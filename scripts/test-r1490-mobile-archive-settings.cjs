const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const uiRoot='dist/web/',css=fs.readFileSync('scripts/r1490-mobile-archive-settings.css','utf8'),index=fs.readFileSync(uiRoot+'index.html','utf8');
test('R1490 styles phone archive invoice actions and the invoice close control without touching invoice content',()=>{
 assert.match(css,/\.invoiceActionMini\{display:grid!important;grid-template-columns:repeat\(2/);
 assert.match(css,/\.invoicePreviewHeadActions>button:last-child\{display:grid!important/);
 assert(index.includes('photobridge-r1490-mobile-archive-settings.css?v=r1490'));
 const ui=fs.readFileSync(uiRoot+'assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('children:"مشاهده فاکتور"'));assert(ui.includes('invoicePreviewHeadActions'));
});
test('settings pickers sit side-by-side and print tariff sizes become editable two-column cards on phones',()=>{
 assert.match(css,/\.labSettingsMobilePickers\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.inventoryPriceGrid:not\(\.head\)\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.mobilePriceCell>input\{width:100%!important/);
 assert.match(css,/labWalkinPricingCard,\.walkinPricingCard/);
});
test('all new styling is gated to lab phone mode and Windows bundle bytes remain frozen',()=>{
 for(const line of css.split('\n').filter(v=>v.includes('{')&&v.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body '),line.slice(0,100));
 const manifest=JSON.parse(fs.readFileSync(uiRoot+'lab-desktop-ui/manifest.json','utf8'));
 for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(uiRoot+'lab-desktop-ui/'+f.name)).digest('hex'),f.sha256,f.name);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.includes('enable-r1490-mobile-archive-settings.mjs'));
});
