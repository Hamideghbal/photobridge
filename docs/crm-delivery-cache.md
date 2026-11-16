# CRM delivery regression

On 2026-11-16, the deployed customer HTML contained the merged unified editor and calendar, but the server served `/customer-crm.html` as `public, max-age=31536000, immutable`. Existing browsers could keep the old HTML and its old script URLs for a year. The desktop iframe reused the same URL. The previous live publication check covered the release revision and other product assets, not customer content or caching. A read-only GitHub-hosted probe confirmed the live headers and current calendar source.

A second problem was the standalone CRM Back link. Inside an embedded tab it navigated the iframe to the full application, nesting another portal header and sometimes another CRM frame. Mobile and lab entry buttons also left the shared application shell.

The fix:

- Serve CRM HTML with no-store, no-cache/expiry headers and the actual deploy revision; do not turn CRM document requests into stale 304 responses.
- Change the iframe URL once to escape old immutable browser entries. Fresh portal HTML references new navigation asset versions. Stable CRM script/style names also receive the unique deploy revision on every build.
- Keep shared CRM content inside the authenticated portal header/navigation. Hide the content document's own header when embedded and remove its Back link. Reuse the photographer desktop's existing CRM tab; lab and mobile use one cached content frame and preserve normal tab routing.
- Route CRM push links through the appropriate portal. Promote any non-CRM navigation out of a CRM frame to the main window instead of allowing recursive portals.
- Skip the destructive tab-button refresh on focus transitions while CRM is open; normal authentication/visibility/settings refreshes remain active.
- Run the delivery transform after all legacy navigation writers and before packaging/compression. Keep existing print-route parameters.

Regression tests use a real HTTP server and Chromium's real cache, not request interception (which disables browser caching). They prime an old immutable customer page, enter through updated tabs, verify the calendar and removed controls, count headers/frames, switch tabs, and attempt a recursive portal navigation at mobile/desktop sizes for both portals. HTTP tests cover no-store behavior, conditional requests and unaffected image caching.

The final live release check now fetches both CRM portal URLs, checks document cache headers/revision and required/removed UI, and compares deployed CRM JavaScript/CSS hashes to reviewed source. It also verifies the new navigation references. No customer credentials or production customer data are used by the probe.
