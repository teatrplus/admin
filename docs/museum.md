# Masks and museum

`t_mask` owns each mask's image, stable URL identifier (`slug`), display order, and name/story in Russian, English, and Uzbek. `t_page_masks` is a singleton containing the museum overview, visit/tour copy, button URLs, gallery photos, accessibility labels, and SEO templates in all three languages.

The initial schemas are extended by `1788951000_museum_content.js`. This migration seeds seven masks (`004`, `007`, `011`, `012`, `013`, `022`, `023`), the existing translated website copy, and four tour photographs. The `pb_migrations/museum-assets` directory is the migration's input, not a runtime website dependency. Ship it with the migration; the existing deployment script copies the whole migrations directory. Original media is retained here so a fresh database can reproduce the seed without another repository or an external download. PocketBase stores uploaded copies in `pb_data/storage`.

Apply migrations before rebuilding the website. The seed expects empty new collections and refuses to overwrite pre-existing editorial records. Rollback locks API access and retains the content and media; restoring service after a rollback requires reconciliation rather than deleting that content.

## Editing

Staff administrators and PocketBase superusers can open **Theater → Masks & museum**, `/theater/masks`. Other staff roles cannot open the panel or modify these collections. Content and uploaded files are publicly readable. Administrators can add masks and edit text, display order, and images. URLs are generated from the English name when omitted, with Russian/Uzbek fallback and automatic collision suffixes, following the shared theater slug hook. Existing URL identifiers are read-only in the editor, and record deletion is disabled to protect existing links.

Select **Museum page** to edit its 22 translated fields, two links, and tour photographs. Each content language has its own tab. Fill all three languages before saving. Gallery controls add, remove, and reorder photographs. Failed saves retain the draft and show validation errors. The image-description and individual-page SEO templates support `{name}`. Numbered captions are no longer displayed. The ticket URL supports `{locale}`.

The public website is statically generated: **rebuild it after saving content**. Saving does not trigger a deployment. `/museum/`, `/en/museum/`, `/uz/museum/`, and their individual mask routes load from PocketBase at build time. Fetch errors, a missing singleton, or missing translated text stop the build instead of publishing fallback copy. Apply `1788952000_named_mask_urls.js` to migrate numbered URLs to `/museum/mask/<name>/` (for example `still` and `tease`). The old `/museum/masks/<number>/` routes redirect permanently; `legacy_slug` retains the old identifier for redirects and the existing artwork layout. Renaming a mask preserves its published slug. The director page also reads mask names from the database; its images and other pages' images remain local until their own CMS migration.

## Verification

Run `python3 tests/theater-museum.test.py` from this repository. It uses a disposable PocketBase database and checks fresh migration/seed, all three languages, uploaded files, permissions, unique URLs/singleton, image replacement, and gallery add/reorder/remove. It never modifies project data. `--serve` retains a fixture on port 18091 for browser checks until Enter is pressed.

The website can be built against local data with:

```sh
POCKETBASE_URL=http://127.0.0.1:8090 PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 npm run build
```

Use the public production PocketBase origin for `PUBLIC_POCKETBASE_URL` when publishing.
