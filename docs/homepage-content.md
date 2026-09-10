# Homepage content

`1788953000_home_content.js` seeds the existing homepage schema. It adds no fields.
The seed copies the website's Russian, English, and Uzbek editorial content verbatim.

| Homepage content                     | Storage                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Hero selection and order             | `t_page_home.featured_plays`; seeded from current `t_play` records in creation order                                        |
| About title and paragraphs           | `about_block` → `_copy_block`: title, first paragraph as lede, remaining paragraphs separated by blank lines in description |
| Statistics                           | `about_info_blocks` → three ordered `_copy_block` records: value in title, label in description                             |
| About mask                           | `about_mask` → existing `t_mask` with legacy slug `023`                                                                     |
| Instagram introduction               | `instagram_block` → title and description                                                                                   |
| Instagram button                     | `instagram_button` → localized labels and URL                                                                               |
| Instagram avatar                     | `instagram_avatar` file                                                                                                     |
| Ticket invitation                    | `cta_block` → first line in title, second line in lede; `cta_button` → localized labels and URL                             |
| Bottom quote                         | `bottom_block` → quote in title, author in lede, role in description                                                        |
| Bottom link and portrait             | `bottom_button` and `bottom_image`                                                                                          |
| Instagram profile and scraper source | Singleton `t_contact.instagram_url`                                                                                         |

The seed preserves other fields on an existing contact record. It refuses ambiguous contact
records, a conflicting Instagram URL, existing homepage/copy/button records, a missing about
mask, or more than ten featured plays. It enables public reads for these public-content
collections and preserves their existing write restrictions. Rollback locks reads and retains
editorial records and files; reconcile retained content before reapplying the seed.

The frontend expects exactly one homepage and one contact record. Missing collections,
ambiguous singletons, and inaccessible assigned copy relations fail the build rather than
silently publishing the old hardcoded copy. CMS changes become public on the next website build.

Buttons have one absolute URL field. The website localizes `theaterplus.uz` internal routes
and recognized iTicket locale prefixes when rendering. The Instagram handle and refresh
worker derive their profile from `t_contact.instagram_url`; the separately editable Instagram
button URL should point to that same profile. `INSTAGRAM_PROFILE_URL` environment configuration
is no longer used by the refresh worker.

## Content without a matching field

- Section headings, navigation, carousel controls, and accessibility UI labels remain in i18n.
- Migration `1789040030_home_relic_choices.js` adds editable `afisha_mask` and `cta_mask` relations, seeded with masks `007` and `004`.
- There is one Instagram avatar field, so the seed uses `logo.png` in both themes. The previous
  separate `logo-dark.png` variant is not migrated.
- There is no portrait-alt field. The website derives it from the localized quote author and role.
- The original statistic says three shows, while the current local repertoire has two records.
  The seed preserves the supplied editorial statistic and does not invent a third play.

Bundled files in `pb_migrations/home-assets` make the migration independent of the website checkout.

## Admin editor

Open **Theater → Homepage** (`/theater/home`) to edit all homepage content together, including
RU/EN/UZ copy, ordered featured plays and statistics, the about mask, buttons, avatar and portrait.
The Instagram profile field updates both `t_contact.instagram_url` and the homepage Instagram button.

`GET` and `POST /api/theater/home` require a staff admin, a moderator with the `theater` scope,
or a PocketBase superuser. Admin access follows the existing app convention of access to all scopes.
Managers, viewers, space-only moderators, and anonymous visitors cannot use the editor endpoint.
The later website-content migration opens theater content writes to admins and theater moderators; the endpoint only saves the homepage's linked
records and the contact's Instagram URL. Apply the website-content migrations for the additional mask selectors.

A save is transactional across copy blocks, buttons, relations, contact URL, and media. A revision
check rejects stale edits with HTTP 409; reload before reconciling another editor's changes. Removed
statistics are unlinked rather than deleted, because copy blocks may be shared. Saved content still
requires a website rebuild to publish.

Validation: `python3 tests/theater-home.test.py` starts and cleans up a disposable seeded PocketBase
instance to check role/scope access, multipart saves, ordering, image removal, new statistics, stale
edits, rollback, and locked generic writes. Add `--serve` to keep the fixture on port 18093 for UI checks.
