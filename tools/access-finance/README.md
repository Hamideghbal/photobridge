# PhotoBridge — Microsoft Access financial review (read-only)

Run `tools/access-finance/BuildAccess.vbs` on **Windows with Microsoft Access 2016 or newer**. It creates a new `PhotoBridge_Finance_Review.accdb` in the same directory and opens its first form.

The generated database contains three native Access datasheet forms:

| Form | Financial view | Columns |
| --- | --- | --- |
| `frmPBInvoices` | فاکتورها | RowNo, Ref, DateJ, Studio, Details, Kind, Amount, AccountingMark |
| `frmPBReceipts` | دریافتی‌ها | RowNo, Ref, DateJ, Studio, Details, Kind, Amount, AccountingMark |
| `frmPBLedger` | حساب معین | RowNo, Ref, DateJ, Studio, Details, Kind, Amount, AccountingMark |

These are **demo data only**, not live PhotoBridge data. All three forms prohibit add/edit/delete; no integration credentials or source-account data are embedded. On systems without Vazirmatn installed, Access may substitute another font. Do not execute this installer against a pre-existing database: it explicitly refuses to overwrite an existing file.

This is a **financial data viewer**, not a verified recoverable PhotoBridge backup. An Access `.accdb` and exported CSV cannot safely restore a complete server database on their own. No application-side restore endpoint has been enabled by this package.

## Restore to PhotoBridge — release prerequisites

Implement a separate, authenticated, admin-only and lab-isolated `backup/export` + `backup/preview` + explicitly confirmed `backup/restore` flow before exposing any restore action:

1. Produce a versioned machine-readable archive from one consistent PostgreSQL snapshot, including tenant identifiers, invoice/order relationships, financial ledger transactions and entries, customer relations, storage object manifests, record counts and cryptographic checksums. Give users a separate Office-readable CSV/XLSX export; the Office copy is **not** the source of truth for restoration.
2. Import to a **staging** area first. Reject schema-version mismatches, incomplete manifests, missing links/files, cross-tenant records, duplicate invoice numbers/IDs, invalid currency totals, unbalanced debit/credit and unexpected source identifiers. No direct edits from Access should ever be applied to the production ledger.
3. Show a preview and a full, verified pre-restore snapshot. Require primary administrator re-authentication, explicit selection of scope and a typed confirmation. Restore atomically and idempotently, preserve immutable invoice identities and use explicit conflict policy. Log who restored what and verify post-restore invoice and receivable balances.
4. Exercise against an isolated PostgreSQL database with a round-trip export/restore test, partial-failure rollback and double-restore idempotency. Never auto-merge a restore implementation until all safeguards pass.

**Status:** read-only Access forms are provided. Recovery requirements are documented; production restore is **not yet implemented** or enabled.

## Website-only invoice fix

The R1531 website patch addresses missing concurrency preconditions on ready-state invoice issuance for internet print and album orders. It executes only after the Windows desktop UI snapshot. Both document creation and PDF upload have separate failure cases: the status transition must succeed before generating the PDF; PDF upload failure must not cause a duplicate invoice. The fix does not alter Windows application code.

## RTL PhotoBridge visual preview

Open `finance-backup-preview.html` directly in a desktop browser to inspect the RTL finance tab layout, PhotoBridge-like spacing, Vazirmatn/Tahoma typography and line icons. The backup page can export **sample** CSV rows and parse a local JSON file for inspection only. It cannot write to the site or restore anything. This preview has not been mounted into the production application's live navigation yet; do not call its JSON inspection a restore.
