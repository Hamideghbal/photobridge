# R1387 shared storage identity; expiry audit

## Confirmed live mismatch

At investigation time, PR #490 was still an unmerged draft and photobridge.ir returned no storageTarget=r1386 marker. Building native 1.0.23 did not deploy the website/API. The old site registers its browser-specific device ID while the app registers its persistent native ID, so the old registration flows can replace each other.

## Corrected identity flow

This revision includes and supersedes R1386. Installed Windows engines announce a stable native device ID and hostname on startup/login without claiming primary status. The site lists those account-scoped installations; a single available installation is preselected, but only an explicit site Save selects the primary computer and the exact folder. The app displays the path read-only and confirms permission only if its ID matches that selection. No IP/hostname fingerprint is treated as proof of physical identity. Browser directory handles are not copied or claimed to be reusable in Electron.

A different PC is rejected server-side and natively before probing the disk, even if force=true. The Windows takeover prompt is removed. Changing the site-selected PC or path creates a new revision and requires activation again. The old browser registration endpoint is rejected under the same lab row lock once shared storage is configured, preventing it from replacing the native primary. Existing local data and native device ID survive upgrade. Native 1.0.24 is required for announcement and this UI; deploying website assets alone cannot update an installed engine.

The integrator now carries the verified-UI build fix and tests so manual packaging can use a pinned, server-verified snapshot. A packaged snapshot still does not deploy the site.

Validation: 53 native tests, 8 API/UI/legacy-route tests and one real PostgreSQL transaction test pass (62 regression tests). Integration ran twice; the R1386 transform was applied idempotently to the exact current main API and website source and generated JS syntax checks pass. Actual Windows NSIS/signing, browser visual QA and production activation were not run.

## Subscription expiry audit — confirmed gap, NOT fixed by this PR

The native HTTP host has no expiry check before enqueueing business mutations. A reproduction with auth.lab.active_until=2000-01-01 and an offline upstream accepted POST /api/lab/invoices/manual with 202 and added it to the pending outbox. Cached GET /api/lab/invoices still returned the historical invoice. See scripts/audit-r1387-expiry.cjs; its passing assertion documents incorrect current behavior, not policy compliance.

Review of the exact current main server blob c5e62ab07ec5512f11b24da70a2ef186972e29d9 shows the lab API boundary selects active/suspended/suspension_reason, but not active_until, and the manual-invoice route has no shared expiry guard. auth() applies the subscription date window to photographer sessions, not lab-admin sessions. Optional desktop entitlement is independent from the paid-subscription window. The requested read-only-on-expiry policy is therefore not guaranteed on the app or this lab invoice API.

A separate implementation needs a shared expiry policy at the server mutation boundary plus native offline queue admission/replay enforcement, preserving invoice-history reads and print/export, subscription renewal and any explicitly granted unlimited access. Existing expiry behavior is reported rather than silently changing billing policy in a storage fix.

Branch: fix/r1387-primary-installed-device. Draft under AGENTS.md security/data-integrity stop conditions. Not merged; no production deployment triggered.
