import importlib.util
import io
from pathlib import Path
import sqlite3
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'deploy'))
spec = importlib.util.spec_from_file_location('database_sync', Path(sys.path[0]) / 'database-sync.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class DatabaseSyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.source = self.root / 'source'
        self.target = self.root / 'shared' / 'pb_data'
        for directory, value in [(self.source, 'incoming'), (self.target, 'original')]:
            directory.mkdir(parents=True)
            with sqlite3.connect(directory / 'data.db') as db:
                db.executescript('CREATE TABLE _collections (name, id, fields); CREATE TABLE _migrations (file); CREATE TABLE content (value);')
                db.execute('INSERT INTO content VALUES (?)', (value,))
            (directory / 'storage').mkdir()
            (directory / 'storage' / 'image').write_text(value)
        self.project = self.root / 'project'
        self.project.mkdir()
        (self.project / 'pb_data').symlink_to(self.target, target_is_directory=True)
        self.archive = sync.backup(self.source, self.root / 'source-backup')

    def value(self):
        with sqlite3.connect(self.target / 'data.db') as db:
            return db.execute('SELECT value FROM content').fetchone()[0]

    def test_pull_preserves_symlink_and_backs_up_destination(self):
        with patch.object(sync, 'local_stopped'):
            sync.install(self.archive, self.project / 'pb_data', self.project, self.root / 'backups')
        self.assertTrue((self.project / 'pb_data').is_symlink())
        self.assertEqual(self.value(), 'incoming')
        restored = self.root / 'restored'
        restored.mkdir()
        sync.extract(next((self.root / 'backups').glob('*.tar.gz')), restored)
        self.assertEqual((restored / 'pb_data/storage/image').read_text(), 'original')

    def test_failed_health_restores_database_and_uploads(self):
        with patch.object(sync, 'service') as service, patch.object(sync, 'run'), patch.object(sync, 'healthy', side_effect=RuntimeError('unhealthy')):
            with self.assertRaisesRegex(RuntimeError, 'unhealthy'):
                sync.install(self.archive, self.target, self.project, self.root / 'backups', 'pocketbase.service', 'http://localhost')
        self.assertEqual(self.value(), 'original')
        self.assertEqual((self.target / 'storage/image').read_text(), 'original')
        self.assertEqual(service.call_args.args[0], 'start')

    def test_pending_migration_refuses_before_stopping_service(self):
        (self.project / 'pb_migrations').mkdir()
        (self.project / 'pb_migrations/new.js').touch()
        with patch.object(sync, 'service') as service:
            with self.assertRaisesRegex(RuntimeError, 'migrations absent'):
                sync.install(self.archive, self.target, self.project, self.root / 'backups', 'pocketbase.service')
        service.assert_not_called()
        self.assertEqual(self.value(), 'original')

    def test_failed_backup_leaves_destination_intact_and_restarts_service(self):
        with patch.object(sync, 'backup', side_effect=RuntimeError('backup failed')), patch.object(sync, 'run'), patch.object(sync, 'service') as service:
            with self.assertRaisesRegex(RuntimeError, 'backup failed'):
                sync.install(self.archive, self.target, self.project, self.root / 'backups', 'pocketbase.service')
        self.assertEqual(self.value(), 'original')
        self.assertEqual((self.target / 'storage/image').read_text(), 'original')
        self.assertEqual(service.call_args.args[0], 'start')

    def test_running_local_database_refuses_replacement(self):
        with patch.object(sync, 'local_stopped', side_effect=RuntimeError('Stop local PocketBase')):
            with self.assertRaisesRegex(RuntimeError, 'Stop local PocketBase'):
                sync.install(self.archive, self.target, self.project, self.root / 'backups')
        self.assertEqual(self.value(), 'original')

    def test_unsafe_archive_rejected(self):
        for name, link in [('pb_data/../../outside', False), ('pb_data/link', True)]:
            with self.subTest(name=name):
                archive = self.root / 'unsafe.tar.gz'
                with tarfile.open(archive, 'w:gz') as tar:
                    entry = tarfile.TarInfo(name)
                    if link:
                        entry.type = tarfile.SYMTYPE
                        entry.linkname = '/tmp'
                    tar.addfile(entry, io.BytesIO())
                with self.assertRaises(RuntimeError):
                    sync.extract(archive, self.root / 'extract')


if __name__ == '__main__':
    unittest.main()
