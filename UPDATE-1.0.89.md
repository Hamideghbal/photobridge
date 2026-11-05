# PhotoBridge Lab 1.0.89

Build with the existing Windows build command and your own signing key. No installer is included in this change.

The single update action now shows UI-download progress. Manual retry rechecks a previously failed UI build while retaining all manifest, file-hash and root validation. Automatic updates continue to quarantine failed builds. Offline errors explicitly refer to the update and have a styled retry button. Closing a progress window keeps the check running; a completed UI update still requires confirmation and waits for open work to finish.
