# R1470 Windows photo Move

The installed host does not connect the browser File System Access picker to its native storage bridge. R1468/R1469 therefore cannot grant access to selected originals outside the configured output folder.

`intake-sources.cjs` adds account-bound, in-memory file capabilities issued only by Electron's image-only multi-file dialog. Renderer requests contain opaque source IDs, never paths. Reads validate file identity; deletion rechecks the original fingerprint and full content hash. Reset/logout revokes capabilities. Configured-root identity is preserved so existing same-file protection works with native destination handles. Existing main-frame/origin IPC checks stay in place.

`intake-sources.js` exposes native file handles via `pbNativeFolder.pickPhotos`. The shared intake helper prefers that capability for Move. Ordinary Copy remains the normal file input. Destination hashes and successful server submission still precede deletion in the existing intake workflow.

Apply `node scripts/integrate-r1470-intake-sources.cjs <native-source-directory>` to the full v1.0.30 source package. It copies both modules, integrates the native dialog and renderer bridge, and bumps the package to 1.0.31 without changing signing or data-retention settings. The saved v1.0.31 source package already contains the integration and an R1470 UI snapshot.

A native Windows installer must be built and installed: site/UI deployment alone cannot add IPC code to an installed executable. Windows packaging and installation were not executed in this Linux environment. Tests use real temporary files and the real native/renderer/helper modules; no customer files.
