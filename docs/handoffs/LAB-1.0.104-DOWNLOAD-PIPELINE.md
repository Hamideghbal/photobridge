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
