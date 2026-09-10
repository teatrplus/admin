# Deployment

## Copy a database between local and production

Stop your local PocketBase process, then run from `theaterplus-admin`:

```bash
./pull-database.sh  # Production → local; backs up local first
./push-database.sh  # Local → production; backs up production first
```

These replace **all collections, accounts (including passwords), PocketBase
settings, and uploaded files** in `pb_data`. They are full copies, unlike the
scoped `t_*` content import described below. The existing `pb_data` symlink is
preserved. Environment files, the PocketBase binary, hooks, and migration files
are not copied. If database settings use `PB_ENCRYPTION_KEY`, both environments
must use the same key to read the copied settings.

The scripts use `deploy/env.deploy` and the existing SSH identity. They require
Python 3 and matching PocketBase versions on both machines, `lsof` locally, and
passwordless `sudo systemctl` access for `deployer`. Production is briefly stopped
for a consistent snapshot on pull, or backup and replacement on push. A failed
push health check restores the previous production database and uploads. Keep
local PocketBase stopped throughout the operation; start it again afterward.

Transfers use private staging directories, SHA-256 verification, safe archive
extraction, SQLite integrity checks, and the upload validation in `backup.py`.
The scripts refuse a source database that has not applied all migration files
present at the destination. Coordinate with deployments: do not deploy or run
another database transfer concurrently. No frontend build or deployment runs.

Local backups default to `database-sync-backups` beside the resolved `pb_data`
directory. Override with `--backup-dir /absolute/path`. Production backups live
under `${REMOTE_BACKUP_DIR:-/var/backups/theaterplus}/database-sync`. Each run has
a separate timestamped directory, printed during execution; these backups are
retained until manually removed. Archives contain a `pb_data/` directory and can
be restored with PocketBase stopped. `PB_SERVICE` and `PB_HEALTH_URL` override
`pocketbase.service` and `http://127.0.0.1:8090/api/health`.

Use `./pull-database.sh --help` or `./push-database.sh --help` for options.
Run transfer regression tests with `python3 tests/database-sync.test.py`.

GitHub Actions builds and deploys `main`; production runs at
`/var/www/theaterplus-admin`. Set `DEPLOY_HOST`, `REMOTE_ADMIN_DIR`, and
`VITE_POCKETBASE_URL` as repository/environment variables. The backup directory
defaults to `/var/backups/theaterplus` and can be overridden with
`REMOTE_BACKUP_DIR`. SSH uses the deployer key and 15-second keepalives.

`deploy.sh` builds the UI, backs up production, syncs hooks/migrations/UI, restarts
PocketBase, and waits for its local HTTP health endpoint. Running deployments are
queued rather than cancelled midway through a backup or file sync.

## Backups

The server needs Python 3 with SQLite support. `backup.py` uses SQLite's online
backup API, checks database integrity, and archives the snapshots with local
uploads. It excludes nested PocketBase backups, temporary files, and live SQLite
WAL/SHM files. It verifies that every upload referenced by a database snapshot is
present. This backup implementation expects local file storage; missing local
uploads fail the deployment rather than producing an incomplete backup.

An exclusive backup lock prevents concurrent backup processes. Before allocating
space, the script removes interrupted `.partial` files and prunes completed
archives to the newest three or 14 days, always retaining the newest archive.
The new backup becomes a fourth archive until the next run. Free-space checking
uses a conservative uncompressed estimate, and archive progress is printed every
15 seconds between files. Completed archives are atomically renamed into place.

An online backup can fail if an upload is deleted or modified while it is being
archived. Retry, or stop PocketBase for a maintenance backup when an exact
database-and-files snapshot is required. Never copy a live SQLite database file
without its committed WAL data.

Run backup regression tests with `python3 tests/deploy-backup.test.py`.

## September 8, 2026 recovery

Production had been repeatedly failing a seed migration because its two expected
play records did not exist. Failed migration transactions left 64,340 orphaned
staff-image files (about 16 GB). Whole-directory deploy archives consumed another
30 GB, exhausting the 50 GB root filesystem. The SSH backup operation had no
keepalives; its reported exit 255 was a transport disconnect, separate from the
successful Vite build and its chunk-size warning.

Seed migrations now tolerate absent sample plays. External staff/sample-blog
image downloads require the explicit `THEATER_SEED_REMOTE_PHOTOS=1` environment
variable, so startup does not depend on those remote hosts. Instagram migrations
look up the collection by its name at each migration stage, accommodating the
different collection IDs in local and production databases.

The truncated 15 GB deploy archive was verified invalid before removal. The
earlier 16 GB archive passed gzip validation. Orphaned staff files were preserved
outside the live data directory at:

`/var/backups/theaterplus/orphaned-t_staff-20260908`

PocketBase was stopped for backup, migration, and import. All 179 local records
across 16 `t_` collections and 88 original uploaded files were transferred. The
Instagram file paths were mapped to production's collection ID. The nine
production Instagram posts represented the same nine posts locally; their local
records became the imported versions. Other newly created seed rows were replaced
with the local content. Record IDs, field values, relations, and uploaded-file
SHA-256 hashes were checked. The import transaction changed only `t_` tables.
All 43 pre-existing records in other production collections retained their values
through the existing schema/field renames.

Private recovery artifacts remain on the server:

- `/var/backups/theaterplus/pre-import-20260908/`: database/upload backup and prior
  hook/migration code.
- `/var/backups/theaterplus/import-20260908/`: import manifest, original local
  uploads, transfer script, reviewed baseline, and verification logs.

The legal-page migration was sourced from the existing `main` workspace because
the shared local database already contained those three collections; it is also
installed on production. The import never copies local accounts, credentials, or
server settings. Keep the recovery directories private and outside public web
roots. They are deliberately outside automatic deploy-archive retention.

The repaired deployment was run end to end. Its post-import backup was about
115 MB, and the public PocketBase health endpoint returned HTTP 200.
