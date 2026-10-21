// R1346 regression: all print-price cells are exactly two input rows,
// and size/paper availability is driven by saved numeric prices.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const bundle = fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js', 'utf8');
const begin = bundle.indexOf('function V0(');
const end = bundle.indexOf('function W0(', begin);
const modal = bundle.slice(begin, end);
const css = fs.readFileSync('dist/web/photobridge-r1152-gallery-layout.css', 'utf8');
const html = fs.readFileSync('dist/web/index.html', 'utf8');

test('gallery tariff shows only size label and five price inputs', () => {
  assert.ok(begin >= 0 && end > begin);
  assert.match(modal, /className:"clientGalleryTariffPriceGrid pb1346CompactPrices "/);
  assert.ok(!modal.includes('className:"clientGalleryTariffRowToggle'), 'no per-size enable switch');
  assert.ok(!modal.includes('className:"clientGalleryTariffRowActions"'), 'no delete or clear actions');
  assert.ok(!modal.includes('className:"clientGalleryTariffPriceGrid head"'), 'no old table heading');
  assert.match(modal, /\[\["luster","لاستر"\],\["silk","سیلک"\],\["metallic","متالیک"\],\["chassis","شاسی"\],\["frame","قاب"\]\]/);
});

test('paper prices determine size active state for new and existing galleries', () => {
  assert.match(modal, /L\.profileActive=v,L\.galleryEnabled=v,h\(C\.sizeId,L\)/);
  assert.match(bundle, /galleryEnabled:je,lusterEnabled:/);
  assert.match(bundle, /galleryEnabled:active,lusterEnabled:/);
  assert.match(bundle, /galleryEnabled:!!\(p&&\[p\.luster_price,p\.silk_price,p\.metallic_price\]\.some/);
  for (const kind of ['luster','silk','metallic','chassis','frame']) {
    assert.ok(bundle.includes(kind + 'Enabled:!!(p&&Number(p.' + kind + '_price)>0)'), kind);
  }
});

test('three paper cells form first row, two accessories form second row', () => {
  assert.match(css, /R1346: each print size has exactly two price rows/);
  for (const idx of [2,3,4,5,6]) {
    assert.ok(css.includes('.clientGalleryTariffPriceCell:nth-child(' + idx + ')'));
  }
  assert.match(css, /grid-column:span 2!important/);
  assert.match(css, /grid-column:span 3!important/);
  assert.match(html, /photobridge-r1152-gallery-layout\.css\?v=r1346/);
  assert.match(html, /tariffs=r1346/);
});
