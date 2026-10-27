const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const root='dist/web/',css=fs.readFileSync('scripts/r1495-mobile-tariff-editing.css','utf8');
test('archive action pair is left aligned at the trailing edge of each archive record',()=>{
 assert(css.includes('.archiveInvoice .archiveRowActions{display:flex!important;grid-column:1/-1!important;justify-self:stretch!important;justify-content:flex-start!important'));
 assert(css.includes('direction:ltr!important'));
});
test('print and walk-in tariff rows show compact size identity and open editable tariff controls',()=>{
 const ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('onClick:()=>pb1487PhonePicker()&&g(k)'));assert(ui.includes('onClick:()=>pb1487PhonePicker()&&setEdit(I)'));
 assert(ui.includes('function PB1495WalkinTariffModal('));assert(ui.includes("'/api/lab/walkin/prices'"));
 assert(css.includes('.mobilePriceCell{display:none!important}'));assert(css.includes('.priceSizeIdentity>button{grid-column:2!important'));
 assert(css.includes('.modal.pb1495TariffEditor .pb1495TariffFields'));
});
test('photographer settlement, initial debt and active controls share a compact phone-only action row',()=>{
 const ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('className:"labPhotographerActions",children:[e.jsxs("div",{className:"labPhotographerSettlement"'));
 assert(css.includes('.labPhotographerActions{grid-column:1/-1!important;grid-row:3!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert(css.includes('.labPhotographerList{width:100%!important;min-width:0!important;overflow-x:hidden!important'));
});
test('tariff action controls stick while headings scroll and all scope remains lab-phone only',()=>{
 assert(css.includes('.priceCatalogActions{position:sticky!important;top:0!important'));
 assert(css.includes('.labPrintPricingCard>.panelHead{display:contents!important}'));
 for(const line of css.split('\n').filter(v=>v.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body'),line.slice(0,120));
 const manifest=JSON.parse(fs.readFileSync(root+'lab-desktop-ui/manifest.json','utf8'));for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'lab-desktop-ui/'+f.name)).digest('hex'),f.sha256,f.name);new vm.Script(fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8'));
});
