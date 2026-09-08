# Theater documents

Migration `1788871000_theater_legal_pages.js` creates and seeds:

| Collection                   | Website path            |
| ---------------------------- | ----------------------- |
| `t_page_privacy_policy`      | `/privacy-policy/`      |
| `t_page_public_offer`        | `/public-offer/`        |
| `t_page_theater_visit_rules` | `/theater-visit-rules/` |

Each collection contains one document with only PocketBase's record ID and three required plain-text fields: `content_en`, `content_ru`, `content_uz` (up to 100,000 characters each). Edit the existing record in the PocketBase dashboard; do not add additional records. Public clients can read, while only superusers can write, matching the blog's editorial permissions. There is no custom admin editor.

Separate paragraphs with a blank line. HTML and Markdown are not interpreted. Titles use the website's existing translated footer labels. Apply the migration before building the website; a missing collection, missing translation or record count other than one stops the build. Rebuild the static website after editing. Rollback preserves documents.

The seed is generic starter copy for review by the theater before publication. Confirm the legal operator's identity, data retention and handling practices, and contractual terms with the responsible owner; the seed is not a certification of legal compliance. It intentionally does not invent registration details, refund deadlines or guarantees. Ticket refund details remain with the seller; reference checked: [iTicket refund and exchange](https://iticket.uz/en/page/return), 8 September 2026.
