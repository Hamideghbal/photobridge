'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');

test('R1645 ledger conversion is on the visible main order-card actions for site AND Windows',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const start=js.indexOf('function Uf('),end=js.indexOf('function vi(',start);
  assert(start>0&&end>start,'Lab order card component not found in '+root);
  const card=js.slice(start,end);
  const buttons=card.indexOf('className:"labOrderMiniActions"');
  const action=card.indexOf('miniInvoiceBtn pb1643LedgerAction');
  const nextActions=card.indexOf('className:"miniInvoiceBtn"',buttons);
  assert(buttons>0&&action>buttons&&action<nextActions,
    'Ledger conversion is not a first-class card action in '+root);
  assert.match(card,/le.settlement_mode==="prepaid"&&le.payment_status!=="paid"&&le.status==="awaiting_payment"/);
  assert.match(card,/pb1643LedgerOrder&&e.jsx\(On/);
  assert.match(card,/فقط روش تسویهٔ همین سفارش تغییر می‌کند/);
  assert.match(card,/هیچ مبلغی صفر یا تسویه نمی‌شود/);
  assert.equal((card.match(/pb1643LedgerAction/g)||[]).length,1);
  assert.match(fs.readFileSync(root+'/photobridge-r1643-order-ledger.css','utf8'),/\.labOrderMiniActions \.pb1643LedgerAction/);
  assert.match(fs.readFileSync(root+'/index.html','utf8'),/photobridge-r1643-order-ledger\.css/);
 }
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1643-order-ledger.css']){
  const row=manifest.files.find(x=>x.name===name);
  assert(row,'Windows update manifest has no '+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});

test('Windows UI-update dialog never shows misleading retry while busy, checking, current, or even error',()=>{
 const src=fs.readFileSync('apps/lab-desktop/ui-update-dialog.cjs','utf8');
 const mockRequire=name=>{
  if(name==='node:fs')return{readFileSync:()=>Buffer.from('font-mock')};
  if(name==='node:path')return path;
  if(name==='node:crypto')return crypto;
  throw Error('unexpected require '+name);
 };
 const module={exports:{}};
 const wrapped=vm.runInNewContext('(function(require,module,exports,__dirname){'+src+'})',{Buffer});
 wrapped(mockRequire,module,module.exports,'/mock/apps/lab-desktop');
 const render=module.exports.renderUiUpdate;
 for(const kind of ['checking','busy','error','current']){
  const html=render({kind,message:'نمونه وضعیت'},'test-token');
  assert.match(html,/<a href="https:\/\/photobridge\.invalid\/ui-update\/later\?token=test-token">بستن<\/a>/);
  assert.doesNotMatch(html,/ui-update\/retry/);
  assert.doesNotMatch(html,/تلاش دوباره|تلاش مجدد/);
  if(kind==='checking')assert.match(html,/update-percent/);
 }
 const ready=render({kind:'ready'},'test-token');
 assert.match(ready,/ui-update\/apply\?token=test-token/);
 assert.doesNotMatch(ready,/ui-update\/retry/);
});

test('R1645 release pipeline places the card check immediately after the existing R1643 build stage',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const patch=build.indexOf("await deployStep('./enable-r1643-order-ledger.mjs')");
 const check=build.indexOf("scripts/test-r1645-ledger-card-update-dialog.cjs");
 assert(patch>=0&&check>patch);
});
