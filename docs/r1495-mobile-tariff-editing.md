# R1495 — lab phone archive, photographer, and tariff settings

This release adjusts only the lab phone interface, behind `pb1482LabPhoneMode`.

- Archive record actions are aligned to the physical left edge in a single trailing action area.
- Photographer cards remove horizontal overflow and place settlement choice, initial-debt editing, and account activation in one compact row.
- Print and walk-in tariffs show compact size cards. Selecting a card opens price editing in a modal; the walk-in modal saves through the existing authenticated walk-in tariff endpoint.
- Tariff action buttons remain pinned while the settings content scrolls and the section headings move out of view.
- The desktop UI snapshot remains hash-verified and unchanged.

Verification: `node --test scripts/test-r1495-mobile-tariff-editing.cjs` plus the existing lab-phone regression stages in `liara-fast-build.mjs`.
