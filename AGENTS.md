# Native Lab release rules

Use this complete native source as the baseline. Preserve unrelated work; do not reconstruct a release from an older branch or from website-only desktop fragments.

The thermal invoice table, model modal focus, update installation gate, signing checks, native host and sync coordination are protected by protected-source-lock.json. Both local and CI builds must run verify-release-lock.cjs and run-release-regressions.cjs. After electron-builder, verify the actual app.asar and runtime resources before signing/publishing the update manifest. Never remove/skip these steps to get a build through.

A hash mismatch is a review signal, not a request to refresh hashes automatically. For an intentional protected change, explain the behavior being changed, update meaningful regression coverage, run it, then explicitly update the lock. Do not put lock regeneration in a build script. Keep the release pair on the same protected source contract. Each published installer must have a distinct newer version; do not replace an already-published EXE under an existing version.

Preserve the original updater public key, application identity, user data paths and durable queue. Never request the private publisher key in chat or include it in a source ZIP.

Known legacy broader-suite failures are documented in VALIDATION-153.md/VALIDATION-154.md. Do not claim the full suite or physical Windows installation passed from a focused test run. Keep native candidates draft until actual Windows validation. Source ZIPs are build inputs, not prebuilt installers.
