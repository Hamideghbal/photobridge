# PhotoBridge Lab 1.0.84 compatibility candidate

This is the same PhotoBridge Lab application, app ID, per-user installation and
SQLite schema as 1.0.83. No second product, data reset or queue migration is added.
The common x64 installer targets Windows 7 SP1 and later Windows versions.

Electron 22.3.27 is the final Electron branch that supports Windows 7. It is out of
security support. The compatibility build also uses its older Node generation;
existing modern installations should not automatically receive this candidate
before the compatibility/security tradeoff and real-device results are reviewed.

Changes: Node SQLite calls use better-sqlite3 through a small API adapter; the
network fallback retains Electron's native network stack, refuses redirects,
handles cancellation and preserves individual Set-Cookie values. Missing Node
web globals, structuredClone and AbortSignal.any are supplied. Access helper
bytecode and its checked bundled Java runtime target Java 8, with the existing
Access library checksums preserved. UI hot updates and signed update trust stay.

Build on Windows 10/11 x64 with Node 22: `npm ci`, `npm run dist:unsigned`.
The GitHub compatibility workflow runs regression tests on Node 16, packages on
Node 22, then executes the actual packaged Electron 22 app with a temporary
SQLite store and a real Chromium login render. The artifact is an unsigned test
candidate, not an automatic production release. The publisher's original key is
still required to create the installed updater's trusted signed update manifest.

Before declaring Windows 7 compatibility: test on actual Windows 7 SP1 x64 with
current platform/SHA-2 and TLS updates. Verify install, login, native font,
folder picker, download, local printing/invoice, backup/restore, online sync,
UI hot updates and application restart. Also test an existing 1.0.83 database
copy and pending queue on Windows 10/11. Preserve the original user-data backup.
A Windows 2022 CI success does not replace the Windows 7 test.
