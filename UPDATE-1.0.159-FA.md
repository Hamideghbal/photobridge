# PhotoBridge Lab 1.0.159 — fast startup candidate

Base: complete native source 1.0.158 (ad38bd5f5f61f340c50c78871fab576597931a47). Only automatic appearance update scheduling and non-blocking UI verification/storage changed. Existing startup already uses local verified UI. Delay automatic check 2.5s after ready and visible; focus bursts coalesce, manual checks bypass delay. Preserve full per-file hashes, manifest validation, retry, atomic activation, known-good and actively rendered roots. Do not change native installer update signature, trust key, install gate, photo transfer, accounting, or database.

Mandatory build adds startup/appearance update regressions and the existing update-install-gate test. Source lock records intentional main, UI updater and regression changes, and verifies both new runtime files in packed app. Run the normal one-click Windows builder and verify actual Windows startup, online/offline, manual update and upgrade from 1.0.158 before signing. Candidate only; no live update manifest or EXE published.

Validation: focused Node 22 tests on real temporary files passed (scheduler, damaged UI repair with SHA-256, failed update rejection and retention of active/pending UI). Native main parsed and static manual-gate integration checks passed. This is not a full release build or Windows runtime/signing test. `nativeStartupUiMs` measures startup until the local UI load finishes, not first interactive render.

## Fast view candidate follow-up
- Refresh the inactive first ten-order page every 18 seconds while the foreground workspace is visible; retain bounded cache, priority guard for incoming downloads and independent click path. Invalidate prefetched reads on server document events and reject superseded financial responses.
- Reconcile summary/payments/expenses once their four financial inputs arrive, independent of slow ledger; start receipt transport before invoice completes for the R2051+ renderer where exact anchors match. Index payment and expense lookup instead of scanning all existing documents per incoming row. Preserve exact customer/date selection, write guards and update signing/installer logic.
- Native candidate only. Mocked focused finance tests and JS syntax checks passed; actual SQLite/HTTP integration tests are included in mandatory release gate but not executed here. No Windows timings or stable release claims.
