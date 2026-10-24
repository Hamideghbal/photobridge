# Cooperation notification ownership

Cooperation events use the in-page green banner and a native Windows system toast, not the persistent order/chat alarm window. The native poll strips matching cooperation IDs from old durable pending rows without dropping orders, retries failed system toasts, and scopes seen history and click actions to the account. Clicking a new request awaits app reopening before loading `/lab/settings/customers/collaboration`.

Windows 1.0.28 is required. Integrate a 1.0.27 source folder with `node scripts/integrate-r1398-cooperation-alerts.cjs PATH`, then use BUILD-WINDOWS.cmd on Windows. The web update cannot replace installed main-process JavaScript. Existing order/chat alarm and offline subscription behavior are retained.

An authenticated native poll announces support for the informational toast. The serving API process keeps a lab-scoped 35-second presence lease and suppresses duplicate cooperation Web Push while it is fresh. Without a current native owner, the worker retains a browser system notification fallback. This in-memory lease is process-local, is lost on restart, and does not coordinate multiple independent API replicas. Initial startup/restart overlap and Windows notification permissions need live verification; it is not a hardware/authorization claim. There are no schema or user-data migrations.

Rejected collaboration reviews and removed memberships are informational: foreground mobile toast has no button or click handler; background push has no action and clicking it cannot navigate. Other notifications retain their actions. Lab cooperation foreground push does not add a second floating toast or sound beside the green banner.

Validation: 8 targeted native/worker/server/foreground tests, the existing 67 native tests, and 3 packaged cooperation tests passed. JS syntax, repeatable transforms, bundled asset hashes and native UI compatibility passed. No EXE/NSIS build, live push provider, Windows notification center, browser/mobile visual test, full Docker or Liara deployment was run.
