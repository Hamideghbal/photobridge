# R1468: independent offline documents

Shared documents become read-only without a server connection. New offline documents remain independent until their entire bundle is acknowledged. Windows 1.0.61 sends policy version 1; older native clients cannot write business documents through the new server.

Migration 194 adds nullable offline references to orders/invoices, immutable import receipts and scoped customer mappings. Existing numeric server sequences are retained. Offline references are projected for display and printing. No existing documents are renumbered or deleted.

`POST /api/lab/desktop/offline-import` requires the authenticated lab administrator and current primary device. Subscription and lab/customer scope are checked inside the transaction. A per-lab/document advisory lock, unique offline reference, immutable payload hash and stored result protect retries. The complete order manifest, invoice snapshot, receipts, corrections and balanced journal commit together. Any failure rolls back. Independent invoice values are imported without repricing or automatic batch discount reconciliation. Customer profiles without mobile numbers are created and mapped inside the same transaction.

Published documents are never updated by an offline import. Further changes use normal online APIs. Order/album stage writes require the observed monotonic `document_revision`; stale or missing versions receive 409. Successful business writes invalidate authenticated lab SSE clients. Updated browser/native listeners refresh queues, finance views and open invoice previews. Native polling remains a fallback.

PDF delivery follows the financial import through the existing authenticated PDF-upload API. The financial transaction is not held open for object storage. The invoice is not advertised as PDF-ready before that upload succeeds.

Validation: `npm run build`, `node --test scripts/test-r1468-offline-policy.cjs`. Database integration: install `@electric-sql/pglite` separately, set `PGLITE_MODULE` to its module path and run `node qa/offline-import-postgres.mjs`. Set `DESKTOP_SOURCE_DIR` to the native source folder to additionally exercise its real order, payment/correction and bundle builder. This validates fifty invoices, lost-response replay, rollback, cross-lab/device checks, customer mapping and exact historical values without production writes.

Release target is `aaa-liara-release`. Display labels use compact `OFF-1` numbers; immutable device-scoped full references remain in database receipts and import payloads.

Rollout requires explicit financial/schema review. Deploy the migration/backend before installing Windows 1.0.61. Retain backups. Old pending desktop mutations are quarantined for comparison; they are not silently replayed or reclassified as offline-origin documents.
