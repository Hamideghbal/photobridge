const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const root='dist/web/',css=fs.readFileSync('scripts/r1491-mobile-archive-action-grid.css','utf8'),index=fs.readFileSync(root+'index.html','utf8');
test('archive file/reprint and invoice controls form aligned two-row touch targets on phones',()=>{
 assert(css.includes('.archiveInvoice .archiveRowActions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert(css.includes('.archiveInvoice .archiveRowActions>.invoiceActionMini{grid-column:1/-1!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert(index.includes('photobridge-r1491-mobile-archive-action-grid.css?v=r1491'));
 const ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('فایل‌ها / چاپ مجدد'));assert(ui.includes('مشاهده فاکتور'));
});
test('archive action styles are isolated to lab phones and frozen Windows assets are intact',()=>{
 for(const line of css.split('\n').filter(v=>v.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body '));
 const manifest=JSON.parse(fs.readFileSync(root+'lab-desktop-ui/manifest.json','utf8'));
 for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'lab-desktop-ui/'+f.name)).digest('hex'),f.sha256,f.name);
});
