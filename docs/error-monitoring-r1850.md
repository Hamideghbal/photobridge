# Error monitoring and upload statistics (R1850)

Based on production rollback v2614 / c4d2461. R1847–R1849 lab-entry changes are deliberately absent. Do not merge this branch into an unreconciled release branch: preserve the user's rollback explicitly in the final PR.

## Behavior

- Authenticated browser reports: same-origin API 5xx/network failures, unhandled JS errors, and terminal print PUT failures. All generated HTML pages install the reporting script. Expected HTTP 4xx, cancellations, console warnings, native desktop errors and caught application errors outside instrumented paths are not globally reported.
- Reports identify stage, observed HTTP/provider code, sanitized path, support reference, authenticated account and original storage request ID if CORS/XML exposes it. No signed URLs, cookies, request/response bodies, file content or file names are transmitted in telemetry. The affected filename is shown locally.
- Classification separates evidenced PostgreSQL failures, storage responses, explicit capacity errors, network-path failures, browser and unknown application failures. Storage 503 is not proof of slow client internet, full disk or a specific provider cause.
- Print PUT retries only network/408/429/502/503/504, at most 3 attempts, with 1.5s/3s delays. Each attempt uses the same URL, bytes, existing file/order identity. No POST submit retry, no new presign ID, no permission retry. Abort stops retry and the existing 3-worker pool still drains started work. Existing completion/status polling is unchanged.
- Persistent database incidents are mirrored every 15s from a bounded local outbox. At most 500 groups in memory, current local file rotates at 4 MiB, previous file retained; administrator endpoint returns latest 200 groups. The database incident history is retained until an explicit retention policy is chosen.
- SMS reuses existing platform-admin recipient/settings/provider, with in-memory settings cache (refresh every minute; maximum age 5 minutes). No customer wallet is charged. Actual provider text send is independent of the database while that cache remains valid. Maximum 6 attempted alerts/hour/process, identical errors share a 10-minute incident window, retries respect budget. Multiple replicas have separate SMS budgets. Failed SMS is visible and retried later. No production SMS was sent during testing.
- Admin page: `/admin/error-monitor`; protected data APIs `/api/admin/error-incidents`, `/api/admin/upload-statistics`. Non-admin reports cannot select actor identity, read incidents, or bypass origin/content-type/8KiB/rate checks.

## Durable statistics

Migration 198 creates a success ledger and trigger on `order_status_events`. The first `sent` event snapshots lab, mode, file count, original byte metadata and unknown-size count in the same transaction. Repeated submission of the same order does not increase totals; rolled-back submission does not count. A later deletion of operational records cannot delete the ledger. This adds a small aggregate read/write to the submission transaction; a metric database write failure causes that transaction to fail rather than publishing a false success.

The historical backfill uses first surviving `sent` events and surviving file metadata. It cannot reconstruct previously hard-deleted files/orders or missing historical events; these rows are labelled historical. Original byte metadata is distinct from actual network bandwidth, compressed derivative size and retransmission traffic. Days use Asia/Tehran; report defaults to 30 days, maximum 90 days, maximum 10,000 rows with explicit truncation flag.

## Operations and limits

Set `ERROR_MONITOR_DIR` to a **persistent private disk directory**, outside any web/upload serving root. Default is a sibling `error-monitor` of `LOCAL_UPLOAD_DIR`; verify this location is mounted in Liara before production approval. Database mirroring reduces restart loss, but errors awaiting synchronization require a persistent outbox to survive deployment or process replacement. Never place it on a public storage bucket.

Existing SMS provider must be configured and admin alerts enabled. Administrator account mobile is selected by the existing platform convention (first active platform_admin). Verify it is the intended owner before enabling production alerts. Startup without a healthy initial configuration cannot send cached alerts. A complete process/host/network/provider outage cannot be reported by that same process; independent external health monitoring is still needed for that case.

Migration historical aggregation can scan existing status/file history and must be reviewed against production size before rollout. It never deletes operational data. No Actions, manual deployment or real production SMS is required by the patch. Review and approve schema/security-sensitive changes before merging as required by AGENTS.md.

Background promises that previously used `.catch(console.error)` also create incidents; pg-pool idle-client errors gain a handler and are recorded instead of becoming an unhandled EventEmitter error. This is observation/reconnection support only; no database write is blindly retried. Orders with no confirmed file are excluded from upload totals.
