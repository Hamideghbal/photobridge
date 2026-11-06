# Lab 1.0.93 — invoice dialog and mandatory stage gate

The 1.0.92 online receipt URL was wrong. The deployed route is `/api/lab/orders/:id/download-receipt/download`, not `/download-receipt`. The new contract QA reads that regular expression from the built server source and invokes the actual receipt and automation modules; it reproduces the old 404 before exercising the corrected request. SQL dependencies remain isolated test adapters, not production accounts.

A single native invoice dialog now opens automatically after verified manual file copying. Known tariffs issue the invoice; missing tariffs show unit-price inputs. Cancel does not save prices, issue an invoice or advance a stage. Failures leave a retryable dialog. Invoice or print warnings stay visible. An invoice returned by the verified receipt is reused.

The native HTTP host rejects every printing/review/design/binding/ready/delivery write without an authoritative invoice, even if the renderer sends a forged invoice ID. Shared orders are checked against a fresh server detail read; independent offline orders against the local committed invoice. This is enforced independently of the legacy server's late-invoice workflow policy and of the UI. File receipt/download and explicit no-invoice recovery remain allowed.

Offline manual processing uses the local invoice and persisted spool journal. Legacy background network dialogs do not interrupt native offline work; genuine failures in the active invoice operation remain visible in its dialog. Remote invoice identifiers are mirrored into queue rows without posting local journal entries or changing customer balances.

QA includes actual DOM dialogs, the patched invoice-button callback, the native HTTP host, exact backend receipt-route matching and real receipt/automation handler code. Separate offline QA drives the actual intake form, writes photo bytes into a temporary folder, verifies their SHA-256 through the host, cancels pricing, checks all stage gates, then saves a price, creates one local invoice and invokes the persisted thermal spooler with a mocked OS print callback. No physical printer or production-database validation is claimed.

Use the complete source package, copy the existing `.publisher` beside `main.cjs`, and run `BUILD-WINDOWS.cmd`. This candidate still needs the user's real Windows validation.
