const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const root='dist/web/',css=fs.readFileSync('scripts/r1494-lab-phone-settings.css','utf8');
test('photographer collaboration subtabs stay visible and form one compact selectable row',()=>{
 assert(css.includes('.labCustomerSectionMenu{position:sticky!important;top:0!important'));
 assert(css.includes('.labCustomerSubnav{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))'));
 const ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');for(const label of ['لیست عکاسی‌ها','دعوت‌نامه‌ها','درخواست همکاری'])assert(ui.includes(label));
});
test('photographer member status, initial-debt and activate controls use separate compact grid cells',()=>{
 assert(css.includes('.labPhotographerCard{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)'));
 assert(css.includes('.labPhotographerActions{grid-column:1/-1!important;grid-row:3!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert(css.includes('.pb1443PhotographerStatus .badge{display:inline-flex!important'));
});
test('finance setting options and both tariff matrices can scroll on lab phones',()=>{
 assert(css.includes('.pbSelectMenuPortal.pb1494LabSettingsMenu{z-index:1000!important'));
 assert(css.includes('max-height:min(62dvh,460px)!important;overflow-x:hidden!important;overflow-y:auto!important'));
 assert(css.includes('.labPrintPricingCard .priceScroller,html.pb1482LabPhoneMode body #root .labRoleWorkspace .labSettingsPageMode .settingsBody .walkinPricingCard .walkinPriceScroller'));
 assert(css.includes('overflow-y:auto!important;overscroll-behavior:contain!important'));
});
test('all changes require lab phone scope and frozen Windows UI remains byte-identical',()=>{
 for(const line of css.split('\n').filter(v=>v.startsWith('html.')) )assert(line.startsWith('html.pb1482LabPhoneMode body'),line.slice(0,120));
 const ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('menuClassName:pb1487PhonePicker()?\'pb1494LabSettingsMenu\':\'\''));assert.equal((ui.match(/pb1494LabSettingsMenu/g)||[]).length,2);new vm.Script(ui);
 const manifest=JSON.parse(fs.readFileSync(root+'lab-desktop-ui/manifest.json','utf8'));for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'lab-desktop-ui/'+f.name)).digest('hex'),f.sha256,f.name);
});
