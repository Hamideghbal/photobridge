# R1473 / Native 1.0.33

Windows-only freshness fixes:
- Initial debt shows the canonical successful mutation response in the open manual-intake dialog. Web retains its existing summary refresh path.
- The installed host sends initial-debt and financial/invoice mutations live before considering its generic outbox. Unrelated conflicts no longer force these writes into the queue. Outstanding financial pending/conflict rows block new financial writes with an explicit message instead of reordering or duplicating them. Initial-debt edits require live confirmation; ordinary finance offline writes retain the previous outbox fallback.
- Native-only confirmed mutation events refresh mounted financial views. Queued acknowledgements never emit completion events. Native loaders are serialized so earlier reads cannot overwrite a later balance. Web has neither the event wrapper nor the serialization change.

General requested debt UX:
- An empty correction note is allowed. Backend ledger/audit entries retain a default description, existing locks, expected amount checks and invoice restrictions.
- Photographer/invitation debt editing opens a body portal dialog, rather than expanding a row. Existing permissions and invoice-lock messaging are preserved; resend buttons receive project styling.

1.0.33 keeps the same publisher trust key as 1.0.32. To test program updates: install 1.0.32, deploy the server/admin changes in this PR, build 1.0.33 on Windows, then upload its EXE and matching update JSON. The prior app should detect/download 1.0.33 and offer installation. No EXE has been built or uploaded in this workspace.

Validation: 90 native-source tests and 18 targeted debt/financial/portal tests pass on Linux. Final UI build stages, Lab snapshot freshness, byte-serving and phone-nav checks pass. Chromium browser tests could not run because no browser binary was available and browser download returned an invalid archive; modal structure and state transitions were exercised from the actual compiled component in VM tests. Actual Windows display and NSIS upgrade remain unverified.
