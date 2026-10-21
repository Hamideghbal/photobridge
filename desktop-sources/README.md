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

## R1342 laboratory update fixes

The current tracked `apps/lab-desktop/ui-update.cjs` replaces the archive's sequential updater. Preserve it alongside `desktop-overlay.js` before extracting the archive and restore both afterward. Then run `node scripts/enable-r1296-native-alerts.mjs` and `node scripts/enable-r1342-lab-ui-update.mjs` from the repository root. The laboratory candidate version becomes **1.0.16**. The Windows workflow performs these steps automatically.

Run `node --test scripts/test-r1342-lab-ui-update.cjs scripts/test-r1342-native-integration.cjs` after integration. Downloads use at most four workers, reuse hash-verified partial downloads after interruption, and verify every manifest file before activation. The manual UI-update command runs from the native tray menu and asks before reloading a visible workspace. No additional local HTTP command is exposed. Native SQLite records, order files and sync queues are unchanged.

These changes update the native application engine and require a newly built installer. Publishing website assets alone cannot replace `main.cjs`, `host.cjs` or `ui-update.cjs` in an older installed application. An unsigned Actions candidate is still not a production release; Windows validation and signing are required before activating the authenticated laboratory download. An existing signed installer can be uploaded in the platform administrator's laboratory desktop release section. The installed program on a user's computer is not accessible from the repository/cloud workspace.
