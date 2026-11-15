# R1858 — compact print actions

Removed the duplicate recovery queue in price details: no second photo list, preview, per-file retry or remove buttons. Original photo cards show durable states and precise errors/correlation IDs. Original thumbnail preview and original photo trash remain. Main send buttons become Retry for an existing draft, reuse original IDs and skip already verified files. Missing originals are reselected using a hidden original-file input with SHA-256 verification.

Original adjacent cancel controls pause an active transfer. When idle they offer explicit Remove upload with confirmation, marking the local queue discarded without deleting server orders or stored customer originals. Discard is checkpointed under the session WebLock; discarded queues do not reopen on refresh and new selection is allowed. There is no automatic discard on errors. No schema/API/payment/pricing/laboratory changes.

Discard checkpoints roll back on storage errors. A previous ambiguous finalization cannot be discarded into a fresh duplicate; the existing order must first be reconciled by retry. Mobile F40/v755 action proxies mirror the same primary label/busy state and adjacent cancel action, with explicit cache versions and updated Windows UI hashes.

The discard checkpoint uses the existing empty-queue state and keeps the old order/file metadata in an explicit discarded record. Older clients therefore see no active photos to resurrect. No new queue-state value is required.
