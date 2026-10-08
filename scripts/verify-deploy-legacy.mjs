import fs from 'node:fs';

// Liara build-memory hotfix: avoid keeping many duplicate copies of the same
// large bundle/server files in memory during deploy verification.
const __pbTextCache = new Map();
function readText(file) {
  const key = String(file);
  if (__pbTextCache.has(key)) return __pbTextCache.get(key);
  const value = fs.readFileSync(key, 'utf8');
  __pbTextCache.set(key, value);
  return value;
}

const required = [
  'dist/web/index.html',
  'dist/web/assets/index-UIRefine-v655.js',
  'dist/web/assets/index-UIRefine-v586.css',
  'dist/web/photobridge-workflow-guides-v572.js',
  'dist/web/photobridge-public-design-v583.js',
  'dist/web/photobridge-public-design-v584.js',
  'dist/web/photobridge-public-design-v650.js',
  'dist/web/photobridge-public-nav-v581.js',
  'dist/web/photobridge-public-nav-v599.js',
  'dist/web/photobridge-public-nav-v625.js',
  'dist/web/photobridge-design-ratings-v657.js',
  'dist/web/photobridge-v662-fixes.css',
  'dist/web/photobridge-mobile-design-flow-v650.js',
  'dist/web/photobridge-public-nav-v599.js',
  'dist/api/server.js',
  'dist/api/faceDetectorWorker.js',
  'dist/api/stage4CompositeWorker.js',
  'scripts/migrate.mjs',
  'migrations/109_ai_retouch_durable_queue.sql',
  'migrations/110_kindergarten_general_wallet_bridge.sql',
  'migrations/111_public_design_orders.sql',
  'migrations/112_public_retouch_accounts_retention.sql',
  'migrations/122_platform_maintenance_mode.sql',
  'migrations/123_photographer_identity_relationship_isolation.sql',
  'migrations/124_equipment_store_sales.sql',
  'migrations/125_equipment_catalog_categories_models.sql',
  'migrations/126_album_design_template_ratings.sql',
  'migrations/128_equipment_sofia_demo_refresh.sql',
  'migrations/129_album_design_like_totals.sql',
  'migrations/131_equipment_sofia_demo_catalog_v2.sql',
  'scripts/ensure-sofia-demo.sql',
  'dist/web/photobridge-design-coming-soon-v664.js',
  'dist/web/photobridge-admin-maintenance-v636.js',
  'dist/web/photobridge-admin-maintenance-v640.js',
  'dist/web/photobridge-admin-album-v641.js',
  'dist/web/photobridge-admin-album-v645.js',
  'dist/web/photobridge-album-design-ui-v645.js',
  'dist/web/photobridge-admin-album-v646.js',
  'dist/web/photobridge-album-design-ui-v646.js',
  'dist/web/photobridge-maintenance-watch-v636.js',
  'dist/web/photobridge-retouch-v583.js',
  'dist/web/photobridge-retouch-v588.js',
  'dist/web/photobridge-retouch-v591.js',
  'dist/web/photobridge-retouch-v595.js',
  'dist/web/photobridge-retouch-v595.js',
  'dist/web/retouch-account.html',
  'dist/web/photobridge-runtime-v711.js',
  'dist/web/photobridge-mobile-header-v711.css',
  'dist/web/photobridge-push-v728.js',
  'migrations/134_web_push_notifications.sql'
];

function fail(message, code = 2) {
  console.error(`[PhotoBridge Deploy Lite] ${message}`);
  process.exit(code);
}

for (const f of required) {
  if (!fs.existsSync(f)) fail(`Missing required file: ${f}`);
}

const html = readText('dist/web/index.html');
const publicDesignLoaded = html.includes('/photobridge-public-design-v650.js');
const publicNavLoaded = html.includes('/photobridge-public-nav-v625.js');
if (!html.includes('/assets/index-UIRefine-v655.js') || !html.includes('/assets/index-UIRefine-v586.css')) {
  fail('index.html does not point to the cache-busted v0.17.593 frontend JS + stable CSS bundles.', 3);
}
if (!html.includes('/photobridge-design-ratings-v657.js?v=662')) fail('v661 like runtime is not loaded');
if (!html.includes('/photobridge-design-coming-soon-v664.js?v=664')) fail('v664 design coming-soon runtime is not loaded');


const webJs = readText('dist/web/assets/index-UIRefine-v655.js');
const webCss = readText('dist/web/assets/index-UIRefine-v586.css');
const serverText = readText('dist/api/server.js');
const workerText = readText('dist/api/faceDetectorWorker.js');
const stage4Text = readText('dist/api/stage4CompositeWorker.js');
const migration109 = readText('migrations/109_ai_retouch_durable_queue.sql');
const migration110 = readText('migrations/110_kindergarten_general_wallet_bridge.sql');
const migration112 = readText('migrations/112_public_retouch_accounts_retention.sql');
const retouchRuntime583 = readText('dist/web/photobridge-retouch-v583.js');
const retouchRuntime584 = readText('dist/web/photobridge-retouch-v588.js');
const retouchRuntime589 = readText('dist/web/photobridge-retouch-v591.js');
const retouchRuntime591 = readText('dist/web/photobridge-retouch-v591.js');
const retouchRuntime592 = readText('dist/web/photobridge-retouch-v595.js');
const retouchRuntime593 = readText('dist/web/photobridge-retouch-v595.js');
const publicNav584 = readText('dist/web/photobridge-public-nav-v625.js');
const retouchAccountHtml = readText('dist/web/retouch-account.html');
const designRatings657 = readText('dist/web/photobridge-design-ratings-v657.js');
const publicDesign650 = readText('dist/web/photobridge-public-design-v650.js');
const migration126 = readText('migrations/126_album_design_template_ratings.sql');
const migration128 = readText('migrations/128_equipment_sofia_demo_refresh.sql');
const migration131 = readText('migrations/131_equipment_sofia_demo_catalog_v2.sql');
const ensureSofiaDemo = readText('scripts/ensure-sofia-demo.sql');
const migrateScript = readText('scripts/migrate.mjs');


// Preserve finance/mobile send polish.
if (!webJs.includes('Mn(w).toLocaleString("fa-IR")')) fail('previous-debt live thousands separator is missing');
if (!webJs.includes('value:Bn(He.amount)')) fail('finance payment amount formatter is missing');
if (!webJs.includes('value:Bn(De.amount)')) fail('finance expense amount formatter is missing');
if (!webJs.includes('value:Bn(ot.amount)')) fail('finance discount amount formatter is missing');
if (!webCss.includes('.financeWorkspace .card:hover')) fail('finance hover jitter guard is missing');
if (!webCss.includes('.simplePrintPhotoChassisInline')) fail('mobile print-card add-on polish is missing');
if (!webCss.includes('PhotoBridge v0.17.551')) fail('v0.17.551 CSS marker is missing');
if (!webCss.includes('grid-template-areas:"lab add" "send send"')) fail('mobile print header ordering is missing');
if (!webCss.includes('background:linear-gradient(135deg,#0e9f6e 0%,#087f5b 100%)')) fail('prominent send CTA styling is missing');
if (!webJs.includes('simplePrintSendIcon') || !webJs.includes('ارسال برای چاپ')) fail('updated send CTA is missing');

// v657 Instagram/album designer refinements.
if (!webJs.includes('saturate(${L}%)') || !webJs.includes('albumDesignQuickSaturation')) fail('v657 saturation control/output is missing');
if (!webJs.includes('albumDesignQuickOpacity') || !webJs.includes('albumDesignQuickBlur')) fail('v657 opacity/blur controls are missing');
if (!webJs.includes('(Se==null?void 0:Se.typographyId)')) fail('v657 default PSD typography recolor fallback is missing');
if (!webCss.includes('PhotoBridge v0.17.663')) fail('v657 designer CSS marker is missing');
if (!designRatings657.includes('pb659LikeHeart') || !designRatings657.includes('محبوب‌ترین') || !designRatings657.includes('syncFromServer')) fail('v661 like/popularity runtime is missing');
if (!serverText.includes('album_design_template_ratings') || !serverText.includes('/rating$/')) fail('v657 rating backend is missing');
if (!migration126.includes('CREATE TABLE IF NOT EXISTS album_design_template_ratings')) fail('v657 ratings migration is missing');
if (!publicDesign650.includes('pb657InstagramCompactBanner') || !publicDesign650.includes('طراحی پست اینستاگرام')) fail('v657 compact Instagram header is missing');
if (!publicNav584.includes('a.active::after')) fail('v657 desktop active underline is missing');



// v661 likes / Coming Soon / equipment portal.
const comingSoon661 = readText('dist/web/photobridge-design-coming-soon-v664.js');
const rentalPortal661 = readText('dist/api/equipment-rental-portal.html');
if (!designRatings657.includes("'x-photobridge-portal':'photographer'") || !designRatings657.includes('stopImmediatePropagation')) fail('v661 desktop like click/session fix is missing');
if (!designRatings657.includes('setInterval(function(){if(!document.hidden)syncFromServer')) fail('v661 cross-device like sync is missing');
if (!webCss.includes('PhotoBridge v0.17.663 — like placement')) fail('v661 left-side like placement CSS is missing');
if (!comingSoon661.includes('/api/public/design-preview-access') || !comingSoon661.includes('این بخش به‌زودی آماده می‌شود') || !comingSoon661.includes('publicSeoHomeCards')) fail('v664 coming-soon UI/home state is missing');
if (!serverText.includes('DESIGN_COMING_SOON') || !serverText.includes('DESIGN_PREVIEW_ALLOWED_MOBILES') || !serverText.includes('design_coming_soon')) fail('v661 server-side design gate is missing');
if (!rentalPortal661.includes('pb661HeaderTabs') || !rentalPortal661.includes('pb661HeaderLogout') || !rentalPortal661.includes('pb661CollapsibleBox')) fail('v661 equipment header/collapsible UI is missing');
if (!rentalPortal661.includes('grid-template-columns:repeat(8,minmax(0,1fr))')) fail('v661 one-row 8-stat dashboard is missing');
if (!migration128.includes('SOFIA-DEMO-R-001') || !migration128.includes('SOFIA-DEMO-S-001')) fail('v661 Sofia demo refresh migration is missing');
if (!migration131.includes('SOFIA-DEMO-R-012') || !migration131.includes('SOFIA-DEMO-S-012') || !migration131.includes("('accessory','لوازم جانبی',50)")) fail('v664 expanded Sofia demo/catalog migration is missing');
if (!ensureSofiaDemo.includes("ILIKE '%سوفیا%'") || !ensureSofiaDemo.includes('SOFIA-DEMO-R-012') || !ensureSofiaDemo.includes('SOFIA-DEMO-S-012')) fail('v665 durable Sofia/Sofia demo seed is missing');
if (!migrateScript.includes('ensure-sofia-demo.sql') || !migrateScript.includes('[sofia-demo]') || !migrateScript.includes('rental_demo_count') || !migrateScript.includes('sale_demo_count')) fail('v665 migrate-time Sofia demo ensure/status check is missing');

// v555 upload/detect separation and client-side optimization.
if (!webCss.includes('PhotoBridge v0.17.555')) fail('v0.17.555 CSS marker is missing');
if (!webCss.includes('PhotoBridge v0.17.555-final')) fail('v0.17.555 final mobile/amount polish is missing');
if (!webJs.includes('PB555OptimizeUploadFile')) fail('mild pre-upload image optimizer is missing');
if (!webJs.includes('PB555PostJsonWithUploadProgress')) fail('upload progress transport is missing');
if (!webJs.includes('phase:"uploading"')) fail('separate upload phase is missing');
if (!webJs.includes('در حال آپلود عکس')) fail('upload stage UI is missing');
if (!webJs.includes('آپلود کامل شد؛ در حال شناسایی دقیق چهره‌ها')) fail('upload-to-detection transition is missing');
if (!webJs.includes('تعداد پیکسل و ابعاد عکس حفظ می‌شود')) fail('same-pixel-dimensions upload note is missing');
if (!webCss.includes('.skinRetouchUploadProgress')) fail('upload progress styling is missing');

// Compact quote: only final amount is visible; grouping stays visible for testing.
if (!webJs.includes('مبلغ روتوش')) fail('retouch amount title is missing');
if (!webCss.includes('.skinRetouchQuoteFacts') || !webCss.includes('.skinRetouchQuoteBreakdown')) fail('quote detail hiding rules are missing');
if (!webCss.includes('margin-right:auto!important')) fail('final amount is not positioned to the physical left');
if (!webJs.includes('PB541GroupingPlan')) fail('temporary grouping plan visibility for testing is missing');
if (!webCss.includes('.skinRetouchManualFaceTrigger{opacity:.72')) fail('subtle face-correction action is missing');

// Mobile print-card alignment requested in v555.
if (!webCss.includes('.simplePrintSizeCardHead>*{align-self:center!important}')) fail('mobile print-card vertical centering is missing');
if (!webCss.includes('border-radius:16px!important;overflow:hidden!important')) fail('rounded mobile print-card is missing');
if (!webCss.includes('display:inline-grid!important') || !webCss.includes('place-items:center!important')) fail('mobile plus icon centering is missing');

// Preserve grouping and Stage-4 safety work.
if (!serverText.includes('/api/customer/ai-studio/skin-retouch/prepare')) fail('customer skin-retouch prepare route is missing');
if (!serverText.includes('manual_face_required')) fail('face-detection recovery fallback is missing');
if (!serverText.includes('native-1600-spatial-v562')) fail('native 1600px spatial grouping strategy is missing');
if (!serverText.includes('RETOUCH_SHARED_CROP_TARGET_LONG_EDGE_PX = 1600')) fail('1600px grouping target is missing');
if (!serverText.includes('RETOUCH_SHARED_CROP_SOFT_MAX_LONG_EDGE_PX = 1680')) fail('1600px grouping tolerance is missing');
if (!serverText.includes('retouchSharedCropSkipsDetectedFace')) fail('spatial skipped-face grouping guard is missing');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('server startup version is not v0.17.663');
if (!serverText.includes("url.pathname === '/api/rental/live'")) fail('rental live endpoint is missing');
if (!serverText.includes('/api/rental-alert-agent/poll')) fail('rental Windows alert agent poll endpoint is missing');
if (!serverText.includes('excludeBookingId: bookingId')) fail('rental approval self-exclusion availability guard is missing');
if (!serverText.includes('equipmentRentalDate(current.rental_start)')) fail('rental approval DB date normalization fix is missing');
if (!serverText.includes('equipmentRentalClearBookingFinancialDraft(pool, bookingId)')) fail('rental cancelled finance cleanup is missing');
if (!serverText.includes('equipmentRentalNotifyBookingStatusSms')) fail('v630 rental rejection/cancellation SMS helper is missing');
if (!serverText.includes('booking_status_enabled')) fail('v630 rental booking-status SMS setting is missing');
if (!serverText.includes('collateral_requirement')) fail('v630 per-photographer collateral backend is missing');
const rentalPortal630 = readText('dist/api/equipment-rental-portal.html');
const rentalBook630 = readText('dist/api/equipment-rental-book.html');
if (!rentalPortal630.includes('smsBookingStatus') || !rentalPortal630.includes('editPhotographerCollateral')) fail('v630 rental portal SMS/collateral UI is missing');
if (!rentalBook630.includes('shopCollateral') || !rentalBook630.includes('<svg viewBox=\"0 0 24 24\"')) fail('v630 photographer rental collateral/icon UI is missing');
if (!webJs.includes('debugCompositeFailedAt')) fail('Stage-4 failed continuation condition is missing');
if (!webJs.includes('ادامه فقط مرحله ۴؛ خروجی AI ذخیره‌شده دوباره استفاده می‌شود')) fail('Stage-4 continuation action is missing');
if (!stage4Text.includes('full face + ears + full visible neck') || !stage4Text.includes('edgeFade')) fail('v594 edge-safe face/ears/neck Stage-4 mask is missing');
if (!stage4Text.includes('directSharpAllowed = false')) fail('direct Sharp safety lock is missing');
if (!stage4Text.includes('writeStage4MaskFile')) fail('Stage-4 mask fallback is missing');

// v555 detector: smaller compressed preview + consensus verification for high-res false positives.
if (!serverText.includes('const maxSide = aggressive ? 500 : 576')) fail('fast compressed detector preview is missing');
if (!serverText.includes('quality: 70')) fail('compressed detector preview quality is missing');
if (!serverText.includes('compressed-context-consensus-v561')) fail('v561 candidate consensus verifier is missing');
if (!serverText.includes('candidateVerification')) fail('candidate verification diagnostics are missing');
if (!workerText.includes("FACE_YOLO_THRESHOLD || .08")) fail('v565 group-face recall detector decode threshold is missing');
if (!workerText.includes("b.source === 'tile' ? .285 : .315")) fail('v562 recall-balanced direct threshold is missing');
if (!workerText.includes('onnx-yolov12n-face-adaptive-recall-v591')) fail('v565 group-face recall detector strategy is missing');
if (!workerText.includes('gridCols = recallMode ? (wideRecall ? 3 : tallRecall ? 1 : 2)')) fail('v565 dense group grid scan is missing');
if (!workerText.includes('TILE_TRIGGER_PX || 640')) fail('v565 low-resolution tile trigger is missing');
if (!workerText.includes('groupRecallMode')) fail('v565 group recall pressure mode is missing');
if (!workerText.includes('background: { r: 114, g: 114, b: 114 }')) fail('v565 detector letterbox fill is missing');
if (!serverText.includes('compressed-context-consensus-v561')) fail('v561 context verifier is missing');
if (!serverText.includes('possibleGroupMiss')) fail('v561 wide-group precision fallback is missing');
if (!serverText.includes('const multiFaceMode = limit >= 12')) fail('v565 multi-face recall mode is missing');
if (!serverText.includes("strategy: multiFaceMode ? 'multiface-recall-no-verifier'")) fail('v565 multi-face verifier bypass is missing');
if (!serverText.includes('const multiFaceNeedsPrecision = multiFaceMode &&') || !serverText.includes('const needsPrecision = multiFaceMode ? multiFaceNeedsPrecision')) fail('v591 adaptive group precision scan is missing');

// v556 durable queue + admin observability/control.
for (const needle of [
  'CREATE TABLE IF NOT EXISTS ai_retouch_queue',
  "queue_mode text NOT NULL DEFAULT 'fast'",
  "state text NOT NULL DEFAULT 'waiting'",
  'heartbeat_at timestamptz',
  'lease_expires_at timestamptz',
  'attempt_count integer NOT NULL DEFAULT 0',
  'max_attempts integer NOT NULL DEFAULT 3'
]) if (!migration109.includes(needle)) fail(`v556 queue migration is missing: ${needle}`);

for (const needle of [
  "RETOUCH_QUEUE_LOCK_KEY = 'photobridge-guided-retouch-queue-v556'",
  'ensureGuidedRetouchQueue',
  'retouchQueuePosition',
  'recoverGuidedRetouchQueue',
  'adminRetouchQueueSnapshot',
  'adminRetouchQueueAction',
  'FOR UPDATE OF q SKIP LOCKED',
  'pg_try_advisory_lock',
  '/api/admin/retouch-queue',
  'retry_requires_force',
  "rq.heartbeat_at>now()-interval '45 seconds'"
]) if (!serverText.includes(needle)) fail(`v556 durable retouch queue backend is missing: ${needle}`);

if (!serverText.includes("currentQueueState === 'cancelled' || currentQueueState === 'paused'")) fail('late queue-runner errors can overwrite cancel/pause state');
if (!serverText.includes("queueState === 'cancelled' || queueState === 'paused'")) fail('queue finalizer does not preserve cancel/pause state');

for (const needle of [
  'PB556RetouchQueueAdmin',
  'صف روتوش',
  'retouchQueuePosition',
  'در صف روتوش',
  'نوبت',
  'نیاز به بررسی',
  '/api/admin/retouch-queue'
]) if (!webJs.includes(needle)) fail(`v556 queue admin/customer UI is missing: ${needle}`);

if (!webCss.includes('PhotoBridge v0.17.556 — durable retouch queue admin')) fail('v556 queue admin CSS marker is missing');
if (!webCss.includes('.pb556RetouchQueueAdmin') || !webCss.includes('.pb556QueueTable')) fail('v556 queue admin styles are missing');

// v557 mobile bottom-app navigation.
for (const needle of [
  'photographerBottomAppNav',
  'photographerBottomAppNavGrid',
  'photographerBottomNavIcon',
  'aria-label":"ناوبری اصلی عکاس"',
  'children:"چاپ"',
  'children:"هوش مصنوعی"',
  'children:"گالری"',
  'children:"طراحی آلبوم"'
]) if (!webJs.includes(needle)) fail(`v557 mobile bottom navigation is missing: ${needle}`);
if (!webCss.includes('PhotoBridge v0.17.557 — photographer mobile bottom app navigation')) fail('v557 bottom nav CSS marker is missing');
if (!webCss.includes('position:fixed!important') || !webCss.includes('grid-template-columns:repeat(4,minmax(0,1fr))')) fail('v557 bottom nav fixed four-column layout is missing');

// v558 semantic icons + no duplicate top-level mobile navigation.
for (const needle of [
  'photographerBottomNavIcon print',
  'photographerBottomNavIcon ai',
  'photographerBottomNavIcon gallery',
  'photographerBottomNavIcon album'
]) if (!webJs.includes(needle)) fail(`v558 semantic bottom-nav icon class is missing: ${needle}`);
if (!webCss.includes('PhotoBridge v0.17.558 — cleaner semantic mobile icons + no duplicated top destinations')) fail('v558 CSS marker is missing');
if (!webCss.includes('.photographerBottomNavIcon.print::before') || !webCss.includes('mask-image:url')) fail('v558 SVG mask icons are missing');
if (!webCss.includes('.photographerSingleHeader:not(.photographerPrintModeHeader) .photographerHomeModeNav')) fail('v558 duplicate top-nav mobile hide rule is missing');


// v559 active bottom-nav icon visibility.
if (!webCss.includes('PhotoBridge v0.17.559 — active mobile bottom-nav icon visibility')) fail('v559 active-icon CSS marker is missing');
if (!webCss.includes('button.active .photographerBottomNavIcon::before')) fail('v559 active icon pseudo-element visibility rule is missing');
if (!webCss.includes('background:#fff!important') || !webCss.includes('background:#315efb!important')) fail('v559 active icon contrast styling is missing');

// v561 active label + face recall/head crop/soft Stage-4 blend.
if (!webCss.includes('PhotoBridge v0.17.561 — active mobile nav text contrast')) fail('v561 active mobile label CSS marker is missing');
if (!webCss.includes('button.active em{color:#fff!important')) fail('v561 active mobile nav text is not white');
if (!serverText.includes('v595-full-head-ears-neck-edge-safe')) fail('v592 Stage-4 checkpoint version is missing');
if (!serverText.includes('face-ears-full-neck-edgefade-v594')) fail('v592 Stage-4 mask profile is missing');
if (!serverText.includes('sideMargin = profileish ? .40 : .30, topMargin = .15, bottomMargin = .66')) fail('v592 balanced face-neck crop expansion is missing');
if (!retouchRuntime591.includes('function faceNeckContextBox') || !retouchRuntime591.includes('?.13:.10,top=.10,bottom=.78')) fail('v589 face+neck preview geometry is missing');
if (!stage4Text.includes('earRx = Math.min(sw * .22, fw * .40)') || !stage4Text.includes('leftEarCx = fx - fw * .10')) fail('v594 full-ear mask geometry is missing');
if (!stage4Text.includes('faceSide * .30')) fail('v593 seamless outer feather is missing');
if (!stage4Text.includes('innerFeather')) fail('v589 two-stage mask feather is missing');
if (stage4Text.includes('const tightEdge = Boolean(crop?.expansion?.manualExact);')) fail('v589 mask still contains the old hard manual edge clip');
if (stage4Text.includes('.sharpen(')) fail('v565 Stage-4 must not sharpen AI output');
if (stage4Text.includes("kernel: 'lanczos3'")) fail('v565 Stage-4 still contains Lanczos3 resampling');
if (!stage4Text.includes('flags=bicubic')) fail('v565 FFmpeg overlay bicubic resampling is missing');
if (!stage4Text.includes("original-face-chroma-lock-v565-natural")) fail('v565 gentle chroma-only color lock is missing');

// v565 lab delivery invoice completion must survive browser/S3 CORS failures.
if (!serverText.includes('labInvoicePdfUpload') || !serverText.includes('pdf-upload')) fail('server-side invoice PDF fallback route is missing');
if (!webJs.includes('/pdf-upload') || !webJs.includes('invoice_pdf_read_failed')) fail('frontend invoice PDF fallback upload is missing');

// v565 admin impersonation notice must stay compact and in page flow.
if (!webJs.includes('ورود نمایشی') || !webJs.includes('نشست موقت ادمین')) fail('admin impersonation notice copy is missing');
if (!webJs.includes('pbAdminImpersonationNotice')) fail('isolated admin impersonation mount is missing');
if (!webCss.includes('PhotoBridge v0.17.565 — admin impersonation notice stays in page flow')) fail('admin impersonation non-blocking CSS marker is missing');
if (!webCss.includes('.adminImpersonationBar{position:relative!important') || !webCss.includes('inset:auto!important')) fail('admin impersonation notice is still a fixed overlay');
if (!webCss.includes('body.pbAdminImpersonating .labOrderAlarmLayer')) fail('admin impersonation still permits a full-screen order alarm');
if (!webCss.includes('PhotoBridge v0.17.565-final — isolated admin impersonation mount.')) fail('isolated admin impersonation CSS marker is missing');
if (!webCss.includes('body.pbAdminImpersonating #root{display:flex!important')) fail('admin impersonation root is still vulnerable to vertical centering');

for (const needle of [
  'CREATE TABLE IF NOT EXISTS kindergarten_wallet_gateway_payments',
  'request_id text NOT NULL UNIQUE',
  "status IN ('payment_pending','payment_failed','paid','credit_pending','credited')"
]) if (!migration110.includes(needle)) fail(`v560 kindergarten-wallet migration is missing: ${needle}`);
for (const needle of [
  'KINDER_WALLET_BRIDGE_SECRET',
  '/api/integrations/kindergarten-wallet/session',
  '/api/integrations/kindergarten-wallet/status',
  '/api/payments/zibal/kindergarten-wallet/callback',
  'kindergartenWalletStatusResponse',
  'process.env.KINDER_WALLET_MIN_TOPUP',
  '/api/integrations/kindergarten-wallet/gateway-start',
  'kindergartenGatewayStartUrl',
  'referrer-policy'
]) if (!serverText.includes(needle)) fail(`v564 kindergarten-wallet/referrer bridge backend is missing: ${needle}`);
for (const forbidden of [
  'KINDER_WALLET_WEBHOOK_URL',
  'deliverKindergartenWalletCredit',
  'retryPendingKindergartenWalletCredits',
  'kindergarten.wallet.paid',
  'kindergarten.wallet.failed'
]) if (serverText.includes(forbidden)) fail(`v563 legacy webhook symbol must be removed: ${forbidden}`);

// v562 large-face multiscale recovery + spatial grouping.
for (const needle of [
  'prepareFaceDetectorZoomOutInput',
  'remapZoomOutFaceBoxes',
  'mergeFaceBoxesWithSupport',
  '[face-detect-v591-adaptive-group-recall]',
  "version: 'v591-adaptive-group-recall'",
  'debugFaceDetectorDiagnostics'
]) if (!serverText.includes(needle)) fail(`v562 multiscale face recovery is missing: ${needle}`);
for (const needle of [
  'retouchSharedGroupSpatialMetrics',
  'maxFacesPerSharedCrop = 6',
  'native-1600-spatial-v562',
  'spatialCoherent',
  'v0.17.562: use a tight "selected face core"'
]) if (!serverText.includes(needle)) fail(`v562 spatial grouping is missing: ${needle}`);
if (!workerText.includes('w > W * .94 || h > H * .94')) fail('v562 large-face worker ceiling is missing');

if (!webCss.includes('PhotoBridge v0.17.566 — print/upload lab header + mobile card alignment + album file readability')) fail('v0.17.566 print/mobile album UI CSS is missing');
if (!webCss.includes('grid-template-areas:"add" "send"')) fail('v0.17.566 mobile print duplicate-lab removal layout is missing');
if (!webJs.includes('onChange:je?A:_')) fail('v0.17.566 top mobile lab selector is not active in create mode');
const workflowGuideJs = readText('dist/web/photobridge-workflow-guides-v572.js');
if (!html.includes('/photobridge-workflow-guides-v572.js')) fail('v0.17.572 workflow-guide runtime is not loaded by index.html');
if (!webCss.includes('PhotoBridge v0.17.567 — cache-busted print/album mobile polish + contextual guide buttons')) fail('v0.17.567 preserved workflow-guide CSS marker is missing');
if (!webCss.includes('PhotoBridge v0.17.568 — print/album card refinement + desktop lab placement + guide arrows')) fail('v0.17.568 UI refinement CSS marker is missing');
for (const needle of ['pb569WorkflowGuideButton','pb569WorkflowGuideNavReady','pb567WorkflowGuideManager','راهنمای عضویت · موبایل','راهنمای عضویت · دسکتاپ','راهنمای چاپ عکس · موبایل','راهنمای چاپ عکس · دسکتاپ','راهنمای سفارش آلبوم · موبایل','راهنمای سفارش آلبوم · دسکتاپ']) {
  if (!workflowGuideJs.includes(needle)) fail(`v0.17.572 workflow guide runtime is missing: ${needle}`);
}
if (!workflowGuideJs.includes('/api/admin/video-guides') || !workflowGuideJs.includes('/api/public/video-guides?raw=1')) fail('v0.17.572 workflow guide API wiring is missing');
if (!workflowGuideJs.includes('pointGuideArrow') || !workflowGuideJs.includes("arrow.textContent=tx>=bx?'→':'←'")) fail('v0.17.572 guide arrows do not point dynamically at their target tabs');
if (!workflowGuideJs.includes('PUBLIC_GUIDE_REACT_SAFE=true')) fail('v0.17.572 React-safe public guide runtime marker is missing');
if (workflowGuideJs.includes('function sync(){syncLabSemantics();mountHeaderButtons();mountAlbumQuoteLab();mountAdminManager();mountSmartGuidePage()}')) fail('v0.17.572 still rewrites React-owned /guide DOM during sync');
if (!workflowGuideJs.includes("function sync(){if(location.pathname==='/guide')return;")) fail('v0.17.572 public /guide hard isolation guard is missing');
for (const needle of ["url.searchParams.get('raw') === '1'", "req.headers['sec-ch-ua-mobile']", 'Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile', "title: 'آموزش عضویت'", "title: 'راهنمای چاپ عکس'", "title: 'راهنمای سفارش آلبوم'"]) {
  if (!serverText.includes(needle)) fail(`v0.17.572 smart server-side guide selection is missing: ${needle}`);
}
if (!workflowGuideJs.includes('در حال دریافت شش ویدیوی اختصاصی') || !workflowGuideJs.includes("slot.kind==='membership'?'عضویت'")) fail('v0.17.572 six-slot admin guide uploader is missing');
if (!serverText.includes('const PUBLIC_GUIDE_URL = `${PUBLIC_APP_URL}/guide`;')) fail('v0.17.572 public guide URL constant is missing');
if ((serverText.match(/\$\{PUBLIC_GUIDE_URL\}/g)||[]).length < 5) fail('v0.17.572 guide link is not included in every invitation SMS path');
if (!webCss.includes('grid-template-columns:minmax(0,1fr) 42px minmax(0,1fr) 42px minmax(0,1fr)')) fail('v0.17.567 five-cell mobile print header is missing');
if (!webCss.includes('order:-20!important') || !webCss.includes('.photographerPrintTopLabStatic')) fail('v0.17.568 desktop top-lab placement is missing');
if (!webCss.includes('grid-template-columns:minmax(0,1fr) minmax(76px,auto)!important')) fail('v0.17.568 paper/chassis same-row layout is missing');
if (!webCss.includes('background:linear-gradient(180deg,#f4f7ff 0%,#e5edff 100%)!important')) fail('v0.17.568 non-grey replacement action is missing');
if (!webCss.includes('"thumb info"') || !webCss.includes('"thumb paper"') || !webCss.includes('"thumb actions"!important')) fail('v0.17.568 album card compact horizontal layout is missing');
if (!webCss.includes('grid-template-areas:"thumb" "info" "paper" "actions"!important')) fail('v0.17.568 phone album-card stacked layout is missing');

// v569 must target the DOM classes that actually exist in the deployed legacy React bundle.
if (!webCss.includes('PhotoBridge v0.17.569 — real deployed-card compatibility')) fail('v0.17.569 deployed-card compatibility marker is missing');
if (!webCss.includes('.albumFileQcCard')) fail('v0.17.569 does not target deployed albumFileQcCard');
if (!webCss.includes('.simplePrintPhotoAddonOverrides')) fail('v0.17.569 does not target deployed print add-on container');
if (!webCss.includes('grid-template-areas:\n    "thumb thumb"\n    "info info"\n    "paper addons"')) fail('v0.17.569 legacy print paper/chassis row is missing');
if (!webCss.includes('grid-template-areas:\n    "preview identity"\n    "preview paper"\n    "preview progress"')) fail('v0.17.569 deployed album card horizontal layout is missing');
if (!webCss.includes('height:42px!important')) fail('v0.17.569 readable album paper selector is missing');
if (!workflowGuideJs.includes("print.append(p)")) fail('v0.17.692 print guide is not mounted inside the Print action');
if (!workflowGuideJs.includes("album.append(a)")) fail('v0.17.692 album guide is not mounted inside the Album action');
if (!workflowGuideJs.includes('pb569GuideLabel') || workflowGuideJs.includes('<span>؟</span>')) fail('v0.17.569 guide button is still using the separated question-mark UI');

// v570: album cards match print-card dimensions, desktop top lab is removed, and contextual lab identity is restored.
if (!webCss.includes('PhotoBridge v0.17.570 — album cards match print cards + desktop lab-context placement')) fail('v0.17.570 CSS marker is missing');
if (!webCss.includes('grid-template-columns:repeat(auto-fill,minmax(230px,1fr))!important')) fail('v0.17.570 album grid does not match print-card sizing');
if (!webCss.includes('aspect-ratio:4/3!important') || !webCss.includes('object-fit:contain!important')) fail('v0.17.570 full-image album preview is missing');
if (!webCss.includes('.photographerPrintModeHeader .photographerPrintTopLab{') || !webCss.includes('display:none!important')) fail('v0.17.570 desktop main-header lab removal is missing');
if (!webCss.includes('.simplePrintPilotLabStatic{') || !webCss.includes('display:inline-flex!important')) fail('v0.17.570 desktop print contextual lab identity is missing');
if (!workflowGuideJs.includes('mountAlbumQuoteLab') || !workflowGuideJs.includes('pb570AlbumQuoteLab')) fail('v0.17.570 album quote lab identity runtime is missing');
if (!workflowGuideJs.includes('syncLabSemantics')) fail('v0.17.570 responsive lab semantics are missing');
// v577 album-design catalog speed/stability.
for (const needle of ['اینستاگرام · رایگان','albumDesignInstagramGrid','albumDesignSlideshowGrid','PB577AlbumSampleFile','samplePreviewUrl','maskPreviewUrl']) if (!webJs.includes(needle)) fail(`v577 album catalog runtime missing: ${needle}`);
if (!webCss.includes('PhotoBridge v0.17.577 — album catalog loading/stability')) fail('v577 album catalog CSS marker missing');
if (!webCss.includes('grid-template-columns:repeat(6,minmax(0,1fr))!important')) fail('v577 six-column Instagram/slideshow grid missing');
for (const needle of ['albumPersistentPreviewRel','albumPersistentPreviewKey','maskPreviewUrl','stale-while-revalidate=604800']) if (!serverText.includes(needle)) fail(`v577 persistent preview backend missing: ${needle}`);

// v573 public SEO landing pages and sitemap.
for (const needle of [
  '/retouch-photo',
  '/retouch-photo/batch',
  '/retouch-photo/album',
  '/photo-selection-gallery',
  '/instagram-post-design',
  'روتوش عکس آنلاین و حرفه‌ای',
  'گالری انتخاب عکس آنلاین',
  'طراحی پست اینستاگرام'
]) if (!serverText.includes(needle) && !webJs.includes(needle)) fail(`v573 SEO landing is missing: ${needle}`);
if (!webCss.includes('PhotoBridge v0.17.573 — SEO landing pages')) fail('v573 SEO CSS marker is missing');
const sitemapText = readText('dist/web/sitemap.xml');
for (const path of ['/retouch-photo','/retouch-photo/batch','/retouch-photo/album','/photo-selection-gallery','/instagram-post-design']) if (!sitemapText.includes(`https://photobridge.ir${path}`)) fail(`v573 sitemap URL missing: ${path}`);

// v575: critical public SEO pages render server-side and cannot white-screen if React fails.
for (const needle of ['SEO_STANDALONE_ROUTES','seoStandaloneHtml','/album-design/start','/instagram-post-design/start','شروع روتوش بدون عضویت','شروع طراحی آلبوم بدون عضویت']) if (!serverText.includes(needle)) fail(`v575 standalone public landing missing: ${needle}`);
for (const path of ['/retouch-photo','/retouch-photo/batch','/retouch-photo/album','/photo-selection-gallery','/instagram-post-design','/album-design','/album-design/wedding']) if (!serverText.includes(`'${path}': {`)) fail(`v575 standalone route definition missing: ${path}`);
if (!serverText.includes('const standaloneHtml = seoStandaloneHtml(pathname)')) fail('v575 standalone HTML is not wired before SPA serving');
if (!publicDesignLoaded) fail('v579 guest design bridge is not loaded by index.html');


// v575 public no-membership tools and photographer professional pricing.
const publicDesignRuntime = readText('dist/web/photobridge-public-design-v583.js');
const migration111 = readText('migrations/111_public_design_orders.sql');
for (const needle of ['/album-design/start','/instagram-post-design/start','photobridge-public-design-v650.js']) if (!html.includes(needle) && !webJs.includes(needle) && !publicDesignRuntime.includes(needle)) fail(`v575 public design route/runtime missing: ${needle}`);
for (const needle of ['pbPublicDesignGuest','/api/public/album-design/orders','instagram_export','album_export','پرداخت آنلاین']) if (!publicDesignRuntime.includes(needle)) fail(`v575 public design runtime missing: ${needle}`);
for (const needle of ['/api/public/album-design/templates','/api/public/album-design/checkout','/api/public/album-design/orders','publicExportPriceToman','publicInstagramPriceToman']) if (!serverText.includes(needle)) fail(`v575 public design backend missing: ${needle}`);
if (serverText.includes("return sendJson(res, 403, { error: 'album_design_coming_soon' })")) fail('v575 photographer album design is still gated as coming soon');
if (!migration111.includes('CREATE TABLE IF NOT EXISTS public_design_orders')) fail('v575 public design payment migration missing');
if (!webCss.includes('PhotoBridge v0.17.575 — public no-membership tools')) fail('v575 public design CSS marker missing');
if (!webJs.includes('s0[t]||s0["retouch-main"]')) fail('v575 legacy SEO white-screen fallback missing');

// v576 unified public navigation and standalone landing polish.
const publicNavRuntime = publicNav584;
if (!publicNavLoaded) fail('v586 public nav runtime is not loaded by index.html');
for (const needle of ['activeRoot','pbCanonicalHeaderV624','pbHomeMobileAccountBar']) if (!publicNavRuntime.includes(needle)) fail(`v586 public nav runtime missing: ${needle}`);
if (!webCss.includes('PhotoBridge v0.17.576 — unified public navigation + calmer SEO typography')) fail('v576 public header/typography CSS marker missing');
for (const needle of ['fonts.googleapis.com/css2?family=Vazirmatn','seoSafeHeaderRight']) if (!serverText.includes(needle)) fail(`public standalone landing/header polish missing: ${needle}`);
if (webJs.includes('publicFeatureLink publicRetouchNavHighlight')) fail('v576 home still forces retouch navigation active');

// v578 dedicated public design modes remain preserved; v579 changes only navigation and vertical sharing direction.
const publicDesign579 = readText('dist/web/photobridge-public-design-v583.js');
const publicNav581 = readText('dist/web/photobridge-public-nav-v581.js');
for (const needle of ['/slideshow-design/start','syncSlideshowOrientation','pbPublicDesignMode-',"mode==='album'"]) if (!publicDesign579.includes(needle)) fail(`v579 dedicated design runtime missing: ${needle}`);
for (const needle of ['/slideshow-design','طراحی اینستاگرام','گالری انتخاب عکس','pbCanonicalHeaderV624','pbScrolled']) if (!publicNav584.includes(needle)) fail(`v586 public header runtime missing: ${needle}`);
for (const needle of ['PhotoBridge v0.17.578 — dedicated design modes + editor/catalog polish','.albumDesignModelFold{display:none!important}','grid-column:auto!important']) if (!webCss.includes(needle)) fail(`v578 CSS polish missing: ${needle}`);
if (!serverText.includes("'/slideshow-design': {") || !serverText.includes("service==='slideshow'")) fail('slideshow landing/public template service missing');
if (!sitemapText.includes('https://photobridge.ir/slideshow-design')) fail('slideshow sitemap URL missing');
if (!html.includes('/assets/index-UIRefine-v655.js') || !html.includes('/assets/index-UIRefine-v586.css')) fail('v590 compiled frontend JS / stable CSS bundle missing');

// v581: canonical public shell + invite-only photographer public access + mobile quick actions.
for (const needle of ['pbCanonicalHeaderV581','pbAccountStrip','pbHomeMobileAccountBar','pbMobileMenuDesign','pbCanonicalDesktopNav','pbCanonicalHeaderSpacerV581','pbCanonicalFooterV581','pbInternalScrolled']) if (!publicNav581.includes(needle)) fail(`v581 canonical public shell missing: ${needle}`);
for (const needle of ['خانه','طراحی آلبوم','طراحی اینستاگرام','طراحی اسلایدشو','گالری انتخاب عکس','چاپ لابراتوار','روتوش عکس','راهنما']) if (!publicNav581.includes(needle)) fail(`v581 public nav item missing: ${needle}`);
for (const needle of ['display:block!important;height:auto!important','position:fixed!important','filter:brightness(0) invert(1)','radial-gradient(circle at 13% -55%','pbCanonicalFooterMounted','pbTrustFallback']) if (!publicNav581.includes(needle)) fail(`v581 header/footer stability rule missing: ${needle}`);
if (!publicNavLoaded || !publicDesignLoaded) fail('current public shell/design runtimes are not loaded by index.html');

// v579: admin keeps slideshow as the master; every portrait slideshow is mirrored into Instagram.
for (const needle of ['cloneVerticalSlidesIntoInstagram','pb-instagram-slide-','_pbSourceSlideshowId','_pbInstagramOutputWidth:1080','_pbInstagramOutputHeight:1920']) if (!publicDesign579.includes(needle)) fail(`v579 slideshow-to-Instagram bridge missing: ${needle}`);
for (const needle of ['instagramFromVerticalSlides','pb-instagram-slide-','instagram-from-slideshow','_pbVirtualInstagram']) if (!serverText.includes(needle)) fail(`v579 backend slideshow-to-Instagram bridge missing: ${needle}`);
if (!webJs.includes('1080/Math.max(1,bt.width),1920/Math.max(1,bt.height)')) fail('v579/v653 Instagram social output scaling is missing');
for (const needle of ['mobileAccountItems','عضویت لابراتوار','polishHomePhotographerAccess','polishPhotographerLoginInviteOnly','pbInviteOnlyLoginNote','عضویت عکاس در PhotoBridge فقط از طریق لینک دعوت انجام می‌شود','pbCanonicalAccounts','pbCanonicalAccountDivider']) if (!publicNav584.includes(needle)) fail(`v584 account/mobile access polish missing: ${needle}`);
if (publicNav584.includes("['/photographer/signup','عضویت عکاس'")) fail('v584 public header still exposes photographer signup');
if (!publicNav584.includes("[['/photographer','ورود عکاس'],['/lab','ورود لابراتوار'],['/rental','ورود فروشگاه']]") || !publicNav584.includes("[['/ai','عضویت آزاد'],['/trial','عضویت لابراتوار'],['/equipment-rental/register','عضویت فروشگاه']]") || !publicNav584.includes('pbMobileInfoLinks')) fail('current mobile top menu is malformed');
if (publicNav584.includes('pbAccountStrip')) fail('v584 desktop account buttons still use the second-row strip');
if (!serverText.includes("primaryHref: '/photographer', primaryLabel: 'ورود عکاس به گالری'")) fail('v581 public gallery still points users to photographer signup');

// v582 public AI retouch quote/prepare regression guard.
const publicPrepareStart = serverText.indexOf("url.pathname === '/api/public/ai/skin-retouch/prepare'");
const publicPrepareEnd = publicPrepareStart >= 0 ? serverText.indexOf('const publicAiOrder =', publicPrepareStart) : -1;
if (publicPrepareStart < 0 || publicPrepareEnd < 0) fail('public skin-retouch prepare route block is missing');
const publicPrepareBlock = serverText.slice(publicPrepareStart, publicPrepareEnd);
if (publicPrepareBlock.includes('debugPrepared?.')) fail('public skin-retouch prepare still references undefined debugPrepared');
if (!publicPrepareBlock.includes("apiRequestSize: String(prepared?.regions?.[0]?.aiSize || 'auto')")) fail('public skin-retouch prepare does not use prepared region size');




// v583 shared retouch core + SMS-only account + physical retention remain preserved.
for (const needle of ['prepareSharedSkinRetouchCore','sharedRetouchDebugMetadata','shared-guided-v583','ensurePublicRetouchAccount','cleanupExpiredRetouchOutputs','RETOUCH_OUTPUT_RETENTION_SETTING_KEY','output_expires_at','output_deleted_at','/api/public/retouch-account/orders']) if (!serverText.includes(needle)) fail(`shared-retouch backend missing: ${needle}`);
for (const needle of ['ALTER COLUMN contact_email DROP NOT NULL','public_retouch_enabled','output_expires_at','output_deleted_at','retouch_output_retention_days']) if (!migration112.includes(needle)) fail(`v583 migration missing: ${needle}`);
for (const needle of ['سفارش‌های روتوش من','/api/public/retouch-account/login','/api/public/retouch-account/orders','زمان باقی‌مانده']) if (!retouchAccountHtml.includes(needle)) fail(`retouch account page missing: ${needle}`);
if (!serverText.includes("delivery: { sms: Boolean(sms?.configured), email: false }")) fail('public retouch plan delivery is not SMS-only');
if (!serverText.includes("ready_email_status='disabled'")) fail('public retouch ready-email path is not explicitly disabled');
if (!serverText.includes("setInterval(() => cleanupExpiredRetouchOutputs().catch(console.error), 60 * 1000).unref();")) fail('physical retouch cleanup is not scheduled every minute');
if (!serverText.includes("outputExpiresAt: row.output_expires_at || null")) fail('photographer retouch download does not expose output expiry');

// v584: public retouch uses the photographer modal language/classes; admin-only debug + server-side payment bypass.
if (!html.includes('/photobridge-retouch-v595.js')) fail('v592 retouch runtime is not loaded by index.html');
for (const needle of ['pb584PublicFlowModal','skinRetouchFlowOverlay','skinRetouchFlowCard','skinRetouchFlowSteps','skinRetouchDetectedFaces','skinRetouchGroupingPlan','pbRetouchAdminDebug','09125678720','شروع تست بدون پرداخت']) if (!retouchRuntime584.includes(needle)) fail(`v584 public retouch modal/admin visibility missing: ${needle}`);
if (retouchRuntime584.includes('pb583FaceSummary')) fail('v584 still exposes the old separate public face-summary UI');
for (const needle of ['isRetouchAdminTestMobile',"requireRole(a, 'platform_admin')",'adminTestBypass',"payment_provider='admin_test'","payment_message='admin_test_bypass'",'tryStartPublicAiOrder(String(o.id))','jobPhase: visibleJobPhase']) if (!serverText.includes(needle)) fail(`v584 admin test/server status bridge missing: ${needle}`);
for (const needle of ['pbCanonicalAccounts','pbCanonicalAccountDivider','pbCanonicalDesktopCluster',"desktopCluster.appendChild(accounts)","desktopCluster.appendChild(divider)","desktopCluster.appendChild(nav)",'main.appendChild(desktopCluster)']) if (!publicNav584.includes(needle)) fail(`v586 desktop account/nav cluster missing: ${needle}`);
if (!serverText.includes('/photobridge-public-nav-v625.js?v=659')) fail('v586 standalone SEO landings do not load the current canonical header');
if (!retouchRuntime584.includes("headers['x-photobridge-portal']='admin'")) fail('v584 admin public-test request does not opt into the authenticated admin portal session');
if (publicNav584.includes('pbAccountStrip')) fail('v584 still renders the desktop account strip');
for (const x of ["const steps=['آپلود','تشخیص چهره','مبلغ','روتوش با AI','ترکیب نهایی','تحویل خروجی']",'openPublicManualEditor','faceNeckContextBox','manualFaceBoxes']) if (!retouchRuntime584.includes(x)) fail(`v586 public retouch parity missing: ${x}`);
if (!retouchRuntime593.includes("side=(ratio<.68||ratio>1.42)?.40:.30,top=.15,bottom=.66")) fail('v593 public face+neck crop geometry missing');
if (!webJs.includes('o<.68||o>1.42?.40:.30') || !webJs.includes('g=r*.66')) fail('v592 photographer face preview geometry/aspect fix missing');
if ((serverText.match(/sideMargin = profileish \? \.40 : \.30, topMargin = \.15, bottomMargin = \.66/g)||[]).length < 2) fail('v593 server face+neck crop geometry missing');
if (!webCss.includes('PhotoBridge v0.17.586 — exact face/manual parity + quote single-card lock')) fail('v586 retouch CSS marker missing');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v592 server startup version missing');


// v587: quick public retouch auth, crash recovery and load-balancer-safe downloads.
const migration113 = readText('migrations/113_public_retouch_quick_auth.sql');
for (const needle of ['public_retouch','signup_mobile_verifications_kind_check']) if (!migration113.includes(needle)) fail(`v587 quick-auth migration missing: ${needle}`);
for (const needle of ['/api/public/retouch-account/register/start','/api/public/retouch-account/register/verify','public_retouch_login_required','public_retouch_prepare_rate_limited','Authenticate/rate-limit before decoding the image','retouchStoredObjectDownloadUrl','/api/retouch-download/','shouldIsolateRetouchComposite','runRetouchCompositeWorkerIsolated']) if (!serverText.includes(needle)) fail(`v587 retouch backend/recovery missing: ${needle}`);
for (const needle of ['pb587QuickAuthGate','pb587RetouchAuthLocked','photobridge_public_retouch_active_order','restoreActivePublicOrder','ارتباط با سرور موقتاً قطع شد']) if (!retouchRuntime584.includes(needle)) fail(`v587 retouch browser recovery missing: ${needle}`);
if (!publicNav584.includes('background:#fff!important;color:#2452b8!important')) fail('v587 public account buttons are not white');
if (!publicNavLoaded || !html.includes('/photobridge-retouch-v595.js')) fail('v592 runtime files are not loaded by index.html');

// v588: admin quick-login, anti-autofill, distinct scrolled account buttons, public face exclusion.
for (const needle of ["/api/auth/admin-login","type=\"tel\"","scrubRetouchMobileAutofill","skinRetouchDetectedFaceRemove","selectedFaceIndexes","حداقل یک چهره را برای روتوش"]) if (!retouchRuntime584.includes(needle)) fail(`v588 public retouch UI missing: ${needle}`);
for (const needle of ["retouchSelectedFaceIndexes","retouchExcludedFaceIndexes","02-ai-input-selected-region-","publicFaceSelectionConfirmedAt","ai_no_faces_selected"]) if (!serverText.includes(needle)) fail(`v588 public face selection backend missing: ${needle}`);
if (!publicNav584.includes('background:rgba(13,42,112,.46)!important')) fail('v588 scrolled account buttons are not visually distinct from active nav');
if (!publicNavLoaded || !html.includes('/photobridge-retouch-v595.js')) fail('v592 runtime files are not loaded by index.html');
for (const needle of ['face-ears-full-neck-edgefade-v594','completed_at<=now()-interval \'5 seconds\'','publicAiReadyDeliverySweep().catch(console.error), 15 * 1000','isRetouchAccount']) if (!serverText.includes(needle)) fail(`v589 retouch/SMS fix missing: ${needle}`);
if (!retouchAccountHtml.includes('/api/public/retouch-account/login') || !retouchAccountHtml.includes('/api/public/retouch-account/admin-bridge') || !retouchAccountHtml.includes('pb591-retouch-mobile')) fail('v591 desktop retouch-account bridge/autofill fix is missing');

// v590: desktop retouch-account portal-correct login + direct retouch CTA.
for (const needle of ["/api/public/retouch-account/login","createSession(user.id, res, 'default')","adminMatches.length === 1"]) if (!serverText.includes(needle)) fail(`v590 retouch account backend missing: ${needle}`);
for (const needle of ['name="pb591-retouch-mobile"','name="pb591-retouch-secret"','/api/public/retouch-account/login','/api/public/retouch-account/admin-bridge']) if (!retouchAccountHtml.includes(needle)) fail(`v591 retouch account page missing: ${needle}`);
if (!webJs.includes('href:"#public-ai-checkout",children:"روتوش عکس"')) fail('v590 public AI hero retouch CTA missing');

// v592: composite stability + order recovery + adaptive grouping + balanced neck crop + one modal control.
for (const needle of ['/api/public/retouch-account/admin-bridge',"createSession(a.userId, res, 'default')",'v591-adaptive-group-recall','bottomMargin = .66','v595-full-head-ears-neck-edge-safe','publicCompositeRecoveryCount','STAGE4_WORKER_STALL_TIMEOUT_MS || 85_000']) if (!serverText.includes(needle)) fail(`v592 server fix missing: ${needle}`);
for (const needle of ['wideRecall','tallRecall','onnx-yolov12n-face-adaptive-recall-v591']) if (!workerText.includes(needle)) fail(`v592 detector speed base missing: ${needle}`);
for (const needle of ['face-ears-full-neck-edgefade-v594','availableNeck = Math.max(fh * .24, safeBottom - neckStart)','waitEncoderCloseWithTimeout','stage4EncoderWaitMs','STAGE4_DEEP_VALIDATE','Math.min(1, 640 / Math.max','-q:v', '2']) if (!stage4Text.includes(needle)) fail(`v592 Stage-4 stability/mask fix missing: ${needle}`);
for (const needle of ['pb592PublicMiniDock','minimizePublicModal','data-pb584-action="minimize"','bottom=.66','scheduleEnhance','renderOrderFallback','composite_failed','queueMaxAttempts']) if (!retouchRuntime593.includes(needle)) fail(`v593 public runtime fix missing: ${needle}`);
if (!retouchRuntime593.includes('new MutationObserver(()=>scheduleEnhance(180))')) fail('v592 MutationObserver throttle is missing');
if (retouchRuntime593.includes('new MutationObserver(()=>enhance())')) fail('v592 still contains the self-triggering unthrottled MutationObserver');
if (!serverText.includes('adaptiveSoftMaxLongEdge = tightPair ? 2400 : tightTrio ? 2200')) fail('v592 adaptive nearby-face grouping ceiling is missing');
if (!html.includes('/photobridge-retouch-v595.js')) fail('v592 retouch runtime is not loaded by index.html');
if (!webJs.includes('g=r*.66')) fail('v592 photographer face+neck preview geometry missing from deployed bundle');


// v593: final Stage-4 reliability/speed/seam + PhotoBridge account typography.
for (const needle of [
  'STAGE4_WORKER_STALL_TIMEOUT_MS || 85_000',
  'STAGE4_WORKER_ABSOLUTE_TIMEOUT_MS || 360_000',
  'requirePreparedCheckpoint',
  'v595-full-head-ears-neck-edge-safe',
  'face-ears-full-neck-edgefade-v594',
  'adaptiveSoftMaxLongEdge = tightPair ? 2400 : tightTrio ? 2200',
  'const maxSide = aggressive ? 500 : 576',
  'maxSide = 1024, maxPixels = 780_000'
]) if (!serverText.includes(needle)) fail(`v593 server fix missing: ${needle}`);
for (const needle of [
  'face-ears-full-neck-edgefade-v594',
  'feather-band-tone-lock-v594',
  'checkpoint-local',
  'STAGE4_REQUIRE_PREPARED_CHECKPOINTS',
  'ffmpeg-one-pass-overlay-v593-conservative',
  'imagemagick-disk-first-v593',
  'availableNeck = Math.max(fh * .24, safeBottom - neckStart)',
  'faceSide * .30'
]) if (!stage4Text.includes(needle)) fail(`v593 Stage-4 fix missing: ${needle}`);
if (!retouchRuntime593.includes('side=(ratio<.68||ratio>1.42)?.40:.30,top=.15,bottom=.66')) fail('v594 public face/neck preview geometry missing');
if (!webJs.includes('o<.68||o>1.42?.40:.30') || !webJs.includes('g=r*.66')) fail('v594 photographer face/neck preview geometry missing');
for (const needle of ['font-size:13.5px','border-radius:14px','background:#4f46e5','font-size:11.5px']) if (!retouchAccountHtml.includes(needle)) fail(`v593 retouch-account typography missing: ${needle}`);
if (!html.includes('/photobridge-retouch-v595.js') || !html.includes('/assets/index-UIRefine-v655.js')) fail('v593 cache-busted runtime/bundle is not loaded');

// v594: public durable queue parity + transparent Stage-4 recovery + edge-safe seam blending.
for (const needle of ["j.owner_type IN ('customer','admin','public')","GREATEST(max_attempts,6)","photographer-durable-parity-v594","publicStage4TransparentRecovery","transparentCompositeRecovery","queueMaxAttempts","bottomMargin = .66","v595-full-head-ears-neck-edge-safe"]) if (!serverText.includes(needle)) fail(`v594 server parity fix missing: ${needle}`);
for (const needle of ['edgeFade','full face + ears + full visible neck','faceSide * .30','feather-band-tone-lock-v594']) if (!stage4Text.includes(needle)) fail(`v594 Stage-4 seam fix missing: ${needle}`);
if (!retouchRuntime593.includes('queueMaxAttempts||6') || !retouchRuntime593.includes('bottom=.66')) fail('v594 public runtime recovery/geometry missing');
if (!html.includes('/photobridge-retouch-v595.js')) fail('v594 runtime is not loaded by index.html');
// v595: full-head/ear-safe crop + persistent public mobile app dock.
for (const needle of ['sideMargin = profileish ? .40 : .30, topMargin = .15, bottomMargin = .66','v595-full-head-ears-neck-edge-safe']) if (!serverText.includes(needle)) fail(`v595 server full-head crop missing: ${needle}`);
if (!retouchRuntime593.includes('side=(ratio<.68||ratio>1.42)?.40:.30,top=.15,bottom=.66')) fail('v595 public full-head preview geometry missing');
if (!webJs.includes('o<.68||o>1.42?.40:.30') || !webJs.includes('m=r*.15') || !webJs.includes('g=r*.66')) fail('v595 photographer full-head preview geometry missing');
for (const needle of ['mobileServiceItems','pbMobilePrimaryActions','pbMobileAccountActions','pbPublicMobileDockMounted',"['/ai','روتوش عکس','retouch']","['/album-design','آلبوم','album']","path.indexOf('/ai')===0"]) if (!publicNav584.includes(needle)) fail(`v595 persistent mobile app dock missing: ${needle}`);
if (!publicNavLoaded || !html.includes('/photobridge-retouch-v595.js') || !html.includes('/assets/index-UIRefine-v655.js')) fail('v595 cache-busted public runtimes/bundle are not loaded');


// v596: single-row mobile app dock + mobile top-menu cleanup + unified Home CTA palette.
for (const needle of [
  'grid-template-columns:repeat(4,minmax(0,1fr))',
  '.pbMobilePrimaryActions,.pbMobileAccountActions{display:contents!important}',
  "['/guide','راهنما']",
  "['/trial','عضویت لابراتوار']",
  'body.pbHomePublicRoute #root .publicActions a',
  'background:linear-gradient(135deg,rgba(238,244,255,.98)',
  'mobile.appendChild(menuBtn)'
]) if (!publicNav584.includes(needle)) fail(`v596 mobile polish missing: ${needle}`);
if (publicNav584.includes('mobile.appendChild(mobileHome)')) fail('v596 mobile Home button was not removed from the header');
if (publicNav584.includes("['/trial','عضویت لابراتوار','joinLab']")) fail('v596 lab signup still exists in the bottom dock');
if (!publicNavLoaded) fail('v596 public nav runtime is not loaded by index.html');
if (!serverText.includes('/photobridge-public-nav-v625.js?v=659')) fail('v596 standalone SEO pages do not load the current nav runtime');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v596 server startup version missing');


// v597: Home returns to bottom dock; guide stays in top mobile menu; dock persists on photographer/lab login;
// lab icon is a printer; PhotoBridge wordmark stays visible; album mobile pickers inherit site font.
for (const needle of [
  "['/','خانه','home']",
  "path==='/photographer'||path==='/lab'",
  "if(kind==='home')return '<svg",
  'M7 8V4h10v4M7 17H5.5',
  'syncMobileDock();buildFooter();',
  '.albumDesignMobileCatalogPickerBackdrop *',
  '.albumDesignMobilePicker,.albumDesignMobilePicker *',
  '#pbCanonicalHeaderV624 .pbCanonicalBrand b{display:block!important;font-size:15px!important;line-height:1!important'
]) if (!publicNav584.includes(needle)) fail(`v597 mobile navigation/font polish missing: ${needle}`);
if (publicNav584.includes("['/guide','راهنما','guide']")) fail('v597 guide still exists in bottom mobile dock');
if (!publicNav584.includes("['/guide','راهنما']") || !publicNav584.includes("['/trial','عضویت لابراتوار']")) fail('v597 guide/lab signup are not present in the top mobile menu');
if (!publicNavLoaded) fail('v597 public nav runtime is not loaded by index.html');
if (!serverText.includes('/photobridge-public-nav-v625.js?v=659')) fail('v597 standalone SEO pages do not load the current nav runtime');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v597 server startup version missing');


// v598: Home is physically right-most in RTL mobile dock and mobile PhotoBridge wordmark is larger.
for (const needle of [
  "var mobileAccountItems=[\n    ['/','خانه','home']",
  "bottom.appendChild(utility);bottom.appendChild(primary)",
  "font-size:15px!important;line-height:1!important;letter-spacing:-.15px!important",
  "@media(max-width:420px){\n        #pbCanonicalHeaderV624 .pbCanonicalBrand b{display:block!important;font-size:14px!important}"
]) if (!publicNav584.includes(needle)) fail(`v598 mobile Home/wordmark polish missing: ${needle}`);
if (!publicNavLoaded) fail('v598 public nav runtime is not loaded by index.html');
if (!serverText.includes('/photobridge-public-nav-v625.js?v=659')) fail('v598 standalone SEO pages do not load the current nav runtime');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v598 server startup version missing');


// v599 album mobile modal/filter/account polish.
const publicDesign580 = readText('dist/web/photobridge-public-design-v583.js');
for (const needle of ['pb599MobileSessionCard','/api/auth/me','/retouch-account','سفارش‌ها و فایل‌های روتوش','فعال']) if (!publicNav584.includes(needle)) fail(`v599 active public account menu missing: ${needle}`);
for (const needle of ['pb599AlbumFilterBackdrop','pb599AlbumFilterSheet','pb599AlbumFilterApply','decorateAlbumFilters','polishAlbumPickerSheets','albumFilterLabel']) if (!publicDesign580.includes(needle)) fail(`v599 album mobile filter/modal runtime missing: ${needle}`);
for (const needle of ['font-family:Vazirmatn','direction:rtl','text-align:right','albumDesignMobileCatalogPickerChoices>button:last-child']) if (!publicNav584.includes(needle)) fail(`v599 album modal typography/direction/safe-scroll guard missing: ${needle}`);
if (publicDesign580.includes('<a href="/photographer">ورود عکاس</a>')) fail('v599 public album guest banner still exposes photographer login');
if (!publicDesignLoaded || !publicNavLoaded) fail('v599 public design/nav runtimes are not loaded by index.html');
if (!serverText.includes('/photobridge-public-nav-v625.js?v=659')) fail('v599 standalone SEO pages do not load current nav runtime');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v599 server startup version missing');


// v600 album interaction freeze hotfix.
const publicDesign581 = readText('dist/web/photobridge-public-design-v583.js');
for (const needle of ['scheduleDecorate','decorateScheduled','decorating=false','setNodeText','isInsideManagedFilter','pagehide','pageshow']) if (!publicDesign581.includes(needle)) fail(`v600 album freeze guard missing: ${needle}`);
if (publicDesign581.includes('var obs=new MutationObserver(function(){decorate()})')) fail('v600 still uses synchronous mutation decorate loop');
if (publicDesign581.includes('if(summary)summary.textContent=albumFilterLabel')) fail('v600 filter summary still mutates on every observer pass');
if (!publicDesignLoaded) fail('v600 freeze-safe public design runtime is not loaded by index.html');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v600 server startup version missing');


// v601 final album mobile picker: all three groups selectable + all templates available + real RTL/font/touch safety.
const publicDesign582 = readText('dist/web/photobridge-public-design-v583.js');
for (const needle of [
  "mode==='album'?true",
  "if(mode==='album')return nativeFetch('/api/public/album-design/templates'",
  'pb602AlbumPickerStyle',
  'polishAlbumPickerSheetsFinal',
  "btn.style.removeProperty('display')",
  'touch-action:manipulation!important',
  'padding:18px 12px calc(46px + env(safe-area-inset-bottom))'
]) if (!publicDesign582.includes(needle)) fail(`v601 final album picker missing: ${needle}`);
if (!publicDesignLoaded) fail('v601 public design runtime is not loaded by index.html');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v601 server startup version missing');

// v602: custom mobile model/size sheet + one-button two-row filters + portrait Instagram immersive editor.
const publicDesign583 = readText('dist/web/photobridge-public-design-v583.js');
for (const needle of [
  'pb602MobilePickerBackdrop',
  'pb602MobilePickerChoice',
  'interceptNativeAlbumSelect',
  'openMobileAlbumPicker',
  'pb602AlbumFilterRow',
  'هر گروه در یک ردیف',
  'syncInstagramPortraitEditor',
  "selectedAlbumGroup()==='instagram'"
]) if (!publicDesign583.includes(needle)) fail(`v602 album mobile UX fix missing: ${needle}`);
if (!webJs.includes('screen.orientation') || !webJs.includes('Ct?"portrait":"landscape"')) fail('v602/v686 deployed bundle must keep explicit mobile orientation support for Instagram/Album');
if (!publicDesignLoaded || !html.includes('/assets/index-UIRefine-v655.js')) fail('v602 cache-busted public design runtime/bundle are not loaded');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v602 server startup version missing');

// v603: animated album sheets + compact filter icon + compact Instagram size label.
const publicDesign584 = readText('dist/web/photobridge-public-design-v650.js');
for (const needle of [
  'pb603BackdropIn',
  'pb603SheetUp',
  'pb603FilterIcon',
  'pb603FilterIconMode',
  'pb603FilterDot',
  'pb603InstagramSize',
  'فیلتر مدل‌ها'
]) if (!publicDesign584.includes(needle)) fail(`v603 album mobile polish missing: ${needle}`);
if (!publicDesignLoaded) fail('v603 public design runtime is not loaded by index.html');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v603 server startup version missing');

// v604: role-aware authenticated mobile dock + centered mobile brand + relocated album controls + reverse-close sheets.
for (const needle of [
  'authenticatedPortalActive',
  '.labRoleWorkspace,.labMobileUtilityRail,.photographerBottomAppNav,.photographerMobileUtilityRail',
  "transform:translate(-50%,-50%)!important",
  'font-size:9px!important',
  'width:25px!important;height:25px!important',
  'width:22px!important;height:22px!important'
]) if (!publicNav584.includes(needle)) fail(`v604 role/mobile navigation polish missing: ${needle}`);
for (const needle of [
  'pb604BackdropOut',
  'pb604SheetDown',
  'installAlbumOutsideCloseAnimation',
  'syncAlbumMobileControlPlacement',
  'data-pb604-filter-proxy',
  'data-pb604-toolbar-proxy',
  'closeManagedBackdrop',
  "top.classList.add('albumDesignMobilePickerButtons')",
  'decorateAlbumFilters();syncAlbumMobileControlPlacement()'
]) if (!publicDesign584.includes(needle)) fail(`v604 album runtime polish missing: ${needle}`);
for (const needle of [
  'PhotoBridge v0.17.604 — album mobile control placement',
  '.albumDesignModelViewToolbar',
  '.pb604SourceGridToggle',
  'grid-template-columns:minmax(0,1fr) minmax(0,1fr) 40px!important',
  'font-size:14.5px!important',
  'font:850 10.4px/1.35 Vazirmatn,Tahoma,Arial,sans-serif!important'
]) if (!webCss.includes(needle)) fail(`v604 active CSS polish missing: ${needle}`);
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v604 server startup version missing');



// v605: instant role switch + lab bottom dock + common dock geometry + retouch render recovery.
for (const needle of [
  'pbAuthenticatedLabPortal',
  'pbAuthenticatedPhotographerPortal',
  'photobridge-auth-session-changed',
  'PB605RenderBoundary',
  'PhotoBridge render recovery v0.17.605'
]) if (!webJs.includes(needle)) fail(`v605 deployed bundle fix missing: ${needle}`);
for (const needle of [
  'PhotoBridge v0.17.605 — one mobile dock geometry',
  '.labSingleHeader .labHeaderNav.roleHeaderPrimary{display:none!important}',
  '.labMobileUtilityRail.mobileRoleUtilityRailGrouped',
  'height:52px!important',
  'padding:7px 8px calc(7px + env(safe-area-inset-bottom,0px))!important'
]) if (!webCss.includes(needle)) fail(`v605 dock CSS missing: ${needle}`);
if (!publicNav584.includes('v605: exact public dock geometry parity')) fail('v605 public dock parity override is missing');
if (webJs.includes('t==="lab"?".unifiedRoleHeader, .labMobileUtilityRail"')) fail('v605 chat dock still measures the lab bottom navigation as a header');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v605 server startup version missing');
const currentRuntime614 = html.includes('/assets/index-UIRefine-v655.js?v=689') && html.includes('/assets/index-UIRefine-v586.css?v=673') && html.includes('/photobridge-public-nav-v625.js?v=659') && html.includes('/photobridge-public-design-v650.js?v=687') && html.includes('/photobridge-retouch-v595.js?v=615');
if (!currentRuntime614) fail('current v614 cache-busted runtime set is missing');


// v606: retouch real route + photographer-parity lab dock + corrected mobile wordmark/filter placement.
for (const needle of [
  'labBottomAppNavGrid',
  'photographerBottomNavIcon labArchive',
  'photographerBottomNavIcon labFinance',
  'p=location.pathname==="/ai"||location.pathname==="/retouch-photo"'
]) if (!webJs.includes(needle)) fail(`v606 deployed bundle fix missing: ${needle}`);
for (const needle of [
  'PhotoBridge v0.17.606 — final mobile alignment',
  '.labMobileUtilityRail.labBottomAppNav',
  'grid-template-columns:minmax(0,1fr) minmax(0,1fr) 36px!important',
  'height:36px!important'
]) if (!webCss.includes(needle)) fail(`v606 active CSS fix missing: ${needle}`);
if (!publicNav584.includes('v606: keep the logo in its original left slot; center only the PhotoBridge wordmark')) fail('v606 mobile brand placement missing');

// v607: remove the root nav observer that regressed /ai and restore the known-good v595 retouch runtime.
if (publicNav584.includes('installRoleDockObserver') || publicNav584.includes('roleDockObserver')) fail('v607 root role-dock MutationObserver regression is still present');
if (!publicNav584.includes('photobridge-auth-session-changed')) fail('v607 event-driven instant role dock sync is missing');
if (retouchRuntime593.includes('PB605InstallRetouchWhiteScreenGuard') || retouchRuntime593.includes('PB606InstallRetouchWhiteScreenGuard')) fail('v607 experimental retouch white-screen guards were not rolled back');
if (!retouchRuntime593.includes('new MutationObserver(()=>scheduleEnhance(180))')) fail('v607 stable retouch enhancer runtime is missing');



// v608: isolate /ai on the last known-good v603 main runtime; keep newer bundle everywhere else.
const retouchStable608 = 'dist/web/assets/index-UIRefine-v602-retouch-stable-v608.js';
const retouchWatchdog608 = 'dist/web/photobridge-retouch-watchdog-v608.js';
if (!fs.existsSync(retouchStable608)) fail('v608 stable retouch bundle is missing');
if (fs.readFileSync(retouchStable608).toString('hex').slice(0,64) === '') fail('v608 stable retouch bundle is empty');
if (!currentRuntime614 && (!html.includes("location.pathname==='/ai'") || !html.includes('index-UIRefine-v602-retouch-stable-v608.js'))) fail('v608 /ai stable runtime selector is missing');
if (!fs.existsSync(retouchWatchdog608)) fail('v608 retouch watchdog is missing');
const retouchWatchdogText608 = readText(retouchWatchdog608);
for (const needle of ['pb608RetouchBootRecovery','unhandledrejection','publicAiPage']) if (!retouchWatchdogText608.includes(needle)) fail(`v608 retouch watchdog missing: ${needle}`);
if (!publicNav584.includes('left:11px!important;top:50%!important;transform:translateY(-50%)!important')) fail('v608 mobile header logo/wordmark geometry missing');


// v609: mobile /ai viewport lock + scrolled hamburger contrast/scale + no click-through on closing album sheets.
const publicDesign609 = readText('dist/web/photobridge-public-design-v650.js');
for (const needle of [
  'pbAiViewportLock',
  'syncRouteViewportClass',
  'overscroll-behavior-x:none',
  'pbMobileMenuGlyph',
  '-webkit-text-fill-color:#fff!important',
  'font-size:10.6px!important'
]) if (!publicNav584.includes(needle)) fail(`v609 mobile AI/header polish missing: ${needle}`);
for (const needle of [
  'pb603Closing{animation:pb604BackdropOut .22s ease-in both!important;pointer-events:auto!important;touch-action:none!important}'
]) if (!publicDesign609.includes(needle)) fail(`v609 album close-toggle guard missing: ${needle}`);
if (!html.includes('/photobridge-public-nav-v625.js?v=659') || !html.includes('/photobridge-public-design-v650.js?v=687') || !html.includes('/photobridge-retouch-watchdog-v609.js?v=615')) fail('v614 public runtime references are missing');
if (html.includes('index-UIRefine-v602-retouch-stable-v608.js')) fail('v609 still routes /ai through the obsolete separate v608 bundle');


// v610: lab bottom navigation copy — album becomes binding.
if (!webJs.includes('"aria-label":"صحافی آلبوم"') || !webJs.includes('e.jsx("em",{children:"صحافی"})')) fail('v610 lab bottom dock binding label is missing');
if (!html.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v614 main bundle cache-bust is missing');


// v611: mobile album-design is admin-only; PSD typography import remains present.
// The exact v611 stack-role markers were intentionally superseded by v612's deterministic order rule.
for (const needle of [
  'typographyLayers,',
  'psdTypographyCount',
  'استخراج‌شده از PSD',
  'طراحی آلبوم برای حساب‌های عکاسی به‌زودی فعال می‌شود. این بخش کاملاً مستقل از چاپ و انتخاب لابراتوار است.'
]) if (!webJs.includes(needle)) fail(`v611 retained album/PSD capability missing: ${needle}`);
if (!html.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v614 cache bust missing');


// v612 capability retained under v614: admin-defined top-N Typography and deterministic PSD roles.
for (const needle of [
  'async function Uj(t,a=!0,PB612Count=1,PB613Overlay=!1)',
  'تعداد Typography',
  'psdTypographyCount:d?PB612Count:0',
  'typographyCount:typography.length'
]) if (!webJs.includes(needle)) fail(`v612 retained PSD stack/count capability missing: ${needle}`);
if (!html.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v614 cache bust missing');

// v613: compact admin PSD workflow + optional fixed foreground + native PSD geometry + direct Typography picker.
for (const needle of [
  'PB613Overlay',
  'foregroundOverlay:PB613FgPayload',
  'removeForegroundOverlay:!PB613Overlay',
  'pb613TypographyPopup',
  'لایه ثابت روی عکس‌ها',
  'psd_photo_layer_missing'
]) if (!webJs.includes(needle)) fail(`v613 PSD/admin runtime fix missing: ${needle}`);
for (const needle of [
  'PhotoBridge v0.17.613 — compact admin album PSD workflow',
  '.albumTemplateDetectedText.pb613TypographyPopup',
  '.pbFixedForegroundOverlay',
  '.albumDesignCheckoutAdmin{display:none!important}'
]) if (!webCss.includes(needle)) fail(`v613 compact PSD CSS missing: ${needle}`);
if (webJs.includes('نسبت PSD با قالب') || webJs.includes('نسبت فایل با قالب')) fail('v613 PSD ratio/size warning still present');
if (!html.includes('/assets/index-UIRefine-v655.js?v=689') || !html.includes('/assets/index-UIRefine-v586.css?v=673')) fail('v614 cache bust missing');


// v614: admin album-design render crash regression guard.
const adminAlbumStart614 = webJs.indexOf('function yb()');
const adminAlbumEnd614 = adminAlbumStart614 >= 0 ? webJs.indexOf('function ', adminAlbumStart614 + 12) : -1;
if (adminAlbumStart614 < 0 || adminAlbumEnd614 < 0) fail('v614 admin album component boundary not found');
const adminAlbumChunk614 = webJs.slice(adminAlbumStart614, adminAlbumEnd614);
if (/\bHa\b/.test(adminAlbumChunk614)) fail('v614 admin album still contains undefined Ha render handler');
const closeCleanup614 = 'setPB613FgFile(null),ce(null),st(null),Xe(""),Z(!1)';
if ((adminAlbumChunk614.split(closeCleanup614).length - 1) < 2) fail('v614 admin album close cleanup handlers missing');
if (!html.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v614 main bundle cache-bust missing');


// v615: defer physical album size to final output + mobile legacy editor canvas-first workspace.
const albumOutput615Path = 'dist/web/photobridge-album-output-v615.js';
if (!fs.existsSync(albumOutput615Path)) fail('v615 album output runtime is missing');
const albumOutput615 = readText(albumOutput615Path);
for (const needle of [
  'pb615AlbumPhysicalSizeDeferred',
  'pb615CheckoutSizePicker',
  'سایز خروجی چاپ',
  'pb615LegacyMobileEditor',
  "classic:{label:'آلبوم کلاسیک'",
  "panorama:{label:'آلبوم کشیده'"
]) if (!albumOutput615.includes(needle)) fail(`v615 album sizing/mobile runtime missing: ${needle}`);
for (const needle of [
  'PhotoBridge v0.17.615',
  '.pb615AlbumPhysicalSizeDeferred .albumDesignSizeButtons',
  '.pb615CheckoutSizePicker',
  '.albumDesignFullscreenModal.pb615LegacyMobileEditor:not(.minimized)',
  '.albumDesignEditorBottomBar{display:none!important}'
]) if (!webCss.includes(needle)) fail(`v615 album sizing/mobile CSS missing: ${needle}`);
if (!html.includes('/photobridge-album-output-v615.js?v=615')) fail('v615 album output runtime reference is missing');
if (!html.includes('/assets/index-UIRefine-v655.js?v=689') || !html.includes('/assets/index-UIRefine-v586.css?v=673')) fail('v615 asset cache-bust is missing');

// v0.17.616 — admin-only equipment rental pilot.
const rentalPage616 = readText('dist/api/admin-equipment-rental.html');
const rentalNav616 = readText('dist/web/photobridge-admin-rental-v616.js');
const rentalMigration616 = readText('migrations/114_equipment_rental_pilot.sql');
for (const needle of [
  '/api/admin/equipment-rental/overview',
  '/api/admin/equipment-rental/availability',
  '/api/admin/equipment-rental/bookings',
  'equipmentRentalAvailability',
  'serveAdminEquipmentRentalPage',
  "platform_admin.equipment_rental_booking_create"
]) if (!serverText.includes(needle)) fail(`v616 equipment-rental backend is missing: ${needle}`);
for (const needle of [
  'equipment_rental_shops',
  'equipment_rental_items',
  'equipment_rental_bookings',
  'equipment_rental_booking_items'
]) if (!rentalMigration616.includes(needle)) fail(`v616 equipment-rental migration is missing: ${needle}`);
if (!(rentalPage616.includes('آفیش آنلاین تجهیزات') || rentalPage616.includes('شبکه اجاره تجهیزات')) || !(rentalPage616.includes('تستی · فقط ادمین') || rentalPage616.includes('مدیریت شبکه'))) fail('v616/v617 admin rental page is missing');
if (!rentalNav616.includes('اجاره تجهیزات · تستی') || !html.includes('/photobridge-admin-rental-v616.js?v=616')) fail('v616 admin rental discovery link is missing');

// v0.17.617/v0.17.618 — public equipment-rental network plus unified auth/location/invite scoping.
const rentalMigration617Path = 'migrations/115_equipment_rental_network.sql';
const rentalMigration618Path = 'migrations/116_equipment_rental_location_invite_scope.sql';
const rentalLanding617Path = 'dist/api/equipment-rental-landing.html';
const rentalRegister617Path = 'dist/api/equipment-rental-register.html';
const rentalPortal617Path = 'dist/api/equipment-rental-portal.html';
const rentalBook617Path = 'dist/api/equipment-rental-book.html';
const rentalIntegration618Path = 'dist/web/photobridge-equipment-rental-v618.js';
for (const f of [rentalMigration617Path,rentalMigration618Path,rentalLanding617Path,rentalRegister617Path,rentalPortal617Path,rentalBook617Path,rentalIntegration618Path]) if (!fs.existsSync(f)) fail(`v618 equipment-rental network file missing: ${f}`);
const rentalMigration617 = readText(rentalMigration617Path);
const rentalMigration618 = readText(rentalMigration618Path);
const rentalPortal618 = readText(rentalPortal617Path);
const rentalBook618 = readText(rentalBook617Path);
const rentalRegister618 = readText(rentalRegister617Path);
const rentalIntegration618 = readText(rentalIntegration618Path);
for (const needle of ['equipment_rental_shop_memberships','equipment_rental_subscription_plans','equipment_rental_subscription_renewals','equipment_rental_trial']) if (!rentalMigration617.includes(needle)) fail(`v617 migration capability missing: ${needle}`);
for (const needle of ['location_lat','location_lng','issuer_rental_shop_id','equipment_rental_photographer_scopes',"'rental'"]) if (!rentalMigration618.includes(needle)) fail(`v618 rental invite/location migration capability missing: ${needle}`);
for (const needle of [
  '/api/public/equipment-rental-trial',
  '/api/public/equipment-rental-trial/verify',
  '/api/public/iran-locations',
  '/api/auth/rental-login',
  '/api/rental/overview',
  '/api/rental/photographer-invites',
  '/api/rental/photographer-invites/send-sms',
  '/api/rental/subscription/renewals',
  '/api/customer/equipment-rental/shops',
  '/api/customer/equipment-rental/bookings',
  'equipmentRentalPhotographerCanAccessShop',
  '/api/admin/equipment-rental/subscription-plans',
  "'equipment-rental-portal.html'",
  "'equipment-rental-book.html'"
]) if (!serverText.includes(needle)) fail(`v618 equipment-rental backend/route missing: ${needle}`);
for (const needle of ['۳۰ روز رایگان','/api/public/equipment-rental-trial','/api/public/iran-locations','locationLat','locationLng','موقعیت دقیق فروشگاه','trialShell','Vazirmatn']) if (!rentalRegister618.includes(needle)) fail(`v618 rental registration page missing: ${needle}`);
for (const needle of ['/api/auth/rental-login','unifiedLoginShell','unifiedLoginBrand','Vazirmatn','/api/rental/photographer-invites','/api/rental/photographer-invites/send-sms','دعوت عکاس به فروشگاه']) if (!rentalPortal618.includes(needle)) fail(`v618 rental shop portal missing: ${needle}`);
for (const needle of ['/api/customer/equipment-rental/shops','/api/customer/equipment-rental/availability','/api/customer/equipment-rental/bookings']) if (!rentalBook618.includes(needle)) fail(`v618 photographer rental booking page missing: ${needle}`);
for (const needle of ['/equipment-rental','/equipment-rental/book','pbRental618MobileBtn','photographerBottomAppNavGrid:not(.labBottomAppNavGrid)','rentalInviteCopy']) if (!rentalIntegration618.includes(needle)) fail(`v618 rental discovery integration missing: ${needle}`);
if (!html.includes('/photobridge-equipment-rental-v685.js?v=727')) fail('latest rental integration runtime is not loaded by dist web index');
const sourceIndex618 = readText('apps/web/index.html');
if (!sourceIndex618.includes('/photobridge-equipment-rental-v685.js?v=727')) fail('latest rental integration runtime is not loaded by source web index');
const adminRental617 = readText('dist/api/admin-equipment-rental.html');
for (const needle of ['اشتراک و تعرفه','subscription-plans','subscription-renewals']) if (!adminRental617.includes(needle)) fail(`v617 admin rental subscription UI missing: ${needle}`);
// v0.17.619 — rental registration map parity + platform-admin test-account reuse.
const rentalRegister619 = readText('dist/api/equipment-rental-register.html');
for (const needle of ['rentalMapViewport','rentalMapMarker','tile.openstreetmap.org','/api/public/location-search','mapZoomIn','موقعیت فعلی','شماره موبایل ادمین PhotoBridge هم قابل استفاده است']) if (!rentalRegister619.includes(needle)) fail(`v619 rental map/admin-test UI missing: ${needle}`);
for (const needle of ['credentialMatches','adminMatches','platform-admin credential','existing_account_password_invalid']) if (!serverText.includes(needle)) fail(`v619 admin-number rental registration backend missing: ${needle}`);

// v620 equipment-rental inventory/accounting safeguards.
for (const needle of [
  '/api/rental/item-image/presign',
  'rental_item_create_failed',
  '/api/rental/accounting',
  'equipmentRentalMoney',
  'equipment_rental_accounting_entries',
  'previousDebt'
]) if (!serverText.includes(needle)) fail(`v620 equipment rental backend is missing: ${needle}`);
const rentalPortal = readText('dist/api/equipment-rental-portal.html');
for (const needle of ['عکس تجهیز','moneyInput','jalaliDateInput','بدهی قبلی','data-tab="accounting"','/api/rental/accounting/entries']) if (!rentalPortal.includes(needle)) fail(`v620 rental portal UI is missing: ${needle}`);
if (!fs.existsSync('migrations/117_equipment_rental_inventory_accounting.sql')) fail('v620 equipment rental migration is missing');


// v622: mobile public menu groups auth/membership, informational links are plain rows, and bottom dock uses Instagram instead of photographer/lab login.
const publicNav622 = readText('dist/web/photobridge-public-nav-v625.js');
for (const needle of [
  "['/photographer','ورود عکاس'],['/lab','ورود لابراتوار'],['/rental','ورود فروشگاه']",
  "['/ai','عضویت آزاد'],['/trial','عضویت لابراتوار'],['/equipment-rental/register','عضویت فروشگاه']",
  'pbMobileInfoLinks',
  'خدمات و راهنما',
  "['/instagram-post-design','اینستاگرام','instagram']",
  "if(kind==='instagram')return '<svg",
  'grid-template-columns:repeat(4,minmax(0,1fr))'
]) if (!publicNav622.includes(needle)) fail(`v622 mobile public navigation missing: ${needle}`);
if (publicNav622.includes("['/photographer','ورود عکاس','photographer']") || publicNav622.includes("['/lab','ورود لابراتوار','lab']")) fail('v622 photographer/lab login still exists in mobile bottom dock');
if (!html.includes('/photobridge-public-nav-v625.js?v=659')) fail('v622 public nav cache-bust is missing from dist index');
const sourceIndex622 = readText('apps/web/index.html');
if (!sourceIndex622.includes('/photobridge-public-nav-v625.js?v=659')) fail('v622 public nav cache-bust is missing from source index');

// v624: hard-fix public mobile navigation must use a new filename and cover rental public pages.
const publicNav624 = readText('dist/web/photobridge-public-nav-v625.js');
for (const needle of [
  "pbMobileLoginGroup",
  "['/photographer','ورود عکاس']",
  "['/lab','ورود لابراتوار']",
  "['/rental','ورود فروشگاه']",
  "pbMobileMembershipGroup",
  "عضویت آزاد",
  "عضویت لابراتوار",
  "عضویت فروشگاه",
  "pbMobileInfoLinks",
  "['/instagram-post-design','اینستاگرام','instagram']",
  "path.indexOf('/equipment-rental')===0",
  "cleanupLegacyPublicNav"
]) if (!publicNav624.includes(needle)) fail(`v624 public navigation missing: ${needle}`);
if (!html.includes('/photobridge-public-nav-v625.js?v=659')) fail('v624 dist index does not load cache-safe nav runtime');
const sourceIndex624 = readText('apps/web/index.html');
if (!sourceIndex624.includes('/photobridge-public-nav-v625.js?v=659')) fail('v624 source index does not load cache-safe nav runtime');
for (const page of ['dist/api/equipment-rental-landing.html']) {
  const txt=readText(page);
  if (!txt.includes('/photobridge-public-nav-v625.js?v=659')) fail(`v624 rental public page missing canonical mobile nav: ${page}`);
}
if (fs.existsSync('dist/web/photobridge-public-nav-v609.js')) fail('v624 stale v609 public nav runtime still ships in dist/web');


// v624: animated left-arrow mobile groups + rental-store desktop polish and Persian calendars.
const publicNav624Final = readText('dist/web/photobridge-public-nav-v625.js');
for (const needle of ['pbMobileMenuGroupToggle','pbMobileMenuGroupArrow','group.classList.toggle(\'expanded\'','transform:rotate(-90deg)','max-height .28s ease']) {
  if (!publicNav624Final.includes(needle)) fail(`v624 animated mobile menu group missing: ${needle}`);
}
const rentalPortal624 = readText('dist/api/equipment-rental-portal.html');
for (const needle of ['equipmentImagePicker','itemsCategoryFilters','bookingCategoryFilters','jalaliCalendarPopover','formActionCell','issuerRentalShopName']) {
  if (needle === 'issuerRentalShopName') continue;
  if (!rentalPortal624.includes(needle)) fail(`v624 rental portal polish missing: ${needle}`);
}
const rentalBook624 = readText('dist/api/equipment-rental-book.html');
for (const needle of ['itemCategoryFilters','jalaliDateInput','jalaliInputToIso']) if (!rentalBook624.includes(needle)) fail(`v624 rental booking page missing: ${needle}`);
for (const needle of ['issuerRentalShopName','کد تأیید اتصال حساب شما به فروشگاه تجهیزات','کد تأیید عضویت و اتصال شما به فروشگاه تجهیزات','PhotoBridge 0.17.689']) if (!serverText.includes(needle)) fail(`v624 rental SMS/server polish missing: ${needle}`);
const pkg624 = JSON.parse(readText('package.json'));
if (pkg624.version !== '0.17.689') fail('v626 package version mismatch');
for (const needle of ['clip-path:inset(0 0 100% 0 round 16px)','scaleY(.78)','margin-right:auto!important','photobridge-public-nav-v625.js?v=659']) if (!(publicNav624Final.includes(needle) || html.includes(needle))) fail(`v625 mobile menu motion/arrow polish missing: ${needle}`);
for (const needle of ['shopLocationField','rentalMapViewport','locationLat','locationLng','locationAddress','padding-top:18px','مشخصات و لوکیشن ذخیره شد.']) if (!rentalPortal624.includes(needle)) fail(`v625 rental store settings/alignment missing: ${needle}`);
for (const needle of ['location_lat=$11','location_lng=$12','location_address=$13','invalid_map_location','PhotoBridge 0.17.689']) if (!serverText.includes(needle)) fail(`v625 rental store location backend missing: ${needle}`);


// v626: exact rental form alignment, integrated item-image preview, profile map placement, and mobile rental navigation parity.
const rentalPortal626 = readText('dist/api/equipment-rental-portal.html');
for (const needle of [
  'PhotoBridge v0.17.626',
  'padding-top:22px!important',
  'settingsAddressField',
  'itemImagePreview" class="equipmentImagePicker',
  'data-rental-bottom-tab="items"',
  'rentalMobileBottomNav',
  'rentalScrolled',
  'rentalMobileMenuGlyph',
  'syncRentalHeaderScroll',
  'اجاره</span>',
  'آفیش‌ها</span>',
  'عکاس‌ها</span>',
  'حسابداری</span>'
]) if (!rentalPortal626.includes(needle)) fail(`v626 rental portal polish missing: ${needle}`);
const pkg626 = JSON.parse(readText('package.json'));
if (pkg626.version !== '0.17.689') fail('v626 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v626 server startup version missing');

// v627: photographer booking approval gate + rental SMS wallet/notifications + final desktop button alignment.
const rentalPortal627 = readText('dist/api/equipment-rental-portal.html');
for (const needle of [
  'PhotoBridge v0.17.628',
  'padding-top:22px!important',
  'data-rental-desktop-tab="sms"',
  'id="smsBalance"',
  '/api/rental/sms-settings',
  '/api/rental/sms-wallet/zibal/request',
  'در انتظار تأیید فروشگاه',
  "bookingStatus('${b.id}','reserved')"
]) if (!rentalPortal627.includes(needle)) fail(`v627 rental portal approval/SMS polish missing: ${needle}`);
const rentalBook627 = readText('dist/api/equipment-rental-book.html');
for (const needle of ['pending_approval','منتظر پذیرش فروشگاه','لغو درخواست','setInterval']) if (!rentalBook627.includes(needle)) fail(`v627 customer rental approval UI missing: ${needle}`);
for (const needle of ["initialStatus: 'pending_approval'",'/api/rental/sms-settings','equipment_rental_sms_wallets','equipmentRentalSmsAutoAllowed','rental_booking_approved','PhotoBridge 0.17.689']) if (!serverText.includes(needle)) fail(`v627 rental approval/SMS backend missing: ${needle}`);
if (!fs.existsSync('migrations/118_equipment_rental_approval_sms_wallet.sql')) fail('v627 migration 118 missing');
const migration118 = readText('migrations/118_equipment_rental_approval_sms_wallet.sql');
for (const needle of ['pending_approval','equipment_rental_sms_wallets','equipment_rental_sms_settings',"'rental_shop'"]) if (!migration118.includes(needle)) fail(`v627 migration 118 incomplete: ${needle}`);
const pkg627 = JSON.parse(readText('package.json'));
if (pkg627.version !== '0.17.689') fail('v627 package version mismatch');



// v628: strict pending approval semantics + collaboration requests + invoices/finance + photographer mobile rental dock.
const rentalPortal628 = readText('dist/api/equipment-rental-portal.html');
for (const needle of [
  'v0.17.628 — final desktop action baseline alignment',
  'padding-top:26px!important',
  'درخواست‌های همکاری عکاس‌ها',
  'پذیرش</button>',
  'reviewCollaboration',
  '/api/rental/collaboration-requests/'
]) if (!rentalPortal628.includes(needle)) fail(`v628 rental store UI missing: ${needle}`);
const rentalBook628 = readText('dist/api/equipment-rental-book.html');
for (const needle of [
  'storeHomeActions',
  'data-store-panel="equipmentPanel"',
  'data-store-panel="bookingsPanel"',
  'data-store-panel="financePanel"',
  'ارسال آفیش به معنی رزرو قطعی نیست',
  'تا آن زمان این درخواست از موجودی فروشگاه کم نمی‌کند',
  'درخواست همکاری',
  '/api/customer/equipment-rental/finance?shopId=',
  'invoice_number',
  'qtyWrap'
]) if (!rentalBook628.includes(needle)) fail(`v628 photographer rental UI missing: ${needle}`);
for (const needle of [
  'ensureEquipmentRentalV628Schema',
  'equipment_rental_collaboration_requests',
  'equipment_rental_invoices',
  'equipmentRentalEnsureInvoice',
  '/api/customer/equipment-rental/collaboration-requests',
  '/api/customer/equipment-rental/finance',
  'collaboration-requests',
  "b.status IN ('payment_pending','reserved','picked_up')",
  'PhotoBridge 0.17.689'
]) if (!serverText.includes(needle)) fail(`v628 rental backend missing: ${needle}`);
if (!fs.existsSync('migrations/119_equipment_rental_collaboration_invoices.sql')) fail('v628 migration 119 missing');
const migration119 = readText('migrations/119_equipment_rental_collaboration_invoices.sql');
for (const needle of ['equipment_rental_collaboration_requests','equipment_rental_invoices','pending','invoice_number']) if (!migration119.includes(needle)) fail(`v628 migration 119 incomplete: ${needle}`);
const pkg628 = JSON.parse(readText('package.json'));
if (pkg628.version !== '0.17.689') fail('v628 package version mismatch');


// v633 photographer production navigation rollback: Print -> lab chooser, Album Design independent, no photographer rental shortcut.
const rentalRuntime633 = readText('dist/web/photobridge-equipment-rental-v633.js');
if (!html.includes('/photobridge-equipment-rental-v685.js?v=727')) fail('v633 rental runtime is not loaded');
if (!webJs.includes('/photographer/labs?intent=print')) fail('v633 Print button does not open the photographer lab chooser');
if (!webJs.includes('/photographer/album-design')) fail('v633 Album Design direct route is missing');
if (webJs.includes('photographerShopEntry')) fail('v633 photographer Shop shortcut must stay hidden while rental is not production-ready');
if (!webJs.includes('فعال · ورود به چاپ') || !webJs.includes('ورود به چاپ')) fail('v633 active-lab Print re-entry is missing');
if (rentalRuntime633.includes('mountPhotographerShortcut') || rentalRuntime633.includes('document.body.appendChild(b)')) fail('v633 rental runtime still injects a photographer shop shortcut');

// v634 emergency maintenance mode + owner-only bypass.
const maintenanceMigration = readText('migrations/122_platform_maintenance_mode.sql');
const maintenanceUi = readText('dist/web/photobridge-admin-maintenance-v636.js');
if (!html.includes('/photobridge-admin-maintenance-v640.js')) fail('v640 admin maintenance control is not loaded');
if (!html.includes('/photobridge-maintenance-watch-v636.js')) fail('v636 live maintenance watcher is not loaded');
for (const needle of [
  "MAINTENANCE_MODE_SETTING_KEY = 'maintenance_mode'",
  'maintenancePrimaryAdminSession',
  'maintenancePageHtml',
  "url.pathname === '/api/admin/maintenance'",
  "error: 'maintenance_mode'"
]) if (!serverText.includes(needle)) fail(`v634 maintenance backend is missing: ${needle}`);
if (!maintenanceMigration.includes("'maintenance_mode'") || !maintenanceMigration.includes("'enabled', true")) fail('v634 maintenance migration must start enabled exactly once');
if (!maintenanceUi.includes('حالت به‌روزرسانی پنل‌ها') || !maintenanceUi.includes('/api/admin/maintenance')) fail('v636 admin maintenance UI is missing');


// v635 maintenance hard lock: an admin cookie alone must never unlock lab/customer portals.
for (const needle of [
  'maintenanceAdminRequestAllowed',
  "url.searchParams.get('maintenance_preview') === '1'",
  'isAdminImpersonationRequest(req)',
  '/lab?maintenance_preview=1#${hash}',
  '/photographer?maintenance_preview=1#${hash}'
]) if (!serverText.includes(needle)) fail(`v635 maintenance hard-lock missing: ${needle}`);
if (!maintenanceUi.includes('صفحه اصلی و بخش‌های عمومی باز می‌مانند') || !maintenanceUi.includes('pbMaintenanceAdminControlV636Position')) fail('v636 scoped/draggable maintenance UI missing');

// v636 scoped maintenance + live role lock + shared admin credential for test roles.
const maintenanceWatch636 = readText('dist/web/photobridge-maintenance-watch-v636.js');
for (const needle of ['maintenanceProtectedRequest','maintenancePortalBypassSession','/api/maintenance/status',"scope: 'role_portals'",'existingUserId: existing?.id || null','lab_admin_already_exists']) if (!serverText.includes(needle)) fail(`v636 scoped maintenance/test-role backend missing: ${needle}`);
for (const needle of ['setInterval(check,2000)','x-photobridge-maintenance-preview','location.reload()']) if (!maintenanceWatch636.includes(needle)) fail(`v636 live maintenance watcher missing: ${needle}`);
if (!rentalPortal630.includes('photobridge-maintenance-watch-v636.js?v=636')) fail('v636 rental live maintenance watcher is not loaded');
if (!serverText.includes('font-family:Vazirmatn,Vazir,Tahoma,Arial,sans-serif')) fail('v636 maintenance page Vazir/Vazirmatn font stack missing');

// v638 photographer identity + relationship isolation.
const migration123 = readText('migrations/123_photographer_identity_relationship_isolation.sql');
for (const needle of [
  'CREATE TABLE IF NOT EXISTS photographer_profiles',
  'photobridge-standalone-photographers',
  'Legacy admin photographer suspension',
  'photographer_enabled=false'
]) if (!migration123.includes(needle)) fail(`v638 photographer isolation migration missing: ${needle}`);
for (const needle of [
  'photographerIdentityByMobile',
  'ensurePhotographerProfile',
  'ensureStandalonePhotographerMembership',
  'globalPhotographerAccessPreserved: true',
  'photographerCredentialOnly: true',
  'sharedIdentityPreserved: true',
  'UPDATE users SET photographer_enabled=$2,updated_at=now()',
  'DELETE FROM photographer_profiles WHERE user_id=$1'
]) if (!serverText.includes(needle)) fail(`v638 photographer identity/relationship backend missing: ${needle}`);
if (!webJs.includes('اگر این شماره قبلاً برای روتوش یا بخش عمومی استفاده شده باشد، سوابق آن دست‌نخورده می‌ماند')) fail('v638 invite role-isolation explanation missing');
if (webJs.includes('این نام از اطلاعات ثبت‌شده لابراتوار آمده و در این مرحله قابل تغییر نیست.')) fail('v638 photographer/studio name is still incorrectly locked to lab invite target name');
const pkg638 = JSON.parse(readText('package.json'));
if (pkg638.version !== '0.17.689') fail('v638 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v638 server startup version missing');



// v639 unified login + public store entry + dedicated public design modes.
const publicDesign639 = readText('dist/web/photobridge-public-design-v650.js');
const webCss639 = readText('dist/web/assets/index-UIRefine-v586.css');
const rentalPortal639 = readText('dist/api/equipment-rental-portal.html');
for (const needle of [
  'unifiedLoginPage',
  'unifiedLoginBrand',
  '/photobridge-favicon-v0140.png',
  'ورود فروشگاه',
  'storeLoginNav',
  'publicAudienceCard store'
]) if (!webJs.includes(needle)) fail(`v639 unified login/store entry missing: ${needle}`);
for (const needle of [
  'html:has(.unifiedLoginPage:not(.hidden))',
  '.unifiedLoginCard',
  '.storeLoginNav',
  '.publicAudienceCard.store'
]) if (!webCss639.includes(needle)) fail(`v639 login/store CSS missing: ${needle}`);
for (const needle of [
  'ورود فروشگاه تجهیزات',
  'unifiedLoginBrand',
  '/photobridge-favicon-v0140.png',
  '/assets/index-UIRefine-v586.css?v=673'
]) if (!rentalPortal639.includes(needle)) fail(`v639 rental login parity missing: ${needle}`);
for (const needle of [
  "if(path==='/slideshow-design/start'){location.replace('/album-design');return;}",
  "else if(which==='instagram')rows=rows.filter(function(t){return readKind(t)==='instagram'});",
  "service='+encodeURIComponent(mode)",
  "desktopGroups.style.display='none'"
]) if (!publicDesign639.includes(needle)) fail(`v639 dedicated public design runtime missing: ${needle}`);
if (!serverText.includes("else if(service==='instagram') templates=all.filter((x)=>kindOf(x)==='instagram');")) fail('v639 public Instagram API still mixes slideshow templates');
if (!html.includes('/photobridge-public-design-v650.js?v=687') || !html.includes('/assets/index-UIRefine-v655.js?v=689') || !html.includes('/assets/index-UIRefine-v586.css?v=673')) fail('v639 cache-busting refs missing');
const pkg639 = JSON.parse(readText('package.json'));
if (pkg639.version !== '0.17.689') fail('v639 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v639 server startup version missing');

// v640 compact maintenance + admin album typography/category workflow.
const maintenanceUi640 = readText('dist/web/photobridge-admin-maintenance-v640.js');
const adminAlbum644 = readText('dist/web/photobridge-admin-album-v644.js');
if (!html.includes('/photobridge-admin-maintenance-v640.js?v=640')) fail('v640 compact maintenance control is not loaded');
if (!html.includes('/photobridge-admin-album-v646.js?v=662')) fail('v644 admin album enhancement is not loaded');
for (const needle of ['pbmMini','pbmMinimize','pbMaintenanceAdminControlV640Minimized','کنترل به‌روزرسانی']) if (!maintenanceUi640.includes(needle)) fail(`v640 minimized maintenance UI missing: ${needle}`);
for (const needle of ['آلبوم معمولی','آلبوم کشیده','اینستاگرام','باز کردن بانک Typography','albumPsdTypographyCount','openTypographyPicker(article)','clearStaleServiceWorker','childList']) if (!adminAlbum644.includes(needle)) fail(`v640 admin album/typography workflow missing: ${needle}`);
const pkg640 = JSON.parse(readText('package.json'));
if (pkg640.version !== '0.17.689') fail('v640 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v640 server startup version missing');


// v642 manual offline-print invoice + album cover quote-at-invoice.
const manualInvoice643 = readText('dist/web/photobridge-manual-invoice-v643.js');
for (const needle of ['ثبت فاکتور دستی','/api/lab/invoices/manual','customerMobile','paidAmount','ردیف‌های فاکتور']) if (!manualInvoice643.includes(needle)) fail(`v642 manual-invoice UI missing: ${needle}`);
for (const needle of ["url.pathname === '/api/lab/invoices/manual'","'manual_invoice'","missingCoverTariff","missing_cover_tariff","finance_customers AS"]) if (!serverText.includes(needle)) fail(`v642 manual-invoice/album-pricing backend missing: ${needle}`);
if (!html.includes('/photobridge-manual-invoice-v643.js?v=643')) fail('v643 manual invoice runtime is not loaded');
const pkg642 = JSON.parse(readText('package.json'));
if (pkg642.version !== '0.17.689') fail('v642 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v642 server startup version missing');


// v643 Instagram admin upload + RTL PSD placement + tariff-backed manual invoice rows + temporary batch album hide.
const adminAlbumV644 = readText('dist/web/photobridge-admin-album-v644.js');
const manualInvoiceV643 = readText('dist/web/photobridge-manual-invoice-v643.js');
const albumDesignUiV643 = readText('dist/web/photobridge-album-design-ui-v643.js');
for (const needle of [
  'nativeKindButtons(root)',
  'pb644NativeInstagram',
  'pb644StretchedChoice',
  'album.click()',
  'albumTemplatePsdOnlyStart',
  'albumTemplatePsdImport>label',
  'direction:rtl!important',
  'آلبوم معمولی',
  'آلبوم کشیده',
  'اینستاگرام'
]) if (!adminAlbumV644.includes(needle)) fail(`v644 native Instagram/RTL workflow missing: ${needle}`);
for (const needle of [
  '＋ ردیف چاپ',
  '＋ هزینه جانبی',
  '/api/lab/dashboard',
  'data-size',
  'data-paper',
  'data-price',
  "kind:'print'",
  "kind:'extra'"
]) if (!manualInvoiceV643.includes(needle)) fail(`v643 tariff-backed manual invoice UI missing: ${needle}`);
for (const needle of [
  '.albumProjectDock',
  'افزودن به آلبوم',
  'ذخیره تغییرات صفحه',
  'پروژه جدید',
  'slideshow'
]) if (!albumDesignUiV643.includes(needle)) fail(`v643 photographer album temporary batch/slideshow hide missing: ${needle}`);
for (const needle of [
  '/photobridge-admin-album-v646.js?v=662',
  '/photobridge-manual-invoice-v643.js?v=643',
  '/photobridge-mobile-design-flow-v685.js?v=688'
]) if (!html.includes(needle)) fail(`v643 runtime not loaded: ${needle}`);
if (!serverText.includes("manual_extra")) fail('v643 manual ancillary invoice backend kind missing');
const pkg643 = JSON.parse(readText('package.json'));
if (pkg643.version !== '0.17.689') fail('v643 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v643 server startup version missing');


// v645 admin Album/Instagram structure + dedicated photographer design UI.
const adminAlbumV645 = readText('dist/web/photobridge-admin-album-v645.js');
const albumDesignUiV645 = readText('dist/web/photobridge-album-design-ui-v645.js');
for (const needle of [
  'pb645AlbumCategoryRow',
  'آلبوم معمولی',
  'آلبوم کشیده',
  'اینستاگرام',
  'pb645PsdStart',
  'pb645PsdLayout',
  'pb645PsdPreview',
  'grid-template-columns:repeat(8,minmax(0,1fr))'
]) if (!adminAlbumV645.includes(needle)) fail(`v645 admin Album/Instagram/PSD/typography UI missing: ${needle}`);
for (const needle of [
  'photographer',
  'pb645InstagramOnly',
  'pb645AlbumOnly',
  '.albumProjectDock',
  'افزودن به آلبوم',
  'ذخیره تغییرات صفحه',
  'پروژه جدید',
  'slideshow'
]) if (!albumDesignUiV645.includes(needle)) fail(`v645 dedicated photographer design UI missing: ${needle}`);
for (const needle of [
  '/photobridge-admin-album-v646.js?v=662',
  '/photobridge-manual-invoice-v643.js?v=643',
  '/photobridge-mobile-design-flow-v685.js?v=688'
]) if (!html.includes(needle)) fail(`v645 runtime not loaded: ${needle}`);
const pkg645 = JSON.parse(readText('package.json'));
if (pkg645.version !== '0.17.689') fail('v645 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v645 server startup version missing');


// v646: native React Instagram admin mode + exact current DOM selectors for dedicated photographer UI.
const adminAlbumV646 = readText('dist/web/photobridge-admin-album-v646.js');
const albumDesignUiV646 = readText('dist/web/photobridge-album-design-ui-v646.js');
for (const needle of [
  'pb646NativeKindHolder',
  'آلبوم معمولی',
  'آلبوم کشیده',
  'repeat(8,minmax(0,1fr))',
  'pb646PsdPreview',
  'label:has(input[type=file])'
]) if (!adminAlbumV646.includes(needle)) fail(`v646 admin design structure missing: ${needle}`);
for (const needle of [
  '.albumDesignMobilePicker',
  'pb646ModelLabel',
  'pb646SizeLabel',
  '.albumDesignCatalogFilters>.pb599AlbumFilterButton',
  'افزودن به آلبوم|ذخیره تغییرات صفحه|پروژه جدید',
  'setNativeSelectValue(select,mode)'
]) if (!albumDesignUiV646.includes(needle)) fail(`v646 photographer dedicated UI missing: ${needle}`);
if (!webJs.includes('onClick:()=>Hn("instagram"),children:"اینستاگرام"')) fail('v646 compiled admin bundle does not expose native Instagram React mode');
if (!webJs.includes('onClick:()=>Hn("album"),children:"آلبوم"')) fail('v646 compiled admin bundle does not expose native Album React mode');
if (!webJs.includes('designKind:"instagram",orientation:"portrait",category:"اینستاگرام",width:1080,height:1350')) fail('v646 native Instagram state payload is missing');
for (const needle of [
  '/assets/index-UIRefine-v655.js?v=689',
  '/photobridge-admin-album-v646.js?v=662',
  '/photobridge-mobile-design-flow-v685.js?v=688'
]) if (!html.includes(needle)) fail(`v646 current runtime not loaded: ${needle}`);
const pkg646 = JSON.parse(readText('package.json'));
if (pkg646.version !== '0.17.689') fail('v646 package version mismatch');
if (!serverText.includes('PhotoBridge 0.17.689')) fail('v646 server startup version missing');


// v647: dedicated mobile Album/Instagram flow.
const mobileDesign647 = readText('dist/web/photobridge-mobile-design-flow-v650.js');
for (const needle of ['pb647InstagramOnly','pb647AlbumOnly','/album-design/start','/instagram-post-design/start','pb647ModelLabel','pb647SizeLabel','_pbVirtualInstagram','instagram-from-slideshow']) if (!mobileDesign647.includes(needle)) fail(`v647 mobile dedicated design flow missing: ${needle}`);
if (!html.includes('/photobridge-mobile-design-flow-v685.js?v=688')) fail('v647 runtime is not loaded before the designer bundle');
const deployedBundle647 = readText('dist/web/assets/index-UIRefine-v655.js');
if (deployedBundle647.includes('{id:"slideshow",title:"اسلایدشو"')) fail('v647 deployed photographer designer still exposes slideshow as a selectable group');
if (!deployedBundle647.includes('PBInstagramRoute?"instagram":"classic"') && !deployedBundle647.includes('new URLSearchParams(location.search).get("pb_mode")==="instagram"')) fail('v647/v683 deployed designer does not default album routes to album / Instagram route to Instagram');

const mobileFlow648 = readText('dist/web/photobridge-mobile-design-flow-v650.js');
if (!html.includes('/photobridge-mobile-design-flow-v685.js?v=688')) fail('v648 mobile design flow is not loaded');
if (!mobileFlow648.includes("if(!allowed(opt))opt.remove()")) fail('v648 must physically remove non-album native options');
if (!mobileFlow648.includes("if(mode==='album')return kind==='album'")) fail('v648 album API template isolation is missing');
if (!mobileFlow648.includes('pruneAlbumOnlyMenus')) fail('v648 album mobile menu pruning is missing');

// v649 cache/race hard fix: never reuse the mutable v646 bundle URL.
const v649Html = readText('dist/web/index.html');
const v649Server = readText('dist/api/server.js');
if (!v649Html.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v649 fresh compiled bundle URL is missing');
if (!v649Html.includes('/photobridge-mobile-design-flow-v685.js?v=688')) fail('v649 mobile flow runtime URL is missing');
if (v649Html.includes('/assets/index-UIRefine-v646.js?v=646')) fail('stale v646 compiled bundle URL is still loaded');
if (!v649Server.includes("revalidateAsset ? 'no-cache, max-age=0, must-revalidate'")) fail('v649 JS/CSS revalidation policy is missing');
if (!v649Server.includes("'x-photobridge-release': '0.17.689'")) fail('v649 release response header is missing');
if (!v649Server.includes('/photobridge-mobile-design-flow-v685.js?v=688')) fail('v649 standalone design page still points at a stale mobile runtime');


// v650 exact mobile Album/Instagram isolation.
const v650Html = readText('dist/web/index.html');
const v650Bundle = readText('dist/web/assets/index-UIRefine-v655.js');
const v650PublicDesign = readText('dist/web/photobridge-public-design-v650.js');
const v650MobileFlow = readText('dist/web/photobridge-mobile-design-flow-v650.js');
for (const needle of [
  '/assets/index-UIRefine-v655.js?v=689',
  '/photobridge-public-design-v650.js?v=687',
  '/photobridge-mobile-design-flow-v685.js?v=688'
]) if (!v650Html.includes(needle)) fail(`v650 fresh runtime ref missing: ${needle}`);
if (!v650Bundle.includes('t=PBInstagramRoute?[{id:"instagram"') && !v650Bundle.includes('new URLSearchParams(location.search).get("pb_mode")==="instagram"')) fail('v650/v683 Instagram mode is not reduced to the single Instagram group in the deployed bundle');
if (!v650Bundle.includes('id:"classic",title:"آلبوم کلاسیک"') || !v650Bundle.includes('id:"panorama",title:"آلبوم کشیده"')) fail('v650 Album route does not retain both album categories');
if (!v650Bundle.includes('m!=="instagram"&&e.jsxs("label"')) fail('v650 deployed mobile picker does not suppress model/size controls for Instagram');
if (!v650PublicDesign.includes("if(mode==='instagram')return;")) fail('v650 legacy mobile picker can still open in Instagram mode');
if (!v650PublicDesign.includes('pb650OptionAllowed')) fail('v650 public-design option filtering is missing');
if (!v650MobileFlow.includes('pruneAlbumOnlyMenus')) fail('v650 album-only menu pruning is missing');
if (!v650MobileFlow.includes("opt.remove()")) fail('v650 non-album native options are not physically removed');


// v651: preview-less Instagram PSD publication + desktop cleanup + non-rotating portrait mobile viewer.
const v651Html = readText('dist/web/index.html');
const v651Bundle = readText('dist/web/assets/index-UIRefine-v655.js');
const v651Css = readText('dist/web/assets/index-UIRefine-v586.css');
const v651PublicDesign = readText('dist/web/photobridge-public-design-v650.js');
const v651PublicNav = readText('dist/web/photobridge-public-nav-v625.js');
const v651Server = readText('dist/api/server.js');
const v651Pkg = JSON.parse(readText('package.json'));
for (const needle of [
  '/assets/index-UIRefine-v655.js?v=689',
  '/photobridge-public-design-v650.js?v=687',
  '/photobridge-public-nav-v625.js?v=659',
  '/photobridge-mobile-design-flow-v685.js?v=688',
  '/assets/index-UIRefine-v586.css?v=673'
]) if (!v651Html.includes(needle)) fail(`v651 fresh runtime ref missing: ${needle}`);
if (v651Pkg.version !== '0.17.689') fail('v651 package version mismatch');
if (!v651Server.includes("'x-photobridge-release': '0.17.689'")) fail('v651 release response header missing');
if (!v651Server.includes('legacyInstagram=rawCategory.includes')) fail('v651 legacy Instagram category normalization missing');
if (!v651Bundle.includes('pb651EmptyPreview') || !v651Bundle.includes('albumTemplateSampleEmpty')) fail('v651 empty PSD preview placeholder missing from deployed catalog');
if (!v651Bundle.includes('new URLSearchParams(location.search).get("pb_mode")==="instagram"') || !v651Bundle.includes('Ct?"portrait":"landscape"')) fail('v651/v686 route-aware Instagram portrait lock missing from deployed bundle');
if (v651PublicDesign.includes("o.lock('portrait')") || v651PublicDesign.includes('o.lock("portrait")')) fail('v651 public runtime still rotates Instagram screen orientation');
if (!v651Bundle.includes('pb651InstagramPortrait') || !v651Bundle.includes('اطلاعات طرح')) fail('v651 Instagram portrait toolbar metadata missing');
if (!v651Css.includes('PhotoBridge v651 — Instagram preview/portrait + desktop filter isolation')) fail('v651 desktop/mobile CSS isolation missing');
if (v651PublicNav.includes("['/slideshow-design','طراحی اسلایدشو']")) fail('v651 desktop navigation still exposes slideshow design');


// v652: exact PSD typography + Instagram save/contrast/back recovery.
const v652Html = readText('dist/web/index.html');
const v652Bundle = readText('dist/web/assets/index-UIRefine-v655.js');
const v652Css = readText('dist/web/assets/index-UIRefine-v586.css');
const v652PublicDesign = readText('dist/web/photobridge-public-design-v650.js');
const v652Server = readText('dist/api/server.js');
const v652Pkg = JSON.parse(readText('package.json'));
for (const needle of [
  '/assets/index-UIRefine-v655.js?v=689',
  '/photobridge-public-design-v650.js?v=687',
  '/photobridge-public-nav-v625.js?v=659',
  '/photobridge-mobile-design-flow-v685.js?v=688',
  '/assets/index-UIRefine-v586.css?v=673'
]) if (!v652Html.includes(needle)) fail(`v652 fresh runtime ref missing: ${needle}`);
if (v652Pkg.version !== '0.17.689') fail('v652 package version mismatch');
if (!v652Server.includes("'x-photobridge-release': '0.17.689'")) fail('v652 release header missing');
for (const needle of [
  'استخراج مستقیم از PSD',
  'طرح اصلی PSD · بدون جایگزینی',
  'برگرداندن به Typography اصلی PSD',
  'albumInstagramSaveOutput',
  'دو خروجی در دسترس است: رایگان برای انتشار و کیفیت بالا با رزولوشن کامل.',
  'albumDesignQuickContrast',
  'contrast:Number',
  'history.replaceState'
]) if (!v652Bundle.includes(needle)) fail(`v652 deployed designer behavior missing: ${needle}`);
if (!v652Bundle.includes('m!=="instagram"&&e.jsx("button",{type:"button",onClick:Tn,children:"خروجی نهایی"})')) fail('v652 Instagram still exposes redundant final-output header action');
if (!v652PublicDesign.includes("if(target.closest('.albumDesignFullscreenModal')){return}")) fail('v652 back button is still intercepted away from the current catalog');
if (!v652Css.includes('PhotoBridge v652 — exact PSD typography + Instagram save/contrast/back recovery')) fail('v652 UI recovery CSS missing');
if (!v652Css.includes('.albumInstagramSaveOutput') || !v652Css.includes(':has(.albumDesignQuickContrast)')) fail('v652 mobile Instagram save/contrast controls missing');

// v653: photographer custom PSD typography persistence + portrait Instagram export + paid-flow recovery.
const v653Bundle = readText('dist/web/assets/index-UIRefine-v655.js');
const v653PublicDesign = readText('dist/web/photobridge-public-design-v650.js');
const v653Server = readText('dist/api/server.js');
const v653Pkg = JSON.parse(readText('package.json'));
if (v653Pkg.version !== '0.17.689') fail('v653 package version mismatch');
if (!v653Bundle.includes('/api/customer/album-design/templates?_=${Date.now()}')) fail('v653 photographer template/custom typography cache-bust missing');
if (!v653Bundle.includes('/api/admin/test-album-design?_=')) fail('v653 admin template/custom typography cache-bust missing');
if (!v653Bundle.includes('Vt=zt.length>0')) fail('v653 typography-only PSD raster fallback is not retained on save');
if (!v653Bundle.includes('/instagram/i.test(a)||/1080\\s*[×x*]\\s*1350/i.test(ii(a))')) fail('v653 Instagram size parser still treats 1080x1350 as physical centimeters');
if (!v653Bundle.includes('width:Math.max(1,Math.round(Math.min(Number(ge.width),Number(ge.height)))),height:Math.max(1,Math.round(Math.max(Number(ge.width),Number(ge.height))))')) fail('v653 paid Instagram export is not hard-normalized to portrait native dimensions');
if (!v653Bundle.includes('1080/Math.max(1,bt.width),1920/Math.max(1,bt.height)')) fail('v653 free Instagram portrait/social scale is missing');
if (!v653PublicDesign.includes('allowAlbumOnce=false')) fail('v653 paid album/Instagram click retry gate missing');
if (!v653PublicDesign.includes("var svc=mode==='instagram'?'instagram_export':'album_export'") || !v653PublicDesign.includes('ensurePaid(svc,{mode:mode})')) fail('v653/v659 public paid export does not start the correct payment service before high-resolution render');
if (!v653Server.includes("if(before!==after)await pool.query('UPDATE platform_settings")) fail('v653 typography settings normalization is still fire-and-forget');
if (!v653Server.includes('customTypographyAssets:(saved.customTypographyAssets||[]).map(albumTypographyAssetPublic).filter(Boolean)')) fail('v653 template-save response does not return the authoritative custom typography bank');


// v654: equipment-store inventory editing, manual photographer booking, collateral layout, and sales storefront.
const v654Server = readText('dist/api/server.js');
const v654Portal = readText('dist/api/equipment-rental-portal.html');
const v654Book = readText('dist/api/equipment-rental-book.html');
const v654Landing = readText('dist/api/equipment-rental-landing.html');
const v654Migration = readText('migrations/124_equipment_store_sales.sql');
const v654Pkg = JSON.parse(readText('package.json'));
if (v654Pkg.version !== '0.17.689') fail('v654 package version mismatch');
if (!v654Server.includes("'x-photobridge-release': '0.17.689'")) fail('v654 release response header missing');
for (const needle of [
  'ensureEquipmentRentalV654Schema',
  'deleted_at timestamptz',
  "url.pathname === '/api/rental/sale-items'",
  '/api/customer/equipment-rental/sale-orders',
  '/api/public/equipment-rental/sale-items',
  'photographerLinked: Boolean(photographer?.id)',
  "UPDATE equipment_rental_items SET active=false,deleted_at=now()",
  "prev==='pending'&&['confirmed','cancelled'].includes(next)"
]) if (!v654Server.includes(needle)) fail(`v654 equipment-store backend missing: ${needle}`);
for (const needle of [
  'bookingModeExisting',
  'bookingModeNew',
  'bookingPhotographerSelect',
  'bookingInviteNewPhotographer',
  'فروش تجهیزات',
  'saleItemForm',
  '/api/rental/sale-items',
  'تنظیم ودیعه',
  'بدون شرط اختصاصی',
  "method:'DELETE'"
]) if (!v654Portal.includes(needle)) fail(`v654 equipment-store portal missing: ${needle}`);
for (const needle of ['salesPanel','خرید تجهیزات از فروشگاه','/api/customer/equipment-rental/sale-items','/api/customer/equipment-rental/sale-orders']) if (!v654Book.includes(needle)) fail(`v654 photographer sales UI missing: ${needle}`);
for (const needle of ['فروشگاه‌های فعال','برای ورود به امکانات فروشگاه، همکاری باید از طریق دعوت‌نامه یا درخواست همکاری تأیید شود.','اجاره و فروش تجهیزات']) if (!v654Landing.includes(needle)) fail(`v843 collaboration-gated equipment landing missing: ${needle}`);
for (const needle of ['ALTER TABLE equipment_rental_items','CREATE TABLE IF NOT EXISTS equipment_sale_items','CREATE TABLE IF NOT EXISTS equipment_sale_orders']) if (!v654Migration.includes(needle)) fail(`v654 migration missing: ${needle}`);
// v843: collaboration-gated store access, office calendar, settings and primary gallery image.
for (const needle of ['equipmentRentalPhotographerCanDiscoverShop','equipmentRentalPhotographerCanAccessShop','accessMode: \'collaboration_required\'']) if (!v654Server.includes(needle)) fail(`v843 store access backend missing: ${needle}`);
for (const needle of ['pb843SetupBookingsTabs','pb843RenderCalendar','pb843SetPrimaryImage','window.cancelItemEdit=cancelItemEdit','window.cancelSaleItemEdit=cancelSaleItemEdit','برنامه هشدار ویندوز']) if (!v654Portal.includes(needle)) fail(`v843 store portal missing: ${needle}`);
for (const needle of ['if(!target.connected)','درخواست همکاری']) if (!v654Book.includes(needle)) fail(`v843 photographer store gate missing: ${needle}`);

// v0.17.663 — typography bank / multi-text PSD memory recovery.
const v655Bundle = readText('dist/web/assets/index-UIRefine-v655.js');
const v655Server = readText('dist/api/server.js');
if (!v655Bundle.includes('PB655TypographyCropCanvas') || !v655Bundle.includes('PB655TypographyLayerFromBounds') || !v655Bundle.includes('crop=ta')) fail('v655 low-memory PSD typography extraction missing');
if (v655Bundle.includes('photoCanvases=photos.map')) fail('v655 still retains all PSD photo canvases');
if (!v655Server.includes('typography_asset_dimensions_too_large') || !v655Server.includes('typography-preview.webp') || !v655Server.includes('albumStoredObjectPreviewUrl(a.objectKey')) fail('v655 typography preview/storage hardening missing');
for (let i=1;i<=60;i++){ const n=String(i).padStart(3,'0'); if(!fs.existsSync(`dist/web/typography-bank/WED-${n}.svg`) || !fs.existsSync(`dist/web/typography-bank/WED-${n}-preview.svg`)) fail(`v655 typography preview missing WED-${n}`); }
if (!html.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v655 deployed bundle URL missing');
const pkg655=JSON.parse(readText('package.json')); if(pkg655.version!=='0.17.689') fail('v655 package version mismatch');
if (!v655Server.includes("'x-photobridge-release': '0.17.689'") || !v655Server.includes('PhotoBridge 0.17.689')) fail('v655 release markers missing');


// v0.17.663 — equipment catalog definitions + connected photographer store entry.
const v656Server=readText('dist/api/server.js');
const v656Portal=readText('dist/api/equipment-rental-portal.html');
const v656Book=readText('dist/api/equipment-rental-book.html');
const v656Migration=readText('migrations/125_equipment_catalog_categories_models.sql');
const v656Runtime=readText('dist/web/photobridge-equipment-rental-v656.js');
const v656Html=readText('dist/web/index.html');
for(const needle of ['ensureEquipmentRentalV656Schema','equipment_catalog_categories','equipment_catalog_models','/api/rental/catalog/categories','/api/rental/catalog/models','equipmentRentalCatalogSnapshot']) if(!v656Server.includes(needle)) fail(`v656 catalog backend missing: ${needle}`);
for(const needle of ['catalogCategoryForm','catalogModelForm','itemCategorySelect','saleCategorySelect','renderCatalog','refreshEquipmentCatalogSelectors']) if(!v656Portal.includes(needle)) fail(`v656 catalog portal missing: ${needle}`);
for(const needle of ['CREATE TABLE IF NOT EXISTS equipment_catalog_categories','CREATE TABLE IF NOT EXISTS equipment_catalog_models']) if(!v656Migration.includes(needle)) fail(`v656 catalog migration missing: ${needle}`);
for(const needle of ['access.connected=true','pbRental656MobileBtn','pbRental656DesktopShopBtn','photographerBottomAppNavGrid','photographerHomeModeNav']) if(!v656Runtime.includes(needle)) fail(`v668 all-photographer store navigation missing: ${needle}`);
if(!v656Html.includes('/photobridge-equipment-rental-v685.js?v=727')) fail('v656 equipment runtime include missing');
if(!v656Book.includes('category_label')) fail('v656 photographer equipment category labels missing');

// v0.17.663 — compact store dashboard, paid equipment-sales wallet and Sofia demo catalog.
const v658Server=readText('dist/api/server.js');
const v658Portal=readText('dist/api/equipment-rental-portal.html');
const v658Book=readText('dist/api/equipment-rental-book.html');
const v658Migration=readText('migrations/127_equipment_sales_wallet_demo.sql');
const v658Pkg=JSON.parse(readText('package.json'));
if(v658Pkg.version!=='0.17.689') fail('v658 package version mismatch');
if(!v658Server.includes("'x-photobridge-release': '0.17.689'")||!v658Server.includes('PhotoBridge 0.17.689')) fail('v658 release markers missing');
for(const needle of ['ensureEquipmentRentalV658Schema','equipment_sale_wallets','equipment_sale_wallet_transactions','equipmentSaleDebitBuyerAndCreditShop','equipmentSaleRefundPaidOrder','return_path','service_wallet_insufficient']) if(!v658Server.includes(needle)) fail(`v658 equipment-sales wallet backend missing: ${needle}`);
for(const needle of ['dashboardCards','shopSummaryStat','statSalesWallet','salesWalletBalance','position:fixed!important','کیف پول فروش']) if(!v658Portal.includes(needle)) fail(`v658 compact store dashboard missing: ${needle}`);
for(const needle of ['shopperWalletCard','shopperWalletBalance','shopperWalletTopupBtn','پرداخت از کیف پول و ثبت سفارش','topupShopperWallet',"returnPath:'/equipment-rental/book?panel=sales'",'service_wallet_insufficient']) if(!v658Book.includes(needle)) fail(`v658 shopper wallet UI missing: ${needle}`);
for(const needle of ['equipment_sale_wallets','payment_status','SOFIA-DEMO-R-001','SOFIA-DEMO-S-001','public:/equipment-demo/sony-a7iv.png']) if(!v658Migration.includes(needle)) fail(`v658 migration/demo seed missing: ${needle}`);
for(const image of ['sony-a7iv.png','canon-r6ii.png','sony-2470.png','canon-70200.png','godox-ad600.png','godox-v1.png','dji-rs3pro.png','sandisk-128.png']) if(!fs.existsSync(`dist/web/equipment-demo/${image}`)) fail(`v658 Sofia demo image missing: ${image}`);

console.log('[PhotoBridge Deploy Lite] v0.17.663 verified: compact equipment-store dashboard, sales wallet checkout/refund, wallet top-up return flow, and Sofia demo catalog are ready.');

// v0.17.663 — heart likes, real typography monochrome preview, mobile photo tools, public gateway checkout and album filter cleanup.
const v659Source = readText('apps/web/src/main.tsx');
const v659Server = readText('dist/api/server.js');
const v659PublicDesign = readText('dist/web/photobridge-public-design-v650.js');
const v659Ratings = readText('dist/web/photobridge-design-ratings-v657.js');
const v659MobileFlow = readText('dist/web/photobridge-mobile-design-flow-v650.js');
const v659AdminAlbum = readText('dist/web/photobridge-admin-album-v646.js');
const v659Css = readText('dist/web/assets/index-UIRefine-v586.css');
for (const needle of ['pb659DesignLike','pb659LikeHeart','liked:nextLiked','toggleDesignModelLike']) if(!v659Source.includes(needle)) fail(`v659 source heart-like flow missing: ${needle}`);
if(v659Source.includes('albumDesignModelStars')) fail('v659 source still contains star rating UI');
for (const needle of ['pb659DesignLike','pb659LikeHeart','my-likes-v661','محبوب‌ترین']) if(!v659Ratings.includes(needle)) fail(`v659 heart runtime missing: ${needle}`);
for (const needle of ['forceMonochrome:fm=!1','(a==null?void 0:a.preserveColor)===!0&&!fm','forceMonochrome:c!=="original"']) if(!v655Bundle.includes(needle)) fail(`v659 typography monochrome compiled preview missing: ${needle}`);
for (const needle of ["mode==='instagram'?'instagram_export':'album_export'",'pb659CompactCheckout','پرداخت و دانلود','albumDesignModelViewToolbar']) if(!v659PublicDesign.includes(needle)) fail(`v659 public design payment/filter runtime missing: ${needle}`);
for (const needle of ['publicInstagramPriceToman','publicExportPriceToman','pb659PublicGatewayPrices']) if(!v659AdminAlbum.includes(needle)) fail(`v659 admin gateway pricing missing: ${needle}`);
for (const needle of ['PhotoBridge v0.17.663','mobile parity — use the real compiled photo controls','albumDesignEditorBottomBar>.albumDesignBottomEffect','pb659LikeHeart']) if(!v659Css.includes(needle)) fail(`v659 CSS/mobile tools missing: ${needle}`);
for (const needle of ['albumDesignMobilePickerButton.size','albumDesignSizeButtons']) if(!v659MobileFlow.includes(needle)) fail(`v659 mobile size-cleanup runtime marker missing: ${needle}`);
if(!v659Server.includes('myLiked') || !v659Server.includes('likeCount') || !v659Server.includes('b.liked')) fail('v659 backend like semantics missing');
if(!html.includes('/photobridge-design-ratings-v657.js?v=662') || !html.includes('/photobridge-public-design-v650.js?v=687') || !html.includes('/assets/index-UIRefine-v655.js?v=689') || !html.includes('/assets/index-UIRefine-v586.css?v=673')) fail('v659 cache-bust refs missing');
if(JSON.parse(readText('package.json')).version!=='0.17.689') fail('v659 package version mismatch');
if(!v659Server.includes("'x-photobridge-release': '0.17.689'") || !v659Server.includes('PhotoBridge 0.17.689')) fail('v659 release markers missing');
console.log('[PhotoBridge Deploy Lite] v0.17.663 verified: likes, typography color, mobile photo controls, public gateway checkout, compact payment UI and album filter cleanup are ready.');


// v0.17.663 — admin album gateway-price card single-instance hotfix.
const v660AdminAlbum=readText('dist/web/photobridge-admin-album-v646.js');
const v660Html=readText('dist/web/index.html');
for(const needle of ["BOX_ID='pb660PublicGatewayPrices'","normalizeExisting(panel)","if(mounting)return","for(const extra of boxes.slice(1))extra.remove()","livePanel.insertAdjacentElement('afterend',box)"]) if(!v660AdminAlbum.includes(needle)) fail(`v660 admin gateway single-instance hotfix missing: ${needle}`);
if(v660AdminAlbum.includes("panel.querySelector('.pb659PublicGatewayPrices')")) fail('v660 still contains the old descendant-only duplicate guard');
if(!v660Html.includes('/photobridge-admin-album-v646.js?v=662')) fail('v660 admin album cache-bust ref missing');
console.log('[PhotoBridge Deploy Lite] v0.17.663 verified: admin gateway pricing card is single-instance and duplicate-safe.');


// v0.17.663 — durable like totals, multi-digit gateway prices, mobile photo-tool parity, PSD movement lock.
const v662Ratings=readText('dist/web/photobridge-design-ratings-v657.js');
const v662Admin=readText('dist/web/photobridge-admin-album-v646.js');
const v662Css=readText('dist/web/photobridge-v662-fixes.css');
const v662Migration=readText('migrations/129_album_design_like_totals.sql');
const v662Pkg=JSON.parse(readText('package.json'));
if(v662Pkg.version!=='0.17.689') fail('v662 package version mismatch');
if(!serverText.includes("'x-photobridge-release': '0.17.689'") || !serverText.includes('PhotoBridge 0.17.689')) fail('v662 release markers missing');
for(const needle of ['album_design_template_like_totals','logicalRowsBefore','finalCount','previousLogical']) if(!serverText.includes(needle)) fail(`v662 durable like backend missing: ${needle}`);
for(const needle of ['CREATE TABLE IF NOT EXISTS album_design_template_like_totals','GREATEST(album_design_template_like_totals.like_count']) if(!v662Migration.includes(needle)) fail(`v662 like-total migration missing: ${needle}`);
for(const needle of ['knownCount:before','knownCount:known','PhotoBridge v0.17.663']) if(!v662Ratings.includes(needle)) fail(`v662 like runtime missing: ${needle}`);
for(const needle of ['asciiDigits','replace(/[۰-۹]/g','pb662MovementLock','pb662MovementLocked','pointermove']) if(!v662Admin.includes(needle)) fail(`v662 admin price/lock runtime missing: ${needle}`);
for(const needle of ['albumDesignQuickSaturation','albumDesignQuickOpacity','albumDesignQuickBlur','albumDesignQuickContrast','.pb659DesignLike{gap:1px']) if(!v662Css.includes(needle)) fail(`v662 mobile tools/like spacing CSS missing: ${needle}`);
if(!html.includes('/photobridge-design-ratings-v657.js?v=662') || !html.includes('/photobridge-admin-album-v646.js?v=662') || !html.includes('/photobridge-v662-fixes.css?v=662')) fail('v662 cache-bust references missing');
console.log('[PhotoBridge Deploy Lite] v0.17.663 verified: durable likes, multi-digit prices, mobile photo tools and default PSD movement lock are ready.');

// v0.17.689 — non-blocking print/album QC, invitation-scoped labs, fixed equipment-store identity, live photographer wallet.
{
  const pkg666=JSON.parse(readText('package.json'));
  const server666=readText('dist/api/server.js');
  const bundle666=readText('dist/web/assets/index-UIRefine-v655.js');
  const index666=readText('dist/web/index.html');
  const rental666=readText('dist/api/equipment-rental-portal.html');
  if(pkg666.version!=='0.17.689') fail('v666 package version mismatch');
  for(const needle of ['photographerJoinedViaLabInvite','print.aspect_ratio_submit_nonblocking','walkin.aspect_ratio_submit_nonblocking','crop_delegation_enabled=true',"'x-photobridge-release': '0.17.689'",'PhotoBridge 0.17.689']) if(!server666.includes(needle)) fail(`v666 server fix missing: ${needle}`);
  for(const needle of ['pbMismatch','قابل ارسال · ابعاد فایل','const ee=!0','const k=!0']) if(!bundle666.includes(needle)) fail(`v666 compiled QC fix missing: ${needle}`);
  for(const needle of ['photobridge-wallet-sync-v666.js','photobridge-print-delegation-v666.js']) if(!index666.includes(needle)) fail(`v666 runtime missing from index: ${needle}`);
  for(const needle of ['rentalShopIdentityBar','rentalShopHeaderName']) if(!rental666.includes(needle)) fail(`v666 fixed store identity missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: non-blocking size warnings, invitation-scoped labs, fixed store identity and live wallet sync are ready.');
}


// v0.17.689 — first-invitation lab scope + photographer-facing fixed store identity.
{
  const server667=readText('dist/api/server.js');
  const book667=readText('dist/api/equipment-rental-book.html');
  const migration667=readText('migrations/132_photographer_initial_invite_scope.sql');
  for(const needle of ['photographer_origin_invite_type','photographerInitialInviteType','photographerInvitedLabIds','lab_invite_scope_required','invitationScoped']) if(!server667.includes(needle)) fail(`v667 initial lab scope missing: ${needle}`);
  for(const needle of ['photographerStoreIdentityBar','photographerStoreHeaderName','syncPhotographerStoreIdentity','position:fixed!important','top:64px!important','top:106px!important']) if(!book667.includes(needle)) fail(`v667 photographer store fixed header missing: ${needle}`);
  for(const needle of ['photographer_origin_invite_type','reusedExistingCustomer','photographer.invite_redeem']) if(!migration667.includes(needle)) fail(`v667 origin migration missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: first-invitation lab scope and fixed photographer store identity are ready.');
}

// v0.17.689 — exact photographer store shell, stable dock, header store switcher and print-scoped tariff settings.
{
  const pkg671=JSON.parse(readText('package.json'));
  const server671=readText('dist/api/server.js');
  const source671=readText('apps/web/src/main.tsx');
  const bundle671=readText('dist/web/assets/index-UIRefine-v655.js');
  const css671=readText('dist/web/assets/index-UIRefine-v586.css');
  const runtime671=readText('dist/web/photobridge-equipment-rental-v671.js');
  const sourceRuntime671=readText('apps/web/public/photobridge-equipment-rental-v671.js');
  const portal671=readText('dist/api/equipment-rental-portal.html');
  const book671=readText('dist/api/equipment-rental-book.html');
  const html671=readText('dist/web/index.html');
  if(pkg671.version!=='0.17.689') fail('v671 package version mismatch');
  for(const needle of ["'x-photobridge-release': '0.17.689'",'PhotoBridge 0.17.689','equipmentRentalInvitedShopIds','photographer_invite_redemptions','rental_collaboration_required','equipmentRentalPhotographerCanAccessShop']) if(!server671.includes(needle)) fail(`v671 store backend missing: ${needle}`);
  if(!server671.includes('reachAllows(shop,channel')||!server671.includes("equipmentRentalPhotographerCanAccessShop(pool,a.userId,shopId,'sale')")) fail('v774 independent sale/rental access missing');
  for(const needle of ["const enterPrintWorkspace=async()=>","labs.length===1","/photographer/labs?intent=print","const printIntent=new URLSearchParams(location.search).get('intent')==='print'",'printLabChoiceList','printSettingsContext','?context=print']) if(!source671.includes(needle)) fail(`v671 source photographer flow missing: ${needle}`);
  if(!bundle671.includes('Ne=async()=>')&&!bundle671.includes('Ne=()=>{if(!H&&_e)')) fail('v671+ deployed print picker handler missing');
  for(const needle of ['printLabPicker','printLabChoiceList','/photographer/orders/flow?workspace=print']) if(!bundle671.includes(needle)) fail(`v671 deployed print picker missing: ${needle}`);
  for(const needle of ['.printLabPickerCard{padding:12px!important}','.printLabChoiceList button','.photographerBottomAppNavGrid']) if(!css671.includes(needle)) fail(`v671 deployed photographer UI css missing: ${needle}`);
  for(const needle of ['exact photographer store dock + print-only tariff settings','photographerBottomNavIcon store','scopePhotographerTariffSettings','isPrintSettingsContext','/photographer/settings/prices?context=print','mountPrintSettings','isolateLabSettings']) if(!runtime671.includes(needle)) fail(`v671 runtime missing: ${needle}`);
  if(runtime671!==sourceRuntime671) fail('v671 source/dist rental runtime mismatch');
  for(const needle of ['اگر عکاس یک یا چند دعوت فروشگاه را پذیرفته باشد','فقط همان فروشگاه‌های دعوت‌کننده را می‌بیند']) if(!portal671.includes(needle)) fail(`v671 store invite scope copy missing: ${needle}`);
  for(const needle of ['photographerStoreRoleHeader','workspaceBar photographerWorkspaceBar photographerSingleHeader unifiedRoleHeader photographerHeaderRefined roleHeaderReflow','mobileHeaderQuickActions photographerMobileHeaderQuickActions','mobileHeaderWallet','storePhotographerName','storePhotographerDate','storePhotographerTime','storeNotificationBtn','storeLogoutBtn','storeSettingsBtn','photographerStoreIdentityBar','storeIdentityToggle','storeIdentityMenu','storeCompactShopList','storeHomeActionsV671','اجاره تجهیزات','خرید تجهیزات','آفیش‌ها','فاکتور و مالی','photographerStoreBottomNav','photographerBottomAppNavGrid pbRental656Connected','photographerBottomNavIcon print','photographerBottomNavIcon ai','photographerBottomNavIcon gallery','photographerBottomNavIcon album','photographerBottomNavIcon store','setStoreSelectorOpen','loadStoreHeaderWallet','loadStoreNotifications','logoutStorePhotographer','const initial=shops.find(s=>String(s.id)===saved&&s.connected)||shops.find(s=>s.connected)','storeHomeTitleHidden']) if(!book671.includes(needle)) fail(`v671 store shell missing: ${needle}`);
  for(const forbidden of ['id="storeSelectorToggle"','id="storeSelectorCurrentName"','<h1>فروشگاه تجهیزات</h1>','id="storeHeaderInvoiceBtn"']) if(book671.includes(forbidden)) fail(`v671 obsolete store UI remains: ${forbidden}`);
  for(const needle of ['/photobridge-equipment-rental-v685.js?v=727','/assets/index-UIRefine-v655.js?v=689','/assets/index-UIRefine-v586.css?v=673']) if(!html671.includes(needle)) fail(`v671 index reference missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: exact photographer header/dock, header store switcher, clean store actions and print-only tariff settings are ready.');
}

// v0.17.689 — preserve store stability, photographer identity and print settings while replacing legacy print shell.
{
  const book678compat=readText('dist/api/equipment-rental-book.html');
  const rental678compat=readText('dist/web/photobridge-equipment-rental-v671.js');
  const srcRental678compat=readText('apps/web/public/photobridge-equipment-rental-v671.js');
  const srcMain678compat=readText('apps/web/src/main.tsx');
  const bundle678compat=readText('dist/web/assets/index-UIRefine-v655.js');
  const server678compat=readText('dist/api/server.js');
  for(const needle of ['stable store chrome without viewport scroll locking','storeSectionNavV673','storeIdentityLabel','syncStoreChromeGeometry']) if(!book678compat.includes(needle)) fail(`v678 store stability feature missing: ${needle}`);
  for(const needle of ['photographerPrintSettingsQuickAction','/photographer/settings/prices?context=print']) if(!rental678compat.includes(needle)) fail(`v678 print settings runtime missing: ${needle}`);
  if(rental678compat!==srcRental678compat) fail('v678 source/dist equipment runtime mismatch');
  if(!srcMain678compat.includes("appWorkspacePage '+'pbFixedRoleHeader '+") || !srcMain678compat.includes("d?.profile?.studio_name||me.user.name||'عکاسی'")) fail('v678 source print shell / photographer identity mismatch');
  if(!bundle678compat.includes('appWorkspacePage "+"pbFixedRoleHeader "+') || !bundle678compat.includes('(p.profile&&p.profile.studio_name)||t.user.name||"عکاسی"')) fail('v678 deployed print shell / photographer identity mismatch');
  for(const needle of ["COALESCE(NULLIF(pp.studio_name,''),u.name,'عکاسی') studio_name",'profile: profile.rows[0] || {}']) if(!server678compat.includes(needle)) fail(`v678 photographer studio identity API missing: ${needle}`);
}

// v0.17.689 — clean mobile print shell; no legacy fixed-header collision; guide buttons restored.
{
  const pkg678=JSON.parse(readText('package.json'));
  const server678=readText('dist/api/server.js');
  const index678=readText('dist/web/index.html');
  const srcIndex678=readText('apps/web/index.html');
  const css678=readText('dist/web/photobridge-print-mobile-v678.css');
  const srcCss678=readText('apps/web/public/photobridge-print-mobile-v678.css');
  const bundle678=readText('dist/web/assets/index-UIRefine-v655.js');
  if(pkg678.version!=='0.17.689') fail('v678 package version mismatch');
  if(!server678.includes("'x-photobridge-release': '0.17.689'") || !server678.includes('PhotoBridge 0.17.689')) fail('v678 release markers missing');
  for(const doc of [index678,srcIndex678]){
    if(!doc.includes('/photobridge-print-mobile-v678.css?v=678')) fail('v678 stylesheet reference missing');
    for(const old of ['photobridge-print-mobile-v676.css','photobridge-print-mobile-v677.css','photobridge-lab-identity-v676.css','photobridge-lab-identity-v676.js']) if(doc.includes(old)) fail(`v678 legacy print/lab reference still active: ${old}`);
  }
  for(const needle of ['grid-template-areas:"lab lab" "photo album" "gphoto galbum"','pb569WorkflowGuideButton','overflow-y:auto','photographerSelectedLabControl']) if(!css678.includes(needle)) fail(`v678 clean mobile print CSS missing: ${needle}`);
  if(css678!==srcCss678) fail('v678 source/dist CSS mismatch');
  if(!bundle678.includes('appWorkspacePage "+"pbFixedRoleHeader "+')) fail('v678 print mode must use shared pbFixedRoleHeader');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: clean mobile print shell and restored guide row are ready.');
}

// v0.17.689 — mobile print header parity, compact archive/invoice row, contextual guide placement.
{
  const pkg679=JSON.parse(readText('package.json'));
  const server679=readText('dist/api/server.js');
  const index679=readText('dist/web/index.html');
  const srcIndex679=readText('apps/web/index.html');
  const css679=readText('dist/web/photobridge-print-mobile-v679.css');
  const srcCss679=readText('apps/web/public/photobridge-print-mobile-v679.css');
  const bundle679=readText('dist/web/assets/index-UIRefine-v655.js');
  const srcMain679=readText('apps/web/src/main.tsx');
  const rental679=readText('dist/web/photobridge-equipment-rental-v671.js');
  const srcRental679=readText('apps/web/public/photobridge-equipment-rental-v671.js');
  if(pkg679.version!=='0.17.689') fail('v679 package version mismatch');
  if(!server679.includes("'x-photobridge-release': '0.17.689'") || !server679.includes('PhotoBridge 0.17.689')) fail('v679 release markers missing');
  for(const doc of [index679,srcIndex679]) if(!doc.includes('/photobridge-print-mobile-v679.css?v=679') || !doc.includes('/photobridge-equipment-rental-v685.js?v=727')) fail('v679 cache-bust refs missing');
  if(!index679.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v679 bundle cache-bust missing');
  for(const needle of ['grid-template-areas:"lab lab lab lab" "gphoto photo album galbum"','photographerPrintModeBack{','grid-area:archive','grid-area:invoice','mobileNotificationBell','mobileHeaderWallet']) if(!css679.includes(needle)) fail(`v679 mobile print CSS missing: ${needle}`);
  if(css679!==srcCss679) fail('v679 source/dist CSS mismatch');
  for(const needle of ['SystemNotificationCenter scope="customer" version={notificationVersion} mobile','aria-label="فاکتور" title="فاکتور"','/photographer/settings/prices?context=print']) if(!srcMain679.includes(needle)) fail(`v679 source print header missing: ${needle}`);
  for(const needle of ['e.jsx(Pc,{scope:"customer",version:M,mobile:!0})','aria-label":"فاکتور",title:"فاکتور"','/photographer/settings/prices?context=print']) if(!bundle679.includes(needle)) fail(`v679 deployed print header missing: ${needle}`);
  if(!rental679.includes("photographerPrintModeUtilityCluster .mobileHeaderSettings") || rental679!==srcRental679) fail('v679 integrated print settings guard missing');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: mobile print header controls, archive/invoice row and contextual guides are ready.');
}


// v0.17.689 — mobile print header height/type parity + archive/invoice breathing room.
{
  const pkg680=JSON.parse(readText('package.json'));
  const server680=readText('dist/api/server.js');
  const index680=readText('dist/web/index.html');
  const srcIndex680=readText('apps/web/index.html');
  const css680=readText('dist/web/photobridge-print-mobile-v680.css');
  const srcCss680=readText('apps/web/public/photobridge-print-mobile-v680.css');
  if(pkg680.version!=='0.17.689') fail('v680 package version mismatch');
  if(!server680.includes("'x-photobridge-release': '0.17.689'") || !server680.includes('PhotoBridge 0.17.689')) fail('v680 release markers missing');
  for(const doc of [index680,srcIndex680]) if(!doc.includes('/photobridge-print-mobile-v680.css?v=680')) fail('v680 stylesheet reference missing');
  for(const needle of ['min-height:88px','font-size:16px','font-size:9.3px','grid-template-rows:32px 30px','row-gap:8px','height:30px']) if(!css680.includes(needle)) fail(`v680 mobile print header parity CSS missing: ${needle}`);
  if(css680!==srcCss680) fail('v680 source/dist CSS mismatch');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: mobile print header height, typography and utility spacing match the photographer shell.');
}

// v0.17.689 — mobile photographer single-scroll shell, assistant/chat clearance, date parity and Instagram return.
{
  const pkg681=JSON.parse(readText('package.json'));
  const index681=readText('dist/web/index.html');
  const srcIndex681=readText('apps/web/index.html');
  const css681=readText('dist/web/photobridge-mobile-shell-v681.css');
  const js681=readText('dist/web/photobridge-mobile-shell-v681.js');
  const store681=readText('dist/web/photobridge-equipment-rental-v671.js');
  const source681=readText('apps/web/src/main.tsx');
  if(pkg681.version!=='0.17.689') fail('v681 package version mismatch');
  for(const doc of [index681,srcIndex681]){
    if(!doc.includes('/photobridge-mobile-shell-v681.css?v=681')&&!doc.includes('/photobridge-mobile-shell-v683.css?v=683')&&!doc.includes('/photobridge-mobile-shell-v686.css?v=686')) fail('v681/v683/v684 stylesheet reference missing');
    if(!doc.includes('/photobridge-mobile-shell-v681.js?v=681')&&!doc.includes('/photobridge-mobile-shell-v682.js?v=682')&&!doc.includes('/photobridge-mobile-shell-v683.js?v=683')&&!doc.includes('/photobridge-mobile-shell-v686.js?v=688')) fail('v681/v682/v683/v684 runtime reference missing');
  }
  for(const needle of ['pbAuthenticatedPhotographerPortal','overflow:hidden!important','aiAssistantLauncher','chatDock:not(.collapsed)','photographerIdentityDateOnly','repeat(6,minmax(0,1fr))']) if(!css681.includes(needle)) fail(`v681 mobile shell CSS missing: ${needle}`);
  if(!js681.includes('pb681InstagramMobileBtn')) fail('v681 Instagram runtime bridge missing');
  if(!store681.includes('repeat(6,minmax(0,1fr))')) fail('v681 store dock is not six-column aware');
  if(!source681.includes('photographerInstagramMobileNav')) fail('v681 source Instagram nav missing');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: mobile date parity, single-scroll shell, assistant/chat clearance and Instagram navigation are ready.');
}


// v0.17.689 — Instagram stays inside the authenticated photographer workspace.
{
  const pkg682=JSON.parse(readText('package.json'));
  const index682=readText('dist/web/index.html');
  const srcIndex682=readText('apps/web/index.html');
  const js682=readText('dist/web/photobridge-mobile-shell-v682.js');
  const srcJs682=readText('apps/web/public/photobridge-mobile-shell-v682.js');
  const source682=readText('apps/web/src/main.tsx');
  if(pkg682.version!=='0.17.689') fail('v682 package version mismatch');
  for(const doc of [index682,srcIndex682]){
    const runtimeMarker=doc.includes('/photobridge-mobile-shell-v686.js?v=688')?'/photobridge-mobile-shell-v686.js?v=688':doc.includes('/photobridge-mobile-shell-v683.js?v=683')?'/photobridge-mobile-shell-v683.js?v=683':'/photobridge-mobile-shell-v682.js?v=682';
    if(!doc.includes(runtimeMarker)) fail('v682/v683 Instagram runtime reference missing');
    if(doc.includes('/photobridge-mobile-shell-v681.js?v=681')) fail('v682 legacy Instagram runtime is still active');
    const reactMarker=doc.includes('/assets/index-UIRefine-v655.js')?'/assets/index-UIRefine-v655.js':'/src/main.tsx'; if(doc.indexOf(runtimeMarker)>doc.indexOf(reactMarker)) fail('v682/v683 Instagram route bootstrap must load before React bundle');
  }
  for(const needle of ["INTERNAL_PATH='/photographer/album-design'","pb_mode=instagram",'__PB_PUBLIC_DESIGN_MODE__','history.pushState','PopStateEvent']) if(!js682.includes(needle)) fail(`v682 internal Instagram routing missing: ${needle}`);
  if(js682.includes("location.assign('/instagram-post-design/start')")) fail('v682 still exits to public Instagram route');
  if(js682!==srcJs682) fail('v682 source/dist runtime mismatch');
  for(const needle of ['openInstagramDesign','pb_mode=instagram','instagramDesignActive']) if(!source682.includes(needle)) fail(`v682 source internal Instagram route missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: Instagram stays inside the authenticated photographer workspace.');
}

// v0.17.689 — real Instagram catalog mode + store dock + mobile shell/header parity.
{
  const pkg683=JSON.parse(readText('package.json'));
  const web683=readText('dist/web/index.html');
  const bundle683=readText('dist/web/assets/index-UIRefine-v655.js');
  const store683=readText('dist/api/equipment-rental-book.html');
  const css683=readText('dist/web/photobridge-mobile-shell-v683.css');
  const js683=readText('dist/web/photobridge-mobile-shell-v683.js');
  if(pkg683.version!=='0.17.689') fail('v683 package version mismatch');
  if(!web683.includes('/photobridge-mobile-shell-v686.js?v=688')||!web683.includes('/photobridge-mobile-shell-v686.css?v=686')) fail('v683/v684 mobile shell refs missing');
  if(!bundle683.includes('location.pathname===\"/photographer/album-design\"&&new URLSearchParams(location.search).get(\"pb_mode\")===\"instagram\"')) fail('v683 shipped bundle Instagram mode missing');
  if(!store683.includes('/photographer/album-design?pb_mode=instagram')||!store683.includes('grid-template-columns:repeat(6,minmax(0,1fr))')) fail('v683 store Instagram dock missing');
  for(const n of ['position:fixed!important;inset:0!important','aiAssistantDock','chatDock:not(.collapsed)','grid-template-areas:\"title meta\" \"subtitle meta\"']) if(!css683.includes(n)) fail(`v683 mobile shell CSS missing: ${n}`);
  if(!js683.includes('pb_mode=instagram')) fail('v683 Instagram runtime missing');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: real Instagram mode, store dock, header parity and mobile single-scroll shell are ready.');
}


// v0.17.689 — authenticated Instagram templates + vertical print identity, no permanent poll.
{
  const pkg684=JSON.parse(readText('package.json'));
  const index684=readText('dist/web/index.html');
  const srcIndex684=readText('apps/web/index.html');
  const flow684=readText('dist/web/photobridge-mobile-design-flow-v650.js');
  const srcFlow684=readText('apps/web/public/photobridge-mobile-design-flow-v650.js');
  const shellJs684=readText('dist/web/photobridge-mobile-shell-v684.js');
  const srcShellJs684=readText('apps/web/public/photobridge-mobile-shell-v684.js');
  const shellCss684=readText('dist/web/photobridge-mobile-shell-v684.css');
  const srcShellCss684=readText('apps/web/public/photobridge-mobile-shell-v684.css');
  const store684=readText('dist/api/equipment-rental-book.html');
  if(pkg684.version!=='0.17.689') fail('v684 package version mismatch');
  for(const doc of [index684,srcIndex684]){
    if(!doc.includes('/photobridge-mobile-shell-v686.js?v=688')||!doc.includes('/photobridge-mobile-shell-v686.css?v=686')) fail('v684 shell refs missing');
    if(!doc.includes('/photobridge-mobile-design-flow-v685.js?v=688')) fail('v684 design-flow cache bust missing');
  }
  for(const needle of ["q.get('pb_mode')","if(mode==='instagram')return kind==='instagram'"]) if(!flow684.includes(needle)) fail(`v684 Instagram catalog mode missing: ${needle}`);
  if(flow684.includes("if(t?._pbVirtualInstagram||String(t?.category||'').toLowerCase()==='instagram-from-slideshow')return false")) fail('v684 still removes virtual Instagram templates');
  if(flow684!==srcFlow684) fail('v684 design-flow source/dist mismatch');
  if(shellJs684.includes('setInterval(ensureInstagram')) fail('v684 permanent Instagram polling loop still active');
  if(shellJs684.includes('MutationObserver')) fail('v684 shell must not add a MutationObserver');
  if(shellJs684!==srcShellJs684) fail('v684 shell JS source/dist mismatch');
  for(const needle of ['flex-direction:column!important','margin:5px 0 0!important','font-size:16px!important','font-size:9.3px!important']) if(!shellCss684.includes(needle)) fail(`v684 print identity parity CSS missing: ${needle}`);
  if(shellCss684!==srcShellCss684) fail('v684 shell CSS source/dist mismatch');
  if(!store684.includes('/photographer/album-design?pb_mode=instagram')) fail('v684 store Instagram dock missing');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: authenticated Instagram catalog and vertical mobile print identity are ready.');
}


// v0.17.689 — deterministic photographer mobile navigation: React owns all six destinations; no delayed DOM injection.
{
  const pkg685=JSON.parse(readText('package.json'));
  const index685=readText('dist/web/index.html');
  const srcIndex685=readText('apps/web/index.html');
  const bundle685=readText('dist/web/assets/index-UIRefine-v655.js');
  const source685=readText('apps/web/src/main.tsx');
  const shellJs685=readText('dist/web/photobridge-mobile-shell-v685.js');
  const shellSrc685=readText('apps/web/public/photobridge-mobile-shell-v685.js');
  const shellCss685=readText('dist/web/photobridge-mobile-shell-v685.css');
  const shellCssSrc685=readText('apps/web/public/photobridge-mobile-shell-v685.css');
  const flow685=readText('dist/web/photobridge-mobile-design-flow-v685.js');
  const flowSrc685=readText('apps/web/public/photobridge-mobile-design-flow-v685.js');
  const rental685=readText('dist/web/photobridge-equipment-rental-v685.js');
  const rentalSrc685=readText('apps/web/public/photobridge-equipment-rental-v685.js');
  const store685=readText('dist/api/equipment-rental-book.html');
  if(pkg685.version!=='0.17.689') fail('v685 package version mismatch');
  for(const doc of [index685,srcIndex685]){
    for(const needle of ['/photobridge-mobile-shell-v686.js?v=688','/photobridge-mobile-shell-v686.css?v=686','/photobridge-mobile-design-flow-v685.js?v=688','/photobridge-equipment-rental-v685.js?v=727']) if(!doc.includes(needle)) fail(`v685 active ref missing: ${needle}`);
  }
  if(!index685.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v685 deployed bundle cache bust missing');
  if(!srcIndex685.includes('/src/main.tsx')) fail('v685 source index main entry missing');
  for(const needle of ['PBInstagramActive','PBInstagramDesign','photographerInstagramMobileNav','photographerStoreMobileNav','photographerBottomNavIcon instagram','photographerBottomNavIcon store','PBInstagramRoute','useLayoutEffect','PBCategory.includes("instagram")','Math.abs(PBRatio-.8)<.025']) if(!bundle685.includes(needle)) fail(`v685 deployed deterministic nav/catalog missing: ${needle}`);
  for(const needle of ['openInstagramDesign','openEquipmentStore','photographerInstagramMobileNav','photographerStoreMobileNav','useLayoutEffect(()=>{if(dedicatedDesignMode']) if(!source685.includes(needle)) fail(`v685 source deterministic nav/catalog missing: ${needle}`);
  for(const runtime of [shellJs685,flow685,rental685]){
    if(runtime.includes('setInterval(')) fail('v685 mobile runtime must not use setInterval polling');
    if(runtime.includes('new MutationObserver')) fail('v685 mobile runtime must not mutate/react to DOM with MutationObserver');
  }
  if(shellJs685.includes('createElement(\'button\')')||shellJs685.includes('ensureInstagram')) fail('v685 shell still injects navigation buttons');
  if(flow685.includes('window.fetch=')||flow685.includes('.click()')) fail('v685 design flow still filters fetches or programmatically switches React controls');
  if(shellJs685!==shellSrc685||shellCss685!==shellCssSrc685||flow685!==flowSrc685||rental685!==rentalSrc685) fail('v685 source/dist runtime mismatch');
  for(const needle of ['repeat(6,minmax(0,1fr))','photographerBottomNavIcon.instagram::before','photographerBottomNavIcon.store::before','font-size:15px!important','margin:6px 0 0!important','position:static!important']) if(!shellCss685.includes(needle)) fail(`v685 mobile CSS missing: ${needle}`);
  if(!store685.includes('#photographerStoreBottomNav .photographerBottomNavIcon.instagram::before')) fail('v685 store Instagram icon selector is not bound to the real dock');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: deterministic six-tab mobile navigation and instant Album/Instagram mode switching are ready.');
}

// v0.17.689 — restore native mobile scrolling, deterministic filter order, portrait Instagram fullscreen and chat clearance.
{
  const pkg686=JSON.parse(readText('package.json'));
  const index686=readText('dist/web/index.html');
  const srcIndex686=readText('apps/web/index.html');
  const shellJs686=readText('dist/web/photobridge-mobile-shell-v686.js');
  const shellJsSrc686=readText('apps/web/public/photobridge-mobile-shell-v686.js');
  const shellCss686=readText('dist/web/photobridge-mobile-shell-v686.css');
  const shellCssSrc686=readText('apps/web/public/photobridge-mobile-shell-v686.css');
  const source686=readText('apps/web/src/main.tsx');
  const bundle686=readText('dist/web/assets/index-UIRefine-v655.js');
  const pubDesign686=readText('dist/web/photobridge-public-design-v650.js');
  const pubDesignSrc686=readText('apps/web/public/photobridge-public-design-v650.js');
  if(pkg686.version!=='0.17.689') fail('v686 package version mismatch');
  for(const doc of [index686,srcIndex686]){
    for(const needle of ['/photobridge-mobile-shell-v686.js?v=688','/photobridge-mobile-shell-v686.css?v=686','/photobridge-public-design-v650.js?v=687']) if(!doc.includes(needle)) fail(`v686 active ref missing: ${needle}`);
    if(doc.includes('/photobridge-mobile-shell-v685.css?v=685')||doc.includes('/photobridge-mobile-shell-v685.js?v=685')) fail('v686 still loads v685 shell');
  }
  if(!index686.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v686 deployed bundle cache bust missing');
  for(const bad of ['body.pbAuthenticatedPhotographerPortal{position:fixed','height:100dvh!important;min-height:0!important;max-height:100dvh!important;\n    overflow:hidden']) if(shellCss686.includes(bad)) fail(`v686 must not globally freeze photographer body: ${bad}`);
  for(const needle of ['overflow-y:auto!important','touch-action:pan-y!important','albumDesignMobileTopFilter{order:0!important','albumDesignModelViewToolbar>b{order:1!important','albumDesignPopularitySort{','order:2!important;margin-right:auto!important','albumDesignMobileGridToggle{','order:3!important','albumDesignMobilePickerButtons:empty','pb651InstagramPortrait','bottom:calc(94px','min-height:54px!important']) if(!shellCss686.includes(needle)) fail(`v686 mobile recovery CSS missing: ${needle}`);
  if(shellJs686.includes('setInterval(')||shellJs686.includes('MutationObserver')||shellJs686.includes('createElement(')) fail('v686 shell JS must remain passive and deterministic');
  if(shellJs686!==shellJsSrc686||shellCss686!==shellCssSrc686) fail('v686 shell source/dist mismatch');
  if(pubDesign686!==pubDesignSrc686) fail('v686 public design source/dist mismatch');
  const filterMarkup='<button type="button" class="albumDesignMobileTopFilter pb599AlbumFilterButton pb603FilterIcon" data-pb604-filter-proxy="1" aria-label="فیلتر مدل‌ها" title="فیلتر مدل‌ها"></button><b></b><div class="albumDesignMobileGridToggle"';
  if(!pubDesign686.includes(filterMarkup)) fail('v686 filter/count/grid DOM order missing');
  if(!source686.includes("const lock=()=>{if(!albumMobileImmersive())return")) fail('v686 source Instagram portrait orientation lock missing');
  if(!bundle686.includes('new URLSearchParams(location.search).get("pb_mode")==="instagram"')||!bundle686.includes('Ct?"portrait":"landscape"')) fail('v686 deployed Instagram portrait lock missing');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: mobile scrolling, filter order, portrait Instagram fullscreen and chat clearance are ready.');
}

// v0.17.689 — Instagram sticky toolbar replacement + view controls at physical left + print/store header parity.
{
  const pkg687=JSON.parse(readText('package.json'));
  const index687=readText('dist/web/index.html');
  const srcIndex687=readText('apps/web/index.html');
  const css687=readText('dist/web/photobridge-mobile-shell-v687.css');
  const css687src=readText('apps/web/public/photobridge-mobile-shell-v687.css');
  const store687=readText('dist/api/equipment-rental-book.html');
  if(pkg687.version!=='0.17.689') fail('v687 package version mismatch');
  for(const doc of [index687,srcIndex687]) if(!doc.includes('/photobridge-mobile-shell-v687.css?v=687')) fail('v687 active stylesheet missing');
  if(css687!==css687src) fail('v687 shell CSS source/dist mismatch');
  for(const needle of [
    'albumDesignMobileCatalogHeader',
    'albumDesignMobilePickerButtons',
    'albumDesignModelViewToolbar',
    'position:sticky!important',
    'top:0!important',
    'albumDesignMobileTopFilter',
    'albumDesignModelViewToolbar>b',
    'albumDesignPopularitySort',
    'albumDesignMobileGridToggle',
    'margin-right:auto!important',
    'font-size:15px!important',
    'font-size:7.5px!important',
    'margin:2px 0 0!important',
    'photographerPrintCommonAction.archive',
    'photographerPrintCommonAction.finance'
  ]) if(!css687.includes(needle)) fail(`v687 mobile parity CSS missing: ${needle}`);
  if(css687.includes('MutationObserver')||css687.includes('setInterval(')) fail('v687 CSS unexpectedly contains runtime polling markers');
  for(const needle of ['PhotoBridge v0.17.689 — store header','padding-left:150px!important','font-size:15px!important','font-size:7.5px!important','margin:2px 0 0!important','min-width:74px!important']) if(!store687.includes(needle)) fail(`v687 store header parity missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: Instagram toolbar replacement, left-side view controls and exact mobile header parity are ready.');
}

// v0.17.689 — print header structurally reuses the standard photographer mobile controls.
{
  const pkg688=JSON.parse(readText('package.json'));
  const server688=readText('dist/api/server.js');
  const index688=readText('dist/web/index.html');
  const srcIndex688=readText('apps/web/index.html');
  const css688=readText('dist/web/photobridge-mobile-shell-v688.css');
  const srcCss688=readText('apps/web/public/photobridge-mobile-shell-v688.css');
  const source688=readText('apps/web/src/main.tsx');
  const bundle688=readText('dist/web/assets/index-UIRefine-v655.js');
  if(pkg688.version!=='0.17.689') fail('v688 package version mismatch');
  if(!server688.includes("'x-photobridge-release': '0.17.689'")||!server688.includes('PhotoBridge 0.17.689')) fail('v688 release markers missing');
  for(const doc of [index688,srcIndex688]){
    if(!doc.includes('/photobridge-mobile-shell-v688.css?v=688')) fail('v688 stylesheet ref missing');
    if(doc.indexOf('/photobridge-mobile-shell-v688.css?v=688')<doc.indexOf('/photobridge-mobile-shell-v687.css?v=687')) fail('v688 stylesheet must load after v687');
  }
  if(!index688.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v688 deployed bundle cache bust missing');
  if(css688!==srcCss688) fail('v688 source/dist CSS mismatch');
  for(const needle of [
    'padding-left:150px!important',
    'font-size:16px!important',
    'font-size:9.3px!important',
    'margin:2px 0 0!important',
    'photographerMobileHeaderQuickActions',
    'grid-template-columns:repeat(2,minmax(0,1fr))!important',
    'photographerPrintModeUtilityCluster>.photographerPrintModeBack',
    'order:2!important'
  ]) if(!css688.includes(needle)) fail(`v688 print header CSS missing: ${needle}`);
  if(css688.includes('MutationObserver')||css688.includes('setInterval(')) fail('v688 CSS unexpectedly contains runtime polling markers');
  if(source688.includes("<small>{printWorkspace?'فضای چاپ PhotoBridge'")) fail('v688 source still changes print subtitle');
  if(source688.includes('{!printWorkspace&&<div className="mobileHeaderQuickActions photographerMobileHeaderQuickActions">')) fail('v688 source still excludes shared quick actions from print');
  for(const needle of [
    '<small>{standalone?\'حساب مستقل PhotoBridge\':\'پنل عکاسی PhotoBridge\'}</small>',
    '{printWorkspace&&<div className="photographerPrintModeUtilityCluster">',
    '<div className="mobileHeaderQuickActions photographerMobileHeaderQuickActions">',
    "{printWorkspace&&<button className={'mobileHeaderSettings '"
  ]) if(!source688.includes(needle)) fail(`v688 source structural parity missing: ${needle}`);
  if(bundle688.includes('children:D?"فضای چاپ PhotoBridge"')) fail('v688 deployed bundle still changes print subtitle');
  if(bundle688.includes('!D&&e.jsxs("div",{className:"mobileHeaderQuickActions photographerMobileHeaderQuickActions"')) fail('v688 deployed bundle still excludes shared quick actions from print');
  for(const needle of [
    'children:H?"حساب مستقل PhotoBridge":"پنل عکاسی PhotoBridge"',
    'D&&e.jsxs("div",{className:"photographerPrintModeUtilityCluster"',
    'e.jsxs("div",{className:"mobileHeaderQuickActions photographerMobileHeaderQuickActions"',
    'D&&e.jsx("button",{className:"mobileHeaderSettings "'
  ]) if(!bundle688.includes(needle)) fail(`v688 deployed structural parity missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: mobile print now reuses the standard photographer header controls; Archive/Invoice are isolated below them.');
}

// v0.17.689 — shared photographer mobile header in Print/Store + opaque store chrome.
{
  const pkg689=JSON.parse(readText('package.json'));
  const server689=readText('dist/api/server.js');
  const index689=readText('dist/web/index.html');
  const srcIndex689=readText('apps/web/index.html');
  const css689=readText('dist/web/photobridge-mobile-shell-v689.css');
  const srcCss689=readText('apps/web/public/photobridge-mobile-shell-v689.css');
  const source689=readText('apps/web/src/main.tsx');
  const bundle689=readText('dist/web/assets/index-UIRefine-v655.js');
  const store689=readText('dist/api/equipment-rental-book.html');
  if(pkg689.version!=='0.17.689') fail('v689 package version mismatch');
  if(!server689.includes("'x-photobridge-release': '0.17.689'")||!server689.includes('PhotoBridge 0.17.689')) fail('v689 release markers missing');
  for(const doc of [index689,srcIndex689]){
    if(!doc.includes('/photobridge-mobile-shell-v689.css?v=689')) fail('v689 shared mobile stylesheet ref missing');
    if(doc.indexOf('/photobridge-mobile-shell-v689.css?v=689')<doc.indexOf('/photobridge-mobile-shell-v688.css?v=688')) fail('v689 stylesheet must load after v688');
  }
  if(!index689.includes('/assets/index-UIRefine-v655.js?v=689')) fail('v689 deployed bundle cache bust missing');
  if(css689!==srcCss689) fail('v689 source/dist CSS mismatch');
  if(!source689.includes("appWorkspacePage '+'pbFixedRoleHeader '+")) fail('v689 source does not keep pbFixedRoleHeader in print');
  if(bundle689.includes('(D?"":"pbFixedRoleHeader ")')) fail('v689 deployed bundle still removes pbFixedRoleHeader in print');
  if(!bundle689.includes('appWorkspacePage "+"pbFixedRoleHeader "+')) fail('v689 deployed bundle shared header root missing');
  for(const needle of [
    'grid-template-areas:"identity" "print-extra" "primary"',
    'font-size:15px!important',
    'font-size:14px!important',
    'photographerPrintModeUtilityCluster',
    'photographerMobileHeaderQuickActions',
    '#storePhotographerWorkspace>#photographerStoreRoleHeader.photographerHeaderRefined',
    '#storePhotographerWorkspace>#photographerStoreIdentityBar',
    '#storePhotographerWorkspace>#storeSectionNavV673',
    'contain:paint!important'
  ]) if(!css689.includes(needle)) fail(`v689 shared mobile header CSS missing: ${needle}`);
  if(!store689.includes('/photobridge-mobile-shell-v689.css?v=689')) fail('v689 store does not load shared mobile stylesheet');
  if(css689.includes('MutationObserver')||css689.includes('setInterval(')) fail('v689 stylesheet unexpectedly contains runtime polling markers');
  console.log('[PhotoBridge Deploy Lite] v0.17.689 verified: Print and Store reuse one mobile photographer header geometry; store chrome fully masks the scrolling canvas.');
}

// v0.17.689 / mobile shell v690 — one canonical photographer mobile header core.
{
  const index690=readText('dist/web/index.html');
  const srcIndex690=readText('apps/web/index.html');
  const css690=readText('dist/web/photobridge-mobile-shell-v690.css');
  const srcCss690=readText('apps/web/public/photobridge-mobile-shell-v690.css');
  const store690=readText('dist/api/equipment-rental-book.html');
  if(css690!==srcCss690) fail('v690 source/dist CSS mismatch');
  for(const doc of [index690,srcIndex690]){
    if(!doc.includes('/photobridge-mobile-shell-v690.css?v=690')) fail('v690 canonical mobile header stylesheet ref missing');
    if(doc.indexOf('/photobridge-mobile-shell-v690.css?v=690')<doc.indexOf('/photobridge-mobile-shell-v689.css?v=689')) fail('v690 stylesheet must load after v689');
  }
  if(!store690.includes('/photobridge-mobile-shell-v690.css?v=690')) fail('v690 store does not load canonical mobile header stylesheet');
  if(store690.indexOf('/photobridge-mobile-shell-v690.css?v=690')<store690.indexOf('/photobridge-mobile-shell-v689.css?v=689')) fail('v690 store stylesheet must load after v689');
  for(const needle of [
    ':is(#photographerStoreRoleHeader,.photographerHeaderRefined)',
    'left:10px!important',
    'width:34px!important',
    'flex:0 0 34px!important',
    'width:32px!important',
    'flex:0 0 32px!important',
    'font-size:9.4px!important',
    'order:1!important',
    'order:2!important',
    'order:3!important',
    'order:4!important'
  ]) if(!css690.includes(needle)) fail(`v690 canonical photographer header CSS missing: ${needle}`);
  if(css690.includes('MutationObserver')||css690.includes('setInterval(')) fail('v690 stylesheet unexpectedly contains runtime polling markers');
  console.log('[PhotoBridge Deploy Lite] mobile shell v690 verified: all photographer destinations use one canonical mobile header core.');
}


// mobile shell v691 — print-only settings, full-bleed lab strip, embedded guide chips and status spacing.
{
  const index691=readText('dist/web/index.html');
  const srcIndex691=readText('apps/web/index.html');
  const css691=readText('dist/web/photobridge-mobile-shell-v691.css');
  const srcCss691=readText('apps/web/public/photobridge-mobile-shell-v691.css');
  const source691=readText('apps/web/src/main.tsx');
  const bundle691=readText('dist/web/assets/index-UIRefine-v655.js');
  const store691=readText('dist/api/equipment-rental-book.html');
  if(css691!==srcCss691) fail('v691 source/dist CSS mismatch');
  if(!index691.includes('/photobridge-mobile-shell-v691.css?v=691')||!srcIndex691.includes('/photobridge-mobile-shell-v691.css?v=691')||!store691.includes('/photobridge-mobile-shell-v691.css?v=691')) fail('v691 stylesheet link missing');
  for(const needle of ['#photographerStoreRoleHeader .photographerMobileHeaderQuickActions>.mobileHeaderSettings','width:100vw!important','grid-template-areas:"lab lab" "photo album"','height:66px!important','bottom:16px!important','row-gap:13px!important','height:42px!important']) if(!css691.includes(needle)) fail(`v691 mobile print CSS missing: ${needle}`);
  if(!source691.includes("{printWorkspace&&<button className={'mobileHeaderSettings '")||!bundle691.includes('D&&e.jsx("button",{className:"mobileHeaderSettings "')) fail('v691 print-only mobile settings guard missing');
  console.log('[PhotoBridge Deploy Lite] mobile shell v691 verified: print-only settings, active-lab print context, full-bleed lab strip, embedded guides and spaced statuses are ready.');
}

// mobile shell v692 — exact shared header height + truly inline square guide controls.
{
  const index692=readText('dist/web/index.html');
  const srcIndex692=readText('apps/web/index.html');
  const css692=readText('dist/web/photobridge-mobile-shell-v692.css');
  const srcCss692=readText('apps/web/public/photobridge-mobile-shell-v692.css');
  const guide692=readText('dist/web/photobridge-workflow-guides-v572.js');
  if(css692!==srcCss692) fail('v692 source/dist CSS mismatch');
  if(!index692.includes('/photobridge-mobile-shell-v692.css?v=692')||!srcIndex692.includes('/photobridge-mobile-shell-v692.css?v=692')) fail('v692 stylesheet link missing');
  if(!index692.includes('/photobridge-workflow-guides-v572.js?v=699')||!srcIndex692.includes('/photobridge-workflow-guides-v572.js?v=699')) fail('v699 guide cache-bust missing');
  for(const needle of ['grid-template-areas:"identity"!important','margin-bottom:160px!important','position:absolute!important','grid-template-rows:42px 58px!important','width:27px!important','right:7px!important','left:7px!important']) if(!css692.includes(needle)) fail(`v692 mobile print CSS missing: ${needle}`);
  for(const needle of ["document.createElement('span')","print.append(p)","album.append(a)","pb692InlineGuideReady"]) if(!guide692.includes(needle)) fail(`v692 inline guide runtime missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] mobile shell v692 verified: shared Print header height is canonical and both guide controls live inside their action buttons.');
}

// mobile shell v694 — exact white header + attached context bars + print actions inside blue strip.
{
  const srcIndex694=readText('apps/web/index.html');
  const index694=readText('dist/web/index.html');
  const store694=readText('dist/api/equipment-rental-book.html');
  const srcCss694=readText('apps/web/public/photobridge-mobile-shell-v694.css');
  const css694=readText('dist/web/photobridge-mobile-shell-v694.css');
  const srcJs694=readText('apps/web/public/photobridge-mobile-context-v694.js');
  const js694=readText('dist/web/photobridge-mobile-context-v694.js');
  if(srcCss694!==css694) fail('v694 source/dist CSS mismatch');
  if(srcJs694!==js694) fail('v694 source/dist runtime mismatch');
  for(const doc of [srcIndex694,index694,store694]){
    if(!doc.includes('/photobridge-mobile-shell-v694.css?v=694')) fail('v694 stylesheet ref missing');
    if(!doc.includes('/photobridge-mobile-context-v694.js?v=694')&&!doc.includes('/photobridge-mobile-context-v697.js?v=697')&&!doc.includes('/photobridge-mobile-context-v698.js?v=698')&&!doc.includes('/photobridge-runtime-v706.js?v=706')&&!doc.includes('/photobridge-runtime-v707.js?v=707')&&!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782'))))) fail('v694-compatible mobile context runtime ref missing');
    if(doc.includes('/photobridge-mobile-context-v693.js?v=693')) fail('legacy v693 mobile context runtime still loaded');
  }
  for(const needle of [
    '--pb694-photo-header-h:72px',
    'pb694ContextBarActive',
    'padding-top:58px!important',
    '#pb694HeaderInviteButton',
    'margin-left:64px!important',
    '#pb694PrintBarActions',
    'photographerPrintModeUtilityCluster{visibility:hidden!important',
    'padding-left:178px!important'
  ]) if(!css694.includes(needle)) fail(`v694 unified mobile shell CSS missing: ${needle}`);
  for(const needle of [
    'ترای پست اینستاگرام',
    'pb694FreeBadge',
    '>هوش مصنوعی<',
    '>گالری مشتریان<',
    "const title=mode==='instagram'?'ترای پست اینستاگرام':'طراحی آلبوم';",
    'data-pb694-print="archive"',
    'data-pb694-print="finance"',
    'Math.round(r.bottom)-1',
    'pb694FastNavigate'
  ]) if(!js694.includes(needle)) fail(`v694 mobile context runtime missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] mobile shell v694 verified: all white headers match, blue strips attach without seams, invite is beside the bell, and Print Archive/Invoice live in the lab strip.');
}


// mobile shell v697 — compact invite label, print white-crop cleanup and unified page-loading feedback.
{
  const srcIndex697=readText('apps/web/index.html');
  const index697=readText('dist/web/index.html');
  const store697=readText('dist/api/equipment-rental-book.html');
  const srcCss697=readText('apps/web/public/photobridge-mobile-shell-v697.css');
  const css697=readText('dist/web/photobridge-mobile-shell-v697.css');
  const srcJs697=readText('apps/web/public/photobridge-mobile-context-v697.js');
  const js697=readText('dist/web/photobridge-mobile-context-v697.js');
  if(srcCss697!==css697) fail('v697 source/dist CSS mismatch');
  if(srcJs697!==js697) fail('v697 source/dist runtime mismatch');
  for(const doc of [srcIndex697,index697,store697]){
    if(!doc.includes('/photobridge-mobile-shell-v697.css?v=697')) fail('v697 stylesheet ref missing');
    if(!doc.includes('/photobridge-mobile-context-v697.js?v=697')&&!doc.includes('/photobridge-mobile-context-v698.js?v=698')&&!doc.includes('/photobridge-runtime-v706.js?v=706')&&!doc.includes('/photobridge-runtime-v707.js?v=707')&&!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782'))))) fail('v697-compatible runtime ref missing');
  }
  if(index697.includes('/photobridge-mobile-context-v696.js?v=696')||store697.includes('/photobridge-mobile-context-v696.js?v=696')) fail('legacy v696 mobile context runtime still loaded');
  for(const needle of [
    'font-size:0!important',
    'content:"دعوت همکار"!important',
    'font-size:7px!important',
    '.photographerPrintModeNav>.rolePrimaryAction::before',
    'content:none!important;display:none!important',
    '#pb697PageLoader',
    'animation:pb697Spin .72s linear infinite!important'
  ]) if(!css697.includes(needle)) fail(`v697 mobile polish CSS missing: ${needle}`);
  for(const needle of [
    'showPageLoader(',
    'syncPageLoader()',
    'در حال بارگذاری ${text}…',
    '.photographerBottomAppNav button,.photographerPrintModeNav>.rolePrimaryAction,#storeSectionNavV673 [data-store-panel]',
    'pb696HeaderInviteButton',
    'pb696PhotographerContextBar'
  ]) if(!js697.includes(needle)) fail(`v697 mobile polish runtime missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] mobile shell v697 verified: invite typography is compact, print active-tab crop is removed, and loading feedback is shared across mobile photographer destinations.');
}


// mobile shell v698 — invite label containment, canonical Store order and print-strip overlap fix.
{
  const srcIndex698=readText('apps/web/index.html');
  const index698=readText('dist/web/index.html');
  const store698=readText('dist/api/equipment-rental-book.html');
  const srcCss698=readText('apps/web/public/photobridge-mobile-shell-v698.css');
  const css698=readText('dist/web/photobridge-mobile-shell-v698.css');
  const srcJs698=readText('apps/web/public/photobridge-mobile-context-v698.js');
  const js698=readText('dist/web/photobridge-mobile-context-v698.js');
  if(srcCss698!==css698) fail('v698 source/dist CSS mismatch');
  if(srcJs698!==js698) fail('v698 source/dist runtime mismatch');
  for(const doc of [srcIndex698,index698,store698]){
    if(!doc.includes('/photobridge-mobile-shell-v698.css?v=698')) fail('v698 stylesheet ref missing');
    if(!doc.includes('/photobridge-mobile-context-v698.js?v=698')&&!doc.includes('/photobridge-runtime-v706.js?v=706')&&!doc.includes('/photobridge-runtime-v707.js?v=707')&&!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782'))))) fail('v698 runtime ref missing');
  }
  for(const needle of [
    '--pb698-wide:82px',
    '#photographerStoreRoleHeader .photographerMobileHeaderQuickActions',
    '.mobileHeaderInvite>.pb698InviteLabel',
    'font-size:7px!important',
    'flex:0 0 var(--pb698-wide)!important',
    'margin:0 0 107px!important',
    'height:107px!important',
    'background:transparent!important',
    'reported-regression hard overrides'
  ]) if(!css698.includes(needle)) fail(`v698 mobile hard-fix CSS missing: ${needle}`);
  for(const needle of [
    "qs('#photographerStoreRoleHeader')||qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined')",
    "label.className='pb698InviteLabel'",
    'invite.replaceChildren(label)',
    '[bell,power,settings,invite,wallet].filter(Boolean).forEach(el=>row.appendChild(el))',
    'pb697HeaderInviteButton',
    'pb697PhotographerContextBar'
  ]) if(!js698.includes(needle)) fail(`v698 mobile hard-fix runtime missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] mobile shell v698 verified: invite text is contained, Store action order is canonical, and the Print strip no longer overlaps the new-print CTA.');
}

// mobile/desktop UI patch v699 — long invite, print CTA overlap, desktop store scroll, Instagram nav and desktop side guides.
{
  const index699=readText('dist/web/index.html');
  const srcIndex699=readText('apps/web/index.html');
  const store699=readText('dist/api/equipment-rental-book.html');
  const css699=readText('dist/web/photobridge-mobile-shell-v699.css');
  const srcCss699=readText('apps/web/public/photobridge-mobile-shell-v699.css');
  const js699=readText('dist/web/photobridge-ui-fixes-v699.js');
  const srcJs699=readText('apps/web/public/photobridge-ui-fixes-v699.js');
  const source699=readText('apps/web/src/main.tsx');
  const guide699=readText('dist/web/photobridge-workflow-guides-v572.js');
  if(css699!==srcCss699) fail('v699 source/dist CSS mismatch');
  if(js699!==srcJs699) fail('v699 source/dist JS mismatch');
  for(const doc of [index699,srcIndex699]){
    if(!doc.includes('/photobridge-mobile-shell-v699.css?v=699')) fail('v699 stylesheet ref missing');
    if(!doc.includes('/photobridge-ui-fixes-v699.js?v=699')&&!doc.includes('/photobridge-runtime-v706.js?v=706')&&!doc.includes('/photobridge-runtime-v707.js?v=707')&&!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782'))))) fail('v699 runtime ref missing');
    if(!doc.includes('/photobridge-workflow-guides-v572.js?v=699')) fail('v699 workflow guide cache-bust missing');
  }
  for(const needle of ['--pb699-wide:90px','pb699InviteLabel','transform:translateY(-10px)!important','@media (min-width:821px)','overflow-y:auto!important','pb699DesktopGuideNav']) if(!css699.includes(needle)) fail(`v699 CSS missing: ${needle}`);
  for(const needle of ['pb699HeaderInviteButton','pb698InviteLabel pb699InviteLabel','photographerInstagramDesignEntry','/photographer/album-design?pb_mode=instagram']) if(!js699.includes(needle)) fail(`v699 runtime missing: ${needle}`);
  if(!store699.includes('photographerInstagramDesignEntry')||!store699.includes('/photographer/album-design?pb_mode=instagram')) fail('v699 Store Instagram nav missing');
  if(!source699.includes('photographerInstagramDesignEntry')||!source699.includes('>طراحی اینستاگرام</button>')) fail('v699 source desktop Instagram nav missing');
  for(const needle of ['pb699DesktopGuide','pb699DesktopGuideNav','>راهنما</em>']) if(!guide699.includes(needle)) fail(`v699 desktop guide runtime missing: ${needle}`);
  console.log('[PhotoBridge Deploy Lite] v699 verified: invite is a real long button, print CTA is lifted onto its rail, desktop Store scrolls, Instagram is in desktop nav, and print guides are side controls on Windows.');
}

// v706 consolidated runtime / PWA performance / store syntax recovery.
{
  const index706=readText('dist/web/index.html');
  const srcIndex706=readText('apps/web/index.html');
  const store706=readText('dist/api/equipment-rental-book.html');
  const runtime706=readText('dist/web/photobridge-runtime-v706.js');
  const srcRuntime706=readText('apps/web/public/photobridge-runtime-v706.js');
  const sw706=readText('dist/web/photobridge-sw-v706.js');
  if(runtime706!==srcRuntime706) fail('v706 source/dist runtime mismatch');
  for(const doc of [index706,srcIndex706,store706]) if(!doc.includes('/photobridge-runtime-v706.js?v=706')&&!doc.includes('/photobridge-runtime-v707.js?v=707')&&!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782'))))) fail('v706-compatible consolidated runtime ref missing');
  for(const legacy of ['/photobridge-mobile-context-v698.js?v=698','/photobridge-ui-fixes-v699.js?v=699','/photobridge-ui-v704.js?v=704']) if(index706.includes(legacy)||srcIndex706.includes(legacy)||store706.includes(legacy)) fail('v706 legacy overlapping runtime still loaded: '+legacy);
  if(store706.includes('</style><script>window.__PB704_ACTIVE__')) fail('v706 invoice template still contains nested script tag');
  for(const needle of ['apiInflight','request_timeout','Promise.allSettled','refreshVisibleStoreData','180000']) if(!store706.includes(needle)) fail('v706 store recovery missing: '+needle);
  for(const needle of ['__PB706_RUNTIME__','MutationObserver','photobridge-sw-v706.js','pb698PhotographerContextBar']) if(!runtime706.includes(needle)) fail('v706 runtime missing: '+needle);
  if(sw706.includes('respondWith(')) fail('v706 service worker must not intercept navigation/API');
  console.log('[PhotoBridge Deploy Lite] v706 verified: consolidated low-overhead runtime, direct-network PWA, staged Store loading and invoice syntax recovery are ready.');
}

// v707 React DOM stability: active runtime must never structurally mutate React-owned nodes.
{
  const index707=readText('dist/web/index.html');
  const srcIndex707=readText('apps/web/index.html');
  const store707=readText('dist/api/equipment-rental-book.html');
  const runtime707=readText('dist/web/photobridge-runtime-v707.js');
  const srcRuntime707=readText('apps/web/public/photobridge-runtime-v707.js');
  const css707=readText('dist/web/photobridge-react-stability-v707.css');
  const sw707=readText('dist/web/photobridge-sw-v707.js');
  if(runtime707!==srcRuntime707) fail('v707 source/dist runtime mismatch');
  for(const doc of [index707,srcIndex707,store707]) if(!doc.includes('/photobridge-runtime-v707.js?v=707')&&!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782'))))) fail('v707 React-safe runtime ref missing');
  if(!index707.includes('index-UIRefine-v655.js?v=689&pb=707')&&!index707.includes('index-UIRefine-v655.js?v=689&pb=708')&&!index707.includes('index-UIRefine-v655.js?v=689&pb=709')&&!index707.includes('index-UIRefine-v655.js?v=689&pb=710')&&!index707.includes('index-UIRefine-v655.js?v=689&pb=724')) fail('v707 bundle cache-bust ref missing');
  for(const forbidden of ['appendChild(invite)','replaceChildren(label)','insertBefore(sep','new MutationObserver']) if(runtime707.includes(forbidden)) fail('v707 runtime contains React-unsafe structural mutation: '+forbidden);
  for(const needle of ['__PB707_RUNTIME__','photobridge-sw-v707.js','pb707InstallButton']) if(!runtime707.includes(needle)) fail('v707 runtime missing: '+needle);
  if(!css707.includes('photographerMobileHeaderQuickActions>.mobileHeaderInvite')) fail('v707 invite CSS positioning missing');
  if(sw707.includes('respondWith(')) fail('v707 service worker must not intercept navigation/API');
  console.log('[PhotoBridge Deploy Lite] v707 verified: React-owned DOM is not reparented by active runtime; PWA/header helpers are isolated outside #root.');
}



// v708 mobile header / install state: keep React DOM stable while aligning the two-row controls.
{
  const index708=readText('dist/web/index.html');
  const srcIndex708=readText('apps/web/index.html');
  const store708=readText('dist/api/equipment-rental-book.html');
  const runtime708=readText('dist/web/photobridge-runtime-v708.js');
  const srcRuntime708=readText('apps/web/public/photobridge-runtime-v708.js');
  const css708=readText('dist/web/photobridge-mobile-header-v708.css');
  const srcCss708=readText('apps/web/public/photobridge-mobile-header-v708.css');
  const sw708=readText('dist/web/photobridge-sw-v708.js');
  const srcSw708=readText('apps/web/public/photobridge-sw-v708.js');
  if(runtime708!==srcRuntime708) fail('v708 source/dist runtime mismatch');
  if(css708!==srcCss708) fail('v708 source/dist CSS mismatch');
  if(sw708!==srcSw708) fail('v708 source/dist service worker mismatch');
  for(const doc of [index708,srcIndex708,store708]) if((!doc.includes('/photobridge-runtime-v708.js?v=708')&&!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))))||(!doc.includes('/photobridge-mobile-header-v708.css?v=708')&&!doc.includes('/photobridge-mobile-header-v709.css?v=709')&&!doc.includes('/photobridge-mobile-header-v710.css?v=710')&&!doc.includes('/photobridge-mobile-header-v711.css?v=711'))) fail('v708-compatible active refs missing');
  if(!index708.includes('index-UIRefine-v655.js?v=689&pb=708')&&!index708.includes('index-UIRefine-v655.js?v=689&pb=709')&&!index708.includes('index-UIRefine-v655.js?v=689&pb=710')&&!index708.includes('index-UIRefine-v655.js?v=689&pb=724')) fail('v708-compatible bundle cache-bust ref missing');
  for(const forbidden of ['appendChild(invite)','replaceChildren(label)','insertBefore(sep','new MutationObserver']) if(runtime708.includes(forbidden)) fail('v708 runtime contains React-unsafe structural mutation: '+forbidden);
  for(const needle of ['__PB708_RUNTIME__','beforeinstallprompt','appinstalled','measurePrimaryActions','--pb708-row-total','photobridge-sw-v708.js']) if(!runtime708.includes(needle)) fail('v708 runtime missing: '+needle);
  for(const needle of ['#f4f8ff','--pb708-invite-w','--pb708-install-w','position:fixed!important','mobileHeaderInvite']) if(!css708.includes(needle)) fail('v708 CSS missing: '+needle);
  if(sw708.includes('respondWith(')) fail('v708 service worker must not intercept navigation/API');
  console.log('[PhotoBridge Deploy Lite] v708 verified: aligned mobile secondary row, install-state detection and soft-blue React-safe header are ready.');
}


// v709 React-owned mobile header/PWA: install CTA is a React sibling, not an external/fixed DOM overlay.
{
  const index709=readText('dist/web/index.html');
  const srcIndex709=readText('apps/web/index.html');
  const store709=readText('dist/api/equipment-rental-book.html');
  const runtime709=readText('dist/web/photobridge-runtime-v709.js');
  const srcRuntime709=readText('apps/web/public/photobridge-runtime-v709.js');
  const css709=readText('dist/web/photobridge-mobile-header-v709.css');
  const srcCss709=readText('apps/web/public/photobridge-mobile-header-v709.css');
  const sw709=readText('dist/web/photobridge-sw-v709.js');
  const srcSw709=readText('apps/web/public/photobridge-sw-v709.js');
  const bundle709=readText('dist/web/assets/index-UIRefine-v655.js');
  const source709=readText('apps/web/src/main.tsx');
  if(runtime709!==srcRuntime709) fail('v709 source/dist runtime mismatch');
  if(css709!==srcCss709) fail('v709 source/dist CSS mismatch');
  if(sw709!==srcSw709) fail('v709 source/dist service worker mismatch');
  for(const doc of [index709,srcIndex709,store709]) if((!doc.includes('/photobridge-runtime-v709.js?v=709')&&!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))))||(!doc.includes('/photobridge-mobile-header-v709.css?v=709')&&!doc.includes('/photobridge-mobile-header-v710.css?v=710')&&!doc.includes('/photobridge-mobile-header-v711.css?v=711'))) fail('v709-compatible active refs missing');
  if(!index709.includes('index-UIRefine-v655.js?v=689&pb=709')&&!index709.includes('index-UIRefine-v655.js?v=689&pb=710')&&!index709.includes('index-UIRefine-v655.js?v=689&pb=724')) fail('v709-compatible bundle cache-bust ref missing');
  for(const forbidden of ['appendChild(invite)','replaceChildren(label)','insertBefore(sep','new MutationObserver']) if(runtime709.includes(forbidden)) fail('v709 runtime contains React-unsafe structural mutation: '+forbidden);
  if(index709.includes('/photobridge-runtime-v709.js?v=709')) for(const needle of ['mobileHeaderInstall pb709InstallButton','PB709InstallApp']) if(!bundle709.includes(needle)||!source709.includes(needle.split(' ')[0])) fail('v709 React install button missing: '+needle);
  for(const needle of ['pb709InstallReady','pb709Installed','beforeinstallprompt','appinstalled','getInstalledRelatedApps','photobridge-sw-v709.js']) if(!runtime709.includes(needle)) fail('v709 runtime missing: '+needle);
  for(const needle of ['#f2f7ff','--pb709-row-w','flex-flow:row wrap','mobileHeaderInstall.pb709InstallButton']) if(!css709.includes(needle)) fail('v709 CSS missing: '+needle);
  if(sw709.includes('respondWith(')) fail('v709 service worker must not intercept navigation/API');
  console.log('[PhotoBridge Deploy Lite] v709 verified: React-owned two-row mobile header, installed-aware PWA CTA and pale-blue header are ready.');
}


// v710 deterministic two-row mobile header: nested React/static rows isolate the header from legacy direct-child CSS.
{
  const index710=readText('dist/web/index.html');
  const srcIndex710=readText('apps/web/index.html');
  const store710=readText('dist/api/equipment-rental-book.html');
  const runtime710=readText('dist/web/photobridge-runtime-v710.js');
  const srcRuntime710=readText('apps/web/public/photobridge-runtime-v710.js');
  const css710=readText('dist/web/photobridge-mobile-header-v710.css');
  const srcCss710=readText('apps/web/public/photobridge-mobile-header-v710.css');
  const sw710=readText('dist/web/photobridge-sw-v710.js');
  const srcSw710=readText('apps/web/public/photobridge-sw-v710.js');
  const bundle710=readText('dist/web/assets/index-UIRefine-v655.js');
  const source710=readText('apps/web/src/main.tsx');
  if(runtime710!==srcRuntime710) fail('v710 source/dist runtime mismatch');
  if(css710!==srcCss710) fail('v710 source/dist CSS mismatch');
  if(sw710!==srcSw710) fail('v710 source/dist service worker mismatch');
  for(const doc of [index710,srcIndex710,store710]) if((!doc.includes('/photobridge-runtime-v710.js?v=710')&&!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))))||(!doc.includes('/photobridge-mobile-header-v710.css?v=710')&&!doc.includes('/photobridge-mobile-header-v711.css?v=711'))) fail('v710-compatible active refs missing');
  if(!index710.includes('index-UIRefine-v655.js?v=689&pb=710')&&!index710.includes('index-UIRefine-v655.js?v=689&pb=724')) fail('v710 bundle cache-bust ref missing');
  for(const forbidden of ['appendChild(invite)','replaceChildren(label)','insertBefore(sep','new MutationObserver']) if(runtime710.includes(forbidden)) fail('v710 runtime contains React-unsafe structural mutation: '+forbidden);
  for(const needle of ['photographerMobileHeaderPrimaryRow','photographerMobileHeaderSecondaryRow','mobileHeaderInstall pb710InstallButton','PB710InstallApp']) if(!bundle710.includes(needle)||!source710.includes(needle==='PB710InstallApp'?needle:needle.split(' ')[0])) fail('v710 React header structure missing: '+needle);
  for(const needle of ['pb710InstallReady','pb710Installed','beforeinstallprompt','appinstalled','getInstalledRelatedApps','photobridge-sw-v710.js','writeMarker(false)']) if(!runtime710.includes(needle)) fail('v710 runtime missing: '+needle);
  for(const needle of ['#f3f8ff','--pb710-actions-w','photographerMobileHeaderPrimaryRow','photographerMobileHeaderSecondaryRow','mobileHeaderInstall.pb710InstallButton']) if(!css710.includes(needle)) fail('v710 CSS missing: '+needle);
  for(const needle of ['id="storeInviteBtn"','id="storeInstallBtn"','photographerMobileHeaderPrimaryRow','photographerMobileHeaderSecondaryRow']) if(!store710.includes(needle)) fail('v710 Store header parity missing: '+needle);
  if(sw710.includes('respondWith(')) fail('v710 service worker must not intercept navigation/API');
  console.log('[PhotoBridge Deploy Lite] v710 verified: deterministic nested mobile header rows, store parity, stale-install recovery and pale-blue header are ready.');
}

// v711 mobile context strip: body-owned bar, React DOM remains untouched.
{
  const index711=readText('dist/web/index.html');
  const srcIndex711=readText('apps/web/index.html');
  const runtime711=readText('dist/web/photobridge-runtime-v711.js');
  const srcRuntime711=readText('apps/web/public/photobridge-runtime-v711.js');
  const css711=readText('dist/web/photobridge-mobile-header-v711.css');
  const srcCss711=readText('apps/web/public/photobridge-mobile-header-v711.css');
  if(runtime711!==srcRuntime711) fail('v711 source/dist runtime mismatch');
  if(css711!==srcCss711) fail('v711 source/dist CSS mismatch');
  for(const doc of [index711,srcIndex711]) if((!doc.includes('/photobridge-runtime-v711.js?v=711')&&!doc.includes('/photobridge-runtime-v711.js?v=714')&&!doc.includes('/photobridge-runtime-v711.js?v=716')&&!doc.includes('/photobridge-runtime-v711.js?v=718')&&!doc.includes('/photobridge-runtime-v711.js?v=719')&&!doc.includes('/photobridge-runtime-v711.js?v=720')&&!doc.includes('/photobridge-runtime-v711.js?v=723')&&!doc.includes('/photobridge-runtime-v711.js?v=724')&&!doc.includes('/photobridge-runtime-v711.js?v=727')&&!doc.includes('/photobridge-runtime-v711.js?v=730&pb=730')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786')&&!(doc.includes('/photobridge-runtime-v711.js?v=731&pb=731')||(doc.includes('/photobridge-runtime-v711.js?v=771&pb=771')||(doc.includes('/photobridge-runtime-v711.js?v=775&pb=775')||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))||(doc.includes('/photobridge-runtime-v711.js?v=776&pb=776')||doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')))))||!doc.includes('/photobridge-mobile-header-v711.css?v=711')) fail('v711 active refs missing');
  for(const needle of ['pb711PhotographerContextBar','روتوش صورت AI','سایر ابزارهای AI','گالری جدید','galleryCount()','modelCount()','data-pb711-filter','data-pb711-grid','document.body.appendChild(bar)']) if(!runtime711.includes(needle)) fail('v711 context runtime missing: '+needle);
  for(const forbidden of ['h.insertAdjacentElement','app.appendChild(bar)','app.insertBefore(bar)','replaceChildren(label)']) if(runtime711.includes(forbidden)) fail('v711 runtime mutates React-owned structure: '+forbidden);
  for(const needle of ['#pb711PhotographerContextBar','html.pb711AiContext','html.pb711GalleryContext','html.pb711DesignContext','--pb711-context-h:42px','linear-gradient(100deg,#1d4ed8,#4338ca)']) if(!css711.includes(needle)) fail('v711 context CSS missing: '+needle);
  console.log('[PhotoBridge Deploy Lite] v711 verified: mobile AI, Gallery, Album and Instagram context controls live in the attached blue strip without reparenting React nodes.');
}



// v728 installed-app/browser Web Push notifications.
{
  const index728=readText('dist/web/index.html');
  const srcIndex728=readText('apps/web/index.html');
  const push728=readText('dist/web/photobridge-push-v728.js');
  const srcPush728=readText('apps/web/public/photobridge-push-v728.js');
  const sw728=readText('dist/web/photobridge-sw-v710.js');
  const srcSw728=readText('apps/web/public/photobridge-sw-v710.js');
  const migration134=readText('migrations/134_web_push_notifications.sql');
  const package728=readText('package.json');
  const build728=readText('dist/web/photobridge-build.json');
  if(push728!==srcPush728) fail('v728 source/dist push runtime mismatch');
  if(sw728!==srcSw728) fail('v728 source/dist service worker mismatch');
  for(const doc of [index728,srcIndex728]) if(!doc.includes('/photobridge-push-v728.js?v=728')&&!doc.includes('/photobridge-push-v728.js?v=782&pb=782')) fail('v728 push runtime ref missing');
  for(const needle of ['PushManager','Notification.requestPermission','pushManager.subscribe','/api/push/public-key','/api/lab/push/subscribe','/api/customer/push/subscribe','PB_PUSH_FOREGROUND','playForegroundSound']) if(!push728.includes(needle)) fail('v728 push client missing: '+needle);
  for(const needle of ["self.addEventListener('push'","showNotification(title","silent:false","vibrate:[220,100,220]","notificationclick","PB_PUSH_FOREGROUND"]) if(!sw728.includes(needle)) fail('v728 service worker push handling missing: '+needle);
  for(const needle of ['web-push','ensureWebPushVapid','sendWebPushToRecipient','web_push_subscriptions','/api/push/public-key','/api/lab/push/subscribe','/api/customer/push/subscribe']) if(!serverText.includes(needle)) fail('v728 push backend missing: '+needle);
  for(const needle of ['CREATE TABLE IF NOT EXISTS web_push_subscriptions','recipient_lab_id','recipient_user_id','endpoint text NOT NULL UNIQUE']) if(!migration134.includes(needle)) fail('v728 push migration missing: '+needle);
  if(!package728.includes('"web-push": "3.6.7"')) fail('v728 web-push dependency missing');
  if(!['728','729','730','731','771','775','776','782','783','784','786'].some(v=>build728.includes('"'+v+'"'))) fail('v728-compatible build marker missing');
  console.log('[PhotoBridge Deploy Lite] v728 verified: Web Push, PhotoBridge icon, foreground tone, vibration and workflow notifications are ready.');
}


// v729 mobile print composer: original controls stay visible in real page flow on phones.
{
  const index729=readText('dist/web/index.html');
  const srcIndex729=readText('apps/web/index.html');
  const css729=readText('dist/web/photobridge-mobile-print-actions-v729.css');
  const srcCss729=readText('apps/web/public/photobridge-mobile-print-actions-v729.css');
  const bundle729=readText('dist/web/assets/index-UIRefine-v655.js');
  const source729=readText('apps/web/src/main.tsx');
  const build729=readText('dist/web/photobridge-build.json');
  if(css729!==srcCss729) fail('v729 source/dist mobile print CSS mismatch');
  for(const doc of [index729,srcIndex729]) if(!doc.includes('/photobridge-mobile-print-actions-v729.css?v=729')) fail('v729 mobile print CSS ref missing');
  for(const doc of [bundle729,source729]) if(!doc.includes('simplePrintPilotMobileInlineActions')) fail('v729 inline print controls missing');
  for(const needle of ['simplePrintPilotMobileHeaderHost','simplePrintPilotPrimaryAdd','simplePrintPilotHeaderSubmit']) if(!css729.includes(needle)) fail('v729 mobile print CSS missing: '+needle);
  if(!['729','730','731','771','775','776','782','783','784','786'].some(v=>build729.includes('"'+v+'"'))) fail('v729-compatible build marker missing');
  console.log('[PhotoBridge Deploy Lite] v729 verified: mobile print size/file and send controls render once in page flow and cannot disappear behind the header.');
}


// v730 Liara ONNX install hardening: use the official skip switch for optional network/CUDA downloads.
{
  const npmrc730=readText('.npmrc');
  const package730=readText('package.json');
  const preflight730=readText('scripts/verify-onnx-runtime.mjs');
  const runtime730=readText('dist/web/photobridge-runtime-v711.js');
  const srcRuntime730=readText('apps/web/public/photobridge-runtime-v711.js');
  const sw730=readText('dist/web/photobridge-sw-v710.js');
  const srcSw730=readText('apps/web/public/photobridge-sw-v710.js');
  const build730=readText('dist/web/photobridge-build.json');
  const index730=readText('dist/web/index.html');
  const srcIndex730=readText('apps/web/index.html');
  if(!npmrc730.includes('onnxruntime-node-install=skip')) fail('v730 official ONNX install skip config missing');
  if(!npmrc730.includes('onnxruntime-node-install-cuda=skip')) fail('v730 legacy ONNX CUDA skip guard missing');
  if(!package730.includes('"onnxruntime-node": "1.21.0"')) fail('v730 ONNX version pin changed unexpectedly');
  if(!package730.includes('verify-onnx-runtime.mjs')) fail('v730 ONNX runtime preflight is not wired into build/verify');
  for(const needle of ['onnxruntime-node-install=skip','InferenceSession','Tensor','1.21.0']) if(!preflight730.includes(needle)) fail('v730 ONNX preflight missing: '+needle);
  if(runtime730!==srcRuntime730) fail('v730 source/dist runtime mismatch');
  if(sw730!==srcSw730) fail('v730 source/dist service worker mismatch');
  if(!['730','731','771','775','776','782','783','784','786'].some(v=>runtime730.includes("const CURRENT_BUILD='"+v+"';"))) fail('v730-compatible runtime build marker missing');
  if(!['730','731','771','775','776','782','783','784','786'].some(v=>sw730.includes('photobridge-pwa-v'+v)&&sw730.includes("version:'"+v+"'"))) fail('v730-compatible service-worker marker missing');
  if(!['730','731','771','775','776','782','783','784','786'].some(v=>build730.includes('"'+v+'"'))) fail('v730-compatible build json marker missing');
  for(const doc of [index730,srcIndex730]) if(!['/photobridge-runtime-v711.js?v=730&pb=730','/photobridge-runtime-v711.js?v=731&pb=731','/photobridge-runtime-v711.js?v=771&pb=771','/photobridge-runtime-v711.js?v=775&pb=775','/photobridge-runtime-v711.js?v=776&pb=776','/photobridge-runtime-v711.js?v=782&pb=782','/photobridge-runtime-v711.js?v=786&pb=786'].some(n=>doc.includes(n))) fail('v730 runtime cache-bust ref missing');
  console.log('[PhotoBridge Deploy Lite] v730 verified: Liara skips optional ONNX network/CUDA install work and validates the CPU binding after npm install.');
}


// v731 exact mobile print/album alignment and deterministic real print controls.
{
  const index731=readText('dist/web/index.html');
  const srcIndex731=readText('apps/web/index.html');
  const css731=readText('dist/web/photobridge-mobile-print-layout-v731.css');
  const srcCss731=readText('apps/web/public/photobridge-mobile-print-layout-v731.css');
  const bundle731=readText('dist/web/assets/index-UIRefine-v655.js');
  const source731=readText('apps/web/src/main.tsx');
  const runtime731=readText('dist/web/photobridge-runtime-v711.js');
  const sw731=readText('dist/web/photobridge-sw-v710.js');
  const build731=readText('dist/web/photobridge-build.json');
  if(css731!==srcCss731) fail('v731 source/dist CSS mismatch');
  for(const doc of [index731,srcIndex731]) {
    if(!doc.includes('/photobridge-mobile-print-layout-v731.css?v=731')) fail('v731 mobile layout CSS ref missing');
    if(!['/photobridge-runtime-v711.js?v=731&pb=731','/photobridge-runtime-v711.js?v=771&pb=771','/photobridge-runtime-v711.js?v=775&pb=775','/photobridge-runtime-v711.js?v=776&pb=776','/photobridge-runtime-v711.js?v=782&pb=782','/photobridge-runtime-v711.js?v=786&pb=786'].some(n=>doc.includes(n))) fail('v731 runtime cache-bust ref missing');
  }
  for(const doc of [bundle731,source731]) if(!doc.includes('simplePrintPilotMobileInlineActions')) fail('v731 real inline print controls missing');
  for(const needle of ['--pb731-print-gap:12px','photographerAlbumListFlush','simplePrintPilotMobileInlineActions','simplePrintPilotPrimaryAdd','simplePrintPilotHeaderSubmit','#simple-print-pilot-mobile-header-slot.simplePrintPilotMobileHeaderHost']) if(!css731.includes(needle)) fail('v731 layout CSS missing: '+needle);
  if(!['731','771','775','776','782','783','784','786'].some(v=>runtime731.includes("const CURRENT_BUILD='"+v+"';"))) fail('v731 runtime build marker missing');
  if(!['731','771','775','776','782','783','784','786'].some(v=>sw731.includes('photobridge-pwa-v'+v)&&sw731.includes("version:'"+v+"'"))) fail('v731 service-worker marker missing');
  if(!['731','771','775','776','782','783','784','786'].some(v=>build731.includes('"'+v+'"'))) fail('v731 build json marker missing');
  console.log('[PhotoBridge Deploy Lite] v731 verified: print/album launch buttons align below the mobile header and the real print composer actions stay visible without duplicates.');
}

// v771 checks the files actually served by Liara, including the prebuilt React bundle.
{
  const index=readText('dist/web/index.html'), srcIndex=readText('apps/web/index.html');
  const css=readText('dist/web/photobridge-ui-fixes-v771.css');
  const js=readText('dist/web/photobridge-appearance-v771.js');
  const bundle=readText('dist/web/assets/index-UIRefine-v655.js');
  const runtime=readText('dist/web/photobridge-runtime-v711.js');
  const manifest=readText('dist/web/photobridge.webmanifest');
  if(css!==readText('apps/web/public/photobridge-ui-fixes-v771.css')) fail('v771 source/dist CSS mismatch');
  if(js!==readText('apps/web/public/photobridge-appearance-v771.js')) fail('v771 source/dist appearance mismatch');
  for(const doc of [index,srcIndex]) {
    if(!doc.includes('/photobridge-ui-fixes-v771.css?v=771')||(!doc.includes('/photobridge-appearance-v771.js?v=771')&&!doc.includes('/photobridge-appearance-v771.js?v=786'))) fail('v771 live assets missing');
  }
  if(!bundle.includes('pb771AppearanceAdminTab')||!bundle.includes('PB771OpenAppearance')) fail('v771 admin control missing from served React bundle');
  for(const needle of ['albumFileToolbar{display:none','albumFileQcCard>img','--pb771-top','pb771InstallChecking']) if(!css.includes(needle)) fail('v771 styling missing: '+needle);
  if(!js.includes('topColor')||!js.includes('/api/admin/appearance')) fail('v771 three-color appearance control missing');
  if(!['771','775','776','782','783','784','786'].some(v=>runtime.includes("const CURRENT_BUILD='"+v+"';"))||!runtime.includes('pb771InstallChecking')) fail('v771 install detection missing');
  if(!manifest.includes('related_applications')) fail('v771 related app manifest missing');
  if(!serverText.includes('topColor: topColor.toLowerCase()')) fail('v771 three-color persistence missing');
  console.log('[PhotoBridge Deploy Lite] v771 verified: visible admin three-color control, panoramic album cards and PWA install-state guard are in shipped assets.');
}

// v772 Windows source is included in the lean deployment and in the separate installer preview.
{
  const main=readText('apps/lab-desktop/main-v745.cjs');
  const host=readText('apps/lab-desktop/local-host.cjs');
  const composer=readText('apps/lab-desktop/desktop-intake.js');
  const intake=readText('apps/lab-desktop/intake.cjs');
  const preload=readText('apps/lab-desktop/preload-v745.cjs');
  const installer=readText('apps/lab-desktop/installer-preview/Install.ps1');
  const manifest=JSON.parse(readText('dist/private-downloads/lab-desktop.json'));
  if(!main.includes("ipcMain.handle('desktop:open-intake'")||!host.includes("name==='/desktop-intake'")
    ||!readText('apps/lab-desktop/desktop-intake.html').includes('/desktop-intake.js')) fail('v772 separate desktop composer missing');
  if(!composer.includes('byMode={print:')||!composer.includes('resend-sms')||!preload.includes('openIntake:')) fail('v772 separate tabs or invitation controls missing');
  if(!intake.includes('isPrintSizeId')||!intake.includes('invitation_sms_sent')) fail('v772 print-size/invitation sync missing');
  if(!installer.includes('Set-RoundedButton')||!installer.includes('AutoScaleMode')) fail('v772 installer appearance missing');
  if(manifest.version!=='0.17.772'||manifest.filename!=='PhotoBridge_Lab_Windows_v772_install_preview.zip') fail('v772 Windows release manifest missing');
  console.log('[PhotoBridge Deploy Lite] v772 verified: separate Windows intake window, isolated print/album files and invitation status are included.');
}


// v779 admin-photographer Sunburst input hardening: always send fresh RGB8 PNGs.
{
  const ui779=readText('dist/web/photobridge-photographer-subject-v779.js');
  const srcUi779=readText('apps/web/public/photobridge-photographer-subject-v779.js');
  if(ui779!==srcUi779) fail('v779 subject edit source/dist mismatch');
  for(const doc of [readText('dist/web/index.html'),readText('apps/web/index.html')]){
    if(!doc.includes('/photobridge-photographer-subject-v779.js?v=779')) fail('v779 subject edit asset ref missing');
    if(doc.includes('/photobridge-photographer-subject-v778.js?v=778')||doc.includes('/photobridge-photographer-subject-v777.js?v=777')) fail('older subject edit asset must not remain active');
  }
  const serverText=readText('dist/api/server.js');
  for(const needle of ['gpt-image-2.5-sunburst',"AI_SUBJECT_EDIT_QUALITY = 'low'",'/api/customer/ai-subject-edit/render','composeOriginalFaceOnAiPrint','compatibilityGate:false','normalizeSubjectEditInput','removeAlpha()','.png({compressionLevel:9','rgb8-png-v779','protected-source-rgb8.png','target-reference-rgb8.png','new Uint8Array(original)','655_360','8_294_400']) if(!serverText.includes(needle)) fail('v779 server subject edit missing: '+needle);
  const endpoint=serverText.slice(serverText.indexOf("if(req.method==='POST'&&url.pathname==='/api/customer/ai-subject-edit/render')"),serverText.indexOf("if (req.method === 'POST' && (url.pathname === '/api/customer/ai-subject-composite/outline'",serverText.indexOf("if(req.method==='POST'&&url.pathname==='/api/customer/ai-subject-edit/render')")));
  if(endpoint.includes('checkSubjectReferenceCompatibility')||endpoint.includes('subject_reference_incompatible')||endpoint.includes('compatibility_check_failed')) fail('v779 compatibility gate is active');
  for(const needle of ['ساخت دو خروجی آزمایشی','خروجی ۱ · خروجی اصلی AI','خروجی ۲ · صورت فایل اصلی','۳۰×۴۰ سانتی‌متر','RGB8 PNG ورودی']) if(!ui779.includes(needle)) fail('v779 UI subject edit missing: '+needle);
  console.log('[PhotoBridge Deploy Lite] v779 verified: Sunburst inputs are normalized to fresh RGB8 PNG files before upload; dual outputs remain enabled.');
}

// v779 — normalized files, rather than camera bytes, must reach OpenAI.
{
  const serverText=readText('dist/api/server.js');
  for(const needle of ['normalizeSubjectEditInput','toColourspace(\'srgb\')','removeAlpha()','image-1-source','image-2-reference','inputNormalization:\'rgb8-png-v779\'','sourceForAi.bytes','targetForAi.bytes']) if(!serverText.includes(needle)) fail('v779 subject input normalization missing: '+needle);
  const endpoint=serverText.slice(serverText.indexOf("if(req.method==='POST'&&url.pathname==='/api/customer/ai-subject-edit/render')"),serverText.indexOf("if (req.method === 'POST' && (url.pathname === '/api/customer/ai-subject-composite/outline'",serverText.indexOf("if(req.method==='POST'&&url.pathname==='/api/customer/ai-subject-edit/render')")));
  if(!endpoint.includes("normalizeSubjectEditInput(source.bytes,'image-1-source')")||!endpoint.includes("normalizeSubjectEditInput(target.bytes,'image-2-reference')")) fail('v779 normalized images are not wired into subject edit endpoint');
  console.log('[PhotoBridge Deploy Lite] v779 verified: subject-edit inputs are rebuilt as standard RGB8 PNG files before OpenAI.');
}

// v782 — cumulative mobile push repair + install-flow permission + restored splash and v781 workflow assets.
{
  const index782=readText('dist/web/index.html');
  const srcIndex782=readText('apps/web/index.html');
  const runtime782=readText('dist/web/photobridge-runtime-v711.js');
  const push782=readText('dist/web/photobridge-push-v728.js');
  const sw782=readText('dist/web/photobridge-sw-v710.js');
  const server782=readText('dist/api/server.js');
  const build782=readText('dist/web/photobridge-build.json');
  for(const doc of [index782,srcIndex782]){
    if(!doc.includes('/photobridge-runtime-v711.js?v=782&pb=782')&&!doc.includes('/photobridge-runtime-v711.js?v=783&pb=783')&&!doc.includes('/photobridge-runtime-v711.js?v=782&pb=782&release=784')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786&release=786')&&!doc.includes('/photobridge-runtime-v711.js?v=786&pb=786&release=807')) fail('v782+ runtime cache-bust ref missing');
    if(!doc.includes('/photobridge-push-v728.js?v=782&pb=782')&&!doc.includes('/photobridge-push-v728.js?v=783&pb=783')&&!doc.includes('/photobridge-push-v728.js?v=782&pb=782&release=784')&&!doc.includes('/photobridge-push-v728.js?v=782&pb=782&release=786')) fail('v782+ push cache-bust ref missing');
    if(!(doc.includes('/photobridge-lab-workflow-v781.js?v=781&pb=782')||doc.includes('/photobridge-lab-workflow-v781.js?v=781&pb=783'))||!(doc.includes('/photobridge-lab-workflow-v781.css?v=781&pb=782')||doc.includes('/photobridge-lab-workflow-v781.css?v=781&pb=783'))) fail('v782+ cumulative v781 workflow refs missing');
    if(!doc.includes('pbAppSplashV780')||!doc.includes('Snell Roundhand')||(!doc.includes('#030a14')&&!doc.includes('#030912'))) fail('v782+ installed-app splash refresh missing');
  }
  if(!(runtime782.includes("const CURRENT_BUILD='782';")||runtime782.includes("const CURRENT_BUILD='783';")||runtime782.includes("const CURRENT_BUILD='784';")||runtime782.includes("const CURRENT_BUILD='786';"))||!runtime782.includes('PB782PreparePushForInstall')) fail('v782+ install-flow push permission bridge missing');
  for(const needle of ['permissionSupported','PB782PreparePushForInstall','PB782SyncPush']) if(!push782.includes(needle)) fail('v782+ push client missing: '+needle); if(!push782.includes("LAST_SYNC='photobridge:push:last-sync:v782'")&&!push782.includes("LAST_SYNC='photobridge:push:last-sync:v783'")) fail('v782+ push sync marker missing');
  if(!(sw782.includes("const VERSION='photobridge-pwa-v782';")||sw782.includes("const VERSION='photobridge-pwa-v783';")||sw782.includes("const VERSION='photobridge-pwa-v784';")||sw782.includes("const VERSION='photobridge-pwa-v786';"))||!(sw782.includes("version:'782'")||sw782.includes("version:'783'")||sw782.includes("version:'784'")||sw782.includes("version:'786'"))) fail('v782+ service-worker version/cache bust missing');
  if(!build782.includes('"782"')&&!build782.includes('"783"')&&!build782.includes('"784"')&&!build782.includes('"786"')) fail('v782+ build marker missing');
  const apiStart=server782.indexOf('async function api(req, res, url)');
  const publicKeyRoute=server782.indexOf("url.pathname === '/api/push/public-key'",apiStart);
  if(apiStart<0||publicKeyRoute<apiStart||publicKeyRoute-apiStart>2500) fail('v782 public VAPID key route is not in the main API router');
  const rentalPage=server782.slice(server782.indexOf('async function serveAdminEquipmentRentalPage'),apiStart);
  if(rentalPage.includes("/api/push/public-key")) fail('v782 stale unreachable push public-key route still exists in admin page renderer');
  for(const needle of ['photographer_subject_edit_jobs','/api/customer/ai-subject-edit/finalize','print_jpeg_conversion_failed']) if(!server782.includes(needle)) fail('v782 cumulative prior fix missing: '+needle);
  console.log('[PhotoBridge Deploy Lite] v782 verified: push public-key route, install-flow permission, subscription recovery, splash refresh and cumulative v781 workflow are ready.');
}


// v783 — account-scoped push logout, RTL, app-native Coming Soon, invoice shortcut, header identity and unified splash.
{
  const index783=readText('dist/web/index.html'),push783=readText('dist/web/photobridge-push-v728.js'),sw783=readText('dist/web/photobridge-sw-v710.js');
  const polish783=readText('dist/web/photobridge-v783-polish.js'),polishCss783=readText('dist/web/photobridge-v783-polish.css');
  const manifest783=readText('dist/web/photobridge.webmanifest'),server783=readText('dist/api/server.js'),store783=readText('dist/api/equipment-rental-book.html'),coming783=readText('dist/web/photobridge-design-coming-soon-v664.js');
  for(const n of ['/photobridge-v783-polish.js?v=783','/photobridge-v783-polish.css?v=783','/photobridge-icon-512-v783.png']) if(!index783.includes(n)) fail('v783 index asset missing: '+n);
  for(const n of ['PB783UnsubscribePushForLogout','PB_PUSH_LOGOUT','photobridge:finance:focus-invoice','__PB783_LOGOUT_FETCH_WRAP__']) if(!push783.includes(n)) fail('v783 push lifecycle missing: '+n);
  for(const n of ['PB_PUSH_LOGOUT','pb783Rtl']) if(!sw783.includes(n)) fail('v783 service worker missing: '+n);
  if(!sw783.includes("const VERSION='photobridge-pwa-v783';")&&!sw783.includes("const VERSION='photobridge-pwa-v784';")&&!sw783.includes("const VERSION='photobridge-pwa-v786';")) fail('v783+ service worker version missing');
  for(const n of ['photographerStoreEntry','pb783StoreComingSoon','pb783FinanceShortcut','مدیریت ','عکاسی ']) if(!polish783.includes(n)) fail('v783 app polish missing: '+n);
  if(!polishCss783.includes('#pb783FinanceShortcut')||!polishCss783.includes('.pb783StoreComingSoon')) fail('v783 app polish css missing');
  if(!(manifest783.includes('"theme_color": "#071426"')||manifest783.includes('"theme_color": "#dff2f6"'))||!(manifest783.includes('photobridge-icon-512-v783.png')||manifest783.includes('photobridge-icon-512-v785.png'))) fail('v783+ manifest/theme alignment missing');
  if(!server783.includes('equipmentRentalPhotographerCanDiscoverShop')||!server783.includes("role='photographer' AND active=true")) fail('v843 collaboration store server gate missing');
  if(!store783.includes('if(!target.connected)')||!store783.includes('درخواست همکاری')||!store783.includes('storePhotographerManager')) fail('v843 direct store collaboration gate missing');
  if(!coming783.includes('isPhotographerDesignPath')||!coming783.includes("if(!isPhotographerDesignPath())show()")) fail('v783 in-app design Coming Soon behavior missing');
  console.log('[PhotoBridge Deploy Lite] v843 verified over v783: push/logout polish remains and Store access now uses collaboration approval instead of admin-only Coming Soon.');
}

// v784 — instant mobile Print navigation + cross-tab scroll/layout cleanup.
{
  const index784=readText('dist/web/index.html');
  const app784=readText('dist/web/assets/index-UIRefine-v655.js');
  const reset784=readText('dist/web/photobridge-mobile-route-reset-v726.js');
  const runtime784=readText('dist/web/photobridge-runtime-v711.js');
  const sw784=readText('dist/web/photobridge-sw-v710.js');
  const build784=readText('dist/web/photobridge-build.json');
  if(!index784.includes('index-UIRefine-v655.js?v=689&pb=724&fix=726&push=728&print=729&ui=767&release=784')&&!index784.includes('index-UIRefine-v655.js?v=689&pb=724&fix=726&push=728&print=729&ui=767&release=786')&&!index784.includes('index-UIRefine-v655.js?v=689&pb=724&fix=726&push=728&print=729&ui=767&release=806')) fail('v784+ main bundle cache-bust missing');
  if(!index784.includes('/photobridge-mobile-route-reset-v726.js?v=784')&&!index784.includes('/photobridge-v786-route-stability.js?v=786')) fail('v784+ route stability asset missing');
  if(!app784.includes('Ne=()=>{if(!H&&_e){$("flow"),Fe("orders"),Dn("/photographer/orders/flow?workspace=print"),pt();return}')) fail('v784 instant photographer Print navigation missing');
  if(app784.includes('Ne=async()=>{try{const Nt=await Me("/api/customer/labs")')) fail('v784 blocking Print navigation still present');
  for(const n of ['isTargetRoute=()=>/^\\/photographer','--pb742-content-top','pb737-mobile-print-dock','document.scrollingElement']) if(!reset784.includes(n)) fail('v784 mobile route cleanup missing: '+n);
  if(!runtime784.includes("const CURRENT_BUILD='784';")&&!runtime784.includes("const CURRENT_BUILD='786';")) fail('v784+ runtime build marker missing');
  if(!(sw784.includes("const VERSION='photobridge-pwa-v784';")&&sw784.includes("version:'784'"))&&!(sw784.includes("const VERSION='photobridge-pwa-v786';")&&sw784.includes("version:'786'"))) fail('v784+ service worker marker missing');
  if(!build784.includes('"784"')&&!build784.includes('"786"')) fail('v784+ build json marker missing');
  console.log('[PhotoBridge Deploy Lite] v784 verified: mobile Print opens immediately and reused mobile scroll/layout state is reset between tabs.');
}


// v786 — stable scroll, deterministic Store route and admin-defined browser chrome color.
{
  const index786=readText('dist/web/index.html');
  const route786=readText('dist/web/photobridge-v786-route-stability.js');
  const css786=readText('dist/web/photobridge-v786-route-stability.css');
  const runtime786=readText('dist/web/photobridge-runtime-v711.js');
  const appearance786=readText('dist/web/photobridge-appearance-v771.js');
  const manifest786=readText('dist/web/photobridge.webmanifest');
  for(const n of ['/photobridge-v786-route-stability.js?v=786','/photobridge-v786-route-stability.css?v=786','pb786ThemeBoot']) if(!index786.includes(n)) fail('v786 index asset missing: '+n);
  if(!index786.includes('/photobridge-runtime-v711.js?v=786&pb=786&release=786')&&!index786.includes('/photobridge-runtime-v711.js?v=786&pb=786&release=807')) fail('v786 index asset missing: /photobridge-runtime-v711.js?v=786&pb=786&release=786');
  for(const n of ['__PB786_ROUTE_STABILITY__','cleanupPrintLeak','pb786StoreRoute','stopImmediatePropagation','history.pushState(null','/photographer/store']) if(!route786.includes(n)) fail('v786 route stability missing: '+n);
  if(route786.includes('scrollTop=0')||route786.includes('scrollTop = 0')||route786.includes('scrollTo({top:0')) fail('v786 route stability must not reset mobile scroll');
  for(const n of ['overflow-anchor:none','touch-action:pan-y','pb786PhotographerNonPrint']) if(!css786.includes(n)) fail('v786 stable scroller CSS missing: '+n);
  if(!runtime786.includes("const CURRENT_BUILD='786';")||!runtime786.includes("return 'store';")||!runtime786.includes("mode==='store'")) fail('v786 runtime Store context/build marker missing');
  if(!appearance786.includes("TOP_CACHE='photobridge:appearance:top'")||!manifest786.includes('"theme_color": "#dff2f6"')) fail('v786 browser theme persistence missing');
  console.log('[PhotoBridge Deploy Lite] v786 verified: mobile scroll stays native, Store navigation is isolated, and browser chrome follows Admin Appearance.');
}

// v790 — shipped mobile finance chrome, gallery order modal/back and Iran IP hint.
{
  const index790=readText('dist/web/index.html');
  const srcIndex790=readText('apps/web/index.html');
  const js789=readText('dist/web/photobridge-v789-runtime-fix.js');
  const js790=readText('dist/web/photobridge-v790-runtime-fix.js');
  const srcJs790=readText('apps/web/public/photobridge-v790-runtime-fix.js');
  const css790=readText('dist/web/photobridge-v790-runtime-fix.css');
  const srcCss790=readText('apps/web/public/photobridge-v790-runtime-fix.css');
  const server790=readText('dist/api/server.js');
  if(js790!==srcJs790) fail('v790 source/dist runtime JS mismatch');
  if(css790!==srcCss790) fail('v790 source/dist runtime CSS mismatch');
  for(const doc of [index790,srcIndex790]) {
    if(!doc.includes('/photobridge-v790-runtime-fix.js?v=790')) fail('v790 runtime JS ref missing');
    if(!doc.includes('/photobridge-v790-runtime-fix.css?v=790')) fail('v790 runtime CSS ref missing');
  }
  for(const n of ['pb790FinanceChrome','pb790PrintOrderButton','pb790SelectionOverlay','pb790VpnHint','clientGalleryOptionalOrdering','pb790GalleryManager']) if(!js790.includes(n)) fail('v790 runtime JS missing: '+n);
  for(const n of ['data-pb790-finance','pb790-finance-chrome','pb790PrintOrderButton','pb790SelectionOverlay','clientGalleryOptionalOrdering','pb790VpnHint']) if(!css790.includes(n)) fail('v790 runtime CSS missing: '+n);
  for(const n of ["'/api/network/country'",'cf-ipcountry','x-forwarded-for','outsideIran']) if(!server790.includes(n)) fail('v790 network-country API missing: '+n);
  console.log('[PhotoBridge Deploy Lite] v790 verified: finance header/scroll, gallery selection/print modal separation, gallery Back handling and non-Iran IP hint are shipped in live dist assets.');
}


// v791 — finance lab selector context, gallery modal stack, lifetime and manual delete.
{
  const index791=readText('dist/web/index.html');
  const srcIndex791=readText('apps/web/index.html');
  const js791=readText('dist/web/photobridge-v791-runtime-fix.js');
  const srcJs791=readText('apps/web/public/photobridge-v791-runtime-fix.js');
  const css791=readText('dist/web/photobridge-v791-runtime-fix.css');
  const srcCss791=readText('apps/web/public/photobridge-v791-runtime-fix.css');
  const server791=readText('dist/api/server.js');
  const source791=readText('apps/web/src/main.tsx');
  if(js791!==srcJs791) fail('v791 source/dist runtime JS mismatch');
  if(css791!==srcCss791) fail('v791 source/dist runtime CSS mismatch');
  for(const doc of [index791,srcIndex791]){
    if(!doc.includes('/photobridge-v791-runtime-fix.js?v=791')) fail('v791 runtime JS ref missing');
    if(!doc.includes('/photobridge-v791-runtime-fix.css?v=791')) fail('v791 runtime CSS ref missing');
  }
  for(const n of ['pb791FinanceContext','appendWorkspacePrint','pb791GalleryLifetime','pb791DeleteGallery','DELETE']) if(!js791.includes(n)) fail('v791 runtime JS missing: '+n);
  for(const n of ['pb791-finance','photographerPrintTopLab','2147483646','pb791GalleryLifetime','pb791DeleteGallery']) if(!css791.includes(n)) fail('v791 runtime CSS missing: '+n);
  for(const n of ["req.method === 'DELETE'","client_gallery.delete","photographer_gallery_retouch_proofs"]) if(!server791.includes(n)) fail('v791 gallery delete API missing: '+n);
  if(!source791.includes("'?workspace=print':''")||!source791.includes('clientGalleryRemainingLabel')||!source791.includes('pb791DeleteGallery')) fail('v791 source mirror missing');
  console.log('[PhotoBridge Deploy Lite] v791 verified: Print finance keeps lab context, modal selectors stack above the dialog, and gallery lifetime/delete controls are shipped.');
}

// v792 — React-safe customer gallery modes, notes modal and paid gallery renewal.
{
  const index792=readText('dist/web/index.html');
  const srcIndex792=readText('apps/web/index.html');
  const js792=readText('dist/web/photobridge-v792-runtime-fix.js');
  const srcJs792=readText('apps/web/public/photobridge-v792-runtime-fix.js');
  const css792=readText('dist/web/photobridge-v792-runtime-fix.css');
  const srcCss792=readText('apps/web/public/photobridge-v792-runtime-fix.css');
  const js789=readText('dist/web/photobridge-v789-runtime-fix.js');
  const js790=readText('dist/web/photobridge-v790-runtime-fix.js');
  const js787=readText('dist/web/photobridge-v787-gallery-fix.js');
  const js791=readText('dist/web/photobridge-v791-runtime-fix.js');
  const server792=readText('dist/api/server.js');
  const migration792=readText('migrations/142_photographer_gallery_renewals.sql');
  const source792=readText('apps/web/src/main.tsx');
  if(js792!==srcJs792) fail('v792 source/dist runtime JS mismatch');
  if(css792!==srcCss792) fail('v792 source/dist runtime CSS mismatch');
  for(const doc of [index792,srcIndex792]){
    if(!doc.includes('/photobridge-v792-runtime-fix.js?v=792')) fail('v792 runtime JS ref missing');
    if(!doc.includes('/photobridge-v792-runtime-fix.css?v=792')) fail('v792 runtime CSS ref missing');
    if(!doc.includes('/photobridge-v790-runtime-fix.js?v=790&patch=792')) fail('v792 v790 cache refresh missing');
    if(!doc.includes('/photobridge-v791-runtime-fix.js?v=791&patch=792')) fail('v792 v791 cache refresh missing');
  }
  for(const n of ['pb792OrderOpen','pb792CompactNote','pb792GalleryCart','kind||\'\')!==\'selection\'','document.body.appendChild(layer)']) if(!js792.includes(n)) fail('v792 customer-gallery runtime missing: '+n);
  if(!js789.includes('v792 owns public-gallery DOM safely')) fail('v792 unsafe v789 public-gallery mutation guard missing');
  if(!js790.includes('v792 owns public-gallery DOM safely')) fail('v792 unsafe v790 public-gallery mutation guard missing');
  if(!js787.includes("btn.id='pb787-invoice-portal'")||!js787.includes('document.body.appendChild(btn)')) fail('v792 safe invoice portal missing');
  if(!js791.includes('pb792RenewGallery')||!js791.includes('/renew')||!js791.includes('pb792Renewable')) fail('v792 gallery renewal runtime missing');
  if(!js791.includes('ms>0&&ms<=7*24*60*60*1000')) fail('v792 renewal window must exclude expired galleries');
  for(const n of ['pb792Priced','pb792SelectionOnly','pb792InvoicePortal','pb792Renewable']) if(!css792.includes(n)) fail('v792 CSS missing: '+n);
  for(const n of ['photographer_gallery_renewals','client_gallery.renew','gallery_renewal_not_yet_available','gallery_renewal_expired','client_gallery_renewal']) if(!server792.includes(n)) fail('v792 renewal API missing: '+n);
  for(const n of ['photographer_gallery_renewals','idempotency_key','deadline_kind','deadline_after']) if(!migration792.includes(n)) fail('v792 renewal migration missing: '+n);
  for(const n of ['galleryRenewEligible','renewGallery','noteMediaId',"kind:'selection'",'عکس در سبد خرید']) if(!source792.includes(n)) fail('v792 source mirror missing: '+n);
  console.log('[PhotoBridge Deploy Lite] v792 verified: React-safe gallery layout switching, order-only invoice mode, multi-view note modal and idempotent 30-day gallery renewal are shipped.');
}

// v793 — mobile lab identity parity, visible customer totals, polished renewal, Instagram beta and Gallery video guides.
{
  const index793=readText('dist/web/index.html');
  const srcIndex793=readText('apps/web/index.html');
  const js793=readText('dist/web/photobridge-v793-runtime-fix.js');
  const srcJs793=readText('apps/web/public/photobridge-v793-runtime-fix.js');
  const css793=readText('dist/web/photobridge-v793-runtime-fix.css');
  const srcCss793=readText('apps/web/public/photobridge-v793-runtime-fix.css');
  if(js793!==srcJs793) fail('v793 source/dist runtime JS mismatch');
  if(css793!==srcCss793) fail('v793 source/dist runtime CSS mismatch');
  for(const doc of [index793,srcIndex793]){
    if(!doc.includes('/photobridge-v793-runtime-fix.js?v=793')) fail('v793 runtime JS ref missing');
    if(!doc.includes('/photobridge-v793-runtime-fix.css?v=793')) fail('v793 runtime CSS ref missing');
  }
  for(const n of ['pb793CartTotal','pb793FinalizeTotal','openRenewModal','pb793GalleryGuideButton','findGuide','photographerInstagramDesignEntry']) if(!js793.includes(n)) fail('v793 runtime JS missing: '+n);
  for(const n of ['justify-content:flex-start!important','pb793CartTotal','pb793SheetIn','pb792RenewGallery','آزمایشی','pb793GalleryGuideButton']) if(!css793.includes(n)) fail('v793 runtime CSS missing: '+n);
  if(!js793.includes("galleryWords=['gallery','گالری']")||!js793.includes("target==='instagram'")) fail('v793 two-slot Gallery guide matching is missing');
  if(!js793.includes("e.stopImmediatePropagation?.();void openRenewModal(renew)")) fail('v793 polished renewal does not own the legacy raw confirmation click');
  console.log('[PhotoBridge Deploy Lite] v793 verified: mobile lab label parity, visible customer invoice totals, animated gallery sheets, polished renewal, Instagram beta and two Gallery video-guide slots are ready.');
}


// v827 — central equipment bank, compact store forms and multi-photo galleries.
{
  const server827=readText('dist/api/server.js');
  const portal827=readText('dist/api/equipment-rental-portal.html');
  const admin827=readText('dist/api/admin-equipment-rental.html');
  const migration827=readText('migrations/143_equipment_global_catalog_gallery.sql');
  for(const n of ['equipment_global_categories','equipment_global_brands','equipment_global_products','catalog_product_id','gallery_images']) if(!migration827.includes(n)) fail('v827 migration missing: '+n);
  for(const n of ['equipmentGlobalCatalogSnapshot','equipmentGalleryNormalize','equipmentItemPublic','/api/admin/equipment-catalog/products']) if(!server827.includes(n)) fail('v827 server missing: '+n);
  for(const n of ['itemCatalogProduct','saleCatalogProduct','equipmentBrandOptions','pb827GalleryStrip','galleryImages']) if(!portal827.includes(n)) fail('v827 rental portal missing: '+n);
  for(const n of ['data-tab="catalog"','globalCategoryForm','globalBrandForm','globalProductForm','/api/admin/equipment-catalog']) if(!admin827.includes(n)) fail('v827 admin catalog missing: '+n);
  console.log('[PhotoBridge Deploy Lite] v827 verified: central equipment bank, editable admin catalog, compact category-first store forms and eight-photo galleries are ready.');
}

// v833 — clean equipment hierarchy and resilient preset gallery hookup.
{
  const portal833=readText('dist/api/equipment-rental-portal.html');
  const migration833=readText('migrations/148_equipment_preset_image_bank_v833.sql');
  for(const n of ['PhotoBridge v833','pb833ModelCore','pb833PresetUrls','pb833ApplyPresetFromCurrent','#itemsCategoryFilters .categoryChip']) if(!portal833.includes(n)) fail('v833 rental portal missing: '+n);
  for(const n of ['Alpha 7R VI','Alpha 7 V','EOS R6 V','jsonb_array_length']) if(!migration833.includes(n)) fail('v833 image-bank migration missing: '+n);
  console.log('[PhotoBridge Deploy Lite] v833 verified: cleaner equipment filters and resilient preset-gallery auto-fill are ready.');
}

// v838 — unified minimalist store navigation and resilient Sony/Canon photo fallbacks.
{
  const portal838=readText('dist/api/equipment-rental-portal.html');
  const version838=readText('VERSION.md');
  for(const n of ['pb838DesktopNav','rentalDesktopTabIndicator','pb838SyncDesktopTabIndicator','pb838OrderImageUrls','referrerpolicy="no-referrer"']) if(!portal838.includes(n)) fail('v838 store portal missing: '+n);
  for(const n of ['data-rental-desktop-tab="photographers"','data-rental-desktop-tab="sms"','data-rental-desktop-tab="subscription"','data-rental-desktop-tab="settings"']) if(!portal838.includes(n)) fail('v838 unified navigation missing: '+n);
  if(portal838.includes('data-rental-tab="catalog">دسته‌های اختصاصی')||portal838.includes('data-tab="catalog">دسته‌های اختصاصی')) fail('v838 custom-category nav must be removed');
  if(portal838.includes('id="rentalHeaderSettings"')) fail('v838 legacy settings gear must be removed');
  for(const n of ['sony|alpha 1 ii','sony|fe 24-70mm f2.8 gm ii','canon|eos r1','canon|eos r6 mark iii','canon|rf 70-200mm f2.8 l is usm z','commons.wikimedia.org/wiki/Special:Redirect/file']) if(!portal838.includes(n)) fail('v838 photo fallback missing: '+n);
  if(!/v(838|839|840|841|842|843)\b/.test(version838)) fail('v838+ version marker missing');
  console.log('[PhotoBridge Deploy Lite] v838 verified: unified animated store navigation and resilient Sony/Canon equipment photo fallbacks are ready.');

// v841 — restore rental item edit cancellation handler removed during v840 optimization.
{
  const portal841 = readText('dist/api/equipment-rental-portal.html');
  const version841 = readText('VERSION.md');
  if(!portal841.includes('function cancelItemEdit(){')) fail('v841 rental cancelItemEdit handler missing');
  if(!portal841.includes("$('#itemEditCancel')?.addEventListener('click',()=>{if(typeof cancelItemEdit==='function')cancelItemEdit()})")) fail('v843 safe rental cancel button binding missing');
  if(!/v(841|842|843)\b/.test(version841)) fail('v841+ version marker missing');
  console.log('[PhotoBridge Deploy Lite] v841 verified: rental item modal cancellation handler is restored and startup ReferenceError is fixed.');
}

}


// v839 — clean two-sided header, hierarchical animated filters, no duplicate body nav.
{
  const portal839=readText('dist/api/equipment-rental-portal.html');
  const version839=readText('VERSION.md');
  for(const n of ['PhotoBridge v839','pb839FilterIndicator','pb839SyncFilterIndicators','pb839BrandIndicator']) if(!portal839.includes(n)) fail('v839 store portal missing: '+n);
  if(portal839.includes('<nav class="tabs" id="tabs">')) fail('v839 duplicate body tab nav must be removed');
  if(portal839.includes('id="rentalDesktopSectionTitle"')) fail('v839 dynamic center section title must be removed');
  if(!portal839.includes("$('#tabs')?.addEventListener")) fail('v839 optional legacy tab binding missing');
  if(!portal839.includes('background:transparent!important;color:#667085!important')) fail('v839 neutral subscription identity styling missing');
  if(!/v(839|840|841|842|843)\b/.test(version839)) fail('v839+ version marker missing');
  console.log('[PhotoBridge Deploy Lite] v839 verified: two-sided clean header, hierarchical animated filters and duplicate navigation cleanup are ready.');
}

// v840 — faster store cards, calmer tab motion and compact rental pricing.
{
  const portal840=readText('dist/api/equipment-rental-portal.html');
  const version840=readText('VERSION.md');
  for(const n of ['PhotoBridge v840','pb840ImageUrlCache','pb840BadImageUrls','pb840CardMeta','rentalItemMoneyInline','loading="lazy"','decoding="async"']) if(!portal840.includes(n)) fail('v840 store portal missing: '+n);
  if(portal840.includes('<span class="pb831BrandFilterLabel">برند</span>')) fail('v840 brand label must be removed from header filters');
  if(!portal840.includes('فروشگاه تجهیزات عکاسی و فیلم‌برداری · ')) fail('v840 shop identity prefix missing');
  if(!/v(840|841|842|843)\b/.test(version840)) fail('v840+ version marker missing');
  
console.log('[PhotoBridge Deploy Lite] v840 verified: faster lazy equipment images, calmer animated tabs, cleaner card metadata and compact rental pricing are ready.');
}

// v842 — settings, finance/photographer subtabs and deferred equipment images.
{
  const portal842=readText('dist/api/equipment-rental-portal.html');
  const version842=readText('VERSION.md');
  for(const n of ['PhotoBridge v842','pb842SubTabs','accountingLedgerPhotographer','برنامه هشدار ویندوز','pb842FallbackImage','PB842_IMAGE_CONCURRENCY=3','pb842RenderedTabs']) if(!portal842.includes(n)) fail('v842 store portal missing: '+n);
  for(const n of ['equipment-fallback/tripod.svg','equipment-fallback/light.svg','equipment-fallback/audio.svg','equipment-fallback/video.svg','equipment-fallback/loading.svg']) if(!fs.existsSync('dist/web/'+n)) fail('v842 fallback asset missing: '+n);
  if(!/v(842|843)\b/.test(version842)) fail('v842+ version marker missing');
  console.log('[PhotoBridge Deploy Lite] v842 verified: Settings owns the Windows alert agent, finance/photographer sub-tabs are organized, and deferred equipment images are ready.');
}

