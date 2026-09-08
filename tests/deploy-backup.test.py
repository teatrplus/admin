import importlib.util
from contextlib import closing
import json
from pathlib import Path
import sqlite3
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("backup", Path(__file__).parents[1] / "deploy/backup.py")
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.data = self.root / "pb_data"
        self.data.mkdir()
        self.destination = self.root / "backups"
        self.db = sqlite3.connect(self.data / "data.db")
        self.addCleanup(self.db.close)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("CREATE TABLE _collections (name TEXT, id TEXT, fields TEXT)")
        self.db.execute("CREATE TABLE photos (id TEXT, image TEXT)")
        self.db.execute("INSERT INTO _collections VALUES (?, ?, ?)", ("photos", "photos_id", json.dumps([{"name": "image", "type": "file"}])))
        self.db.execute("INSERT INTO photos VALUES ('record1', 'image.jpg')")
        self.db.commit()
        image = self.data / "storage/photos_id/record1/image.jpg"
        image.parent.mkdir(parents=True)
        image.write_bytes(b"original upload")

    def test_backs_up_committed_wal_and_uploads_without_nested_backups(self):
        (self.data / "backups").mkdir()
        (self.data / "backups/previous.zip").write_bytes(b"not included")
        result = backup.backup(self.data, self.destination)
        with tarfile.open(result) as archive:
            names = archive.getnames()
            self.assertIn("pb_data/data.db", names)
            self.assertNotIn("pb_data/data.db-wal", names)
            self.assertNotIn("pb_data/backups/previous.zip", names)
            self.assertEqual(archive.extractfile("pb_data/storage/photos_id/record1/image.jpg").read(), b"original upload")
            restored = self.root / "restored.db"
            restored.write_bytes(archive.extractfile("pb_data/data.db").read())
        with closing(sqlite3.connect(restored)) as db:
            self.assertEqual(db.execute("SELECT * FROM photos").fetchall(), [("record1", "image.jpg")])
            self.assertEqual(db.execute("PRAGMA integrity_check").fetchone(), ("ok",))

    def test_missing_referenced_file_fails_without_publishing_archive(self):
        (self.data / "storage/photos_id/record1/image.jpg").unlink()
        with self.assertRaisesRegex(RuntimeError, "Referenced upload missing"):
            backup.backup(self.data, self.destination)
        self.assertEqual(list(self.destination.glob("pb_data-*")), [])

    def test_disk_full_fails_before_archive(self):
        with patch.object(backup.shutil, "disk_usage") as usage:
            usage.return_value.free = 0
            with self.assertRaisesRegex(RuntimeError, "Insufficient backup space"):
                backup.backup(self.data, self.destination)
        self.assertEqual(list(self.destination.glob("pb_data-*")), [])

    def test_retention_preserves_latest_backup_and_removes_interrupted_archive(self):
        self.destination.mkdir()
        for number in range(5):
            (self.destination / f"pb_data-2026090{number}.tar.gz").write_bytes(b"existing")
        (self.destination / "pb_data-interrupted.tar.gz.partial").write_bytes(b"partial")
        backup.backup(self.data, self.destination)
        self.assertTrue((self.destination / "pb_data-20260904.tar.gz").exists())
        self.assertFalse((self.destination / "pb_data-20260900.tar.gz").exists())
        self.assertEqual(len(list(self.destination.glob("*.tar.gz"))), 4)
        self.assertEqual(list(self.destination.glob("*.partial")), [])


if __name__ == "__main__":
    unittest.main()
