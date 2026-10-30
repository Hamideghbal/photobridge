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
runR1314(process.execPath, ["--test", "scripts/test-r1359-mobile-blue-launch.cjs", "scripts/test-r1222-mobile-brand.cjs"], { stdio: "inherit" });
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
