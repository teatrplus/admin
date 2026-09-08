#!/usr/bin/env python3
"""Deployment backup: online SQLite snapshots, bounded retention, atomic archive."""

import fcntl
import json
from contextlib import closing
import os
from pathlib import Path
import shutil
import sqlite3
import sys
import tarfile
import tempfile
import time


def backup(data, destination):
    data, destination = Path(data).resolve(), Path(destination).resolve()
    if not data.is_dir():
        raise RuntimeError(f"PocketBase data directory is missing: {data}")
    if destination == data or data in destination.parents:
        raise RuntimeError("Backup destination must be outside pb_data")
    destination.mkdir(parents=True, exist_ok=True)
    with (destination / ".deploy-backup.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        # Interrupted archives are never presented as completed backups.
        for path in destination.glob("pb_data-*.tar.gz.partial"):
            path.unlink()
        archives = sorted(destination.glob("pb_data-*.tar.gz"), reverse=True)
        # Keep the newest three before creating another; never remove the last backup.
        for index, path in enumerate(archives):
            if index > 0 and (index >= 3 or path.stat().st_mtime < time.time() - 14 * 86400):
                path.unlink()

        databases = list(data.glob("*.db"))
        files = []
        for directory, children, names in os.walk(data):
            if Path(directory) == data:
                children[:] = [name for name in children if name not in {"backups", ".temp"}]
            for name in names:
                path = Path(directory) / name
                if path.parent == data and name.endswith((".db", ".db-wal", ".db-shm")):
                    continue
                files.append(path)
        database_size = sum(p.stat().st_size for p in databases + list(data.glob("*.db-wal")))
        size = sum(p.stat().st_size for p in files) + database_size
        required = size + database_size + max(size // 10, 256 * 1024**2)
        free = shutil.disk_usage(destination).free
        print(f"Backup input: {size / 1024**2:.1f} MiB; free: {free / 1024**2:.1f} MiB", flush=True)
        if free < required:
            raise RuntimeError(f"Insufficient backup space: need {required} bytes, have {free}")

        stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
        final = destination / f"pb_data-{stamp}-{os.getpid()}.tar.gz"
        partial = Path(str(final) + ".partial")
        try:
            with tempfile.TemporaryDirectory(prefix=".snapshot-", dir=destination) as temporary:
                snapshots = []
                for database in databases:
                    target = Path(temporary) / database.name
                    started = time.monotonic()
                    def progress(status, remaining, total):
                        if time.monotonic() - started > 120:
                            raise RuntimeError(f"SQLite snapshot timed out: {database.name}")
                    with closing(sqlite3.connect(database.as_uri() + "?mode=ro", uri=True)) as source, closing(sqlite3.connect(target)) as snapshot:
                        source.backup(snapshot, pages=1024, progress=progress)
                        if snapshot.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
                            raise RuntimeError(f"Invalid SQLite snapshot: {database.name}")
                    snapshots.append((target, f"pb_data/{database.name}"))
                # A DB snapshot must never advertise a local upload absent from the archive.
                snapshot_data = Path(temporary) / "data.db"
                if snapshot_data.exists():
                    with closing(sqlite3.connect(snapshot_data)) as snapshot:
                        collections = snapshot.execute("SELECT name, id, fields FROM _collections").fetchall()
                        available = {str(p.relative_to(data)) for p in files}
                        for name, collection_id, fields_json in collections:
                            for field in json.loads(fields_json):
                                if field["type"] != "file":
                                    continue
                                quote = lambda value: '"' + value.replace('"', '""') + '"'
                                for record_id, value in snapshot.execute(f"SELECT id, {quote(field['name'])} FROM {quote(name)}"):
                                    if not value:
                                        continue
                                    names = json.loads(value) if value.startswith("[") else [value]
                                    for filename in names:
                                        key = f"storage/{collection_id}/{record_id}/{filename}"
                                        if key not in available:
                                            raise RuntimeError(f"Referenced upload missing from backup: {key}")
                entries = snapshots + [(p, "pb_data/" + str(p.relative_to(data))) for p in files]
                last_report = time.monotonic()
                with tarfile.open(partial, "x:gz", compresslevel=1) as archive:
                    for index, (path, name) in enumerate(entries, 1):
                        before = path.stat()
                        archive.add(path, arcname=name, recursive=False)
                        after = path.stat()
                        if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                            raise RuntimeError(f"File changed during backup: {name}; retry")
                        if time.monotonic() - last_report >= 15:
                            print(f"Backup progress: {index}/{len(entries)} files", flush=True)
                            last_report = time.monotonic()
                with partial.open("rb") as stream:
                    os.fsync(stream.fileno())
                partial.rename(final)
            print(f"Backup complete: {final} ({final.stat().st_size / 1024**2:.1f} MiB)", flush=True)
            return final
        finally:
            partial.unlink(missing_ok=True)


if __name__ == "__main__":
    os.umask(0o077)
    backup(*sys.argv[1:])
