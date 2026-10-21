# Building the PhotoBridge Lab Windows installer locally

This alternative uses the same native Electron/NSIS installation model as the equipment/frame store. It **does not depend on GitHub Actions**.

### Requirements

- A Windows 10/11 x64 PC with Node.js 22 or newer and internet access for `npm ci`, Electron and electron-builder.
- A **current** checkout or downloaded ZIP of the full PhotoBridge repository. The `dist/web` files in that checkout become the installer's initial UI. Get the newest `main` before building.
- Keep `desktop-sources/PhotoBridge-Desktop-Sources-R1089.zip`, `apps/lab-desktop/desktop-overlay.js`, `apps/lab-desktop/ui-update.cjs`, and the repository `scripts/` folder.

### One-click preparation and build

From the repository root, double-click **`BUILD-LAB-WINDOWS.cmd`**. The script:

1. Checks the saved Windows-source ZIP against its pinned SHA-256 before touching the native app.
2. Restores **only the laboratory native source files**, keeping the new tracked overlay and resumable UI updater intact (and leaving the Store application untouched).
3. Integrates Windows alerts and the 1.0.16 laboratory update system.
4. Includes the current website UI in the installer, prepares the existing PhotoBridge icon and runs focused native tests.
5. Runs `npm ci`, the app's tests and Electron Builder NSIS on the local Windows machine.

Expected unsigned test output:

`apps/lab-desktop/release/PhotoBridge-Lab-Setup-1.0.16-x64.exe`

It also writes `lab-installer-build.json` with size and SHA-256. If a step fails it exits with a nonzero status and does **not** report a fictitious EXE.

For a preparation-only dry run:

`node tools/build-lab-windows-local.mjs --prepare-only`

For a signed build on Windows **after configuring a valid Authenticode certificate** (such as `CSC_LINK` and its credential):

`node tools/build-lab-windows-local.mjs --signed`

### Publishing

This build script **does not** upload anything to the website. Only after validating the Windows installation, login/logout, order synchronization, offline storage and UI updates should a signed release be uploaded using:

**Admin → راهنما → برنامه ویندوز لابراتوار → بارگذاری برنامه**

The site's existing protected laboratory download endpoint then serves that active release. Never upload the unsigned test artifact as a production-signed installer. Older installed native versions will need the new EXE installed once; later website UI updates can use the built-in updater.

**Important:** Preparing the source and passing cross-platform tests does not prove that the Windows executable has been built or tested on real Windows.
