/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Internal state: only the authenticated publication routes expose it.
    app
      .db()
      .newQuery(
        `CREATE TABLE _site_publication (
      site TEXT PRIMARY KEY CHECK (site IN ('landing', 'theater')),
      revision INTEGER NOT NULL DEFAULT 0,
      published_revision INTEGER NOT NULL DEFAULT 0,
      claim TEXT NOT NULL DEFAULT '',
      claim_until INTEGER NOT NULL DEFAULT 0
    )`,
      )
      .execute()
    app.db().newQuery("INSERT INTO _site_publication (site) VALUES ('landing'), ('theater')").execute()
  },
  (app) => {
    app.db().newQuery('DROP TABLE IF EXISTS _site_publication').execute()
  },
)
