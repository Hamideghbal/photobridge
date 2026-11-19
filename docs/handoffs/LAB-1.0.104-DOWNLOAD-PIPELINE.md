# PhotoBridge Lab 1.0.104: investigation and continuation handoff

Status: INVESTIGATION ONLY. No functional fix has been committed, no Windows 1.0.104 installer has been built, and no installed Windows behavior has been verified. Do not merge or promote this handoff as a completed fix.

Updated: 2026-11-19 (Asia/Tehran). Repository: Hamideghbal/photobridge.

## User acceptance criteria

1. When a new order/preview appears, start its photo download immediately in the background. Investigate the causal path rather than lowering polling intervals.
2. Downloads and invoice work must be independent. An invoice/PDF for order A must not block download of order B. Preserve account/device guards, paid-prepayment checks, exact file receipt validation, atomic writes, and duplicate prevention.
3. During file transfer show actual measured byte progress. Once every file has been received and verified, remove the progress element entirely from the same notification. Then show the appropriate text stages: «در حال صدور فاکتور», «فاکتور صادر شد», and only after all required work succeeds «تمام مراحل با موفقیت انجام شد». An invoice, PDF, print, verification, or network error must never produce final success.
4. Add behavioral tests for time from order visibility to first photo request/write, blocked invoice concurrency, and notification DOM/state changes. Merely testing source markers or reduced timer values is insufficient.
5. Commit the actual implementation on a separate branch, create a PR, and prepare buildable Windows 1.0.104 candidate source. Do not publish a stable release until actual behavior is confirmed.
6. User says R1903–R1906 did not fix the installed app; do not assume they work or that their source is available.
7. The latest user explicitly requested a full GitHub handoff so another chat can continue if this session reaches a limit.

## Repository and source provenance — essential

The repository has two substantially different trees on different branches. Do not confuse the web/deployment repository with the native Electron source repository just because they share a remote.

* Default branch `aaa-liara-release`, inspected at `13c711d1fede941197e1905088e9c8a8fe9eaa6e`, contains web/server dist, sequential integration scripts, old native ZIP sources, and a sparse `apps/lab-desktop` directory. Latest title: R1891/R1892 offline manual intake/immediate wake.
* `fix/lab-103-offline-manual-intake-bootstrap` at `77256294af4186581ab011f00d6c2962c8ac10fb` also has the web-root layout. Its tracked tree matched the inspected release tree. Its name alone does not prove it contains a complete native 1.0.103 application.
* `feat/lab-1.0.88-download-progress` at `e91f93efd89e893a83ac5b52b5d815ded39c7b0f` contains REAL native Electron source AT REPOSITORY ROOT. package.json is 1.0.91 despite the older branch name.
* `build/lab-1.0.94-complete` at `4d0ac901ead327824c6bb76c8318b3cdab2a4b91` contains complete native source at repository root, package.json 1.0.94. This is the newest complete native base positively inspected so far, NOT proof of installed 1.0.104 provenance.
* `fix/lab-1.0.93-invoice-workflow` at `62e4a485615387deb2b678725887466027c19d97` was fetched but has not yet been investigated in depth.
* Searches in branch names, commit/PR metadata for 1.0.104 and R1903–R1906 have not identified the exact installed-source revision. These searches do not prove it is absent. A clarification asking for the installed source/installer link was sent; no answer received at handoff time.

Do not label a rebuilt 1.0.94 application as a verified repair of installed 1.0.104. Establish provenance, or explicitly label any reconstructed candidate and document differences.

## Confirmed source findings (causal risks; installed 1.0.104 still unverified)

### Global worker lock includes finance and PDF

`scripts/r1568-native-worker.js.txt` defines `pb1568Work.running`. `pb1568AutoTick` sets it true, fetches thermal status, auth, automation settings and order list, then loops with `await pb1568ProcessOrder(...)`. That function performs download, acknowledgement, invoice creation, PDF generation/upload and optional printing before returning. The lock clears only in the scan finally block. A slow invoice/PDF can therefore hold subsequent orders behind it even though their native notification is visible.

`scripts/r1583-download-retry.js.txt` shares that running flag with explicit retries. `scripts/r1586-download-wake.js.txt` refuses to start while running, coalesces wakeups, and waits for a later drain. This preserves serialization of the entire financial pipeline rather than just protecting duplicate downloads.

The built native UI still has that global serialization. The full extracted function was saved locally in `work/pb1568ProcessOrder.txt`; regenerate from the build when continuing.

### Native realtime signal itself waits behind synchronization

In REAL native `main.cjs` on the 1.0.94 base, `startRealtime` handles events by starting `nativeAlerts.poll()`, then `await sync.live()`, then `sync.wake()`, and only THEN sends `lab-document-change` to the main renderer. That means the download wake can wait on synchronization. Native alert `notify` also sends a document-change before showing the alert, but the renderer worker then still has the global lock and discovery requests above.

Fix should signal download discovery independently of sync latency and keep account/epoch checks. Test a deliberately unresolved sync promise. Do not simply change the 10-second native alert polling interval.

### Receipt acknowledgement includes invoice before commit

`scripts/enable-r1575-download-invoice.mjs` transforms `dist/api/lab-download-receipt.js` to accept `afterVerifiedDownload`. After validating the exact file manifest and updating downloaded_at, it awaits that callback BEFORE COMMIT. The server route supplies `invoiceAfterVerifiedDownload(...)`, defined by `scripts/r1575-download-invoice.js.txt`. Thus the file acknowledgement response itself can wait on invoice work and keep its transaction/row locks open.

The renderer `pb1451AcknowledgeDownload` sends a file receipt and reports phase `verified` only after this server response. Consequently the progress bar can outlive real transfer/verification while financial processing continues.

Potential approach to evaluate: explicit capability/opt-in for a download-only receipt in the new candidate, keeping legacy client behavior intact; issue invoice via its idempotent endpoint separately. Do NOT blindly remove invoice-on-receipt for all older clients without considering compatibility. Do NOT mark a queued offline mutation as a verified receipt or an issued invoice.

### Notification always includes a progress element

REAL native `alert-renderer.js` function `renderDownloads` creates `<progress>` for every phase and always appends it. It also always appends a percentage. Even verified/finance/error states keep a bar. Root `order-progress.cjs` allows only checking/downloading/verified/failed and clamps verified/downloadVerified to 100. It has stage invoice/pdf/print/pricing but no distinct successful invoice/final completion stages.

`scripts/r1581-download-feedback.js.txt` merges prior progress data and normalizes unknown phases to checking; stale byte counters can therefore survive stage transitions. `scripts/enable-r1586-opening-debt-history.mjs` reports final completion as `phase: verified, stage: download`, making transfer completion and total workflow completion ambiguous. Actual built `pb1568ProcessOrder` confirms this final report.

`scripts/r1547-invoice-download-notice.js.txt` function `pb1547CompletePdf` catches PDF errors and displays a warning without rethrowing. Audit callers before making any final-success claim; do not inadvertently swallow required-stage failures.

### Integrity controls to preserve

Native `native-storage.cjs` and native bridge use account-scoped roots and device checks, temp-file open with `wx`, explicit actual write-position tracking, handle.sync/close, root/account revalidation before atomic rename, cleanup on failure, writer busy checks and 1MiB awaited IPC chunks. Existing exact manifest validation in `dist/api/lab-download-receipt.js` checks expected IDs/names/bytes plus order/payment/device eligibility under a transaction. These controls must remain intact.

### Existing timer-only repairs are not a root fix

R1586 removed a 12-second initial worker timer and added wake hooks. R1682 reduced a 45-second safety interval to 10 seconds. R1892 adds immediate wake plus probes at 800/2400/5600/11000 ms with a coalescing window. They do not remove global finance serialization, receipt coupling or the unconditional progress DOM element.

## Build findings

A full `npm run build` of the isolated web worktree completed with exit code 0; final log showed fail 0. This is BASELINE validation, not validation of any fix. Build output lives locally at `work/baseline-build.log`. The build changes hundreds of generated tracked files; do not commit these incidental changes.

The web workflow `.github/workflows/build-windows-desktop-candidate.yml` restores `desktop-sources/PhotoBridge-Lab-Source-v1.0.22.zip`, then applies many integration scripts. A local reproduction FAILED at `integrate-r1471-app-updates.cjs` line 15 because BUILD-WINDOWS.cmd lacks the expected `echo SUCCESS:` anchor. The partially reconstructed folder is NOT valid candidate source. Prefer the positively identified complete native source tree after checking its provenance.

Native 1.0.94 `build-local.cjs` only permits an explicit version list ending in 1.0.94; it requires Windows x64, Node >=22 and the ORIGINAL publisher key matching update-trust.cjs. Do not create a replacement signing key or weaken trust checks. `npm run dist:unsigned` is available for an explicitly unsigned test artifact and is not a stable release.

`prepare-assets.cjs` can verify and bundle pinned native UI (`verified-ui`, `verified-ui-pin.json`) or refresh from the site. A test candidate MUST bundle the intended patched UI, not silently fetch unmerged production UI. Native `host.cjs` serves the actual runtime bundle through `storage-bundle.cjs`, `live-order-patch.cjs`, `manual-invoice-ui.cjs`; tests should cover the final served transformation, not only an unused template.

No Windows installer build or actual Windows runtime test has been completed. No stable release, production deploy, PR merge or updater promotion is authorized at this stage.

## Recommended implementation sequence

1. Identify exact installed 1.0.104 native source and UI build, or clearly document reconstruction from the complete native base. Preserve provenance hashes.
2. Write failing causal tests using the real worker and final host-served renderer code. Hold invoice A unresolved, introduce order B and assert B's first file request/write starts without waiting. Hold sync.live unresolved and assert renderer wake is sent. Repeated wakeups for the same order must produce one transfer.
3. Split discovery, per-order download ownership and finance continuations. Release discovery lock once eligible orders are scheduled. Maintain account/order-scoped single-flight across native event, scan, manual and retry paths. Keep finite resource limits; queued downloads must not wait on invoice/PDF. Persist download checkpoint before finance so retries do not redownload complete files.
4. Separate validated receipt from invoice execution with compatible server/client protocol. Test exact manifest validation, retry idempotency, paid-prepayment and primary-device guards, rollback and failure paths against a real isolated PostgreSQL database. Never treat HTTP202/offline queued invoice responses as issuance.
5. Define explicit download verification, invoice issuing, invoice issued, required PDF/print and final-success states. Remove `<progress>` and percent once download verified. Retain text errors; allow invoice-stage retries without retransfer. Test actual DOM with Playwright on desktop/mobile notification layout as relevant.
6. Run targeted tests, full required build, final native bundle verification and Windows candidate build. Record timing distributions and environment, not invented installed-machine timing. Windows runtime verification remains an explicit release gate.
7. Commit/push separate scoped branches and PR(s), with reviewable source and build instructions/artifact hashes. Base web/server PR on aaa-liara-release per AGENTS.md. Native-root changes need careful packaging/branch strategy: do not replace the web tree with the native tree in a PR to the release branch.
8. Leave PR/candidate UNMERGED and UNPUBLISHED as stable until user confirms actual operation.

## Local continuation locations

These paths are session-local conveniences; the commits and paths above are durable references.

* `/workspace/photobridge` — pre-existing DIRTY workspace with unrelated changes. DO NOT restore or clean it.
* `/workspace/photobridge-lab-104` — isolated web worktree, branch `fix/lab-104-immediate-download`, base 13c711d. Only baseline build-generated changes so far, no functional edits. `work/remote-heads.txt` lists remote heads. `work/native-baseline/` contains ZIP22 extraction; `work/native-candidate/` is a FAILED partial reconstruction; do not use as finished source.
* `/workspace/photobridge-native-104` — clean native worktree, branch `fix/lab-104-native-pipeline`, base 4d0ac901. No functional edits so far.
* Baseline web build log: `work/baseline-build.log`. Worker extracts: `work/pb1568ProcessOrder.txt`, `work/pb1568AutoTick.txt`, `work/pb1451AcknowledgeDownload.txt`.

## Useful verification environment

Node default is 24; source `/workspace/photobridge-env/env.sh` for Node22 and local database configuration. Never print credentials. PostgreSQL socket `/workspace/photobridge-env/run`, port55432; create disposable isolated databases/roles, never use the application DB. PostgreSQL17 binaries under `/workspace/photobridge-env/pg/usr/lib/postgresql/17/bin`.

Playwright is available at `/opt/codex/cua_node/lib/node_modules/playwright`; Chromium `/usr/bin/chromium`. Supply NODE_PATH/PB_BROWSER_EXECUTABLE as tests require. GitHub CLI authentication/fetch works. Some `gh run view --log` downloads are blocked by proxy; the GitHub connector workflow-job-log tool is a possible fallback. Use `DOCKER_CONFIG` under work/ if Docker is needed; home is restricted.

## Honest completion checklist

- [x] Root source paths inspected and concrete coupling points identified.
- [x] Baseline web build completed.
- [ ] Exact installed 1.0.104/R1903–R1906 provenance established.
- [ ] Functional fix implemented.
- [ ] Failing-then-passing behavioral latency/integrity/DOM tests.
- [ ] Full post-change build and native verification.
- [ ] Buildable Windows 1.0.104 candidate and hashes.
- [ ] Actual installed Windows performance verified.
- [ ] Implementation PR ready for review.
- [ ] Stable release approved. DO NOT CHECK THIS AUTOMATICALLY.

## Continuation update — 2026-11-19, R1907 candidate work

**Status: partial implementation committed to isolated branches, NOT an accepted/installed 1.0.104 fix. No merge, no production deploy or stable release.**

- Native Electron work branch `fix/lab-104-native-candidate-1907` derives from the complete native 1.0.94 source. It changes the realtime callback so `lab-document-change` is sent before (not after) pending `sync.live()`, adds invoice-specific progress states, and renders a real progress element only while bytes are still transferring; after verified receipt the bar and percent disappear from the **same** native notification.
- Native `receipt-forward.cjs` uses an explicit opt-in to forward exact manifest receipt directly to server, bypassing the desktop offline mutation queue. It checks response `downloaded_at`/`verifiedFiles`, rejects 202/pending and account/device changes; native host activates this only for version `1.0.104`. The legacy receipt flow is unchanged. The native `lab104-candidate.cjs` locks trial candidates to their bundled UI, preventing silent replacement with the production website before test verification.
- Native tests are run against the real native renderer's `renderDownloads` function, the realtime wake function, the receipt forwarder and main-frame authorization. GitHub Actions native tests at [run 44471921094](https://github.com/Hamideghbal/photobridge/actions/runs/44471921094) completed successfully. This **does not** verify real Windows order download latency.
- Web/server branch `fix/lab-104-web-pipeline-1907` derives from `aaa-liara-release`. It has a bounded two-transfer pool with account/order keyed single flight, scanning that schedules download without awaiting a prior order's invoice, separate retry draining, and an opt-in server receipt that commits after exact file/device/payment verification without blocking on invoice. It preserves existing invoice-on-receipt behavior for legacy clients. It reports distinct verified, invoice issuing, invoice issued, and completion stages, and rejects queued PDF upload as success.
- Tests include an independently exercised fake blocked-invoice scheduler and `scripts/test-r1907-final-native-worker.cjs`, intended to run the **final generated** native worker with invoice A stalled while order B starts a first transfer. The latter and full web build are pending/iterating through CI; do not mark them passed until GitHub Actions confirms them.
- Web build encountered unrelated legacy release revision compatibility assertions initially. The candidate revision now retains the legacy mobile release markers; CI has been rerun. Link: [web branch Actions](https://github.com/Hamideghbal/photobridge/actions/workflows/verify-lab-104-web-pipeline.yml).
- A **test-only unsigned installer** workflow was added on native candidate branch. It first builds the patched web UI, verifies SHA-256 manifest entries, replaces stale native UI pin, then attempts a Windows installer and packaged Electron smoke test. [Candidate Actions](https://github.com/Hamideghbal/photobridge/actions/workflows/build-lab-104-unsigned-candidate.yml). Its success is not yet established and the original publisher private key is neither supplied nor replaced.
- `package.json` and `package-lock.json` in the isolated native **reconstruction** branch carry `1.0.104`; **this version label does not establish binary provenance of the user's actually installed program**.
- Main release branch, database schema, old native signing/update trust, account-scoped disk writer, verified file manifest and payment/device checks have not been changed.

### Acceptance still open
1. Obtain and compare exact user's installed 1.0.104 executable/source and R1903–R1906 if ever located.
2. Confirm full web build and final injected worker behavioral tests; verify opt-in server receipt with an isolated real PostgreSQL transaction and legacy compatibility.
3. Confirm unsigned Windows candidate construction, pin manifest hashes and packaged Electron smoke.
4. Test new-order arrival to first actual byte write on installed Windows, including an artificially blocked invoice, offline/resume, repeated wakes and changed-account denial. Record timings and failure states.
5. Keep PRs Draft; **never merge/deploy/publish stable before explicit real-user acceptance**.

## R1907 candidate build gate — completed 2026-11-19

**Artifact created, isolated for USER TEST ONLY; NOT installed-user acceptance. Do not merge, sign, ship stable or deploy production.**

- [Draft PR #901](https://github.com/Hamideghbal/photobridge/pull/901) (Electron/native) includes Windows candidate source version `1.0.104`, built from full native `build/lab-1.0.94-complete` base with explicit reconstruction marker.
- [Draft PR #902](https://github.com/Hamideghbal/photobridge/pull/902) (web/API native-only pipeline) has full regenerated native bundle + tests green at [run 44473674398](https://github.com/Hamideghbal/photobridge/actions/runs/44473674398), including blocked invoice A / independent download B, receipt SQL checks and preservation of legacy-client path.
- [Native test run 44477390240](https://github.com/Hamideghbal/photobridge/actions/runs/44477390240) succeeded.
- [End-to-end packaging workflow 44477390264](https://github.com/Hamideghbal/photobridge/actions/runs/44477390264) **succeeded** after adjusting Windows ZIP extraction in `expand-access-runtime.ps1` (Windows PowerShell overload) and native dependencies (install under Node16 ABI, build Electron under Node22). The **unsigned** x64 EXE is stored inside [artifact 14507336226](https://github.com/Hamideghbal/photobridge/actions/runs/44477390264/artifacts/14507336226); seven-day retention.
- Installer filename: `PhotoBridge-Lab-Setup-1.0.104-x64.exe`. Installer EXE SHA-256 `B55739273265EEDFFD1CE46119E9467CCB3A4CE727C79F03F8F3580E4ADCBD98`. UI manifest build SHA-256 `a9c0012451db6d8d85def67d47866cbe7613bf8412ae095326c3ab5898b0e074`; 901 assets verified.
- Packaged Electron startup smoke passed: `PB_COMPAT_SMOKE_PASS {"electron":"22.3.27","node":"16.17.1","sqlite":true,"network":true,"login":true}`.
- **Still NOT done:** real first-byte timing from new order/preview on physical Windows device with actual backend server opt-in receipt protocol enabled in an isolated environment, downloaded file hash parity, restart/offline/resume, second order arriving during blocked invoice, account/device-denial, signing/provenance of installed 1.0.104. Current server branch is draft/not deployed, so testing the unsigned client against production cannot establish correct new receipt behavior and is not an approved production test.
- #900, #901, #902 remain draft/unmerged. No production rollout or stable update is authorized by automated test success alone.

## R1908 — user-reported immediate-download regression; corrective candidate (2026-11-19)

**Real operator feedback:** the unsigned reconstructed 1.0.104 candidate delivered correct progress-bar removal after verified download, **but actual notification-to-start latency was still slow, reportedly worse**. The previous automated tests did not exercise the actual popup-to-first-byte path. Do not mark latency as fixed until operator reruns this scenario.

**Investigation and changes:**
- Previous R1892 wake mechanism scheduled four full lab order-list scans (800/2400/5600/11000 ms) after a notification, with a serialized worker/one-second debounce. Previous R1907 removed invoice waiting but still required the browser to fetch accounts, automation and the *complete lab order list* before getting the selected order's files. Automatic download also repeated device/root checks and expensive full-folder verification *before the first byte*.
- Native Electron candidate [Draft PR #901](https://github.com/Hamideghbal/photobridge/pull/901) now sends the exact server notification's trusted **order UUID** from native alert handling to the renderer immediately via `lab-order-arrived` IPC, independently of invoice, PDF, sync and list-scanning, with account/epoch checks and renderer-ready replay. New isolated native tests verify immediate delivery, dedupe, account isolation, replay.
- Web/UI candidate [Draft PR #902](https://github.com/Hamideghbal/photobridge/pull/902) adds `pb1908FastArrival` using only authenticated **order-detail and automation-policy** requests concurrently; no `/api/lab/orders` list. Already loaded order-preview detail is reused instead of fetched twice. Exact-order detail readiness retries replace four global rescans. Native auto download checks root/device once and skips redundant pre-verification **only on proven completely empty new order folders**; every existing/partial/unknown folder goes through the original verifier and **full post-write file verification is always mandatory**.
- `pb1908DownloadDiagnostics()` in native renderer and console `[LAB104 download latency]` record notification→detail/policy→download scheduled→first actual streamed byte timestamps, rather than claiming a speed gain from CI mocks.
- [Web latest CI 44481232753](https://github.com/Hamideghbal/photobridge/actions/runs/44481232753): **SUCCESS**, final UI/server generated and simulated exact-notification-no-list and blocked-invoice tests passed.
- [Native latest CI 44481405269](https://github.com/Hamideghbal/photobridge/actions/runs/44481405269): **SUCCESS**, account/notification replay regression tests passed.
- [R1908 unsigned Windows build 44481405254](https://github.com/Hamideghbal/photobridge/actions/runs/44481405254): started from exact web commit `32c9a1d96d5dc6707d6d456d018d1929caf2a5f6`, native source `f81a60fb98d40d7a82b1336917da8b431579b155`. Installer results and artifact must be checked before calling build successful.

**Hard remaining gates:** real authenticated Windows notification-to-first byte timing (including first start without opening web order page), genuine API server receipt compatibility in an isolated environment, no auto-downloading older orders, file manifest parity and device/account changes. The new server companion remains Draft/not deployed; do not merge/publish stable/deploy production on the strength of isolated tests alone. Preserve the already-correct post-download progress-bar removal.

### R1908 unsigned Windows installer gate — SUCCESS (2026-11-19)

- [GitHub Actions build 44481405254](https://github.com/Hamideghbal/photobridge/actions/runs/44481405254): **passed** `patched-web-ui` and `windows-test-artifact`, including 901 SHA256-verifiable UI files and packaged Electron runtime smoke with sqlite, network and login.
- [Download **NEW R1908 test installer artifact 14509096446**](https://github.com/Hamideghbal/photobridge/actions/runs/44481405254/artifacts/14509096446) — ZIP contains `PhotoBridge-Lab-Setup-1.0.104-x64.exe`, **UNSIGNED**, 7-day GitHub Actions retention; do not confuse with old slow R1907 artifact 14507336226.
- R1908 EXE SHA-256: `8E0ED498292921077F8B510E4E0DFE42EFED7C691237856376238DA846985C9E`. R1908 pinned native UI hash `be0bc80c838250ddea85d22b719fc856e72c7c4e21d2225f08dfaf24d0f43804`.
- **Acceptance OPEN:** despite green automated tests and smoke, real physical Windows notification-to-first-byte time has not been validated. Backend R1907 patch remains Draft/not deployed. Existing progress bar fix preserved. No stable release/production deploy authorized.

## R1909 — reproduced visible 30–45s pause from user screenshot (2026-11-19)

**User repro:** PhotoBridge Lab Windows has already opened order **#894** and its OS/native popup states “سفارش جدید / سفارش #894 از Platform Admin ثبت شد · ۱ فایل”; the file is shown in **در انتظار دانلود**, and the actual transfer does not begin for 30–45 seconds. The progress bar is correctly removed after verified download. R1907/R1908 had NOT fixed latency on the user's real machine.

**Concrete source-level defects discovered (not generic retry/timer guesses):**

1. **Same-version installer silently kept OLD UI.** `startup-ui.cjs` previously returned immediately whenever `uiEmbeddedForNativeVersion==='1.0.104'`, regardless of whether the user had installed a newer 1.0.104 candidate UI manifest. Since every test installer used the same version number, the new fast-download UI frequently was **never activated**; `lab104-candidate.cjs` also disables server UI hot-update. Fix: in this pinned-only 1.0.104 test candidate compare actual `uiEmbeddedForNativeBuild`/verified bundle SHA-256, and adopt a changed embedded build even for the same version; legacy/stable UI update behavior is untouched. Regression test creates two different signed-hash manifests with identical version and proves adoption of second build.
2. **Native fast-order wake ignored notifications containing ONLY a displayed order number.** `alert-content.cjs` used to set `orderAlert` only for three explicit `event_key` values and an `order_id` field. The screenshot-like payload (“سفارش #۸۹۴ … ثبت شد”) may have neither; the popup can render while `fastArrival.notify()` never runs, leaving the 45-second polling worker as fallback. Fix: parse Persian/Arabic/Latin visible order numbers with strict new-order detection; dispatch raw fresh notification **before showing the alert window**; if UUID is absent, asynchronously resolve exact numbered order from the authenticated Lab orders list with account/uniqueness/status guards and bounded readiness retries. If UUID exists, forward immediately with no list fetch. A realistic #۸۹۴ test exercises this branch.
3. **Raw notification callback wiring had been incomplete.** `NativeAlerts` must preserve `onOrderNotice` in `Object.assign(this, …)` as well as receive the callback. An integration test now instantiates the real notification poll, asserts the order resolver begins before the popup, and fails when callback wiring is omitted.
4. **Submission timestamp vs creation timestamp + stale retry checkpoint.** `pb1908FastArrival` previously discarded a legitimately newly submitted order when a photographer created its draft before automation was enabled or more than two minutes earlier. It also honored a 30–60s backoff left by an earlier incomplete-manifest scan. R1909's web candidate accepts a **fresh, account-scoped native notification**, still requiring enabled automation, valid payment/status, device and complete file manifest; it clears pending-download backoff only for recoverable errors once the current manifest is ready. No hard account/device/financial guards are bypassed.
5. **Instrument actual transfer:** native candidate writes nonblocking `lab-download-start-YYYY-MM-DD.jsonl` under Electron's userData directory, recording exact order notification, number-to-UUID resolution, renderer IPC dispatch, and web `notification→detail→transfer scheduled→first actual byte` milestones. This will reveal a remaining stall without further speculative changes.

**Source branches:** [native Draft PR #901](https://github.com/Hamideghbal/photobridge/pull/901), [web/API Draft PR #902](https://github.com/Hamideghbal/photobridge/pull/902), original [handoff Draft PR #900](https://github.com/Hamideghbal/photobridge/pull/900). The web generated worker tests are green at [run 44484419536](https://github.com/Hamideghbal/photobridge/actions/runs/44484419536) and native scenario tests at [run 44485664531](https://github.com/Hamideghbal/photobridge/actions/runs/44485664531). The **R1909 unsigned Windows build** [run 44485666792](https://github.com/Hamideghbal/photobridge/actions/runs/44485666792) was running when this note was written; check final artifact/results before claiming success.

**Non-negotiable remaining acceptance:** the user must EXIT THE ENTIRE old app process (Windows tray **خروج کامل**) before installing the new unsigned candidate; otherwise Electron's single-instance lock simply focuses the stale process. Measure real first byte after a *new* numbered order notification and repeat with invoice blocked. DO NOT merge, deploy to Liara, publish an update, or claim real end-to-end latency is fixed without that field result. The correct post-download progress-bar removal must remain unchanged.

### R1909 final test artifact — automated gates passed (2026-11-19)

- Native source head `4c2d4ed290cddb988e79f52b5f5aaf80bab9576f` on [Draft #901](https://github.com/Hamideghbal/photobridge/pull/901); web pinned `b41d9f7d624a39922f07d2be889a4e506fa14873` on [Draft #902](https://github.com/Hamideghbal/photobridge/pull/902).
- [Native alert/number resolver/same-version cache tests **PASS** — 44486505052](https://github.com/Hamideghbal/photobridge/actions/runs/44486505052).
- [Web generated-worker/server behavior **PASS** — 44484419536](https://github.com/Hamideghbal/photobridge/actions/runs/44484419536).
- [Unsigned Windows packaging + packaged Electron DOM/login/network/SQLite smoke **PASS** — 44486504894](https://github.com/Hamideghbal/photobridge/actions/runs/44486504894).
- **Correct new R1909 installer artifact:** [14510628570 — lab-1.0.104-R1909-direct-order-notification-UNSIGNED](https://github.com/Hamideghbal/photobridge/actions/runs/44486504894/artifacts/14510628570). ZIP contains `PhotoBridge-Lab-Setup-1.0.104-x64.exe`; it remains **unsigned** and stored for **7 days**, not published as a stable release. DO NOT recommend earlier R1907/R1908 test artifact.
- R1909 EXE SHA-256: `72524A0314DFE218CE0E0F725BEC094EA0E401979798E5E375D84C71002E3858`. Pinned UI manifest build fingerprint: `de86d50b0f7067d1d9d415f80522ea349ba44ad0a8aa89b430639e7d79e49e8f`; 901 embedded UI files verified.
- Smoke: `PB_COMPAT_SMOKE_PASS {"electron":"22.3.27","node":"16.17.1","sqlite":true,"network":true,"login":true}`. Prior headless Win CI intermittently had `document.hidden` true for the popup despite alert DOM; smoke now verifies actual rendered order and preload bridge without assuming runner focus.
- **Real field test still OPEN**. Before using test candidate, close program with notification-area/tray `خروج کامل` (closing its main window only hides app and a running earlier 1.0.104 will be reused); then install new candidate and send a BRAND NEW order with a new OS notification. Compare first-byte timing and inspect app private `lab-download-start-YYYY-MM-DD.jsonl` if delay remains. No production deploy, merge, stable publishing or field acceptance was performed.

## R1910 — exact cause of complete download regression in 1.0.104, user screenshot #896 (2026-11-19)

**Operator reproduction:** new-order alert #896 arrived, download **did NOT start**, and both native popup and lab window displayed: `پوشهٔ قبلی این سفارش پیدا نشد؛ برای اتصال دوباره «بررسی و تکمیل دانلود» را بزنید...`. Error dialog was labelled «نیاز به بررسی فاکتور», although file acquisition had already failed. Previous R1909 was NOT an accepted fix. The progress bar disappearing on verified completion remains the ONLY accepted previous behavior.

**Root cause confirmed in source — introduced by our R1908 optimization, not a disk change on the operator's PC:**

- Previous R1550 per-order storage explicitly rewrote the downloader root as `root = await pb1450Root(true,detail);`. The second `detail` argument is **mandatory**, not optional. It pins the exact order to a verified writable root in per-order IndexedDB storage **before** writing the local startedAt marker.
- R1908's generic regular-expression rewrite accidentally replaced this with `root = await pb1450Root(options.silent===true?false:true);` (**DROPPED `detail`**). The downloader then wrote `yc(order.id).startedAt` / `pathLayout`, and the first call to `pb1450Target` invoked `pb1550Root(detail,false)`. Its original legacy heuristic interpreted mere `startedAt` as proof of an old disk folder, refused to bind a new destination, and threw exactly the operator's `پوشهٔ قبلی این سفارش پیدا نشد` exception. The automation stored this as a **30–60s retry backoff**, explaining both false "historical folder" errors and delayed first-byte failures.
- [R1910 web Draft PR #902](https://github.com/Hamideghbal/photobridge/pull/902): restore `root = await pb1450Root(options.silent!==true,detail);` **at the start of actual `pb1450Download`**. A native silent automatic order never shows picker, but retains the per-order identity and disk/device permission checks. Preserve manual behavior with `choose=true`.
- Refine `pb1550Root` legacy classification: a new order with `pathLayout==='order-v2'`, no server `downloaded_at`, no local verified files, and no `localComplete` can recover from the wrongly persisted R1908 marker without requiring a historical folder. A truly historical order, pinned or locally verified file, partial receipt, disconnected root, or downloaded server record still **cannot** be transparently rebound to a different root.
- One-shot `pb1910RepairFalseHistoricalRetry` clears `retryAt` **only** for previously affected new orders with the exact prior error and no local file proof; guards account/status, prevents repeated automatic clearing, and leaves historical/partial data untouched. Allows #896 retry on the new candidate without 30–60s wait.
- **Critical new non-mock tests** in `scripts/test-r1910-live-download-root.cjs`: extract the **final generated production native UI bundle's actual `pb1450Download()` implementation** (not merely scheduler), simulate actual first file request and chunk receipt, verify exact `detail` passed before `startedAt`, verify both pre/post full disk checks, and reproduce #896 misclassification with previous `startedAt`. Tests reject silently repinning historical or partial files. One-shot retry migration has a dedicated test.
- [Latest R1910 generated web/native worker gate SUCCESS — run 44491078304](https://github.com/Hamideghbal/photobridge/actions/runs/44491078304), commit `9138277571d036ae7c647a9456d8042edb0a95dc`. Native [Draft #901](https://github.com/Hamideghbal/photobridge/pull/901) unsigned installer build now pins this web commit; [CI build 44491229503](https://github.com/Hamideghbal/photobridge/actions/runs/44491229503). Inspect final installer/artifact after completion.

**Safety gate:** DO NOT ship stable, deploy Liara, merge any PR, claim real operator acceptance or instruct installation over a running process. All PRs remain Draft. Candidate rebuild and genuine field first-byte/verified file test still required. No photography originals may be lost or relocated silently.
