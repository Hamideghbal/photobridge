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

test('R1967: mobile header retains three live status actions, page numbers, and opens the real on-site Lab intake',()=>{
 const client=read('dist/web/photobridge-r1967-lab-archive-mobile.js');
 const css=read('dist/web/photobridge-r1967-lab-archive-mobile.css');
 assert(client.includes("btn.onclick=()=>"),'status buttons must be interactive');
 assert(client.includes('live')||client.includes("?.click()"),'status buttons invoke original React tab actions');
 assert(client.includes("source.classList.contains('active')"),'selected filter follows real status');
 assert(client.includes('pb1967LabMobileChromeReady'),'mobile overrides appear only when mounted');
 assert(client.includes('＋ سفارش حضوری'),'mobile action must be called سفارش حضوری');
 assert(client.includes('pb1969OpenLabOnsiteOrder'),'mobile action invokes actual Lab intake');
 assert(!client.includes("fetch('/api/lab/walkin'"),'mobile action must never open the customer QR link');
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
  for(const [file,version] of [['photobridge-r1967-lab-archive-mobile.css','r1967'],['photobridge-r1967-lab-archive-mobile.js','r1969'],['photobridge-r1969-lab-onsite-order.css','r1969'],['photobridge-r1969-lab-onsite-order.js','r1969']]){
   assert(html.includes('/'+file+'?v='+version),root+' missing or stale '+file);
   assert(fs.existsSync(root+'/'+file),root+' missing output '+file);
  }
  assert(html.includes('labDaily=r1968'),root+' archive module cache revision missing');
 }
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(read(root+'/manifest.json'));
 assert.equal(manifest.channel,'lab');assert.equal(manifest.protocol,1);
 for(const file of [ASSET,'index.html','photobridge-r1967-lab-archive-mobile.css','photobridge-r1967-lab-archive-mobile.js','photobridge-r1969-lab-onsite-order.css','photobridge-r1969-lab-onsite-order.js']){
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

test('R1968: clicking a Lab calendar day triggers exactly one summary and parses Persian digits without changing the React selection',()=>{
 const src=read('dist/web/photobridge-r1967-lab-archive-mobile.js');
 const start=src.indexOf('const pb1968Months=');
 const end=src.indexOf('function pb1968ArchiveDayClick(',start);
 assert(start>=0&&end>start,'pure Persian day parser must exist');
 const parse=new Function(src.slice(start,end)+'return pb1968ArchiveDateKey;')();
 assert.equal(parse('آذر ۱۴۰۵','۲'),'1405-09-02');
 assert.equal(parse('فروردین ۱۴۰۴','۳۱'),'1404-01-31');
 assert.equal(parse('بهمن ١٤٠٥','١٠'),'1405-11-10');
 assert.equal(parse('آذر ۱۴۰۵','۰'),null);
 assert.equal(parse('unknown','۲'),null);
 assert(src.includes("document.addEventListener('click',pb1968ArchiveDayClick,true)"),'capture-phase native click must not depend on React bundle patch');
 assert(src.includes("'.labArchiveWorkspace .persianCalendarCard .calendarGrid button'"),'delegated handler must be scoped to the Lab archive calendar only');
 assert(src.includes("if(popup?.isConnected&&openDay===day)return"),'React custom event and native click must not reopen the modal or refetch');
 assert(src.includes("if(day)void show(day)"),'click must directly open day financial modal');
 assert(src.includes("if(e.detail?.role==='lab')"),'original event listener remains for cached/older UI variants');
});

test('R1969: mobile on-site intake is a real Lab order and not walk-in QR/manual invoice',()=>{
 const client=read('dist/web/photobridge-r1969-lab-onsite-order.js');
 const server=read('dist/api/server.js');
 assert(client.includes("window.pb1969OpenLabOnsiteOrder=open"),'mobile button opens on-site form');
 assert(client.includes("'ثبت سفارش حضوری'"),'intake title uses requested label');
 assert(client.includes("'/api/lab/delegated-orders/bootstrap?mode=print&fresh='"),'same customer/size bootstrap as Lab website intake');
 assert(client.includes("'/api/lab/delegated-orders','POST'"),'creates an actual Lab order');
 assert(client.includes("localOnly:false"),'mobile cannot impersonate the lab primary hard-drive device');
 assert(client.includes("'/files/presign'")&&client.includes("'/api/lab/delegated-files/complete'"),'all photos are uploaded then verified before submit');
 assert(client.includes("'/submit'")&&client.includes("state.items.length"),'submission follows verified uploaded originals');
 assert(client.includes("clientOrderId:state.clientOrderId")&&client.includes("clientFileId:entry.id"),'retry uses stable idempotency IDs');
 assert(client.includes("if(entry.complete)return"),'retries do not re-upload verified photos');
 assert(client.includes("state.locked=true"),'customer, files and pricing cannot change after a draft is reserved');
 assert(client.includes("customerId")&&client.includes("studioName")&&client.includes("mobile"),'both linked photographer and new mobile customer supported');
 assert(!client.includes("/api/lab/walkin")&&!client.includes("/api/lab/invoices/manual"),'wrong QR and invoice shortcuts excluded');
 assert(server.includes("if (b.localOnly === true && !await requireLocalIntakePrimary()) return;"),'only local primary-device intakes are gated');
 assert(server.includes("if (!deviceLocal && !uploadAvailable)"),'remote intake requires real upload storage');
 assert(server.includes("f.original_state !== 'active'"),'backend rejects orders with unverified originals');
 new Function(client);
});
