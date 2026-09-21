# Theater documents

Migration `1788871000_theater_legal_pages.js` creates and seeds:

| Collection                   | Website path            |
| ---------------------------- | ----------------------- |
| `t_page_privacy_policy`      | `/privacy-policy/`      |
| `t_page_public_offer`        | `/public-offer/`        |
| `t_page_theater_visit_rules` | `/theater-visit-rules/` |

Each collection contains one document with three required **JSON** fields: `content_en`, `content_ru`, and `content_uz`. Edit them in **Theater → Website pages → Privacy policy / Public offer / Visit rules** in `theaterplus-admin/app`. The existing content endpoint handles saves, theater editorial permissions, and revision conflicts.

The Svelte editor stores Tiptap document JSON. It supports paragraphs, H2/H3 headings, bold, italic, underline, strikethrough, links, bullet and numbered lists, quotes, line breaks, horizontal separators, and undo/redo. Each language keeps its own draft; switching languages resets undo history. Insert a separator with the **Horizontal separator / Горизонтальный разделитель** toolbar button.

The Astro `RichText` reader renders semantic HTML without a browser editor dependency. Page titles still use the translated footer labels. Missing translations, unsupported documents, or a record count other than one stop the build. Rebuild/publish the static website after saving content.

On 21 September 2026 the local database was converted once, directly: all nine content fields became JSON, and the existing Russian, English, and Uzbek texts were retained. Existing section headings, lists, and standalone dash/underscore separators became structured nodes; legal clause numbers remain in the text. A database backup was made before conversion. Upload this converted database before deploying the updated editor and reader. There is deliberately no replayable conversion migration; the original seed migration above describes the earlier plain-text format.

The seed is generic starter copy for review by the theater before publication. Confirm the legal operator's identity, data retention and handling practices, and contractual terms with the responsible owner; the seed is not a certification of legal compliance. It intentionally does not invent registration details, refund deadlines or guarantees. Ticket refund details remain with the seller; reference checked: [iTicket refund and exchange](https://iticket.uz/en/page/return), 8 September 2026.
