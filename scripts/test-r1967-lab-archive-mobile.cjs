'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const read=path=>fs.readFileSync(path,'utf8');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ASSET='assets/index-UIRefine-v655-r84.js';

test('R1967: read-only Lab-scoped daily finance API uses Tehran date boundaries, invoice corrections and payments',()=>{
 const server=read('dist/api/server.js');
 const start=server.indexOf('/* PB1967 archive day financial summary, strictly scoped to lab */');
 const end=server.indexOf('async function archiveOrdersForLab(',start);
 assert(start>=0&&end>start,'day conversion function injected near archive');
 const convert=new Function(server.slice(start,end)+'return pb1967JalaliArchiveDay;')();
 assert.equal(convert('1405-09-02'),'2026-11-23');
 assert.equal(convert('1405-13-01'),null);
 assert.equal(convert('1405-11-31'),null);
 assert.equal(convert('bad'),null);
 const routeStart=server.indexOf("url.pathname==='/api/lab/archive/day-finance'");
 const routeEnd=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/archive')",routeStart);
 assert(routeStart>0&&routeEnd>routeStart,'route stays inside authenticated Lab API scope');
 const route=server.slice(routeStart,routeEnd);
 assert(route.includes('i.lab_id=$1')&&route.includes('fc.lab_id=i.lab_id')&&route.includes('lab_id=$1'),'both finance queries are lab scoped');
 assert(route.includes("AT TIME ZONE 'Asia/Tehran'"),'financial date uses Tehran calendar midnight');
 assert(route.includes('finance_payments'),'daily receipts are recorded payments');
 assert(route.includes('invoice_increase')&&route.includes('invoice_decrease'),'invoice corrections are respected');
 assert(route.includes('invoiceCount:invoices.length'));
 assert(!/\b(?:DELETE|UPDATE|INSERT|TRUNCATE)\b/i.test(route),'summary cannot write to financial or order tables');
});

test('R1967: archive square click opens finance summary without losing the existing selected orders',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/'+ASSET);
  assert(js.includes('F(be);if(t==="lab")window.dispatchEvent(new CustomEvent("pb1967-lab-archive-day"'),root+' archive date click must be actionable');
  assert(js.includes('className:"archiveInvoiceList"'),root+' existing archive order list must remain');
  assert(js.includes('className:"queueFilters mainQueueFilters compactQueueFilters"'),root+' original React status handlers preserved');
 }
});

test('R1967: mobile header retains three live status actions, page numbers, and uses real walk-in intake',()=>{
 const client=read('dist/web/photobridge-r1967-lab-archive-mobile.js');
 const css=read('dist/web/photobridge-r1967-lab-archive-mobile.css');
 assert(client.includes("btn.onclick=()=>"),'status buttons must be interactive');
 assert(client.includes('live')||client.includes("?.click()"),'status buttons invoke original React tab actions');
 assert(client.includes("source.classList.contains('active')"),'selected filter follows real status');
 assert(client.includes('pb1967LabMobileChromeReady'),'mobile overrides appear only when mounted');
 assert(client.includes("fetch('/api/lab/walkin'"),'manual button opens existing real intake instead of fake action');
 assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert(css.includes('grid-template-rows:39px 34px'));
 assert(css.includes('.r1944Search,.')||css.includes('.r1944Search,'),'mobile search hidden');
 assert(css.includes('.r1944Pager'),'pagination retained');
 assert(css.includes('html.pb1967LabMobileChromeReady'),'CSS gated to actual Lab page');
 assert(!css.includes(':has('));
 new Function(client);
});

test('R1967: native app manifest and web links contain exact new JS/CSS and updated bundle hashes',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=read(root+'/index.html');
  for(const file of ['photobridge-r1967-lab-archive-mobile.css','photobridge-r1967-lab-archive-mobile.js']){
   assert(html.includes('/'+file+'?v=r1967'),root+' missing '+file);
   assert(fs.existsSync(root+'/'+file),root+' missing output '+file);
  }
  assert(html.includes('labDaily=r1967'),root+' archive module cache revision missing');
 }
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(read(root+'/manifest.json'));
 assert.equal(manifest.channel,'lab');assert.equal(manifest.protocol,1);
 for(const file of [ASSET,'index.html','photobridge-r1967-lab-archive-mobile.css','photobridge-r1967-lab-archive-mobile.js']){
  const item=manifest.files.find(x=>x.name===file);
  assert(item,'native updater must ship '+file);
  assert.equal(item.sha256,hash(fs.readFileSync(root+'/'+file)),'native hash mismatch '+file);
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
});

test('R1967: patch executes after final Lab writers, before final br/gzip and native manifest freeze',()=>{
 const build=read('scripts/liara-fast-build.mjs');
 const old=build.lastIndexOf("deployStep('./enable-r1965-manager-mobile-only.mjs')");
 const updated=build.lastIndexOf("deployStep('./enable-r1967-lab-archive-mobile.mjs')");
 const sealed=build.lastIndexOf("deployStep('./enable-r1897-final-lab-assets.mjs')");
 assert(old>=0&&updated>old&&sealed>updated);
});
