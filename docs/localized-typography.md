# Localized typography

`pb_hooks/localized_typography.pb.js` normalizes content before every PocketBase
record create/update. This includes saves from `app/`, custom content endpoints,
the PocketBase dashboard and `app.save()`. The app receives the normalized record
through its existing save/reload flow; no separate browser formatter is needed.

The language comes from the field suffix (`_en`, `_ru`, `_uz`), independently of
the editor's interface language. Text fields and Tiptap JSON documents are covered,
including shared copy, buttons, SEO, staff biographies and space landing content.

| Language | Primary quotation | Nested quotation | Surname |
| -------- | ----------------- | ---------------- | ------- |
| English  | “…”               | ‘…’              | Dolóko  |
| Russian  | «…»               | „…“              | Долóко  |
| Uzbek    | “…”               | ‘…’              | Dolóko  |

Surname replacement preserves each letter's case and applies to Latin and Cyrillic
spellings in every language. All languages use the literal Latin `ó` (uppercase `Ó`),
including Russian `Долóко`. Previously stored Cyrillic о plus a combining accent is
converted to this spelling without duplicating accents.

Only paired quotation marks are converted. Unmatched marks are left for an editor
to resolve; parentheses and square brackets are unchanged. Apostrophes inside words
(including Uzbek o‘, g‘ and tutuq marks) are preserved. URLs in prose, rich-text
attributes, code, unrelated JSON, identifiers, slugs and file fields are unchanged.
Rich-text formatting operates across inline marks within each paragraph/heading,
preserving their structure and links.

`1790410000_localized_typography.js` backfills existing content in batches of 200,
saving only changed records. It retains its original implementation in `shared/localized-typography-v1.js`.
`1790410100_literal_surname_accent.js` then corrects the stress character using
`shared/localized-typography-v2.js`, which is also used by the save hook. Keep both versioned modules when deploying
the migration and hook (the existing deploy script already ships `shared/`).
Future changes to these rules should use a new version and migration so historical
migrations retain their behavior.

Apply through the normal PocketBase migration/startup process. Deploy backups are
already enabled by default. The migration cannot reconstruct original punctuation;
its down step explicitly refuses reversal. Restore a database backup to undo it.
Publish the affected websites after migrating, as with other content changes.

Verification: `node --test tests/localized-typography.test.cjs`. This covers the
formatter, rich-text boundaries, idempotence, paginated migration and real HTTP
create/update requests against a disposable PocketBase server.
