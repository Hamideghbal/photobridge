# Site-driven native folder selection

The lab site offers Choose folder instead of a typed Windows path. The authenticated lab admin selects an announced native installation; a short-lived server request is polled by that installation. Only a user-selected folder from the Windows dialog is probed and submitted. There is no cross-origin localhost endpoint, browser filesystem-handle transfer, protocol-handler injection, or arbitrary file-read endpoint.

Native 1.0.26 is required. The app brings its window forward before showing the dialog. The site and app must use the same lab account and have internet during this initial setup. Subsequent offline subscription behavior is unchanged: the last confirmed grant lasts until its subscription deadline.

Requests are lab-scoped in existing ui_preferences and bound to the announced device. A row lock guards claim, cancellation, expiration, stale settings and completion. Finish atomically registers the selected folder and native primary after the disk write probe. The native installation independently verifies that server result and persists the local root before acknowledging success to the browser. An activating request can resume after network loss/restart without another picker. Browser refresh can resume watching an unfinished request. Selecting another primary remains an explicit site admin action.

Cancellation or errors before finish preserve the previous configuration. After a confirmed finish, server and local persistence are not one distributed transaction: an unacknowledged activating request remains pending and is reconciled by the app, rather than falsely reporting completion. A settings revision change invalidates that request. A process crash while the dialog is open may require cancel/retry; unclaimed/claimed requests expire after five minutes.

Validation: 67 native tests, 26 storage API/UI tests and one real PostgreSQL-compatible transaction test passed. Generated server and website syntax and repeatable transforms were checked. The native integrator ran twice; bundled UI hashes and compatibility passed. Windows EXE/NSIS, visual dialog behavior and full Liara deployment are not verified here.

This change introduces a site-to-native capability and is held for explicit publication under AGENTS.md security-sensitive stop conditions.
