# Publishing CMS changes

Save stores content in PocketBase. The header's **Publish** button appears after
saved content changes and stays available on every admin route until those
changes have been submitted to Cloudflare. Its tooltip names the pending sites.

- Landing content (`s_*`, except requests) and the public phone/Telegram details
  of staff selected on the landing mark **landing** pending.
- Theater content (`t_*`, except requests, inquiries, Instagram posts and sync jobs),
  `_copy_block`, and `_button` mark **theater** pending.
- Successful Instagram refreshes (manual or daily) automatically rebuild only
  the theater website. Instagram posts and sync jobs never create pending
  publication work or make the Publish button appear. This rebuild leaves any
  pending editorial revisions intact.
- Unchanged saves, account/security changes, and operational records do not
  create pending publication work. Unsaved editor drafts must be saved first.

The server decides which sites need deployment. Admins and superusers can publish
both; moderators can publish only their assigned `space`/`theater` scopes.
Pending state is shared by editors and survives reloads and PocketBase restarts.
The UI refreshes it after CMS saves, on focus, and every 15 seconds.

`GET /api/publication` returns the caller's site status. `POST /api/publication`
submits only their pending sites and returns `accepted`, `failed`, and fresh
`sites` arrays. It does not accept client-supplied deploy URLs or site overrides.

The notification says changes should appear in approximately two minutes. A
successful publication here means Cloudflare accepted the deploy-hook request;
it does not confirm that the later build finished. Build failures must be checked
in Cloudflare. See [Cloudflare deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/).

Each accepted site is cleared independently. A failed site remains pending, so
retrying does not redeploy the successful site. The database records a revision
per site and acknowledges only the revision claimed before the HTTP request;
saves during publishing remain pending. A 60-second claim prevents concurrent
clicks from duplicating a request and expires if PocketBase stops mid-request.
An interrupted response after Cloudflare accepts a request can still result in a
duplicate build on retry; deploy hooks have no idempotency key.

Content and revision updates share a database transaction. Failed saves roll
back both. No Cloudflare request runs inside a transaction, and ordinary saves
make no deploy request. This also covers custom nested-content save routes.
Instagram's completed refresh is a separate automatic deployment path.

## Installation

Deploy the UI, hooks, and migration `1789050000_site_publication.js` together and
restart PocketBase. The migration creates internal table `_site_publication`
with a clean baseline; it cannot reconstruct edits made before installation.
The empty replacement `space_landing_redeploy.pb.js` must be deployed too. The
deployment script does not delete old hooks; this replacement disables the old
automatic deploy hook on existing installations.

Configure two distinct server-side environment variables:

| Site    | Deploy hook                     |
| ------- | ------------------------------- |
| Landing | `SPACE_PAGES_DEPLOY_HOOK_URL`   |
| Theater | `WEBSITE_PAGES_DEPLOY_HOOK_URL` |

Missing configuration is a failed publication and leaves that site pending.
The old Cloudflare API token/account/project queue-cleanup variables are no
longer used. Publishing no longer deletes queued Cloudflare deployments.
Static rendering and content loading in `theaterplus-landing` and
`theaterplus-website` are unchanged; they read saved PocketBase content at build
time. A separate Git-triggered or Instagram-triggered build can therefore also
publish saved content.

Run `python3 tests/site-publication.test.py` for integration tests with disposable
PocketBase data and local deploy-hook servers. No live deployment is requested.
