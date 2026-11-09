import fs from 'node:fs';
import path from 'node:path';
import { deduplicateOnnxRuntime } from './deduplicate-onnx-runtime.mjs';


// Emit the exact stage name before execution so truncated Liara logs still
// identify the last attempted patch. Re-throw on failures; never hide exit codes.
let completedDeploySteps = 0;
async function deployStep(specifier) {
  const started = Date.now();
  console.log(`[PhotoBridge Docker build] START ${specifier}`);
  try {
    await import(specifier);
  } catch (error) {
    console.error(`[PhotoBridge Docker build] FAIL ${specifier} after ${Date.now() - started}ms`);
    console.error(error?.stack || error);
    throw error;
  }
  console.log(`[PhotoBridge Docker build] OK ${specifier} (${Date.now() - started}ms)`);
  // In the Liara worker, ESM modules and large patched assets accumulate over
  // 100+ stages. Opportunistic GC keeps peak memory lower without changing
  // file output or weakening any regression tests.
  if (global.gc && ++completedDeploySteps % 8 === 0) global.gc();
}

// R89: expose the npm jsQR browser bundle as a first-party static asset for mobile equipment scanning.
try {
  const jsqrSrc = path.join('node_modules','jsqr','dist','jsQR.js');
  const jsqrDst = path.join('dist','web','vendor-jsqr-1.4.0.js');
  if (fs.existsSync(jsqrSrc)) {
    fs.mkdirSync(path.dirname(jsqrDst), { recursive:true });
    fs.copyFileSync(jsqrSrc, jsqrDst);
    console.log('[PhotoBridge Liara Fast Build] local jsQR scanner asset prepared.');
  } else {
    console.warn('[PhotoBridge Liara Fast Build] jsQR package asset not present before build; npm install must provide jsqr@1.4.0.');
  }
} catch (e) {
  console.warn(`[PhotoBridge Liara Fast Build] jsQR vendor copy skipped: ${String(e?.message || e)}`);
}

const required = [
  'dist/web/storefront.html',
  'dist/web/storefront.js',
  'dist/web/storefront.css',
  'dist/web/photobridge-r1207-frame-catalog.js',
  'dist/web/assets/photobridge-handover-vazirmatn.woff2',
  'dist/api/server.js',
  'dist/api/faceDetectorWorker.js',
  'dist/api/stage4CompositeWorker.js',
  'dist/web/index.html',
  'dist/web/assets/index-UIRefine-v586.css',
  'scripts/migrate.mjs',
  'migrations/142_photographer_gallery_renewals.sql',
  'migrations/143_equipment_global_catalog_gallery.sql',
  'migrations/145_equipment_store_model_catalog.sql',
  'migrations/146_equipment_preset_image_bank.sql',
  'migrations/147_equipment_preset_image_bank_repair.sql',
  'migrations/148_equipment_preset_image_bank_v833.sql',
  'migrations/149_equipment_preset_image_bank_v835.sql',
  'migrations/150_equipment_lens_photo_bank_v836.sql',
  'migrations/151_equipment_complete_camera_photo_bank_v837.sql'
];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`[PhotoBridge Liara Fast Build] missing ${file}`);
    process.exit(2);
  }
}
const html = fs.readFileSync('dist/web/index.html','utf8');
const moduleSrc = html.match(/<script[^>]*type=[\"']module[\"'][^>]*src=[\"']([^\"']+)[\"'][^>]*>/i)?.[1]
  || html.match(/<script[^>]*src=[\"']([^\"']*\/assets\/index-[^\"']+\.js[^\"']*)[\"'][^>]*type=[\"']module[\"'][^>]*>/i)?.[1];
if (!moduleSrc) {
  console.error('[PhotoBridge Liara Fast Build] main module script missing from dist/web/index.html');
  process.exit(3);
}
const modulePath = moduleSrc.split('?')[0].replace(/^\//, '');
const moduleFile = path.join('dist/web', modulePath);
if (!fs.existsSync(moduleFile)) {
  console.error(`[PhotoBridge Liara Fast Build] main module file missing: ${moduleFile}`);
  process.exit(3);
}
for (const marker of [
  '/assets/index-UIRefine-v586.css',
  '/photobridge-v795-runtime-fix.js?v=795',
  '/photobridge-v795-runtime-fix.css?v=795'
]) {
  if (!html.includes(marker)) {
    console.error(`[PhotoBridge Liara Fast Build] index marker missing: ${marker}`);
    process.exit(3);
  }
}
console.log(`[PhotoBridge Liara Fast Build] main bundle accepted: ${moduleSrc}`);

deduplicateOnnxRuntime();

console.log('[PhotoBridge Liara Fast Build] R100 prebuilt dist accepted; mobile blue chrome + lean desktop UI regeneration.');

// Fail fast if a regression test pins an obsolete release token; this guard
// used to fail much later after most UI patch stages had already run.
console.log('[PhotoBridge Docker build] START deployment revision compatibility tests');
const {execFileSync: checkRevisionCompat} = await import('node:child_process');
checkRevisionCompat(process.execPath, ['--test','scripts/test-r1350-deploy-revision-compat.cjs'], {stdio:'inherit'});
console.log('[PhotoBridge Docker build] OK deployment revision compatibility tests');



await deployStep("./enable-r1094-windows-print-handovers.mjs");
await deployStep("./enable-r1087-commitment-autoprint.mjs");
await deployStep("./remove-r1092-legacy-windows-alert-panel.mjs");
await deployStep("./fix-r1093-inventory-visibility.mjs");
await deployStep("./enable-r1095-customer-rental-stock-modes.mjs");
await deployStep("./enable-r1095-stock-mode-ui.mjs");
await deployStep("./enable-r1096-photographer-store-ui.mjs");
await deployStep("./enable-r1097-store-readability.mjs");
await deployStep("./enable-r1098-stock-privacy.mjs");
await deployStep("./enable-r1099-photographer-tabs.mjs");
await deployStep("./enable-r1105-lab-origin-release.mjs");
await deployStep("./enable-r1106-test-account-visibility.mjs");
await deployStep("./enable-r1106-mobile-store-panel.mjs");
await deployStep("./enable-r1108-gallery-trial.mjs");
await deployStep("./enable-r1109-gallery-lifetime.mjs");
await deployStep("./enable-r1112-gallery-single-form.mjs");
await deployStep("./enable-r1113-gallery-text-dialogs.mjs");
await deployStep("./enable-r1118-lab-finance.mjs");
await deployStep("./enable-r1119-mobile-chat.mjs");
await deployStep("./enable-r1120-gallery-controls.mjs");
await deployStep("./enable-r1121-print-orders.mjs");
await deployStep("./enable-r1124-photographer-desktop-header.mjs");
await deployStep("./enable-r1138-primary-lab-intake.mjs");
await deployStep("./enable-r1142-intake-copies-customer.mjs");
await deployStep("./enable-r1143-folder-storage.mjs");
await deployStep("./enable-r1148-lab-profile-image.mjs");
await deployStep("./enable-r1147-lab-admin-header.mjs");
await deployStep("./enable-r1151-lab-mobile-print-navigation.mjs");
await deployStep("./enable-r1152-gallery-layout-prices.mjs");
await deployStep("./enable-r1155-gallery-pinned-filters.mjs");
await deployStep("./enable-r1158-gallery-compact-cards.mjs");
await deployStep("./prepare-store-desktop-ui.mjs");
await deployStep("./prepare-lab-desktop-ui.mjs");
await deployStep("./reassemble-r1091-store-installer.mjs");
await deployStep("./create-r1092-windows-installer-zip.mjs");
await deployStep("./enable-r1132-final-assets.mjs");
await deployStep("./enable-r1159-gallery-intro-cards.mjs");
await deployStep("./enable-r1160-gallery-card-actions.mjs");
await deployStep("./enable-r1162-gallery-header-delete.mjs");
await deployStep("./enable-r1163-photographer-gallery-header.mjs");
await deployStep("./enable-r1164-gallery-tariff-photos.mjs");
await deployStep("./enable-r1176-lab-finance.mjs");
await deployStep("./enable-r1177-lab-settings-finance.mjs");
await deployStep("./enable-r1178-release.mjs");
await deployStep("./enable-r1179-lab-walkin-invoice-view.mjs");
await deployStep("./enable-r1180-lab-order-details.mjs");
await deployStep("./enable-r1181-server.mjs");
await deployStep("./enable-r1181-lab-photo-controls.mjs");
await deployStep("./enable-r1182-lab-file-availability.mjs");
await deployStep("./enable-r1182-lab-download-client.mjs");
await deployStep("./enable-r1183-lab-direct-stream.mjs");
await deployStep("./enable-r1183-lab-image-ui.mjs");
await deployStep("./enable-r1183-finalize.mjs");
await deployStep("./enable-r1184-lab-walkin-album.mjs");
await deployStep("./enable-r1184-finalize.mjs");
await deployStep("./enable-r1185-lab-desktop-statement-layout.mjs");
await deployStep("./enable-r1186-lab-walkin-button.mjs");
await deployStep("./enable-r1187-photo-tab-jitter.mjs");
await deployStep("./enable-r1188-lab-browser-tabs.mjs");
await deployStep("./enable-r1189-lab-queue-stability.mjs");
await deployStep("./enable-r1190-desktop-tab-speed.mjs");
await deployStep("./enable-r1192-mobile-pwa-tabs.mjs");
await deployStep("./enable-r1193-photographer-stable-tabs.mjs");
await deployStep("./enable-r1194-gallery-create-dialog.mjs");
await deployStep("./enable-r1195-gallery-create-compact.mjs");
await deployStep("./enable-r1196-gallery-field-align.mjs");
await deployStep("./enable-r1197-gallery-create-four-fields.mjs");
await deployStep("./enable-r1201-lab-controls.mjs");
await deployStep("./enable-r1202-lab-invoice-preview-counters.mjs");



await deployStep("./enable-r1208-frame-palette.mjs");
await deployStep("./generate-r1222-brand-icons.mjs");
await deployStep("./enable-r1250-store-order-sms.mjs");
await deployStep("./enable-r1252-frame-customer-layout.mjs");

await deployStep("./enable-r1267-lab-site.mjs");

await deployStep("./enable-r1268-equipment-site.mjs");

await deployStep("./enable-r1269-equipment-navigation.mjs");

await deployStep("./enable-r1270-equipment-pages.mjs");

await deployStep("./enable-r1271-equipment-collections.mjs");

await deployStep("./enable-r1272-site-typography.mjs");

await deployStep("./enable-r1273-text-editor.mjs");

await deployStep("./enable-r1274-equipment-layout.mjs");

await deployStep("./enable-r1275-site-position.mjs");

await deployStep("./enable-r1276-equipment-reviews.mjs");

await deployStep("./enable-r1284-original-launch.mjs");

await deployStep("./enable-r1291-lab-manual-customer-accounts.mjs");


await deployStep("./enable-r1296-lab-settings.mjs");

await deployStep("./enable-r1297-lab-settings-speed.mjs");

await deployStep("./enable-r1298-lab-header-navigation.mjs");

await deployStep("./enable-r1299-lab-initial-debt.mjs");

await deployStep("./enable-r1301-lab-site-general.mjs");
await deployStep("./enable-r1302-mobile-login.mjs");


await deployStep("./enable-r1307-desktop-print-controls.mjs");

await deployStep("./enable-r1308-finance-and-entry.mjs");

await deployStep("./enable-r1309-single-desktop-header.mjs");

await deployStep("./enable-r1310-gallery-mobile-layout.mjs");


await deployStep("./enable-r1311-panel-session-refresh.mjs");

// R1314 runs after session reset; a failing regression test blocks the Docker image.
await deployStep("./enable-r1314-print-workspace.mjs");
console.log("[PhotoBridge Docker build] START R1314 regression tests");
const { execFileSync: runR1314 } = await import("node:child_process");
runR1314(process.execPath, ["--test", "scripts/test-r1314-print-workspace.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1314 regression tests");

// Keep the scroll/header fix after R1314 and block an invalid production payload.
await deployStep("./enable-r1315-print-scroll-and-lab-header.mjs");
console.log("[PhotoBridge Docker build] START R1315 regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1315-print-scroll-and-lab-header.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1315 regression tests");

// R1316: wait for both Print controls before revealing the second header row.
await deployStep("./enable-r1316-atomic-print-scroll.mjs");
console.log("[PhotoBridge Docker build] START R1316 regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1316-atomic-print-scroll.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1316 regression tests");

// R1317: use measured viewport bounds and settle Lab readiness on actual content.
await deployStep("./enable-r1317-print-viewport-fast-lab.mjs");
console.log("[PhotoBridge Docker build] START R1317 regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1317-print-viewport-fast-lab.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1317 regression tests");


// Safe rollback: Liara v1765-v1768 failed after this stage was introduced.
// Keep R1312 source untouched for isolated diagnosis; retain working R1311 output.
console.log('[PhotoBridge Docker build] R1312 temporarily disabled; retaining R1311 desktop panels.');

await deployStep("./enable-r1318-photographer-gallery.mjs");

await deployStep("./enable-r1322-mobile-print-cards.mjs");

await deployStep("./enable-r1325-desktop-avatar-print-grid.mjs");

await deployStep("./enable-r1326-archive-preview.mjs");

await deployStep("./refresh-r1328-lab-desktop-manifest.mjs");
console.log("[R1328] START gallery / invite regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1328-gallery-invite.cjs"], { stdio: "inherit" });
console.log("[R1328] OK gallery / invite regression tests");

await deployStep("./enable-r1330-home-gallery-polish.mjs");

await deployStep("./enable-r1331-gallery-retouch-sms.mjs");

await deployStep("./enable-r1332-gallery-cards-brand.mjs");

await deployStep("./enable-r1335-retouch-optional-note.mjs");

await deployStep("./enable-r1336-gallery-feedback.mjs");

await deployStep("./enable-r1337-retouch-refresh.mjs");

await deployStep("./enable-r1334-login-width.mjs");

await deployStep("./enable-r1337-gallery-retouch-refresh.mjs");
await deployStep("./enable-r1338-retouch-upload-progress.mjs");
await deployStep("./enable-r1340-retouch-correction-only.mjs");
console.log("[R1337] START gallery retouch upload regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1337-gallery-retouch-refresh.cjs"], { stdio: "inherit" });
console.log("[R1337] OK gallery retouch upload regression tests");
console.log("[R1338] START retouch progress regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1338-retouch-upload-progress.cjs"], { stdio: "inherit" });
console.log("[R1338] OK retouch progress regression tests");

console.log("[R1340] START correction-only retouch UI tests");
runR1314(process.execPath, ["--test", "scripts/test-r1340-retouch-correction-only.cjs"], { stdio: "inherit" });
console.log("[R1340] OK correction-only retouch UI tests");

await deployStep("./enable-r1341-compact-retouch-cards.mjs");

await deployStep("./enable-r1344-gallery-create-pricing.mjs");

// Generate fresh OS-owned PWA branding AFTER the last mobile UI patch,
// BEFORE the final Lab UI snapshot. No duplicate HTML splash and no changes
// to the desktop Electron icon.
await deployStep("./enable-r1359-mobile-blue-launch.mjs");
console.log("[R1359] START mobile PWA blue brand regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1359-mobile-blue-launch.cjs", "scripts/test-r1222-mobile-brand.cjs"], { stdio: "inherit", env: { ...process.env, PB_TEST_PWA_REVISION: "r1359" } });
console.log("[R1359] OK mobile PWA blue brand regression tests");
await deployStep("./enable-r1361-mobile-startup-caption.mjs");
console.log("[R1361] START readable mobile launch tests");
runR1314(process.execPath, ["--test", "scripts/test-r1361-mobile-startup-caption.cjs"], { stdio: "inherit" });
console.log("[R1361] OK readable mobile launch tests");

// Native Lab UI stays unobstructed. Run the minimal overlay regression
// BEFORE regenerating the final website UI package consumed by Windows.
console.log("[PhotoBridge Docker build] START R1356 quiet Lab overlay tests");
runR1314(process.execPath, ["--test", "scripts/test-r1356-lab-overlay-minimal.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1356 quiet Lab overlay tests");

// The R1328 manifest refresh runs BEFORE the late R1330–R1344 UI patches.
// Rebuild the LAB payload at the very end; otherwise Windows downloads
// a valid but OLD snapshot while the website shows the new layout.
// The same module was imported earlier in this Node process. ESM caches it by
// module URL, so importing the identical specifier a second time is a NO-OP.
// Use a distinct module URL to force regenerating the final, patched web UI.
// R1363 must run after older Lab CSS patches and before the final Windows UI snapshot.
await deployStep("./enable-r1363-lab-queue.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1363-single-order-alarm.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1364-lab-tabs.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1364-lab-tabs.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1365-lab-options.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1365-lab-options.cjs", "scripts/test-r1369-installer-upload.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1367-admin-grants.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1367-admin-grants.cjs", "scripts/test-r1368-menu-build.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1367-intake-invoice-sms.mjs");
await deployStep("./enable-r1370-installer-zip.mjs");
await deployStep("./enable-r1372-third-header.mjs");
await deployStep("./enable-r1373-installer-domains.mjs");
await deployStep("./enable-r1374-domain-payment.mjs");
await deployStep("./enable-r1376-invite-actions.mjs");
await deployStep("./enable-r1377-domain-gateway.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1377-domain-gateway.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1376-invite-actions.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1374-domain-orders.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1373-installer-domains.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1372-third-header.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1370-installer-zip.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1367-intake-invoice-sms.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1378-lab-fixes.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1378-lab-fixes.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1379-album-matrix.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1379-album-matrix.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1380-flat-album-editor.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1380-album-editor.cjs", "scripts/test-r1381-inline-menu.cjs", "scripts/test-r1382-compact-colors.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1383-album-images.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1383-album-images.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1384-album-galleries.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1384-album-galleries.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1385-album-save.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1385-album-save.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1386-storage-target.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1386-storage-target.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1389-storage-feedback.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1390-folder-picker.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1390-folder-picker.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1388-lab-expiry.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1388-lab-expiry.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1391-lab-existing-account.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1391-lab-existing-account.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1393-shared-account.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1393-shared-account.cjs", "scripts/test-r1393-reset-guard.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1394-collaboration-feedback.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1394-collaboration-feedback.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1395-storage-pair.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1395-storage-pair.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1396-alert-spacing.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1396-alert-spacing.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1397-notice-flow.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1397-notice-flow.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1398-cooperation-notifications.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1398-cooperation-alerts.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1399-cooperation-state.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1399-cooperation-state.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1400-print-chooser-refresh.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1400-print-chooser.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1400-quick-reply.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1402-chat-voice.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1402-chat-voice.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1403-independent-lab-roles.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1403-build.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1404-chat-style.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1405-chat-picker.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1405-chat-picker.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1406-lab-chat.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1406-lab-chat.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1407-chat-behavior.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1407-chat-behavior.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1409-active-lab-chat.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1409-active-lab-chat.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1410-invite-flow.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1410-invite-flow.cjs"], { stdio: "inherit" });
runR1314(process.execPath, ["--test", "scripts/test-r1411-existing-invite.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1418-finance-presentation.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1418-finance-presentation.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1419-finance-footer.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1419-finance-footer.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1420-payment-list.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1420-payment-list.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1421-finance-toolbar.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1421-finance-toolbar.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1423-finance-bars.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1423-finance-bars.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1425-finance-second-row.mjs");
await deployStep("./enable-r1427-invoice-customer.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1427-invoice-customer.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1428-finance-header.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1428-finance-header.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1429-header-order.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1429-header-order.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1430-finance-alignment.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1430-finance-alignment.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1431-finance-documents.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1431-finance-documents.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1433-header-settling.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1433-header-settling.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1434-album-guidance.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1434-album-guidance.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1435-finance-row-actions.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1435-finance-row-actions.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1436-settings-invites.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1436-settings-invites.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1437-finance-details.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1437-finance-details.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1438-photographer-controls.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1438-photographer-controls.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1439-finance-toolbar-parity.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1439-finance-toolbar-parity.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1440-storage-layout.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1440-storage-layout.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1441-photographer-cards.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1441-photographer-cards.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1442-store-finance.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1442-store-finance.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1443-lab-layout-polish.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1443-lab-layout-polish.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1444-order-labels-settlement.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1444-order-labels-settlement.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1445-lab-wallet-pending.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1445-lab-wallet-pending.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1446-lab-wallet-prereg-subscription.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1446-lab-wallet-prereg-subscription.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1445-download-repair.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1445-download-repair.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1450-download-workflow.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1450-download-workflow.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1451-retention-storage-archive.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1451-retention-storage-archive.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1452-retention-archive-ui.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1452-retention-archive-ui.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1453-browser-folder-help.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1453-browser-folder-help.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1454-admin-album-samples.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1454-admin-album-samples.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1455-visible-gallery-recovery.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1455-visible-gallery-recovery.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1457-contained-album-gallery.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1457-contained-album-gallery.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1458-photographer-print-toolbar.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1458-photographer-print-toolbar.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1459-print-lab-context.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1459-print-lab-context.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1460-photographer-third-header.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1460-photographer-third-header.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1461-print-navigation.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1461-print-navigation.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1462-print-actions.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1462-print-actions.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1463-photographer-header-finish.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1463-photographer-header-finish.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1464-photographer-album-layout.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1464-photographer-album-layout.cjs"], { stdio: "inherit" });
await deployStep("./enable-r1465-lab-manual-live.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1465-lab-manual-live.cjs"], {stdio:"inherit"});
await deployStep("./enable-r1466-intake-move.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1466-intake-move.cjs"], {stdio:"inherit"});
await deployStep("./enable-r1467-lab-switch-intake.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1467-lab-switch-intake.cjs"], {stdio:"inherit"});
await deployStep("./enable-r1468-intake-file-actions.mjs");
await deployStep("./enable-r1469-intake-native-errors.mjs");
await deployStep("./enable-r1470-native-intake.mjs");
await deployStep("./enable-r1471-app-updates.mjs");
await deployStep("./enable-r1472-live-finance.mjs");
await deployStep("./enable-r1498-manual-paper-identity.mjs");
runR1314(process.execPath,["--test","scripts/test-r1498-manual-paper-identity.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1473-debt-modal.mjs");
await deployStep("./enable-r1475-installed-download.mjs");
await deployStep("./enable-r1476-shared-alerts.mjs");
await deployStep("./enable-r1477-lab-notices.mjs");
await deployStep("./enable-r1478-entry-startup.mjs");
runR1314(process.execPath,["--test","scripts/test-r1478-entry-startup.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1477-lab-notices.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1476-shared-alerts.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1475-installed-download.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1473-debt-modal.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1472-live-finance.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1471-app-updates.cjs"],{stdio:"inherit"});
runR1314(process.execPath,["--test","scripts/test-r1470-intake-sources.cjs"],{stdio:"inherit"});
runR1314(process.execPath, ["--test", "scripts/test-r1468-intake-file-actions.cjs"], {stdio:"inherit"});
await deployStep("./enable-r1479-approved-launch.mjs");
runR1314(process.execPath,["--test","scripts/test-r1479-approved-launch.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1480-launch-icon.mjs");
runR1314(process.execPath,["--test","scripts/test-r1480-launch-icon.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1481-icon-insets.mjs");
runR1314(process.execPath,["--test","scripts/test-r1481-icon-insets.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1499-lab-desktop-invoice-errors.mjs");
runR1314(process.execPath,["--test","scripts/test-r1499-lab-desktop-invoice-errors.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1500-lab-intake-quantity-web.mjs");
runR1314(process.execPath,["--test","scripts/test-r1500-lab-intake-quantity-web.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1501-lab-intake-parity.mjs");
runR1314(process.execPath,["--test","scripts/test-r1501-lab-intake-parity.cjs"],{stdio:"inherit"});
// Per-photo copy/move controls are shared by the website and frozen desktop UI.
await deployStep("./enable-r1504-per-photo-copy-move.mjs");
runR1314(process.execPath,["--test","scripts/test-r1504-per-photo-copy-move.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1502-web-intake-card-layout.mjs");
runR1314(process.execPath,["--test","scripts/test-r1502-web-intake-card-layout.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1515-intake-retry-confirmation.mjs");
runR1314(process.execPath,["--test","scripts/test-r1515-intake-retry-confirmation.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1520-live-status.mjs");
runR1314(process.execPath,["--test","scripts/test-r1520-live-status.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1528-contained-intake.mjs");
await deployStep("./enable-r1468-offline-policy.mjs");
runR1314(process.execPath,["--test","scripts/test-r1468-offline-policy.cjs"],{stdio:"inherit"});
await deployStep("./enable-r1529-document-tags.mjs");
// Bundle the font before publishing the verified Windows hot-update snapshot.
await deployStep("./enable-r1533-local-ui-font.mjs");
await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344");
await deployStep("./verify-lab-desktop-ui-freshness.mjs");

// Admin preview layout is website-only and runs after the frozen Windows UI snapshot.
await deployStep("./enable-r1503-admin-preview-layout.mjs");
runR1314(process.execPath,["--test","scripts/test-r1503-admin-preview-layout.cjs"],{stdio:"inherit"});

// Serve the manifest's actual immutable-by-hash bytes, never SEO-mutated HTML
// or year-long cached fixed-name images. This patch is a build-time transform
// of the shipped server and does not touch data, sync state, or auth.
await deployStep("./enable-r1351-lab-ui-exact-byte-serving.mjs");
console.log("[PhotoBridge Docker build] START R1354 patch-on-import regression tests");
runR1314(process.execPath, ["--test", "scripts/test-r1354-lab-ui-patch-import.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1354 patch-on-import regression tests");
console.log("[PhotoBridge Docker build] START R1351 lab UI wire-byte integrity tests");
runR1314(process.execPath, ["--test", "scripts/test-r1351-lab-ui-exact-byte-serving.cjs"], { stdio: "inherit" });
console.log("[PhotoBridge Docker build] OK R1351 lab UI wire-byte integrity tests");
// Phone-only interface ships AFTER the Windows/Lab UI snapshot and byte-integrity checks.
// This ensures existing Electron/Windows layout and UI packages remain unchanged.
await deployStep("./enable-r1448-lab-phone-nav.mjs");
runR1314(process.execPath, ["--test", "scripts/test-r1448-lab-phone-nav.cjs"], { stdio: "inherit" });












// R1482 replaces the old phone dock after all immutable desktop snapshots.
await deployStep("./enable-r1482-lab-mobile.mjs");
runR1314(process.execPath,["--test","scripts/test-r1482-lab-mobile.cjs"],{stdio:"inherit"});

// Public phone refinements only; do not alter or rebuild the frozen Windows UI.
await deployStep("./enable-r1483-lab-mobile.mjs");
runR1314(process.execPath,["--test","scripts/test-r1483-lab-mobile.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1484-mobile-taps.mjs");
runR1314(process.execPath,["--test","scripts/test-r1484-mobile-taps.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1485-mobile-finance.mjs");
runR1314(process.execPath,["--test","scripts/test-r1485-mobile-finance.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1486-mobile-calendar.mjs");
runR1314(process.execPath,["--test","scripts/test-r1486-mobile-calendar.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1487-mobile-pickers.mjs");
runR1314(process.execPath,["--test","scripts/test-r1487-mobile-pickers.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1488-phone-finance.mjs");
runR1314(process.execPath,["--test","scripts/test-r1488-phone-finance.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1489-unified-phone-picker.mjs");
runR1314(process.execPath,["--test","scripts/test-r1489-unified-phone-picker.cjs"],{stdio:"inherit"});

// Additional lab-phone-only archive and tariff layout; Windows UI snapshots remain frozen.
await deployStep("./enable-r1490-mobile-archive-settings.mjs");
runR1314(process.execPath,["--test","scripts/test-r1490-mobile-archive-settings.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1491-mobile-archive-action-grid.mjs");
runR1314(process.execPath,["--test","scripts/test-r1491-mobile-archive-action-grid.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1492-lab-phone-readable-records.mjs");
runR1314(process.execPath,["--test","scripts/test-r1492-lab-phone-readable-records.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1493-mobile-session-resume.mjs");
runR1314(process.execPath,["--test","scripts/test-r1493-mobile-session-resume.cjs"],{stdio:"inherit"});

await deployStep("./enable-r1494-lab-phone-settings.mjs");
runR1314(process.execPath,["--test","scripts/test-r1494-lab-phone-settings.cjs"],{stdio:"inherit"});
 
// R1530: WEBSITE ONLY. Apply after the immutable Windows UI snapshot and all phone overlays.
// A verified download must advance from the receipt's current order revision, never the stale card.
await deployStep("./enable-r1530-site-download-transition.mjs");
runR1314(process.execPath,["--test","scripts/test-r1530-site-download-transition.cjs"],{stdio:"inherit"});

// R1531: website-only ready invoice preconditions; Windows UI snapshot remains unchanged.
await deployStep("./enable-r1531-site-ready-invoice.mjs");
runR1314(process.execPath,["--test","scripts/test-r1531-site-ready-invoice.cjs"],{stdio:"inherit"});

// R1532: website startup only; leave both desktop UI snapshots untouched.
await deployStep("./enable-r1532-lab-header-first-paint.mjs");
runR1314(process.execPath,["--test","scripts/test-r1532-lab-header-first-paint.cjs"],{stdio:"inherit"});

runR1314(process.execPath,["--test","scripts/test-r1533-local-ui-font.cjs"],{stdio:"inherit"});

// Login security is server-side; native clients use the same authenticated login API.
await deployStep("./enable-r1534-lab-login-security.mjs");
runR1314(process.execPath,["--test","scripts/test-r1534-lab-login-security.cjs"],{stdio:"inherit"});

// Mobile SMS autofill and browser-only expired-session navigation.
await deployStep("./enable-r1535-mobile-otp-session.mjs");
runR1314(process.execPath,["--test","scripts/test-r1535-mobile-otp-session.cjs"],{stdio:"inherit"});

// Browser signup/login/reset password eyes and authentic PhotoBridge logo fallback.
await deployStep("./enable-r1536-password-eye-brand.mjs");
runR1314(process.execPath,["--test","scripts/test-r1536-password-eye-brand.cjs"],{stdio:"inherit"});

// R1537: website-only conditional migration UX and one-password OTP security page.
// Runs after frozen Windows installer/UI snapshots and R1536 verification.
await deployStep("./enable-r1537-conditional-sync-security.mjs");
runR1314(process.execPath,["--test","scripts/test-r1537-conditional-sync-security.cjs","scripts/test-r1534-lab-login-security.cjs"],{stdio:"inherit"});

// R1538: single password visibility control plus targeted native lab login refresh.
await deployStep("./enable-r1538-one-toggle-native-login.mjs");
runR1314(process.execPath,["--test","scripts/test-r1538-one-toggle-native-login.cjs"],{stdio:"inherit"});

// R1539: lab tariff catalog types and per-size prices, after frozen native UI release.
await deployStep("./enable-r1539-paper-binding-catalog.mjs");
await deployStep("./enable-r1539-paper-binding-ui.mjs");
runR1314(process.execPath,["--test","scripts/test-r1539-paper-binding-catalog.cjs"],{stdio:"inherit"});

// R1539: order-safe binding model selected before album size and paper.
await deployStep("./enable-r1539-album-binding-server.mjs");
await deployStep("./enable-r1539-photographer-album-binding-ui.mjs");
await deployStep("./enable-r1539-album-binding-display.mjs");
runR1314(process.execPath,["--test","scripts/test-r1539-photographer-album-binding.cjs"],{stdio:"inherit"});

// R1540: Windows lab customer-free navigation, local cleanup, binding removal,
// scroll-aligned tariffs and visible opening-debt amount.
await deployStep("./enable-r1540-lab-fixes.mjs");
runR1314(process.execPath,["--test","scripts/test-r1540-lab-fixes.cjs"],{stdio:"inherit"});

// R1541: aligned catalog columns and compact binding controls for site and native hot updates.
await deployStep("./enable-r1541-tariff-columns.mjs");
runR1314(process.execPath,["--test","scripts/test-r1541-tariff-columns.cjs"],{stdio:"inherit"});

// R1542: override the complete desktop shell and avoid cached customer handlers.
await deployStep('./enable-r1542-native-tariffs.mjs');

// R1543: usable native catalog dialogs, archive confirmation and customer details.
await deployStep('./enable-r1543-lab-dialogs.mjs');

// R1544: keep native account projections from suppressing the opening-debt editor.
await deployStep('./enable-r1544-opening-debt-status.mjs');

// R1545: local photo verification belongs to print, not later invoice/delivery.
await deployStep('./enable-r1545-downloaded-order-delete.mjs');
await deployStep('./enable-r1545-print-only-verification.mjs');

// R1546: native shared orders retain local identities after server import.
await deployStep('./enable-r1546-mapped-order-invoice.mjs');

// R1547: confirmed ready orders switch immediately; PDF is a non-blocking follow-up.
// Delivered to browser and Windows Lab UI hot-update package with integrity checks.
await deployStep("./enable-r1547-invoice-download-fast-ready.mjs");
runR1314(process.execPath,["--test","scripts/test-r1547-invoice-download-fast-ready.cjs"],{stdio:"inherit"});

// R1548: Windows Lab only; do not change website navigation or authentication.
await deployStep("./enable-r1548-native-navigation.mjs");
runR1314(process.execPath,["--test","scripts/test-r1548-native-navigation.cjs"],{stdio:"inherit"});

// R1549: remove Lab login home link and enter browser editor through normal Lab sign-in.
await deployStep('./enable-r1549-lab-login-site-editor.mjs');
runR1314(process.execPath,['--test','scripts/test-r1549-lab-login-site-editor.cjs'],{stdio:'inherit'});

// R1550: bind local file access to each order, independently of the new default root.
await deployStep('./enable-r1550-order-storage.mjs');
runR1314(process.execPath,['--test','scripts/test-r1550-order-storage.cjs'],{stdio:'inherit'});

// R1551: expose the existing binding catalog in manual album intake too.
await deployStep('./enable-r1551-walkin-album-binding.mjs');

// R1552: archive day order follows registration time, newest at the top.
await deployStep('./enable-r1552-archive-newest-first.mjs');
runR1314(process.execPath,['--test','scripts/test-r1552-archive-newest-first.cjs'],{stdio:'inherit'});

// R1563: stable discount seal and live Windows intake preregistration/SMS.
await deployStep('./enable-r1563-intake-discount.mjs');

// R1564: selectable plans, order SMS accounting and browser archive recovery.
await deployStep('./enable-r1564-subscription-browser-recovery.mjs');


await deployStep('./enable-r1565-archive-sms-labels.mjs');

runR1314(process.execPath,['--test','scripts/test-r1564-core.cjs'],{stdio:'inherit'});

await deployStep('./enable-r1566-archive-revision.mjs');
runR1314(process.execPath,['--test','scripts/test-r1566-archive-revision.cjs'],{stdio:'inherit'});

// R1567: native-only feature menu and measured low-end UI work reduction.
await deployStep('./enable-r1567-native-performance.mjs');
runR1314(process.execPath,['--test','scripts/test-r1567-native-requests.cjs'],{stdio:'inherit'});

// R1568: guarded invoice-before-print and automatic verified downloads, OFF by default.
// A newer native host is required before any silent thermal print can be enabled.
await deployStep('./enable-r1568-auto-processing.mjs');
runR1314(process.execPath,['--test','scripts/test-r1568-auto-processing.cjs'],{stdio:'inherit'});

// R1569: reduce manual intake request fan-out and finance first-panel loading.
// Atomic batch file metadata (no photo upload), bounded hashing and aggregated balances.
await deployStep('./enable-r1569-lab-performance.mjs');
runR1314(process.execPath,['--test','scripts/test-r1569-lab-performance.mjs'],{stdio:'inherit'});

// R1570: make the R1568 Lab automation setting immediately discoverable.
await deployStep('./enable-r1570-automation-entry.mjs');
runR1314(process.execPath,['--test','scripts/test-r1570-automation-entry.cjs'],{stdio:'inherit'});

// R1571: Chrome 109 / Windows 7 conventional photo copy picker and safe Move guard.
await deployStep('./enable-r1571-win7-photo-picker.mjs');
runR1314(process.execPath,['--test','scripts/test-r1571-win7-photo-picker.cjs'],{stdio:'inherit'});

// R1572: stable finance refresh and General settings placement for automation/backup.
await deployStep('./enable-r1572-finance-general.mjs');
runR1314(process.execPath,['--test','scripts/test-r1572-finance-general.cjs'],{stdio:'inherit'});





await deployStep('./enable-r1573-native-backup.mjs');
runR1314(process.execPath,['--test','scripts/test-r1573-native-backup.cjs'],{stdio:'inherit'});

await deployStep('./enable-r1574-native-first-layout.mjs');
runR1314(process.execPath,['--test','scripts/test-r1574-native-first-layout.cjs'],{stdio:'inherit'});

await deployStep('./enable-r1575-download-invoice.mjs');

await deployStep('./enable-r1576-pricing-backup.mjs');

await deployStep('./enable-r1577-price-resume.mjs');
runR1314(process.execPath,['--test','scripts/test-r1577-price-resume.cjs'],{stdio:'inherit'});

await deployStep('./enable-r1578-queue-transfer.mjs');

await deployStep('./enable-r1580-stage-feedback.mjs');

await deployStep('./enable-r1581-download-feedback.mjs');

await deployStep('./enable-r1582-download-reason.mjs');

await deployStep('./enable-r1583-download-retry.mjs');

await deployStep('./enable-r1584-price-increase.mjs');

runR1314(process.execPath,['--test','scripts/test-r1584-price-increase.cjs'],{stdio:'inherit'});

await deployStep('./enable-r1585-preview-photographers.mjs');

await deployStep('./enable-r1586-opening-debt-history.mjs');

// R1587: print-only experimental upload pool. Strictly after latest R1586 changes.
// Benchmarks are synthetic; live storage performance remains to be measured.
await deployStep('./enable-r1587-print-upload-pool.mjs');
runR1314(process.execPath,['--test','scripts/test-r1587-print-pool.cjs'],{
  stdio:'inherit',env:{...process.env,PB1587_VERIFY_BUNDLE:'1'}
});

// R1588: retain three parallel PUTs; serialize and retry only safe JPEG
// confirmation requests on transient gateway failures.
await deployStep('./enable-r1588-print-completion.mjs');
runR1314(process.execPath,['--test','scripts/test-r1588-print-completion.cjs'],{
  stdio:'inherit',env:{...process.env,PB1588_VERIFY_BUNDLE:'1'}
});

// R1590: desktop photographer layout only; injected AFTER all existing CSS patches.
await deployStep('./enable-r1590-photographer-desktop-card-fit.mjs');
runR1314(process.execPath,['--test','scripts/test-r1590-photographer-desktop-card-fit.cjs'],{stdio:'inherit'});

// R1591: four separated desktop print-card zones; the title is hidden and the two
// central sections are centered between dividers. Mobile and album cards unchanged.
await deployStep('./enable-r1591-desktop-print-four-section.mjs');
runR1314(process.execPath,['--test','scripts/test-r1591-desktop-print-four-section.cjs'],{stdio:'inherit'});

// R1592: demonstrate status-based card-to-tab flight in the photographer desktop.
// Movement is presentation-only; the active tab does not change automatically.
await deployStep('./enable-r1592-photographer-order-fly.mjs');
runR1314(process.execPath,['--test','scripts/test-r1592-photographer-order-fly.cjs'],{stdio:'inherit'});


// R1592: visually fly orders to their next tab on real status updates.
// Never auto-switch the active photographer tab and never change server status.
await deployStep('./enable-r1592-photographer-order-fly.mjs');
runR1314(process.execPath,['--test','scripts/test-r1592-photographer-order-fly.cjs'],{stdio:'inherit'});







// R1596 hotfix: disable the experimental R1593-R1595 Lab card flight and
// its core-bundle stage overrides. Prioritize the last known usable Lab UI.
// Do not restore these patches until the Windows blank-screen fault is verified.
console.log('[R1596] Experimental Lab card-flight overlay/JS stage patches disabled');
runR1314(process.execPath,['--test','scripts/test-r1596-lab-startup-rollback.cjs'],{stdio:'inherit'});

// R1597: display the verified-download confirmation immediately after server
// receipt, BEFORE slow invoice continuation and queue refresh. Invoice timing
// and the successful R1596 Windows startup rollback remain unchanged.
await deployStep('./enable-r1597-early-download-notice.mjs');
runR1314(process.execPath,['--test','scripts/test-r1597-early-download-notice.cjs'],{stdio:'inherit'});
runR1314(process.execPath,['--test','scripts/test-r1596-lab-startup-rollback.cjs'],{stdio:'inherit'});
 
// R1598: PWA role restoration and the Photographer phone invoice dock ONLY.
// Do not modify the native Windows Lab bundle or restore the disabled card flight.
await deployStep('./enable-r1598-mobile-role-invoice-nav.mjs');
runR1314(process.execPath,['--test','scripts/test-r1598-mobile-role-invoice-nav.cjs'],{stdio:'inherit'});

// R1599: website/PWA role isolation and explicit crop confirmation only.
// The Windows Lab UI snapshot and retired Lab flight remain unchanged.
await deployStep('./enable-r1599-mobile-crop-nav.mjs');
runR1314(process.execPath,['--test','scripts/test-r1599-mobile-crop-nav.cjs'],{
 stdio:'inherit',env:{...process.env,PB1599_VERIFY_BUNDLE:'1'}
});


await deployStep('./enable-r1602-photographer-upload-orders.mjs');

await deployStep('./enable-r1603-lab-pricing-stage.mjs');

await deployStep('./enable-r1604-photo-editor.mjs');

await deployStep('./enable-r1605-photo-mobile-polish.mjs');

await deployStep('./enable-r1606-gallery-startup.mjs');

await deployStep('./enable-r1607-embedded-mobile-dock.mjs');

await deployStep('./enable-r1608-chassis-compact-orders.mjs');

// R1610: lab archive header cleanup, inline customer discount and status-circle loader.
// Apply last, after the R1585 table and all native hot-update stages are present.
await deployStep('./enable-r1610-lab-ux.mjs');
runR1314(process.execPath,['--test','scripts/test-r1610-lab-ux.cjs'],{stdio:'inherit'});

// R1612: timeline circle stays in its original position while the inner ring
// animates; customer finance discount editing opens a top-layer dialog.
await deployStep('./enable-r1612-lab-spinner-discount-modal.mjs');
runR1314(process.execPath,['--test','scripts/test-r1612-lab-spinner-discount-modal.cjs'],{stdio:'inherit'});

// R1613: restore after-print invoice issuance following manual price entry,
// prevent Windows auto-reopen of old invoices, and animate status circles.
await deployStep('./enable-r1613-lab-invoice-ui.mjs');
// R1615: prevent optimizer-specific pricing callback shape from blocking Docker.
runR1314(process.execPath,['--test','scripts/test-r1615-pricing-build-anchor.cjs'],{stdio:'inherit'});
runR1314(process.execPath,['--test','scripts/test-r1613-lab-invoice-ui.cjs'],{stdio:'inherit'});


// Additive laboratory referral program; separate from photographer invitations.
await deployStep('./enable-lab-referral-program.mjs');
runR1314(process.execPath,['--test','scripts/test-lab-referral-build.cjs'],{stdio:'inherit'});

// Existing business accounts add roles only after SMS proof, without password changes.
await deployStep('./enable-signup-sms-identity.mjs');
// R1624: photographer temporary names, SMS-only lab referrals and dismissible expiry.
runR1314(process.execPath,['--test','scripts/test-r1624-invitations.cjs'],{stdio:'inherit'});
// R1625: prevent already-registered laboratory invitations and keep the copy/link and form controls aligned.
runR1314(process.execPath,['--test','scripts/test-r1625-invitations.cjs'],{stdio:'inherit'});
// R1626: single-row invite actions and automatic joined-recipient status.
runR1314(process.execPath,['--test','scripts/test-r1626-referral-invites.cjs'],{stdio:'inherit'});

// One shared invitation row in both website and existing Windows UI updates.
await deployStep('./enable-r1628-invite-row.mjs');

// Preserve customer navigation layout; show insufficient SMS credit in the existing wallet badge.
await deployStep('./enable-r1629-header-wallet.mjs');

// Prepare the reusable photographer invitation once and keep its copy action inside the field.
await deployStep('./enable-r1630-photographer-link.mjs');

// Desktop photographer finance navigation and read-only statement grouping fix.
await deployStep('./enable-r1631-desktop-finance.mjs');

// Successful ready/delivered moves exit the current queue without switching tabs.
await deployStep('./enable-r1631-order-exit.mjs');

// Dedicated photographer finance third header and lab-parity desktop navigation.
await deployStep('./enable-r1632-three-header.mjs');

// Match the photographer's Windows header text to the lab and right-align new print/album order actions.
await deployStep('./enable-r1633-photographer-header-actions.mjs');
runR1314(process.execPath,['--test','scripts/test-r1633-photographer-header-actions.cjs'],{stdio:'inherit'});

await deployStep('./enable-r1635-photographer-inline-settings.mjs');
// R1636: catch hidden iframe settings and broken native UI payloads in Docker builds.
runR1314(process.execPath,['--test','scripts/test-r1636-photographer-inline-settings.cjs'],{stdio:'inherit'});

// R1638: hide legacy settings navigation and align eight photographer invoice columns.
await deployStep('./enable-r1638-photographer-inner-settings-finance.mjs');
runR1314(process.execPath,['--test','scripts/test-r1638-photographer-inner-settings-finance.cjs'],{stdio:'inherit'});

// R1641: manual order submit avoids redundant copy-only disk hashing.
// The native invoice-progress dialog only offers retry/cancel after a failure.
await deployStep('./enable-r1641-lab-manual-speed-dialog.mjs');
runR1314(process.execPath,['--test','scripts/test-r1641-lab-manual-speed-dialog.cjs'],{stdio:'inherit'});

// R1643: lab manager can convert one unpaid pre-print order to ledger.
// Keep the photographer's default settlement and the invoice/payment ledger unchanged.
await deployStep('./enable-r1643-order-ledger.mjs');
runR1314(process.execPath,['--test','scripts/test-r1643-order-ledger.cjs'],{stdio:'inherit'});
runR1314(process.execPath,['--test','scripts/test-r1645-ledger-card-update-dialog.cjs'],{stdio:'inherit'});

// R1646: convert the photographer's settlement relationship in THIS lab,
// from the receipt/approval order itself. Never zero their invoices or payments.
await deployStep('./enable-r1646-photographer-ledger.mjs');
runR1314(process.execPath,['--test','scripts/test-r1646-photographer-ledger.cjs'],{stdio:'inherit'});

// R1648: keep photographer desktop invoice visible above its native chrome and
// stabilize print/finance tabs without changing any financial operations.
await deployStep('./enable-r1648-photographer-invoice-preview.mjs');
runR1314(process.execPath,['--test','scripts/test-r1648-photographer-invoice.cjs'],{stdio:'inherit'});

// R1649: album photographer card only. Keep photo-print layout unchanged.
await deployStep('./enable-r1649-photographer-album-card.mjs');
runR1314(process.execPath,['--test','scripts/test-r1649-photographer-album-card.cjs'],{stdio:'inherit'});

// R1652: restore photographer standalone settings scrolling, and make the
// photographer archive calendar the same readable size as the Lab archive.
await deployStep('./enable-r1652-photographer-settings-archive.mjs');
runR1314(process.execPath,['--test','scripts/test-r1652-photographer-settings-archive.cjs'],{stdio:'inherit'});

// R1655 SAFETY ROLLBACK: R1653 rewrote desktop click state and cached another
// settings iframe, breaking the print/album/archive/tariff mappings. Do NOT
// invoke R1653 or R1654. R1648's unsafe index-based click override is disabled
// in its installer; its R1651 standalone invoice-frame fallback remains.
await deployStep('./enable-r1655-restore-photographer-navigation.mjs');
runR1314(process.execPath,['--test','scripts/test-r1655-restore-photographer-navigation.cjs'],{stdio:'inherit'});

// R1657: remove redundant embedded photographer finance heading and center an only mobile Print/Album mode.
await deployStep('./enable-r1657-photographer-finance-mobile-tab.mjs');
runR1314(process.execPath,['--test','scripts/test-r1657-photographer-finance-mobile-tab.cjs'],{stdio:'inherit'});

// R1658: new-album photo sheets, compact resume notice, and no moving price sidebar.
await deployStep('./enable-r1658-album-compact-three-up.mjs');
runR1314(process.execPath,['--test','scripts/test-r1658-album-compact-three-up.cjs'],{stdio:'inherit'});

// R1659: first-paint mobile dock deduplication and desktop settings selected-state correction.
await deployStep('./enable-r1659-single-mobile-dock-settings-active.mjs');
runR1314(process.execPath,['--test','scripts/test-r1659-single-mobile-dock-settings-active.cjs'],{stdio:'inherit'});

// R1660: mobile Lab order number and small tablet single-column card header.
await deployStep('./enable-r1660-mobile-lab-order-number.mjs');
runR1314(process.execPath,['--test','scripts/test-r1660-mobile-lab-order-number.cjs'],{stdio:'inherit'});

// R1661: open push invoice inside the current photographer page, on phone and desktop.
await deployStep('./enable-r1661-photographer-invoice-overlay.mjs');
runR1314(process.execPath,['--test','scripts/test-r1661-photographer-invoice-overlay.cjs'],{stdio:'inherit'});

// R1662: desktop photographer Settings overlay closes before printing or navigation.
await deployStep('./enable-r1662-photographer-settings-return.mjs');
runR1314(process.execPath,['--test','scripts/test-r1662-photographer-settings-return.cjs'],{stdio:'inherit'});

// R1664: customer vs photographer local order folders, old pinned storage unchanged.
runR1314(process.execPath,['--test','scripts/test-r1664-storage-separation.cjs'],{stdio:'inherit'});

// R1665: bold monochrome thermal invoices for coworker and customer with party telephone.
await deployStep('./enable-r1665-thermal-invoice.mjs');
runR1314(process.execPath,['--test','scripts/test-r1665-thermal-invoice.cjs'],{stdio:'inherit'});

// R1674: direct customers get distinct receipts, A4/PDF, preview and identity.
await deployStep('./enable-r1674-direct-customer-invoice.mjs');
runR1314(process.execPath,['--test','scripts/test-r1674-direct-customer-invoice.cjs'],{stdio:'inherit'});

// R1666: HEIC/HEIF iPhone conversion and safe photo filenames.
await deployStep('./enable-r1666-iphone-heic-upload.mjs');
runR1314(process.execPath,['--test','scripts/test-r1666-iphone-heic-upload.cjs'],{stdio:'inherit'});

// R1682: direct-customer invoices must issue independently of photographer ledger flags.
// Keep the photographer after-print flow intact, block direct-customer Ready without invoice,
// and trigger native auto-download on fresh order-list responses.
await deployStep('./enable-r1682-direct-customer-order-flow.mjs');
runR1314(process.execPath,['--test','scripts/test-r1682-direct-customer-order-flow.cjs'],{stdio:'inherit'});
// R1687: update customer-only invoice routing in the last generated Windows and site bundles.
await deployStep('./enable-r1687-direct-customer-thermal.mjs');
runR1314(process.execPath,['--test','scripts/test-r1687-direct-customer-thermal.cjs'],{stdio:'inherit'});

// R1698: activate approved compact thermal receipt layout on site + native UI snapshot.
await deployStep('./enable-r1698-approved-receipts.mjs');
runR1314(process.execPath,['--test','scripts/test-r1698-approved-receipts.cjs'],{stdio:'inherit'});
// R1700: receipts explicitly identify the photographer; worker wakes when prior download ends.
runR1314(process.execPath,['--test','scripts/test-r1700-receipt-wake.cjs'],{stdio:'inherit'});
// R1705: distinguish verified laboratory member roles for actual photographer uploads.
runR1314(process.execPath,['--test','scripts/test-r1705-verified-receipt-role.cjs'],{stdio:'inherit'});

// R1711: image rotation and print-size frame orientation are independent in Lab Edit Photo.
await deployStep('./enable-r1711-independent-print-frame.mjs');
runR1314(process.execPath,['--test','scripts/test-r1711-independent-print-frame.cjs'],{stdio:'inherit'});

// R1712: HEIC first decoder, verified JPEG and accurate upload error phases.
await deployStep('./enable-r1712-heic-verified-conversion.mjs');
runR1314(process.execPath,['--test','scripts/test-r1712-heic-verified-conversion.cjs'],{stdio:'inherit'});

// R1714: decouple HEIC conversion from HTTP upload completion to avoid gateway 502.
await deployStep('./enable-r1714-async-upload-completion.mjs');
runR1314(process.execPath,['--test','scripts/test-r1714-async-upload-completion.cjs'],{stdio:'inherit'});

// R1720: web-mobile-only Print chooser visibility, lower polling and initial invitation tab.
// Run after desktop snapshots and all legacy patch stages; leave Windows UI untouched.
await deployStep('./enable-r1720-mobile-print-chooser.mjs');
runR1314(process.execPath,['--test','scripts/test-r1720-mobile-print-chooser.cjs'],{stdio:'inherit'});

// R1721: mobile-only initial navigation must not show Gallery then restart the app.
// Keep this AFTER R1720 and all Windows UI snapshots.
await deployStep('./enable-r1721-mobile-first-entry.mjs');
runR1314(process.execPath,['--test','scripts/test-r1721-mobile-first-entry.cjs'],{stdio:'inherit'});

// R1722: group the existing photographer Lab chooser by city only when the
// authorized directory spans multiple registered cities (mobile + desktop web).
// Apply after all older UI mutators, without altering the native Windows UI snapshot.
await deployStep('./enable-r1722-lab-city-grouping.mjs');
runR1314(process.execPath,['--test','scripts/test-r1722-lab-city-grouping.cjs'],{stdio:'inherit'});

// R1723: enforce EXACT uppercase HAMKAR/MOSHTARI names in final web + Lab
// Windows hot-update bundles and refresh the Windows manifest checksum.
// Repeat the R1132 regression test here: its old defer/duplicate boot error
// must never be reintroduced by later builds. GitHub Actions not required.
await deployStep('./verify-r1723-uppercase-storage.mjs');
runR1314(process.execPath,['--test','scripts/test-r1723-storage-and-build.cjs'],{stdio:'inherit'});

// R1725: an explicitly reselected Lab folder may have lost its local identity JSON.
// Verify native and browser UI recovery, and regenerate Windows UI cache/manifest.
await deployStep('./verify-r1725-deleted-marker.mjs');
runR1314(process.execPath,['--test','scripts/test-r1725-marker-recovery.cjs'],{stdio:'inherit'});

// R1726: after all native/UI packaging stages, enhance SITE mobile login only.
// Correct the earlier R1451 test assertion at source before this build reaches it.
await deployStep('./enable-r1726-mobile-login.mjs');
runR1314(process.execPath,['--test','scripts/test-r1726-mobile-login.cjs'],{stdio:'inherit'});

// R1727: site-mobile login visual refinement only: logo -> PhotoBridge -> Persian title.
// Keep the existing keyboard-safe top anchor, login behavior and installed-app banner.
await deployStep('./enable-r1727-mobile-login-header.mjs');
runR1314(process.execPath,['--test','scripts/test-r1727-mobile-login-header.cjs'],{stdio:'inherit'});
