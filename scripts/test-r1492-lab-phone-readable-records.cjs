const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const root='dist/web/',css=fs.readFileSync('scripts/r1492-lab-phone-readable-records.css','utf8'),index=fs.readFileSync(root+'index.html','utf8'),ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');
test('finance numerals are enlarged and statement transactions use readable mobile cards',()=>{
 assert(css.includes('.pb1431ReceiptRow>strong{font-size:13px!important'));
 assert(css.includes('.invoiceRow b{font-size:10px!important'));
 assert(css.includes('.statementTable tbody tr{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)'));
 for(const label of ['ردیف','تاریخ','شرح','شماره سند','بدهکار','بستانکار','باقیمانده'])assert(css.includes('content:"'+label+'"'));
 assert(index.includes('photobridge-r1492-lab-phone-readable-records.css?v=r1492'));
 assert(ui.includes('className:"pb1431ReceiptRow"')&&ui.includes('className:"statementTable"'));
});
test('archive show action aligns left and all changes are restricted to lab phones',()=>{
 assert(css.includes('.archiveInvoice .invoiceActionMini>button:first-child,html.pb1482LabPhoneMode body #root .labRoleWorkspace .labRolePageScrollArea .archiveRowActions>button:first-child{justify-content:flex-start!important;text-align:left!important}'));
 for(const line of css.split('\n').filter(v=>v.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body '));
 const manifest=JSON.parse(fs.readFileSync(root+'lab-desktop-ui/manifest.json','utf8'));
 for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'lab-desktop-ui/'+f.name)).digest('hex'),f.sha256,f.name);
});
