# R1490 — lab phone archive and settings layout

This change is scoped to the authenticated lab phone layout (`pb1482LabPhoneMode`). It aligns archived-invoice actions, gives the invoice preview close control a clear touch target, places the two settings pickers side-by-side, and turns the print/binding tariff matrix into readable per-size cards with directly editable price fields. The same mobile card treatment also applies to the lab's walk-in tariff panel when it uses the matching pricing panel classes.

The patch runs after the frozen desktop/Windows UI snapshot. It changes no tariff values or APIs; existing save actions remain in place. `scripts/test-r1490-mobile-archive-settings.cjs` checks phone-only scope and verifies the frozen Windows files against their manifest hashes.

R1491 adds a separate two-row grid for archive cards: file/reprint and invoice actions keep matching widths and touch heights despite being rendered in nested components.

R1492 enlarges finance/archive figures on lab phones and presents account-statement entries as labeled, two-column transaction cards. The archive invoice-view action is left-aligned within its touch target.
