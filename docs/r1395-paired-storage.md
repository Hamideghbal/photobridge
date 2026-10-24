# Matching browser and Windows storage folders

The browser selects its own File System Access folder. The Windows app selects its own native folder. A small `.photobridge-folder-id.json` marker identifies the selected folder; matching selections preserve both device registrations. A different selection invalidates the previous registrations and displays a request to select matching folders. Existing photos are never deleted by this change.

Enrollment is lab-admin-only and serialized with the existing lab row lock. Pair membership is stored in existing `ui_preferences`; no migration is required. Download, download-check, local intake, and device-status routes use the paired membership instead of a single device comparison. Legacy registration cannot overwrite paired membership.

Windows source integration: run `node scripts/integrate-r1395-paired-storage.cjs PATH_TO_1_0_26_SOURCE` to produce version 1.0.27. Build that source with the existing Windows build procedure before rollout. The old app gets a clear upgrade instruction when selecting a paired folder.

Validation: relevant web build transforms, JavaScript syntax checks, 38 storage tests, and 67 native app tests pass locally. Full Liara Docker build, production database execution, real Chrome folder permission prompts, simultaneous browser/native photo downloads, and a built Windows 1.0.27 installer have not been verified. Keep this PR unmerged pending that verification. The marker identifies an explicitly selected folder; copied markers are not hardware identity or proof that two apps run on the same computer.
