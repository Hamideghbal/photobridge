# Validation

Base: af9606f2 (fix/lab-152-queue-loading-finance-entry).

17 focused Node 22 tests passed: approved thermal layout, native model-dialog injection, existing thermal print journal, offline invoice printing, manual invoice UI, and local automatic invoicing. Test-only SQLite binding 11.10.0 was used for Node 22; shipped Electron dependency remains 8.7.0.

Browser tests against actual web and Windows UI modules reproduce the old keyboard block with an already open native modal; the fixed modal accepts Persian and Latin text, cancel makes no write, save writes once, and ordinary tariff typing remains usable.

A broader native suite was not green: existing build-local-version/current-download assertions fail unchanged on the clean af9606f2 baseline (4 failures across those fixtures). A run with test isolation disabled also stalled after legacy sync tests and was stopped. These inherited failures are not claimed fixed; native PR remains a draft. Physical Windows build and printer execution have not run here.
