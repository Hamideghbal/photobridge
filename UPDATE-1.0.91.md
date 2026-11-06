# PhotoBridge Lab 1.0.91 — manual photo order registration

The updated website intake sends metadata to `files/local-batch`. Version 1.0.90 did not implement that route locally, so offline registration failed with `offline_operation_unsupported`.

- Register up to 100 device-local file records in one atomic local transaction, using the same registration helper as individual files. Failed batches roll back; replay does not duplicate files.
- Preserve native file proof checks before submit and the shared/offline document policy.
- Include the pending online native alias/bootstrap fixes, and stop routing after a live bootstrap response has been sent.
- Test with the real catalog key `13x18`, luster and metallic paper, two files, retry and verified-file submission.

The website batch validator also needs its separate fix to accept text catalog keys such as `13x18`; UUID validation applies to file IDs. Until that server fix is deployed, online batch registration can still report `print_selection_required`.

Build on Windows with `node build-local.cjs 1.0.91`. The original publisher key is still required. This source is not a signed installer; preserve the existing SQLite database and photo folders. Native changes require a new installed application; a website-only UI update cannot replace the native order engine.
