# Custom shop storefronts (r1256)

Platform admins open the main admin فروشگاه‌ها list → دامنه و سایت (or `/admin/equipment-rental` → دامنه‌های اختصاصی فروشگاه‌ها) (`/admin/storefront`). Register a hostname without scheme/path and select its shop. Both equipment and frame/chassis shops use the same flow. An assigned domain cannot be overwritten; administrators must explicitly release its connection before registering it for another shop or laboratory.

Managers open Settings → سایت اختصاصی، قیمت‌ها و سفارش‌های عمومی (`/rental/storefront`). Existing SKUs remain shared. Each SKU has independent enabled/price/percentage-discount values for PhotoBridge and website in `variant_specs.salesChannels`. Existing products retain their PhotoBridge price and start unpublished on the website. Prices and availability are enforced on the server. Native product edits preserve channel settings. `/rental/storefront-preview` previews published website items; checkout is disabled on preview.

## Domain setup and activation (simplified in r1258)

1. In Liara, attach the hostname to the **same application as PhotoBridge**, follow its DNS instructions, and enable HTTPS. Liara ingress/certificates remain managed by the platform administrator; this release does not provision them through a provider API.
2. In PhotoBridge's admin shop list, choose **دامنه و سایت**, select the shop and register its domain. Registration immediately checks the connection and activates a ready domain. No extra PhotoBridge TXT record or copied verification code is needed.
3. If Liara is not ready yet, finish that setup and click **بررسی مجدد اتصال**. Existing pending domains use this same one-button path. Previously-added TXT records can remain; they are no longer consulted.

Only a platform admin can assign a domain to a shop. Activation requires a valid, TLS-verified HTTPS response from that exact hostname containing its registered proof. The server pins connections to resolved public IPv4 addresses, rejects private/reserved addresses, follows no redirects, and bounds DNS/probe work. The main app/admin/auth routes remain inaccessible on custom storefront hosts. Pending domains cannot serve catalog or checkout. IPv6-only hosting needs an A record for this verification implementation.

Domain deactivation blocks storefront/catalog/order tracking and is not undone by merely opening the domain list or visiting the public site; explicitly check the connection to reactivate it. No migration is required for r1258, beyond the original `182_custom_storefronts.sql`. The retained `verified_at` field now records successful HTTPS proof rather than a separate TXT challenge. Failed rechecks do not take an already-active shop offline.

`PUBLIC_APP_URL` must be the canonical HTTPS PhotoBridge origin. Optional `STOREFRONT_PLATFORM_HOSTS` is a comma-separated list of additional trusted platform/health hostnames that must continue serving the main application (for example the existing Liara application hostname). `www.<canonical hostname>`, localhost and 127.0.0.1 are preserved. All other unregistered hosts return 404; registered storefront domains cannot access the main app, authentication, photographer or admin routes.

## Public purchase and fulfillment

There is no photographer sign-in or membership creation. Customers submit name/mobile/delivery details, receive the shop's configured card-transfer details, upload an image receipt, and track using a private bearer link. A saved high-entropy client token plus idempotency key permits safe recovery from an interrupted checkout response without duplicating orders. Treat tracking links as private. Receipt images use the existing private object storage and JPEG normalization. A configured bank account and storage are required; no online payment gateway is added here.

Guest orders live in `equipment_store_public_orders`, separate from photographer wallets, invoices, credit and accounting. Managers review the receipt before confirmation, then move orders to ready/delivered. Frame orders are made to order; equipment stock is atomically reserved only at payment approval, never by an anonymous unpaid checkout. Insufficient stock prevents approval. Cancellation restores a reservation once; settled external bank refunds remain a manual shop responsibility. This release does not post guest revenue into the existing photographer ledger or issue tax invoices.

Tests: `PB_PGLITE_PATH=<path-to-pglite> node --test scripts/test-r1256-storefront.cjs`; Chromium: `node --test scripts/test-r1256-storefront-browser.cjs` (optional `PB_BROWSER_EXECUTABLE`). Existing production/payments/model tests protect photographer flows.

## Photographer office booking on the equipment-shop domain (r1262)

Equipment rental/sales stores use the same admin domain assignment and HTTPS verification as frame/chassis stores. A rental-only store is allowed to activate a storefront domain; the public sale catalog and checkout are hidden/disabled unless `sale_enabled=true`. If sale is enabled, its website-channel price/discount is independent from the PhotoBridge photographer channel, and guest bank-transfer checkout uses the existing guest-order flow.

For equipment stores with rental enabled, the domain exposes an **آفیش تجهیزات** area. Photographers sign in using the existing PhotoBridge photographer mobile/password account. Sessions use the same verified accounts and first-party HttpOnly/Secure cookies scoped to the shop hostname (therefore a PhotoBridge session on a different hostname does not automatically sign in). Only the explicitly allowlisted customer login, session, rental item, availability, office booking, collaboration-request and membership-profile API routes may reach the current PhotoBridge API on a custom hostname. All admin/shop-manager/lab API routes remain blocked; no shop-independent API routes are opened. The original customer endpoints continue to verify member identity, confirmed shop collaboration, membership profile, inventory, dates and prices. On-site new photographer signup and profile completion link to the canonical PhotoBridge account flow.

Public visitors cannot create a rental office or use photographer-only rental prices; the guest site offers only the separate website-channel retail catalog. Retail never uses photographers' wallets. The signed image URLs for items on merchant domains refer to the canonical PhotoBridge asset origin.

Security release gate: this changes the hostname boundary of authenticated photographer endpoints. As specified by AGENTS.md, do not automatically merge/deploy; review auth scope, CSRF origin protection, shop scoping, and first-party cookies, and run CI before manual approval.

## Laboratory domains (r1264)

In `/admin/storefront`, the institution selector now has shops and laboratories. Attach the hostname and HTTPS to this same Liara application, select the laboratory, and register the domain. The existing automatic HTTPS proof and single retry button apply. A hostname has exactly one owner, enforced by migration `183_lab_custom_domains.sql`; existing shop assignments remain intact.

The laboratory homepage uses the existing PhotoBridge font and palette, its saved name and location, and two entry points:
- Photographers open the canonical PhotoBridge `/photographer` portal. Existing login, membership, pricing, upload, finance, and other capabilities remain authoritative. The custom host does not create or expand photographer access.
- Public customers stay on the laboratory hostname at `/walkin/<slug>`. This is the existing full public print interface, including image upload and preparation, print sizes/materials, available add-ons, and submission. It reuses `walkin_prices` and creates ordinary `source=walkin` orders in that lab's existing order queue and accounting flow. No duplicate tariff, order or financial system is introduced. Enable public intake and configure its prices in the laboratory's existing walk-in settings; a disabled intake is shown as unavailable.

Custom hosts expose only their own walk-in slug and static client assets. Each token-authorized order/upload query is additionally scoped to the hostname's lab ID. Other laboratories, authenticated portal routes, and admin APIs are blocked. Domain writes remain platform-admin-only. The informational homepage does not fabricate address, contact details, or service claims.

## Releasing and reassigning a hostname (r1266)

In admin domain management, **غیرفعال کردن** pauses the site while reserving the hostname. **حذف اتصال و آزادسازی دامنه** explicitly disconnects it, hides it from assigned domains, and allows registration for a different shop or laboratory. A confirmation explains that the current public site stops. The hostname is prefilled afterward; select the new institution and register it. DNS/HTTPS in Liara need no changes when using the same application.

Migration 184 adds `released_at`. The row is retained because previous public orders reference its hostname. Their owner, amounts, receipts and manager access remain unchanged; public tracking on that hostname is unavailable while disconnected or assigned to another institution. Registration of a released hostname atomically resets ownership and HTTPS verification with a fresh token. A domain that has not been released still rejects replacement. Release requires the expected owner identity; an outdated shop page cannot disconnect a later laboratory assignment. A stale HTTPS check cannot activate a released/reassigned binding. Public checkout locks and validates the active current shop/domain binding before writing an order.
