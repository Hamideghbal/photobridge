# R1482 — compact lab phone workspace

The lab phone screenshot showed the original header print/album tabs together with the R1151 injected duplicate row, oversized collapsed order operations, and no usable bottom dock.

Replace the R1448 loader after the frozen Windows snapshot with an independently styled phone dock: Print, Finance, Archive. Inline SVGs avoid inherited desktop icon masks and visibility styles. Buttons forward to the existing React handlers, preserving access checks and workflow behavior; selecting Print while already in the album list preserves that list. Existing routes still determine the selected button. The dock unmounts on logout, leaving the lab workspace, or widening the viewport.

On mobile only, hide the R1151 duplicate and the previous utility rail, keep the original header mode controls, and remove the duplicate row’s reserved 48px spacing. Show existing actionable stage buttons in a compact connected timeline, with green completed stages and blue current stage. Album stages can scroll horizontally. No action handlers, download verification, billing logic, or APIs change. Payment notices, progress, invoice/detail actions remain present. Safe-area padding protects the dock and final order card; the subscription notice sits above it.

Validation: four navigation/workspace regression tests pass, including route changes, original handler forwarding, single mounting, teardown and Windows/other-role exclusion. Final desktop freshness and exact-byte serving checks plus existing phone navigation tests pass. Authenticated real-phone rendering has not been exercised in this environment.
