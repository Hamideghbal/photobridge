// This repository ships a prebuilt deploy payload, not the original web sources.
// Historical version-specific source assertions are retained in verify-deploy-legacy.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function assert(ok, message) {
  if (!ok) throw new Error(`[PhotoBridge Deploy] ${message}`);
}
// Keep the original payload-presence guards; resolve the active bundle below.
const required = [
  'dist/web/index.html',
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
for (const file of required) assert(fs.existsSync(file), `Required deployment payload missing: ${file}`);
const web = path.resolve('dist/web');
const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert(pkg.name === 'photobridge-liara-deploy-lite', 'Unexpected deployment package');
assert(pkg.photobridgeDeployBuild, 'Deployment build identity missing');
const modules = [...html.matchAll(/<script\b[^>]*>/gi)]
  .map(m => m[0]).filter(tag => /\btype=["']module["']/i.test(tag));
assert(modules.length === 1, 'Expected exactly one main module');
const moduleSrc = modules[0].match(/\bsrc=["']([^"']+)["']/i)?.[1];
assert(moduleSrc?.startsWith('/assets/index-') && /[?&]v=[^&]+/.test(moduleSrc), 'Main module must use a versioned local asset');

const assets = new Set();
for (const match of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
  const tag = match[0];
  const ref = tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
  if (!ref || !ref.startsWith('/') || ref.startsWith('//')) continue;
  const relative = decodeURIComponent(ref.split(/[?#]/)[0]).replace(/^\//, '');
  const file = path.resolve(web, relative);
  assert(file.startsWith(web + path.sep), `Asset escapes web root: ${ref}`);
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `Missing mounted asset: ${ref}`);
  assert(fs.statSync(file).size > 0, `Empty mounted asset: ${ref}`);
  assets.add(file);
}
assert(assets.has(path.resolve(web, moduleSrc.split('?')[0].slice(1))), 'Main module not verified');
assert([...assets].some(f => f.endsWith('.css')), 'No mounted stylesheet');

// Check shipped JavaScript syntax, including current overlays rather than an unused old bundle.
for (const file of [...assets].filter(f => f.endsWith('.js')).concat([
  'dist/api/server.js', 'dist/api/faceDetectorWorker.js', 'dist/api/stage4CompositeWorker.js',
  'scripts/migrate.mjs', 'scripts/prune-onnx-platforms.mjs'
])) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert(check.status === 0, `Invalid JavaScript ${file}: ${check.stderr || check.error || ''}`);
}
const server = fs.readFileSync('dist/api/server.js', 'utf8');
for (const route of ['/api/health', '/api/lab/desktop-ui-manifest', '/api/lab/desktop-installer']) {
  assert(server.includes(route), `Deployment route missing: ${route}`);
}
for (const file of ['dist/api/equipment-rental-book.html', 'dist/api/equipment-rental-portal.html',
  'migrations/151_equipment_complete_camera_photo_bank_v837.sql', 'scripts/ensure-sofia-demo.sql']) {
  assert(fs.existsSync(file), `Required deployment payload missing: ${file}`);
}
const docker = fs.readFileSync('Dockerfile', 'utf8');
assert(docker.includes('RUN node scripts/prune-onnx-platforms.mjs'), 'Docker native-runtime pruning missing');
assert(docker.includes('COPY --from=deps /app/node_modules ./node_modules'), 'Runtime must copy verified dependencies');
console.log(`[PhotoBridge Deploy] ${pkg.photobridgeDeployBuild}: ${assets.size} mounted assets, JavaScript syntax, runtime routes and deployment payload verified.`);
