# PhotoBridge Lab 1.0.90 — single first paint

This release candidate addresses the double-looking launch reported on a slow connection: the old lab header/status controls were briefly visible before the deferred canonical header scripts promoted them.

## Change
- On a successful startup, open the verified local `/lab` UI **once**. The separate `data:` startup document is loaded only when startup fails.
- Inject an inline native-only first-paint gate before any website scripts. On desktop, keep the transitional React lab UI hidden until the canonical main header, required second header and any contextual third header have been promoted and the native overlay has loaded.
- Display a lightweight local loading message meanwhile; if it takes over 18 seconds, show a retry control while continuing to check for readiness. Do not expose the old layout on timeout.
- Login pages and archive pages without secondary tabs can display normally. Touch/mobile layouts are not gated, and no new network request is added.
- Preserve the existing verified UI bundle, integrity hashes, offline behavior, native bridge, session and settings.

**Performance boundary:** This removes one successful Electron document navigation and prevents transitional UI paint. It does not remove the React app itself or the deferred site scripts, and is not proof of faster internet data transfer or mobile navigation. A separate web performance audit is needed for those.

## Local Windows build

Windows x64, Node.js 22+, and the **original** publisher update key are required:

```powershell
$env:PB_UPDATE_SIGNING_KEY = 'C:\Keys\update-private.pem'
node .\build-local.cjs 1.0.90
```

Or run `BUILD-WINDOWS.cmd` after placing the key in `.publisher/update-private.pem`.

Expected installer: `release/PhotoBridge-Lab-Setup-1.0.90-x64.exe`, plus a signed update JSON. Neither is committed to the repository. Do not generate a new publisher key: that would break upgrades of installed versions. Authenticode signing of the EXE additionally requires the existing `CSC_LINK` / `WIN_CSC_LINK` setup.

## Verification

Run `node --test test/first-paint.test.cjs` and all native tests, then verify the Windows 7/10/11 launch with throttled networking: there must be **no old header/status flash**, while login, archive, finance, reload after errors, and offline startup still work. This source change has not been built or verified on a real Windows installer in this environment.
