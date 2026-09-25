# Theater website content

Open **Theater → Website pages** (`/theater/content`). Choose the public page you want to update;
its introduction, related items and detail pages live in the same panel. Routes use page names,
such as `/theater/content/courses`, `/theater/content/team` and `/theater/content/festivals`.
Old collection-based bookmarks resolve to the corresponding page panel. There are no standalone
discovery-card, sponsor-touchpoint, teacher, programme, credit or media-library menus.
Staff admins and moderators with the `theater` scope can edit;
PocketBase superusers retain access. Managers, viewers and moderators with only another scope
cannot use these content endpoints. Login accounts remain in Staff Manager; public cast and
production profiles use `t_staff`.

| Content                                                            | Collections                                                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| About, director, courses, contacts, sponsors, festivals            | `t_page_about`, `t_page_director`, `t_page_courses`, `t_page_contacts`, `t_page_sponsors`, `t_page_festivals` |
| Team, news and repertoire introductions                            | `t_page_team`, `t_page_news`, `t_page_repertoire`                                                             |
| Festival records and programmes                                    | `t_festival`, `t_festival_session`                                                                            |
| Shared identity, search metadata, announcement and ticket operator | `t_site_settings`                                                                                             |
| Shared address, maps, social profiles and public phone numbers     | `t_contact`, `t_contact_phone`                                                                                |
| Plays, performances and credits                                    | `t_play`, `t_performance`, `t_staff`, `t_role`, `t_staff_role`                                                |
| Courses, teachers and ordered sections                             | `t_course`, `t_course_teacher`, `t_course_section`                                                            |
| News, partners and shared photographs                              | `t_blog_post`, `t_partner`, `t_media_library`                                                                 |
| Legal pages                                                        | `t_page_privacy_policy`, `t_page_public_offer`, `t_page_theater_visit_rules`                                  |
| Reusable page items                                                | `t_link_card`, `t_sponsor_format`, `t_sponsor_touchpoint`                                                     |

The Home and Masks & museum cards open `/theater/home` and `/theater/masks`, with a back link
to Website pages. Shared website settings live under **Theater → General** (`/theater/general`)
in the sidebar. The page library contains only public pages.
Home now includes selectors for the schedule and ticket invitation masks. Museum now includes
search metadata, its page kicker and the tour gallery description.

## Editing model

Each editor follows the public page. Choose **Page content** for its introduction, or choose an
item from the sticky list for its detail page. On narrow screens this list becomes a collapsible
picker. Language and save actions stay above the scrolling workspace. Courses and other manually
ordered lists include **Arrange on website**; drag items and save the order.

- **Courses:** course story and cover, attendance, enrollment and fees, teachers, programme,
  FAQs, text, video and gallery sections. Add teachers directly, either guests with their own
  portrait or theater staff whose name and portrait are reused. A section shows only fields
  appropriate to its type. Its course relationship and position are assigned automatically.
- **Team:** department and portrait, biography, education, quote, roles with their productions,
  and the personal page gallery. The artistic director profile links to its full editorial page.
- **Repertoire:** production copy, visitor information, posters, trailer, cast, dates and tickets,
  performance-specific cast and production photographs.
- **Festivals:** archive and empty-state copy alongside festival drafts, programmes and galleries.
- **Artistic director:** introduction, portrait, biography, education, awards, approach, interview,
  collection figures, selected masks and search metadata, using labels specific to those sections.
- **Sponsors:** the full proposal alongside partner names, websites, a single replaceable logo,
  sponsor status and visibility. Unnamed partners use their website domain in the list.
  Each FAQ can include an optional button with translated labels and a link. Leave its fields
  empty to omit the action; it appears below the answer only when that question is expanded.
  Apply `1789470000_sponsor_faq_buttons.js` with the updated shared catalogue before editing.
  It adds an optional `button` relation from `_copy_block` to the existing `_button` collection,
  preserving all questions and answers. Use full website URLs (for example,
  `https://theaterplus.uz/contact/`); the website adds the active locale. Phone and email links
  are supported too. Publish/rebuild the website after saving content changes.
  **News:** introduction alongside articles.
- **Contacts:** the page introduction and the shared contact details in one panel.

`shared/theater-content.json` is the explicit field catalogue used by both the Svelte editor
and the PocketBase save endpoint. It describes sections, localized fields, references and
owned relations, reverse children and membership selections. Page composition and routes live in
`app/src/lib/theater-panels.ts`. It is not a general PocketBase schema browser: import keys, legacy URLs,
raw ordering numbers and automatically measured image dimensions stay out of forms.

Copy and calls to action use `_copy_block` and `_button` relations. Each copy descriptor
lists only the rows its section renders: for example, a quote needs a title, while an FAQ
needs title and description. Repeatable copy, linked records, galleries and manually ordered
collections use the shared drag-and-drop component, including keyboard reordering. Galleries
reuse `GalleryImage` for replace/delete controls and stable drag sizing.

An editor save updates its owned tree and reverse children in one transaction. Existing owned
and child IDs and filenames must belong to that tree. Reverse children automatically receive
their parent and order. Membership selections update only the current credit in a production’s
cast, preserving other cast members. Normal relations select existing records. Revision hashes reject
stale saves and order changes with HTTP 409; reload and reconcile before retrying. Removed
owned relation records are unlinked, because another page may share them. Removed private reverse
children (course sections, assignments and performances) are deleted, including when deleting their
parent. Removing a shared gallery photo detaches it only from this page, preserving its other uses.
Page galleries edit `t_media_library`, which the website actually reads, rather than unused legacy
file arrays on people or productions. Singleton pages cannot be deleted. Stable URLs are generated
from names or titles on creation and kept fixed thereafter, except museum mask slugs, which
admins and theater moderators can edit. Mask addresses must be nonempty and unique. Roles use
the person's portrait; they do not have a separate photo field.

Buttons accept absolute HTTP(S), `tel:` and `mailto:` URLs. The website localizes recognized
theaterplus.uz and iTicket paths. Public contact numbers are independent records, never auth
records. The global announcement is disabled initially, matching the previous website.

## Festival publication

The two explicitly fictional preview festivals are imported as **unpublished drafts**.
No published festivals means `/festivals/` renders the existing empty layout. With published
records it renders the archive and `/festivals/<slug>/` details, in RU, EN and UZ. Preview routes
are removed. Upcoming festivals sort first; past festivals sort newest first. Programme and
festival dates display in Asia/Tashkent. Optional images, programme, outcome and booking actions
are omitted when empty. Publishing a record still requires the usual static website rebuild.

## Migration and deployment

Apply the migration chain through `1789047701_updated_t_mask.js` before building the updated
website. `1789040000_theater_editorial_content.js` reads the immutable `content-schema.json` and
`content-seed.json` snapshots. Bundled `content-assets/` and `museum-metadata.json` preserve the
existing RU/EN/UZ copy and media independently of the website checkout. Existing contact values
are preserved. The migration also widens `_button.url` from URL to validated text to support
phone and email actions without losing existing URLs.

The historical migration chain expects the existing imported plays; it is not a blank-database
demo installer. New content migrations preserve records and files on rollback. Take a PocketBase
backup before deploying; restore that backup if the previous schema is required.

Deploy `shared/`, `pb_hooks/`, and all `pb_migrations/` files and asset directories together with
the admin build. `deploy/deploy.sh` includes the shared catalogue. Then rebuild the website with
`POCKETBASE_URL` for server reads and `PUBLIC_POCKETBASE_URL` for browser-visible media. Content
changes and date-based status transitions become public on the next build. This change does not
deploy either application or automatically trigger website deployments.

## Verification

`python3 tests/theater-content.test.py` creates a disposable copy of the local seeded database,
opens its source read-only, starts PocketBase on an unused local port, and cleans up afterward.
Pass `--database /path/to/backup/data.db` to verify the migrations from a pre-migration backup.
The fixture excludes external notification, deployment and cron hooks. It covers scope rules,
nested saves, uploads, ordering, ownership, revision conflicts, rollback, festival CRUD and
publication, public contacts, and required news cover metadata. It also creates complete courses,
teachers, programme/FAQ/gallery sections, profiles, roles, productions and performances, and checks
reverse-child ownership, removal, shared-photo detachment and automatic URLs. It does not mutate
working content. It also verifies editor field multiplicities against the migrated schema,
existing partner edits and logo replacement/removal, and mask slug validation and permissions.
Browser checks must likewise use a disposable copy when saving test edits.

The existing `theater-home.test.py`, `theater-museum.test.py`, and `theater-mask-order.test.cjs`
cover their dedicated editors. Run `pnpm check` and `pnpm build` in `app`, and `pnpm typecheck`
and `pnpm build` in the website checkout.

## Staff positions

`t_staff.position_en`, `position_ru`, and `position_uz` hold optional job titles.
The team directory and profile kicker use the position in the current language,
then the translated department. Actors
fall back to Actor/Actress, Актёр/Актриса, or Aktyor/Aktrisa according to `gender`.
The admin team editor exposes both position and gender. Education and quotes remain separate.

Migration `1790294400_staff_position.js` renames the former description columns,
preserves their values only for administration and production, and clears the
remaining departments. Rollback renames columns back but cannot restore purged text;
restore a database backup if that text is needed. Apply this migration and restart
PocketBase before building the website or using the updated admin editor.
