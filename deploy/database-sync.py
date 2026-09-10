#!/usr/bin/env python3
"""Full PocketBase copies. Invoked by the pull/push shell entry points."""

import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import sqlite3
import subprocess
import tarfile
import tempfile
import time
import urllib.request

from backup import backup


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def checksum(path):
    with open(path, 'rb') as stream:
        return hash_stream(stream)


def hash_stream(stream):
    digest = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        digest.update(chunk)
    return digest.hexdigest()


def validate(data, migrations=None):
    if not (data / 'data.db').is_file():
        raise RuntimeError('Archive has no data.db')
    for path in data.glob('*.db'):
        with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True) as db:
            if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
                raise RuntimeError(f'Invalid SQLite database: {path.name}')
    if migrations:
        with sqlite3.connect((data / 'data.db').as_uri() + '?mode=ro', uri=True) as db:
            applied = {r[0] for r in db.execute('SELECT file FROM _migrations')}
        pending = {p.name for p in migrations.glob('*.js')} - applied
        if pending:
            raise RuntimeError('Destination has migrations absent from source database: ' + ', '.join(sorted(pending)))


def extract(archive, directory):
    with tarfile.open(archive, 'r:gz') as tar:
        for member in tar.getmembers():
            path = Path(member.name)
            if path.is_absolute() or '..' in path.parts or not path.parts or path.parts[0] != 'pb_data':
                raise RuntimeError(f'Unsafe archive path: {member.name}')
            if not (member.isfile() or member.isdir()):
                raise RuntimeError(f'Unsupported archive entry: {member.name}')
        tar.extractall(directory)
    validate(directory / 'pb_data')


def local_stopped(data):
    # Check all open files, including uploads, before renaming a live data directory.
    result = subprocess.run(['lsof', '-t', '+D', str(data)], capture_output=True, text=True)
    if result.returncode not in (0, 1) or result.stderr.strip():
        raise RuntimeError('Could not check local database users with lsof: ' + result.stderr.strip())
    if result.stdout.strip():
        raise RuntimeError('Stop local PocketBase before running this script (open files in pb_data).')


def service(action, name):
    run('sudo', '-n', 'systemctl', action, name)


def healthy(url):
    for _ in range(30):
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status == 200 and json.load(response).get('code') == 200:
                    return
        except (OSError, ValueError):
            pass
        time.sleep(1)
    raise RuntimeError('PocketBase failed its health check')


@contextlib.contextmanager
def lock(data):
    with (data.parent / '.database-sync.lock').open('a') as stream:
        fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def install(archive, data, root, backups, service_name=None, health_url=None):
    # Resolve the project's pb_data symlink, preserving the symlink itself.
    data = data.resolve(strict=True)
    with lock(data), tempfile.TemporaryDirectory(prefix='.database-sync-', dir=data.parent) as temporary:
        stage = Path(temporary)
        extract(archive, stage)
        validate(stage / 'pb_data', root / 'pb_migrations')
        stopped = False
        swapped = False
        old = stage / 'previous'
        try:
            if service_name:
                # Refuse to inadvertently start an intentionally stopped service.
                run('systemctl', 'is-active', '--quiet', service_name)
                service('stop', service_name)
                stopped = True
            else:
                local_stopped(data)
            saved = backup(data, backups)
            print(f'Destination backup: {saved}', flush=True)
            data.rename(old)
            try:
                (stage / 'pb_data').rename(data)
            except BaseException:
                old.rename(data)
                raise
            swapped = True
            if service_name:
                service('start', service_name)
                healthy(health_url)
            print('Database and uploads replaced successfully.', flush=True)
        except BaseException:
            if swapped:
                if service_name:
                    service('stop', service_name)
                data.rename(stage / 'failed')
                old.rename(data)
                print('Restored the previous database and uploads.', flush=True)
            raise
        finally:
            if stopped:
                service('start', service_name)


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description='Copy ALL PocketBase data, accounts, settings and uploads. Stop local PocketBase first. Destination backups are retained per run.')
    parser.add_argument('direction', choices=['pull', 'push', 'remote-snapshot', 'remote-install'])
    parser.add_argument('root', type=Path)
    parser.add_argument('--backup-dir', type=Path, help='Local backup directory (default: beside the resolved pb_data directory)')
    parser.add_argument('--archive', type=Path, help=argparse.SUPPRESS)
    parser.add_argument('--service', default=os.environ.get('PB_SERVICE', 'pocketbase.service'))
    parser.add_argument('--health-url', default=os.environ.get('PB_HEALTH_URL', 'http://127.0.0.1:8090/api/health'))
    args = parser.parse_args()
    root = args.root.resolve()
    data = (root / 'pb_data').resolve(strict=True)
    stamp = time.strftime('%Y%m%dT%H%M%SZ', time.gmtime()) + '-' + str(os.getpid())
    backups = (args.backup_dir or data.parent / 'database-sync-backups').resolve() / stamp
    if args.direction == 'remote-snapshot':
        with lock(data):
            run('systemctl', 'is-active', '--quiet', args.service)
            service('stop', args.service)
            try:
                archive = backup(data, backups)
                shutil.copyfile(archive, args.archive)
            finally:
                service('start', args.service)
            healthy(args.health_url)
        return
    if args.direction == 'remote-install':
        install(args.archive, data, root, backups, args.service, args.health_url)
        return

    local_stopped(data)
    host = os.environ.get('DEPLOY_HOST', '64.112.125.109')
    user = os.environ.get('DEPLOY_USER', 'deployer')
    remote_root = os.environ.get('REMOTE_ADMIN_DIR', '/var/www/theaterplus-admin')
    remote_backups = os.environ.get('REMOTE_BACKUP_DIR', '/var/backups/theaterplus') + '/database-sync'
    target = user + '@' + host
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=4', target]

    def remote(*command, **kwargs):
        return run(*ssh, shlex.join(command), **kwargs)

    local_version = run(str(root / 'pocketbase'), '--version', capture_output=True, text=True).stdout.strip()
    remote_version = remote(remote_root + '/pocketbase', '--version', capture_output=True, text=True).stdout.strip()
    if local_version != remote_version:
        raise RuntimeError(f'PocketBase versions differ: local {local_version}, production {remote_version}')
    remote_temp = remote('mktemp', '-d', '/tmp/theaterplus-db-sync.XXXXXXXX', capture_output=True, text=True).stdout.strip()
    try:
        # Transfer helpers without requiring scp/SFTP or interpolating shell paths.
        for name in ('database-sync.py', 'backup.py'):
            with (Path(__file__).parent / name).open('rb') as stream:
                remote('sh', '-c', 'umask 077; cat > "$1"', 'sh', remote_temp + '/' + name, stdin=stream)
        common = [remote_root, '--backup-dir', remote_backups, '--archive', remote_temp + '/data.tar.gz', '--service', args.service, '--health-url', args.health_url]
        with tempfile.TemporaryDirectory(prefix='theaterplus-db-sync-') as temporary:
            archive = Path(temporary) / 'data.tar.gz'
            if args.direction == 'pull':
                remote('python3', remote_temp + '/database-sync.py', 'remote-snapshot', *common)
                with archive.open('wb') as stream:
                    remote('cat', remote_temp + '/data.tar.gz', stdout=stream)
            else:
                with lock(data):
                    local_stopped(data)
                    shutil.copyfile(backup(data, backups / 'source'), archive)
                with archive.open('rb') as stream:
                    remote('sh', '-c', 'umask 077; cat > "$1"', 'sh', remote_temp + '/data.tar.gz', stdin=stream)
            expected = remote('sha256sum', remote_temp + '/data.tar.gz', capture_output=True, text=True).stdout.split()[0]
            if checksum(archive) != expected:
                raise RuntimeError('Transfer checksum mismatch')
            if args.direction == 'pull':
                install(archive, data, root, backups)
            else:
                remote('python3', remote_temp + '/database-sync.py', 'remote-install', *common)
    finally:
        remote('rm', '-rf', '--', remote_temp)


if __name__ == '__main__':
    main()
