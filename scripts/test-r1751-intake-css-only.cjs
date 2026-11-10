'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const root=['dist/web','dist/web/lab-desktop-ui'];
const marker='/* R1751: responsive layout only; no intake launcher, order, or SMS changes. */';
test('approved row wraps selected photographer and debts without overlapping',()=>{
 const css=fs.readFileSync('scripts/r1751-responsive-intake-account.css','utf8');
 for(const s of ['.pb1365CustomerAccountRow','flex-wrap:wrap!important','flex:1 1 236px!important','flex:2 1 440px!important','.pb1294AccountSummary','.pb1294AccountActions','.pb1294Meta','.pb1294InitialEdit[hidden]','overflow-wrap:anywhere!important','@media(max-width:620px)'])assert(css.includes(s),s);
 for(const s of ['#pb1137LocalIntakeButton','.pb1148SecondaryHeader','.labSingleHeader'])assert(!css.includes(s),'no header change: '+s);
});
test('one responsive CSS block and versioned CSS link in site and Windows payload',()=>{
 for(const dir of root){
  const css=fs.readFileSync(dir+'/photobridge-r1137-lab-local-intake.css','utf8');
  const html=fs.readFileSync(dir+'/index.html','utf8');
  assert.equal(css.split(marker).length-1,1);
  assert.equal(html.split('&layout=r1751').length-1,1);
  assert(!html.includes('accountRow=r1740'));
  assert(!/photobridge-r1137-lab-local-intake\.js\?[^"'<>\s]*layout=r1751/.test(html));
 }
});
test('real intake launcher, permission check and R1749 protection remain intact',()=>{
 const n='dist/web/lab-desktop-ui/';
 const js=fs.readFileSync(n+'photobridge-r1137-lab-local-intake.js','utf8');
 const header=fs.readFileSync(n+'photobridge-r1147-lab-admin-header.js','utf8');
 const headerCss=fs.readFileSync(n+'photobridge-r1147-lab-admin-header.css','utf8');
 assert(js.includes("button.id='pb1137LocalIntakeButton'"));
 assert(js.includes('/* PB1749 native visible intake */'));
 assert(js.includes('/api/lab/download-device'));
 assert(js.includes('primaryState'));
 assert(header.includes('/* PB1749 retained real intake button */'));
 assert(headerCss.includes('/* PB1749 visible real native intake */'));
 const script=fs.readFileSync('scripts/enable-r1751-intake-css-only.mjs','utf8');
 assert(!script.includes('writeFileSync(jsPath'));
 assert(!script.includes('resendPendingInvitation'));
 assert(!script.includes('delegated-orders'));
});
test('Windows hot update manifest points at the new CSS and HTML bytes',()=>{
 const n='dist/web/lab-desktop-ui/';
 const m=JSON.parse(fs.readFileSync(n+'manifest.json','utf8'));
 for(const f of ['photobridge-r1137-lab-local-intake.css','index.html']){
  const entry=m.files.find(x=>x.name===f);
  assert(entry,f);assert.equal(entry.sha256,sha(fs.readFileSync(n+f)));
 }
 assert.equal(m.build,sha(Buffer.from(JSON.stringify(m.files))));
});
