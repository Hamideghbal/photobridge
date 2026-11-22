'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=fs.readFileSync('dist/api/server.js','utf8');
const mark='function pb1962LabManagerEventInfo(';
const begin=api.indexOf(mark),end=api.indexOf('\nfunction publishCustomerEvent(',begin);
assert(begin>=0&&end>begin,'R1962 manager helper was installed in production server');
const source=api.slice(begin,end);
const lab='11111111-1111-4111-8111-111111111111';
const order='22222222-2222-4222-8222-222222222222';
const invoice='33333333-3333-4333-8333-333333333333';
const context=vm.createContext({console,Map,Set,JSON,Number,String,Object,Date,Promise});
vm.runInContext(source,context);
const info=(event,extras={})=>context.pb1962LabManagerEventInfo(event,{orderId:order,number:'4231',...extras});
test('R1962 manager copy uses persisted download completion, not an upload started state',()=>{
 assert.equal(info('order_status',{status:'sent',updatedAt:'2026-11-23T12:00:00Z'}),null);
 assert.equal(info('order_status',{status:'downloaded'}).eventKey,'lab_manager_download_verified');
 assert.equal(info('album_download_verified').eventKey,'lab_manager_download_verified');
 assert.equal(info('order_status',{status:'downloaded'}).dedupeKey,info('album_download_verified').dedupeKey);
 assert.equal(info('order_status',{status:'ready',updatedAt:'2026-11-23T12:00:00Z'}).eventKey,'lab_manager_order_status');
 assert.equal(info('order_status',{status:'ready',updatedAt:'2026-11-23T12:00:00Z',managerChanged:false}),null);
 assert.equal(info('order_status',{status:'ready'}),null);
});
test('R1962 invoice ID is the unique event identity; legacy invoice number not confused with order number',()=>{
 const a=info('invoice_ready',{invoiceId:invoice,number:908});
 const b=info('invoice_created',{invoiceId:invoice,invoiceNumber:908,orderNumber:'4231'});
 assert.equal(a.dedupeKey,b.dedupeKey);
 assert.match(a.message,/908/);
 assert(!a.message.includes('سفارش #908'));
 assert.match(b.message,/4231/);
});
test('R1962 album stage notifies binding separately without announcing manual printing as a verified download',()=>{
 assert.equal(info('album_stage_updated',{stage:'binding',updatedAt:'2026-11-23T12:00:00Z'}).eventKey,'lab_manager_album_stage');
 assert.equal(info('album_stage_updated',{stage:'printing',updatedAt:'2026-11-23T12:00:00Z'}),null);
 assert.equal(info('album_stage_updated',{stage:'ready',updatedAt:'2026-11-23T12:00:00Z'}),null);
});
test('R1962 sends at most one push for repeated server events and keeps lab recipient isolation',async()=>{
 const rows=[],push=[];
 const connection={
  query:async (sql,args=[])=>{
   if(sql.startsWith('INSERT INTO system_notifications')){
    const key=args[5],existing=rows.find(r=>r.lab===args[0]&&r.event===args[1]&&r.key===key);
    if(existing)return {rows:[]};
    const row={id:String(rows.length+1),title:args[2],message:args[3]};
    rows.push({lab:args[0],event:args[1],key,row});return {rows:[row]};
   }
   return {rows:[]};
  },release:()=>{}
 };
 context.pool={connect:async()=>connection};
 context.sendWebPushToRecipient=async(kind,id,row,event)=>{push.push({kind,id,row,event});return {accepted:1}};
 context.labEventClients=new Map();
 const input={orderId:order,number:4231,status:'downloaded',updatedAt:'2026-11-23T12:00:00Z'};
 assert.equal(await context.pb1962LabManagerNotify(lab,'order_status',input),true);
 assert.equal(await context.pb1962LabManagerNotify(lab,'order_status',input),false);
 await Promise.resolve();
 assert.equal(rows.length,1);
 assert.equal(push.length,1);
 assert.equal(push[0].kind,'lab');
 assert.equal(push[0].id,lab);
 assert.equal(await context.pb1962LabManagerNotify('bad-lab','order_status',input),false);
});
test('R1962 server hooks are placed after commits and scope subscriptions to a lab admin',()=>{
 const customer=api.slice(api.indexOf('function publishCustomerEvent('),api.indexOf('function publishRentalShopEvent('));
 assert.match(customer,/pb1962LabManagerNotify\(labId,event,data\)/);
 const labScope=api.slice(api.indexOf("if (url.pathname.startsWith('/api/lab/'))"),api.indexOf("if (req.method === 'POST' && url.pathname === '/api/lab/push/subscribe')")+1500);
 assert.match(labScope,/requireRole\(a, 'lab_admin'\)/);
 assert.match(labScope,/recipient_lab_id/);
 const download=api.slice(api.indexOf('const labAlbumDownloadComplete'),api.indexOf('const labPaymentReceipt'));
 assert(download.indexOf("await c.query('COMMIT')")<download.indexOf("pb1962LabManagerNotify(labId,'album_download_verified'"));
 assert.match(api,/managerChanged:String\(oldOrder\.status\|\|''\)!==String\(status\)/);
 assert.match(api,/invoiceId:submitted\._invoice\?\.id\|\|null/);
});
test('R1962 mobile prompt uses a user gesture; existing PWA worker and sound remain untouched',()=>{
 const push=fs.readFileSync('dist/web/photobridge-push-v728.js','utf8');
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(push.includes('مدیر لابراتوار: سفارش جدید، دانلود کامل، صدور فاکتور'));
 assert(push.includes("Notification.requestPermission()"));
 assert(push.includes('PB782EnableNotifications'));
 assert.match(html,/photobridge-push-v728\.js\?[^"']*labManager=r1962/);
 const sw=fs.readFileSync('dist/web/photobridge-sw-v710.js','utf8');
 assert(sw.includes("self.addEventListener('push'"));
 assert(sw.includes('showNotification'));
});
