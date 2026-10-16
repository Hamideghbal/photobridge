# Custom shop storefronts (r1256)

Platform admins open the main admin فروشگاه‌ها list → دامنه و سایت (or `/admin/equipment-rental` → دامنه‌های اختصاصی فروشگاه‌ها) (`/admin/storefront`). Register a hostname without scheme/path and select its shop. Both equipment and frame/chassis shops use the same flow. A registered domain cannot be reassigned to a different shop.

Managers open Settings → سایت اختصاصی، قیمت‌ها و سفارش‌های عمومی (`/rental/storefront`). Existing SKUs remain shared. Each SKU has independent enabled/price/percentage-discount values for PhotoBridge and website in `variant_specs.salesChannels`. Existing products retain their PhotoBridge price and start unpublished on the website. Prices and availability are enforced on the server. Native product edits preserve channel settings. `/rental/storefront-preview` previews published website items; checkout is disabled on preview.

## Domain setup and activation

1. Apply migration `182_custom_storefronts.sql` through the normal migration startup.
2. In Liara, attach the registered hostname to this application's ingress, follow its DNS instructions, and enable HTTPS. This release does **not** provision Liara ingress or certificates through its API. No Liara API credentials are currently configured.
3. Add the ownership TXT record displayed by the admin, at `_photobridge.<hostname>`.
4. Click بررسی و فعال‌سازی. The server checks TXT ownership and a TLS-verified HTTPS proof served by the application on that hostname. It pins requests to resolved public IPv4 addresses, rejects private/reserved addresses, does not follow redirects, and uses an eight-second timeout. Pending domains cannot serve catalog or checkout. IPv6-only hosting needs an A record for this verification implementation.

DNS and HTTPS cannot be supplied merely by inserting a domain into the database. The admin shows pending DNS/hosting until these external prerequisites are complete. Domain deactivation immediately blocks public storefront/catalog/order tracking. Reverify to reactivate.

`PUBLIC_APP_URL` must be the canonical HTTPS PhotoBridge origin. Optional `STOREFRONT_PLATFORM_HOSTS` is a comma-separated list of additional trusted platform/health hostnames that must continue serving the main application (for example the existing Liara application hostname). `www.<canonical hostname>`, localhost and 127.0.0.1 are preserved. All other unregistered hosts return 404; registered storefront domains cannot access the main app, authentication, photographer or admin routes.

## Public purchase and fulfillment

There is no photographer sign-in or membership creation. Customers submit name/mobile/delivery details, receive the shop's configured card-transfer details, upload an image receipt, and track using a private bearer link. A saved high-entropy client token plus idempotency key permits safe recovery from an interrupted checkout response without duplicating orders. Treat tracking links as private. Receipt images use the existing private object storage and JPEG normalization. A configured bank account and storage are required; no online payment gateway is added here.

Guest orders live in `equipment_store_public_orders`, separate from photographer wallets, invoices, credit and accounting. Managers review the receipt before confirmation, then move orders to ready/delivered. Frame orders are made to order; equipment stock is atomically reserved only at payment approval, never by an anonymous unpaid checkout. Insufficient stock prevents approval. Cancellation restores a reservation once; settled external bank refunds remain a manual shop responsibility. This release does not post guest revenue into the existing photographer ledger or issue tax invoices.

Tests: `PB_PGLITE_PATH=<path-to-pglite> node --test scripts/test-r1256-storefront.cjs`; Chromium: `node --test scripts/test-r1256-storefront-browser.cjs` (optional `PB_BROWSER_EXECUTABLE`). Existing production/payments/model tests protect photographer flows.
