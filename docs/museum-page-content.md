# Museum page content

`t_page_masks` stores related copy, actions, metadata and gallery files, plus record timestamps:

| Field                             | Content                                          |
| --------------------------------- | ------------------------------------------------ |
| `intro_block` → `_copy_block`     | Page title, introduction, description            |
| `visit_block` → `_copy_block`     | Visit heading and description                    |
| `visit_button` → `_button`        | Directions labels and URL                        |
| `excursion_block` → `_copy_block` | Tour title, attribution in lede, description     |
| `excursion_button` → `_button`    | Ticket labels and URL                            |
| `seo_block` → `_copy_block`       | Search title, page kicker and search description |
| `gallery_alt_ru/en/uz`            | Tour photo description                           |
| `excursion_photos`                | Ordered gallery files                            |

Migration `1789030000_museum_page_relations.js` copies the current RU/EN/UZ editorial values
before removing the old columns. It retains the page ID, gallery filenames, and existing files.
Individual masks remain in `t_mask`, with their own names, stories, images, and stable URLs.

The website's `museumPage` i18n namespace owns the back link, collection heading and gallery controls.
Migration `1789040010_theater_page_metadata.js` moves the kicker, photo description and SEO copy to PocketBase. Mask image alt text uses the mask
name. Mask SEO combines that name with the shared museum metadata. The unused serial-number label
and redundant mask SEO/alt templates are removed. The singleton marker is also removed: the loader
requires exactly one page and generic record creation is locked, as with the homepage.

The admin's **Theater → Masks & museum → Museum page** form edits only the retained editorial
content and gallery. `POST /api/theater/museum-page` atomically saves its linked copy blocks,
buttons, and gallery, with revision checks to reject stale edits. Access includes staff admins, theater-scoped moderators and superusers. Generic copy/button writes are not opened by this change.

Buttons store concrete HTTP(S) URLs. The migration replaces the old `{locale}` placeholder with
`ru`; the website selects the visitor's iTicket language when rendering. Gallery order supports
both existing files and new uploads in any position.

Deploy the migration and hooks with the updated admin and website loaders, then rebuild the
website to publish. The pre-migration loader depends on columns this migration removes.
Rollback reconstructs the old editorial columns from the current related content and restores
static label defaults. It keeps reusable records and files; use a database backup if exact old
static labels or schema constraints must be recovered.

Run `python3 tests/theater-museum.test.py` for migration, permissions, atomic-save, gallery, and URL
checks against disposable PocketBase data. `--serve` keeps the fixture available for UI checks.
