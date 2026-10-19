import fs from 'node:fs';
import path from 'node:path';
import { deduplicateOnnxRuntime } from './deduplicate-onnx-runtime.mjs';

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

await import('./enable-r1094-windows-print-handovers.mjs');
await import('./enable-r1087-commitment-autoprint.mjs');
await import('./remove-r1092-legacy-windows-alert-panel.mjs');
await import('./fix-r1093-inventory-visibility.mjs');
await import('./enable-r1095-customer-rental-stock-modes.mjs');
await import('./enable-r1095-stock-mode-ui.mjs');
await import('./enable-r1096-photographer-store-ui.mjs');
await import('./enable-r1097-store-readability.mjs');
await import('./enable-r1098-stock-privacy.mjs');
await import('./enable-r1099-photographer-tabs.mjs');
await import('./enable-r1105-lab-origin-release.mjs');
await import('./enable-r1106-test-account-visibility.mjs');
await import('./enable-r1106-mobile-store-panel.mjs');
await import('./enable-r1108-gallery-trial.mjs');
await import('./enable-r1109-gallery-lifetime.mjs');
await import('./enable-r1112-gallery-single-form.mjs');
await import('./enable-r1113-gallery-text-dialogs.mjs');
await import('./enable-r1118-lab-finance.mjs');
await import('./enable-r1119-mobile-chat.mjs');
await import('./enable-r1120-gallery-controls.mjs');
await import('./enable-r1121-print-orders.mjs');
await import('./enable-r1124-photographer-desktop-header.mjs');
await import('./enable-r1138-primary-lab-intake.mjs');
await import('./enable-r1142-intake-copies-customer.mjs');
await import('./enable-r1143-folder-storage.mjs');
await import('./enable-r1148-lab-profile-image.mjs');
await import('./enable-r1147-lab-admin-header.mjs');
await import('./enable-r1151-lab-mobile-print-navigation.mjs');
await import('./enable-r1152-gallery-layout-prices.mjs');
await import('./enable-r1155-gallery-pinned-filters.mjs');
await import('./enable-r1158-gallery-compact-cards.mjs');
await import('./prepare-store-desktop-ui.mjs');
await import('./prepare-lab-desktop-ui.mjs');
await import('./reassemble-r1091-store-installer.mjs');
await import('./create-r1092-windows-installer-zip.mjs');
await import('./enable-r1132-final-assets.mjs');
await import('./enable-r1159-gallery-intro-cards.mjs');
await import('./enable-r1160-gallery-card-actions.mjs');
await import('./enable-r1162-gallery-header-delete.mjs');
await import('./enable-r1163-photographer-gallery-header.mjs');
await import('./enable-r1164-gallery-tariff-photos.mjs');
await import('./enable-r1176-lab-finance.mjs');
await import('./enable-r1177-lab-settings-finance.mjs');
await import('./enable-r1178-release.mjs');
await import('./enable-r1179-lab-walkin-invoice-view.mjs');
await import('./enable-r1180-lab-order-details.mjs');
await import('./enable-r1181-server.mjs');
await import('./enable-r1181-lab-photo-controls.mjs');
await import('./enable-r1182-lab-file-availability.mjs');
await import('./enable-r1182-lab-download-client.mjs');
await import('./enable-r1183-lab-direct-stream.mjs');
await import('./enable-r1183-lab-image-ui.mjs');
await import('./enable-r1183-finalize.mjs');
await import('./enable-r1184-lab-walkin-album.mjs');
await import('./enable-r1184-finalize.mjs');
await import('./enable-r1185-lab-desktop-statement-layout.mjs');
await import('./enable-r1186-lab-walkin-button.mjs');
await import('./enable-r1187-photo-tab-jitter.mjs');
await import('./enable-r1188-lab-browser-tabs.mjs');
await import('./enable-r1189-lab-queue-stability.mjs');
await import('./enable-r1190-desktop-tab-speed.mjs');
await import('./enable-r1192-mobile-pwa-tabs.mjs');
await import('./enable-r1193-photographer-stable-tabs.mjs');
await import('./enable-r1194-gallery-create-dialog.mjs');
await import('./enable-r1195-gallery-create-compact.mjs');
await import('./enable-r1196-gallery-field-align.mjs');
await import('./enable-r1197-gallery-create-four-fields.mjs');
await import('./enable-r1201-lab-controls.mjs');
await import('./enable-r1202-lab-invoice-preview-counters.mjs');



await import('./enable-r1208-frame-palette.mjs');
await import('./generate-r1222-brand-icons.mjs');
await import('./enable-r1250-store-order-sms.mjs');
await import('./enable-r1252-frame-customer-layout.mjs');

await import('./enable-r1267-lab-site.mjs');

await import('./enable-r1268-equipment-site.mjs');

await import("./enable-r1269-equipment-navigation.mjs");

await import("./enable-r1270-equipment-pages.mjs");

await import("./enable-r1271-equipment-collections.mjs");

await import("./enable-r1272-site-typography.mjs");

await import("./enable-r1273-text-editor.mjs");

await import("./enable-r1274-equipment-layout.mjs");

await import("./enable-r1275-site-position.mjs");

await import("./enable-r1276-equipment-reviews.mjs");

await import("./enable-r1284-original-launch.mjs");

await import('./enable-r1291-lab-manual-customer-accounts.mjs');


await import('./enable-r1296-lab-settings.mjs');

await import('./enable-r1297-lab-settings-speed.mjs');

await import('./enable-r1298-lab-header-navigation.mjs');

await import('./enable-r1299-lab-initial-debt.mjs');

await import('./enable-r1301-lab-site-general.mjs');
await import('./enable-r1302-mobile-login.mjs');


await import('./enable-r1307-desktop-print-controls.mjs');
