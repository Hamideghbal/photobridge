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
await import('./enable-r1097-photographer-stock-ui.mjs');
await import('./prepare-store-desktop-ui.mjs');
await import('./prepare-lab-desktop-ui.mjs');
await import('./reassemble-r1091-store-installer.mjs');
await import('./create-r1092-windows-installer-zip.mjs');
