# Locked 154 → 155 release pair

Both variants retain the runtime fixes from 9dc2a89c. Their protected source contract is identical; only the build/package version and role label differ. 154 is the local test base; 155 is the newer site target.

Validation performed here:
- 29 mandatory dependency-free release tests passed under Node 22.
- 68 related tests passed, including actual sync/store/HTTP mutation coordination and updater/thermal/model checks.
- Negative controls reject a restored legacy printer, restored model editor or old sync-flight gate, removal of the mandatory verifier, stale packaged code and a mismatched packaged version.
- A real ASAR fixture produced by @electron/asar 3.4.1 passed the packaged-core reader, and its copied UI resources passed every manifest hash and native compatibility check. This was a cross-platform packaging fixture, not a Windows executable build.
- Private keys are not present. Both Windows source bundles must be built with the user's original publisher key. Physical Windows build/install and 154→155 update are not claimed tested here.

Build enforcement:
- npm verify runs source-lock verification and release regressions before preparing the UI.
- both distribution commands call verify-installer, which also compares actual app.asar and runtime resources against the protected source.
- create-update-release refuses signing until the packaged-source/UI check passes.
- the CI workflow checks the same lock and regressions; no successful hosted CI execution is claimed from local checks.

Known unrelated failures in the inherited broad suite remain documented in previous validation notes. The lock prevents accidental regression on this release path; it is not a guarantee against deliberately removing the checks or building an unrelated old checkout.
