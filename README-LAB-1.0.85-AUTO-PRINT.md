# PhotoBridge Lab 1.0.85 - trusted silent printer bridge (test candidate)

This keeps the PhotoBridge Lab app identity, user data, SQLite store, signed updater trust and Windows 7 SP1 compatibility engine from the 1.0.84 candidate.

The local Electron host exposes pbLabAutoPrint **only** to the installed localhost 43761 application. Each print operation requires an authenticated lab, exact main-window sender origin, a well-formed printable HTML sheet, a current default Windows printer, and a unique lab-scoped job key. The host permanently reserves each job key before calling silent printer submission. Spool failure/crash is recorded for manual review; it never repeats an uncertain print automatically. The older 1.0.83/1.0.84 installed hosts do not provide this bridge. The program window keeps the native worker active while minimized in the tray.

The corresponding web/API and native UI hot-update feature lives in PR #687 on the aaa-liara-release branch. Without that server UI and enabled lab settings, the bridge does not independently print anything.

Never publish the unsigned GitHub workflow installer or release auto-updater before successful physical Windows 7/10/11 and actual receipt-printer tests. Signed release requires the original publisher key. The GitHub job verifies a packaged Electron login + bridge exposure and runs mock spool/failure/duplicate tests; it cannot prove physical paper output or printer driver availability.
