# R1487 — phone photographer pickers and project notices

For lab phones only, replace native photographer selects in invoices, receipts and account statements with the existing project `wn` component. Preserve the same option values, empty/all choice, state updates and page/detail resets. Retain the original native select branch for Windows/desktop. Phone detection for rendering does not depend on workspace classes mounting, so the first render already uses the correct component.

Style both triggers and body-portalled options in RTL using Vazirmatn; long names can wrap. Statement columns allocate 1.8 shares to photographer and .8 each to the two dates.

Replace raw phone download/unavailable-stage alerts and failed remote-stage verification messages with the existing queued accessible project dialog. Add an optional brandLabel parameter while preserving the old archive brand as default. Lab phone notices explicitly use the lab brand and Persian titles. Workflow eligibility and API behavior remain unchanged.

Validation: six new tests cover all three picker callbacks/options, first-render phone detection, notice titles/blocked transitions, portal styles and every frozen Windows manifest hash. Five prior calendar tests also pass (11 total). The chained public phone build transforms and syntax checks pass. Real authenticated phone rendering has not been tested. No Windows source, settings, backend or installer changes; the patch runs after the frozen Windows snapshot.
