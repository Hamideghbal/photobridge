# PhotoBridge Lab Windows — complete sources, installer and signed update JSON

**Current protected baseline: R1910, installed label 1.0.104.** This release tooling and the R1911 notification badge do **not** change the fixed photo-download, invoice, receipt or disk/USB pipeline.

## 1. Which three files belong to each release?

A **tested production release** is a matching, immutable set:

1. `PhotoBridge-Lab-Setup-X.Y.Z-x64.exe`: the exact signed Windows installer.
2. `PhotoBridge-Lab-Update-X.Y.Z.json`: the **original Ed25519 publisher-key signed** updater manifest. Its `version`, `size`, and `sha256` must match the **final actual EXE bytes**. This is the JSON the installed updater already checks; it is NOT `latest.yml`, NOT an unsigned generated SHA document, and NOT something that can be fabricated from GitHub or a new unrelated key.
3. `PhotoBridge-Lab-FullSource-X.Y.Z.zip` + `PhotoBridge-Lab-ReleaseInfo-X.Y.Z.json`: complete native source files, lockfile, verified exact embedded UI, source manifest with per-file hashes, full pinned website/API source ZIP, native and web commit IDs and verified installer checksum. This is the **canonical long-lived editable release source**. It contains no publisher private key, password, cookie, customer records or site session.

**IMPORTANT:** The user-tested R1910 (1.0.104) is an **unsigned test installer** and has **no valid updater JSON**. The R1911 candidate includes only the notification-status presentation change plus source/update tooling. Do not put an unsigned JSON next to a test EXE or upload it as a stable program.

## 2. Next change: no more hunting for historical sources

From now on, edit the **full native source** and pinned web/API source in the GitHub repo, never reverse-engineer a setup EXE. The native repo branch `fix/lab-104-native-candidate-1907` includes the entire Electron source, tests, `package-lock.json`, updater and signed-release scripts, and verified UI snapshot. The web branch `fix/lab-104-web-pipeline-1907` contains the tested current R1910 download changes; only test/acceptance can authorize merging.

For each **new version** (e.g. `1.0.105`), in GitHub Actions select **Lab Windows FULL source + next-version candidate (MANUAL, NOT published)** and enter:
- `next_version` — a strictly newer three-part version. Do **not** reuse 1.0.104.
- `web_source_commit` — the exact immutable 40-character Git SHA of the tested website/backend source. For the R1910 working download foundation this is `9138277571d036ae7c647a9456d8042edb0a95dc` until explicitly superseded after full verification.

The manual workflow checks the web source/real file-downloader and the native alerts/updater, pins and SHA-checks the exact native UI, updates `package.json` and `package-lock.json` together, builds an **UNSIGNED, non-published** Windows test installer, smoke-tests packaged Electron, and uploads a **complete native + website source ZIP** with provenance for future edits. It **does not publish** to Liara, change the website, make Git tags, or create a fake update JSON.

After inspection, the separate **Archive complete Lab Windows SOURCE permanently (manual draft)** GitHub Action takes the successful build run ID and exact version to create a **private Draft GitHub Release** containing the full source archive + release-info. Draft GitHub Releases do not expire with the 30-day Actions artifacts. A production source tag must point to the exact native commit recorded in `ReleaseInfo`.

## 3. Publishing a real signed updater JSON (after Windows acceptance ONLY)

Do not run this section for a test candidate, an unverified version, or while a customer's download is active.

1. Build and sign the final Windows EXE with the legitimate project Authenticode certificate as required by the website's installer publishing checks. Windows CI tests use unsigned builds, which are NOT a production release.
2. Use the **existing original** `.publisher/update-private.pem` (or `PB_UPDATE_SIGNING_KEY` pointing to that file) in a private secure Windows release workstation. The public key is permanently embedded in installed clients in `update-trust.cjs`; creating a new key would break updates for those clients. Never commit or upload the private key to the repo, a source ZIP, or chats.
3. With the final EXE already built in `release/`, run `node create-update-release.cjs`. This emits `release/PhotoBridge-Lab-Update-X.Y.Z.json`. Then `node release-kit.cjs verify-json` rejects any forged, unsigned, wrong-version, wrong-size or wrong-EXE JSON.
4. Build the complete source/archive release kit using `PB_WEB_SOURCE_ARCHIVE`, `PB_WEB_SOURCE_COMMIT` and `PB_REQUIRE_SIGNED_UPDATE=1` with `node release-kit.cjs pack`, to cryptographically verify the same installer and signed JSON.
5. In the website administrator's installer release UI upload the exact final Windows EXE through the existing authenticated `/api/admin/lab-desktop-release/upload` + `/upload/complete` process. **The UI upload itself is not proof that auto-updates are activated.**
6. Once the separately reviewed site PR `feat/lab-update-json-r1911` is deployed, submit the signed JSON to the **platform-admin-only** `POST /api/admin/lab-desktop-release/update-manifest` endpoint as `{"update":<signed JSON object>}`. The API verifies the embedded old-client Ed25519 public key, release version and byte size, then streams the actual just-uploaded EXE from object storage to confirm the signed SHA-256 before activating the JSON. A mismatch returns a hard error; manual downloads continue but **updater JSON is not activated**.
7. The installed client already requests authenticated `GET /api/lab/desktop-installer/update`, and validates JSON signature, newer version and the downloaded EXE SHA-256 **again** before installing. The optional site change above implements this route without touching photo download. For missing/unpublished JSON the site returns `{"update":null}`; do not advertise a newer version until both components are proved.
8. Before approving production, test on a Windows machine with a real lab account: new-order notification immediately starts file transfer; local byte count matches the manifest; invoice/PDF complete independently; alert shows durable completed badge; update from 1.0.104 to the new version works; old files and saved account survive; unsuccessful updates leave the current installation intact.

## 4. Safety and source provenance rules

- Never copy a new EXE with an old JSON; never rename the EXE without recreating/signing the JSON; never reuse a previous version number.
- No website/Liara/CDN/stable auto-update or GitHub public release in any automated candidate workflow. Approval is explicit.
- The full source ZIP MUST include the exact generated and validated `verified-ui/` contents the installer actually used, **not** the older UI checked into some historical commit.
- The exact tested website/API source ZIP and its immutable Git commit are mandatory; otherwise the release kit fails closed.
- Source archives are kept as **private draft GitHub Releases**, not just the ephemeral unsigned EXE or a seven-day CI download.
- Project secrets, publisher keys, Windows signing certificates, customer files and persisted app data are never part of source archives.
- Current repository source provenance for 1.0.104 was reconstructed from archived native 1.0.94 sources; the user's installed R1910 behavior has been accepted, but do not claim that reconstructed sources prove bit-for-bit identity with older unsigned installations.

## 5. Status of this change

The signed updater architecture and JSON signing script existed already (`create-update-release.cjs`, `app-update.cjs`, `update-trust.cjs`). This change adds a **complete source snapshot** workflow and verifiable package provenance, a **separate private source archive workflow**, future-version generator, and a **separate draft site update-JSON API**. The original publisher key is **not available to CI** and no signed JSON or production upload has been created.
