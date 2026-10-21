// R1346: gallery print-price activation is derived from entered prices, with two compact price rows.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const web = path.resolve('dist/web');
const bundle = path.join(web, 'assets/index-UIRefine-v655-r84.js');
const stylesheet = path.join(web, 'photobridge-r1152-gallery-layout.css');
let code = fs.readFileSync(bundle, 'utf8');

function replaceRequired(haystack, oldText, newText, label) {
  if (!haystack.includes(oldText)) throw new Error('[R1346] Missing ' + label);
  return haystack.replace(oldText, newText);
}
const begin = code.indexOf('function V0(');
const end = code.indexOf('function W0(', begin);
if (begin < 0 || end < begin || end - begin > 18000) throw new Error('[R1346] Tariff modal anchors missing');
let modal = code.slice(begin, end);

if (!modal.includes('pb1346CompactPrices')) {
  modal = replaceRequired(modal,
    'L.profileActive=v,v||(L.galleryEnabled=!1),h(C.sizeId,L)',
    'L.profileActive=v,L.galleryEnabled=v,h(C.sizeId,L)',
    'automatic size activation on price entry');
  modal = replaceRequired(modal,
    'k=f.some(C=>!!C.galleryEnabled&&!S(C))',
    'k=!1',
    'redundant gallery toggle validation');
  modal = replaceRequired(modal,
    'className:"clientGalleryTariffPriceGrid "+(w?"priced":"")',
    'className:"clientGalleryTariffPriceGrid pb1346CompactPrices "+(w?"priced":"")',
    'compact tariff row');
  modal = replaceRequired(modal,
    'این قیمت‌ها یک‌بار در پروفایل ذخیره می‌شوند؛ ستون «این گالری» تعیین می‌کند کدام سایز همین حالا برای این مشتری قابل سفارش باشد.',
    'هر سایز با ثبت قیمت یکی از سه نوع کاغذ به‌صورت خودکار فعال می‌شود. قیمت خالی یعنی آن گزینه غیرفعال است.',
    'tariff explanation');

  // The old eight-column heading no longer matches the grouped price inputs.
  let start = modal.indexOf('e.jsxs("div",{className:"clientGalleryTariffPriceGrid head"');
  let stop = modal.indexOf('f.map(C=>{', start);
  if (start < 0 || stop < start || stop - start > 1000) throw new Error('[R1346] Tariff heading not found');
  modal = modal.slice(0, start) + modal.slice(stop);

  // Remove the per-size active/inactive switch entirely.
  start = modal.indexOf('e.jsxs("label",{className:"clientGalleryTariffRowToggle "');
  stop = modal.indexOf('[["luster","لاستر"]', start);
  if (start < 0 || stop < start || stop - start > 700) throw new Error('[R1346] Tariff toggle not found');
  modal = modal.slice(0, start) + modal.slice(stop);

  // Remove both the preset-size clear control and custom-size delete control.
  start = modal.indexOf(',e.jsx("div",{className:"clientGalleryTariffRowActions"');
  stop = modal.indexOf(']},C.sizeId)})', start);
  if (start < 0 || stop < start || stop - start > 1250) throw new Error('[R1346] Tariff delete actions not found');
  modal = modal.slice(0, start) + modal.slice(stop);
}
code = code.slice(0, begin) + modal + code.slice(end);

// Previously switched-off sizes become enabled when a paper price is present.
code = replaceRequired(code,
  'profileActive:!!(p&&p.active!==!1),galleryEnabled:!!(p&&p.active!==!1&&s.get(String(p.size_id))===!0)',
  'profileActive:!!(p&&[p.luster_price,p.silk_price,p.metallic_price].some(v=>Number(v)>0)),galleryEnabled:!!(p&&[p.luster_price,p.silk_price,p.metallic_price].some(v=>Number(v)>0))',
  'saved tariff initialization');
for (const service of ['luster','silk','metallic','chassis','frame']) {
  code = replaceRequired(code,
    service + 'Enabled:!!(p!=null&&p.' + service + '_enabled)',
    service + 'Enabled:!!(p&&Number(p.' + service + '_price)>0)',
    service + ' saved enablement');
}
// Saving existing and new galleries must ignore obsolete manual-toggle state.
code = replaceRequired(code, 'galleryEnabled:je&&!!we.galleryEnabled', 'galleryEnabled:je', 'existing-gallery save');
code = replaceRequired(code, 'galleryEnabled:active&&!!row.galleryEnabled', 'galleryEnabled:active', 'new-gallery save');
if (code.includes('clientGalleryTariffRowToggle "+(C.galleryEnabled') ||
    code.includes('className:"clientGalleryTariffRowActions"')) {
  throw new Error('[R1346] Obsolete controls still render in the tariff editor');
}
fs.writeFileSync(bundle, code);

let css = fs.readFileSync(stylesheet, 'utf8');
const additionalCss = fs.readFileSync('scripts/r1346-gallery-compact.css', 'utf8');
if (!css.includes('/* R1346:')) css += '\n' + additionalCss;
fs.writeFileSync(stylesheet, css);

const htmlFiles = ['index.html','desktop-ui/index.html','lab-desktop-ui/index.html'];
for (const name of htmlFiles) {
  const file = path.join(web, name);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('photobridge-r1152-gallery-layout.css')) throw new Error('[R1346] Tariff CSS missing in ' + name);
  html = html.replace(/(photobridge-r1152-gallery-layout\.css\?v=)[^"'<>\s&]+/g, '$1r1346');
  html = html.replace(/(index-UIRefine-v655-r84\.js\?[^"'<>\s]*)/g, (match) =>
    match.includes('tariffs=r1346') ? match : match + '&tariffs=r1346');
  fs.writeFileSync(file, html);
}

// Desktop app payloads are built earlier; replace copied assets and refresh manifests.
for (const folder of ['desktop-ui','lab-desktop-ui']) {
  const dir = path.join(web, folder);
  if (!fs.existsSync(dir)) continue;
  for (const asset of ['assets/index-UIRefine-v655-r84.js','photobridge-r1152-gallery-layout.css']) {
    const destination = path.join(dir, asset);
    if (fs.existsSync(destination)) fs.copyFileSync(path.join(web, asset), destination);
  }
  const manifestFile = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestFile)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (!Array.isArray(manifest.files)) throw new Error('[R1346] Bad desktop manifest ' + folder);
  for (const entry of manifest.files) {
    const target = path.resolve(dir, entry.name);
    if (!target.startsWith(dir + path.sep) || !fs.existsSync(target)) {
      throw new Error('[R1346] Missing desktop asset ' + entry.name);
    }
    entry.sha256 = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  }
  manifest.build = crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
}
console.log('[R1346] Print tariff controls removed, price activation automatic, paper/frame rows compacted.');
