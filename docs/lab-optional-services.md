# Lab optional services and compact intake (R1365)

Lab settings → General now contains the dedicated website and Windows program entries. The lab list in the platform admin has **برنامه و سایت اختصاصی**, with independent download and website grants per laboratory. Both grants default off. No database migration is added; settings use the existing `platform_settings` table under a lab-scoped key.

A site request is accepted only when the lab has an active, unexpired subscription backed by a positive approved renewal and its positive paid platform payment. Trial dates, admin date extensions alone, pending payments, zero amounts and payments for another lab do not qualify. Payment continues through the existing subscription renewal/receipt/gateway flow; no new fee, automatic wallet charge or payment implementation is introduced. After payment the operator explicitly requests a site and an admin grants access. Turning on the site grant cannot bypass the paid requirement. Requests merge atomically with grants and retain their first timestamp.

The site gate applies to the authenticated site editor API, preview data and public laboratory custom domains. Existing custom sites require the website grant and qualifying payment too; rollout must review those accounts before enabling this release. Revocation or expiry blocks site access without deleting domains, content, orders or payment history. Domain assignment and verification remain in the existing admin flow. Existing Windows app login/storage access is unchanged; the new download grant gates installer GET/HEAD/status only.

The Windows download uses the existing `/api/lab/desktop-installer` and administrator-uploaded release. A missing release is shown as unavailable; no placeholder installer is offered. Upload a tested EXE with the existing platform-admin Lab Windows release uploader. Installed native clients show that the program is already installed.

The local intake's customer picker, concise receivable/opening-debt summary and explicit SMS checkbox occupy one desktop row; narrow screens wrap. Invoice SMS is sent only after checking the box, using the latest existing invoice. For a pending member without an invoice it sends the invitation instead. Opening-debt correction remains available only for a pending lab member with no invoice. Invoice creation now takes the same per-lab/customer transaction lock as correction, protecting the before-first-invoice rule during concurrent activity.

Only the outer Lab viewport scrolls; nested settings bodies have natural height and no reserved gutter. Content keeps its inner spacing. Selected credit and settings controls retain readable dark text against their light background.

Validation commands:

```sh
node scripts/enable-r1365-lab-options.mjs
node --test scripts/test-r1365-lab-options.cjs scripts/test-r1291-lab-manual-customer-accounts.cjs scripts/test-r1294-lab-intake-account-picker.cjs scripts/test-r1295-lab-intake-build-cache.cjs scripts/test-r1296-lab-settings.cjs
PB_PGLITE_PATH=<installed-pglite-path> node --test scripts/test-r1365-lab-options-db.cjs
PB_PGLITE_PATH=<installed-pglite-path> node --test --test-name-pattern='site editor saves|uploaded photos|SSR pages|actual public handler' scripts/test-r1267-lab-site.cjs
```

The production build runs the lightweight R1365 tests after the final transform and before the Windows UI snapshot. PostgreSQL tests use the optional PGlite test dependency separately. Full production/Windows builds and visual checks require their normal CI/environments. This release changes access and subscription eligibility, so AGENTS.md requires explicit publication review rather than automatic merge.
