# PhotoBridge Windows application source archive

**Canonical source snapshot:** [PhotoBridge-Desktop-Sources-R1089.zip](PhotoBridge-Desktop-Sources-R1089.zip).

This ZIP is **not a Windows installer**. It contains actual editable native Electron sources for **both** applications, extracted from archived working versions:

- `apps/store-desktop/`: store app based on R69 / 1.0.1, combined with R97 hot-update changes and R1089 account-switch and native printer fixes (candidate version 1.0.3).
- `apps/lab-desktop/`: lab app based on R72, updated with R97 hot-update source (version 1.0.14).
- Build instructions and regression tests are included in each application's `SOURCE-README.md`.

## Restore editable source

From the PhotoBridge repository root, extract the ZIP into the root, preserving relative paths. It intentionally includes both `apps/store-desktop/` and `apps/lab-desktop/` so later development can work from the saved source instead of decompiling an EXE. The tracked production repository also has standalone `desktop-overlay.js` files; when building a **new** installer prefer the latest tracked overlays from the current `main` checkout rather than an older snapshot from inside this archive.

## Store Windows candidate

1. Check out current `main` (to obtain current `dist/web` and `dist/api/equipment-rental-portal.html`).
2. Extract the source snapshot. Restore the checkout's up-to-date `desktop-overlay.js` for each app.
3. On **Windows x64 / Node.js 22**, run `cd apps/store-desktop; npm ci; npm test; npm run dist:unsigned`.
4. Installer generation embeds the latest checkout UI into the EXE using `prepare-assets.cjs` so launch is not blocked on initial web update. Background update can still fetch later versions.
5. On a real Windows machine verify default-printer A4 handover printing, A → sign out → B isolation, offline queue retention, mobile-triggered printing, and fresh installation before publishing.

Source snapshot SHA-256: `49788a4b7db76696742a9ebdfc054b71029993c76677fcf5da95d94085f2dad0` (234,370 bytes).

## Production safety

The Windows source archive does not change the deployed website. CI can create an **unsigned test installer** as a restricted GitHub Actions artifact, but a signed production EXE must pass Windows validation, be signed, and be uploaded to the existing authenticated store installer distribution route. **Never claim an unsigned Actions artifact is a production-ready installer.** Preserve local SQLite data during upgrades.

This source is also backed up in the user's ChatGPT Library folder `/PhotoBridge Desktop Sources/`.
