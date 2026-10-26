# R1485 — lab phone sticky tabs and calendars

Public phone UI only, inserted after the frozen Windows snapshot. No native settings, installer, backend or financial mutation behavior changes.

Remove the queue's upper padding and obsolete shortcut space. Use financial-style active status tabs directly under the measured header. Keep finance navigation sticky at the top of the phone scroller. Reduce print/album timeline dots from 32px to 26px while preserving a 48px-wide, 68px-tall touch target.

Opening another phone date picker closes the previous open picker through its existing React trigger. Desktop date toggling is unchanged. Measure calendar placement against the visual viewport and bottom dock; use a readable seven-column calendar rather than inheriting the narrow date-field width.

The dashboard range selector, both dates and Apply share a row. Invoice customer selection and manual invoice action share a row; hide the redundant invoice-count summary. Keep all three invoice actions at 44px height. In receipts, customer selection, payment and discount share one row, with selected-customer metrics on the following row.

Validation: four new tests cover real date-trigger behavior, calendar bounds at widths 280–412px and reduced viewport heights, phone-only layout rules and all frozen Windows SHA-256 hashes. The preceding five explicit-tap regressions pass. Final snapshot/freshness/wire checks pass. Authenticated real-phone visual verification remains untested.
