# Theater school

The course catalogue is managed in PocketBase at `/theater-school/`, `/en/theater-school/` and `/uz/theater-school/`. The website builds static pages; rebuild it after content or publication changes.

## Content model

| Collection                | Responsibility                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `t_course`                | One continuing course: title, summary, description, audience, practical details, enrollment status, cover, teacher relations and stable slug.                |
| `t_course_section`        | An ordered section owned by one course. `about`, `audience`, `outcomes`, `format` stay visible; `program` and `faq` use native expandable sections.          |
| `t_course_teacher`        | A reusable teacher. Link `staff` to reuse a theater member's name, portrait and profile; otherwise enter a guest's name, role, biography and optional photo. |
| `t_media_library.courses` | Tag existing or newly uploaded photos with all relevant courses. Photos continue to support staff tags and translated captions/alt text.                     |

All visitor-facing CMS text has `_ru`, `_en`, `_uz` fields. The requested locale falls back to Russian, then English and Uzbek. Paragraph fields use plain text with blank lines; `items_*` uses one item per line. HTML from Elementor is never rendered. Translate the body and list together; missing individual fields fall back independently.

`sort_order` orders courses and sections (ascending, then ID). On a course page the introduction comes first, followed by visible sections, the programme, teachers and FAQs. Sections are ordered within these groups. Teachers follow their selected relation order. Shared photos use the library's existing sort order and carousel.

### Gallery and teaser sections

Apply `1788950000_course_media_sections.js` to add `gallery` and `teaser` to `t_course_section.kind`. The `t_course` fields and existing section records are preserved.

- For `gallery`, select photos in the section's `gallery` relation in display order. Upload new photos in `t_media_library`; its translated captions, alt text and people tags are reused. These photos do not need a course tag.
- For `teaser`, paste a YouTube URL into `teaser_url`. Watch, share (`youtu.be`), Shorts, live and embed links are supported, including start times. The website uses the same privacy-enhanced, lazy-loaded 16:9 player as play pages. Other domains are rejected by the CMS; empty or unrecognized video links are hidden by the website.
- Both kinds support translated headings, body paragraphs and lists. Empty headings fall back to the localized Gallery/Teaser label. Empty galleries are hidden.
- Media sections follow `sort_order` among visible sections, before programme/teachers/FAQs. When any explicit gallery section exists, it replaces the automatic bottom gallery; courses without one retain their course-tagged gallery.

Rebuild the website after editing. Rollback preserves the new fields and content.

### Publishing and enrollment rules

- New records default to unpublished. Course and section list/view rules expose only published courses. Only PocketBase superusers can write; guest teacher records and the shared media library are public.
- Before publishing, enter at least a title and summary in one language. The build rejects missing required public copy or unresolved teachers rather than publishing a broken page. Unpublishing removes the page on the next build.
- `enquire`: ask about the next intake; `open`: enrollment is confirmed; `waitlist`: intake is closed but the theater accepts waiting-list enquiries; `closed`: no enrollment action. Status does not determine whether the course page exists.
- Set a real `enrollment_url` for an external registration service, or a public `contact_phone`. The website links directly to that destination. It does not collect personal data or claim to submit an application. A phone action asks the theater about enrollment or its waiting list.
- Enter only confirmed duration, timetable and location information. Optional fields disappear when empty. `price_uzs` zero/empty means “ask for details”, never “free”. `price_note_*` describes the pricing basis.
- Age bounds, session count and session minutes are numeric facts; `audience_*` can explain multiple age groups. `duration_*` describes the full course; `session_minutes` is the length of one class.
- Slugs are generated once by the existing model hook from the English title, falling back to Russian/Uzbek, and kept stable on edits. The database unique index guards collisions. New courses require no code changes.

### Source import

Authenticated source text was captured on 2026-09-07 in [course-source-ru.json](./course-source-ru.json). Credentials and login sessions are not stored in the repository. The seed preserves the Russian material and adds English/Uzbek editorial translations. Review translations before a production launch.

The original courses are:

| New slug                | WordPress source                                                                                | Confirmed details                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `acting`                | [Acting](https://teatrplus.uz/theater-school/kurs-aktyorskogo-masterstva/)                      | Ages 9+; Monday/Thursday 18:00–19:30, 90 minutes, at Theater+; Sherzod Sismatov.                                           |
| `animation-laboratory`  | [Animation](https://teatrplus.uz/theater-school/laboratoriya-taktilnoj-animaczii-i-media-arta/) | Groups 9–12 and 12–16; 16 practical classes, eight two-hour classes/month; Dante Rustav.                                   |
| `speak-with-confidence` | [Public speaking](https://teatrplus.uz/theater-school/oratorskoe-iskusstvo-govoryu-uverenno/)   | Four programme modules, including all originally collapsed content; intake closed, waiting-list enquiries; Mikhail Doloko. |
| `poetry-school`         | [Poetry](https://teatrplus.uz/theater-school/shkola-poezii-2/)                                  | One month of practical classes; Ashot Danielyan.                                                                           |

Editorial changes: removed an accidental editing instruction from the animation introduction; repaired spacing, punctuation and the acting list's inconsistent verb form; changed the poetry page's address to the reader to consistent formal Russian. The poetry text retains the discussion of emotion and self-expression without presenting the class as a clinical therapy. No prices, start dates, qualifications, class sizes or testimonials were invented. The source's dummy/AI artwork was omitted. Upload real course photographs when available.

The phone number follows the public website header. Sherzod links to his existing staff record; the other three teachers are guests in `t_course_teacher`, so they do not create artificial staff-directory entries. Adding a staff relation later automatically enables its profile link.

### Setup and verification

Deploy the updated `theater_slug.pb.js` and `lib/theater_slug.js` hooks together with migrations `1788800800_theater_courses.js` and `1788800810_seed_theater_courses.js`. Apply them before building the website. The source database must already contain the existing `t_staff` and `t_media_library` collections, including Sherzod's record used by the seed. Seed records have fixed IDs; applying the migration twice does not duplicate them. Rollbacks retain course content, photos and later editorial edits.

`node --test tests/theater-course.test.cjs tests/theater-slug.test.cjs` creates a disposable PocketBase database, applies the real migrations, and checks stable URLs, collisions, multilingual seed content, teacher expansion, draft visibility and anonymous-write rejection. It needs the local PocketBase binary (or `POCKETBASE_BINARY`) and permission to bind a temporary localhost port.

The website's Astro config retains one-time redirects for all four WordPress detail paths in each locale. They are excluded from the sitemap. Static hosting emits redirect HTML; canonical course pages use the PocketBase slugs.
