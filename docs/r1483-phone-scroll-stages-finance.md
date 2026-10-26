# R1483 — lab phone scroll, stages and compact finance

Scope is the public smartphone lab workspace only. The transform runs after the frozen Windows UI snapshot and never writes its files, installer source, settings, storage configuration or backend APIs.

- Hide print/album queue search, clearing an existing invisible query through its original React clear control.
- Measure the real visible header and bottom dock edges on render/resize. Use one scroll viewport between those edges; remove nested order-list fixed heights and excess bottom padding.
- Keep status filters hit-testable. Stage connector pseudo-elements do not intercept touches. Stage clicks do not open the whole order card.
- Phone download buttons are disabled: downloading remains on the primary computer. For later stage actions, read the current server order and require matching order/lab identity, downloaded_at, an eligible status, and paid prepaid orders. The server remains authoritative for the actual existing transition. Mobile does not inspect a disk on the phone. Windows/desktop retain the original complete local-file verification.
- Keep finance tabs in one row, put range selection and two dates in one row, and place date-range actions side by side.
- Lay invoice records out as a compact three-column grid with amounts in stable cells and actions together; hide only the duplicated issuance date cell because its date is already under the invoice number. Preserve every monetary field and existing action.

Validation: seven focused tests pass, exercising the actual stage dispatcher and guard, blocked/mismatched/unpaid/offline cases, measured viewport updates, Windows exclusion, and SHA-256 verification of every frozen Windows manifest file. Final snapshot freshness, patch-import and wire-byte tests and prior mobile navigation tests pass. Authenticated real-phone visual testing was not available.

Review boundary: the phone stage prerequisite changes from a local disk recheck to current server confirmation of the primary download. No backend authorization or transition rules are changed. Because this adjusts a workflow integrity prerequisite, AGENTS.md's 'Do not auto-merge' rule applies; prepare the PR and await explicit publication approval.
