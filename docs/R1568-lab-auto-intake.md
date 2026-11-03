# R1568 Lab automatic intake and invoice policy

This is an opt-in candidate; do not automatically publish a financial or printer workflow.

## Settings
- Auto download: off by default. Incoming online photo orders only; the primary native workstation must be running, logged in and online, with an accessible preconfigured storage root and correct permissions.
- Invoice timing: after print by default (the existing behavior), or before print after full on-disk verification and a primary-device server receipt.
- Auto print: off by default, with at-most-once per-job native print submission. Older installed hosts lack the IPC bridge and must not claim success.

## Missing tariff policy
If any print-size price is missing, the server returns invoice_pricing_required, with no financial invoice. A clearly marked provisional sheet is printed showing order number, studio, file count, per-size file count and print-copy count, followed by NEEDS MANUAL INVOICE FROM LAB OPERATOR. Once prices are entered, issue exactly one financial invoice for the original order. The provisional sheet never enters accounting.

## Release requirements
- Download should not mark an order printed, ready or completed; no original-file deletion schedule should be started by early invoice alone.
- Physical workstation off/sleep or disconnected disk cannot download: website option does not magically control a powered-off PC.
- Silent printing requires a signed Windows app update with a printer IPC bridge. The website or hot-updated UI alone cannot silently send jobs to the printer from an older 1.0.83 host.
- Verify partial downloads, retry and reconnection, two concurrent jobs, missing/changed prices, spooler crashes, settings switch, PDF errors, and low-end Windows/Windows 7 SP1 device testing before merging to aaa-liara-release.
