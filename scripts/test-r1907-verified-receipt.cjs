'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const generated=path.join(__dirname,'../dist/api/lab-download-receipt.js');
const server=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
function pool({fileBytes=20,device='D',orderStatus='sent'}={}){
 const queries=[],order={id:'ord',status:orderStatus,settlement_mode:'postpaid',payment_status:'paid',downloaded_at:null};
 let released=false;
 const client={release:()=>{released=true},query:async(q,params)=>{
  queries.push(String(q));
  if(q==='BEGIN'||q==='COMMIT'||q==='ROLLBACK')return {rows:[],rowCount:0};
  if(q.includes('FROM labs'))return {rows:[{ui_preferences:{},primary_download_device_id:device}]};
  if(q.includes('FROM orders WHERE'))return {rows:[order]};
  if(q.includes('FROM order_files'))return {rows:[{id:'file-1',original_name:'photo.jpg',print_name:'photo.jpg',bytes:fileBytes,print_bytes:fileBytes}]};
  if(q.includes('INSERT INTO platform_settings'))return {rows:[],rowCount:1};
  if(q.includes('UPDATE orders SET downloaded_at'))return {rows:[{...order,downloaded_at:'2026-11-19T00:00:00.000Z'}]};
  throw Error('unexpected SQL: '+q);
 }};
 return {queries,client,wasReleased:()=>released,connect:async()=>client};
}
const valid=[{id:'file-1',name:'photo.jpg',bytes:20}];
test('real verified receipt commits before any invoice/PDF request for candidate opt-in',async()=>{
 const {acknowledgeLabDownload}=await import(pathToFileURL(generated).href);
 assert(server.includes("req.headers['x-photobridge-receipt-only']==='1'?null:"),'native-only opt-in receipt server route not integrated');
 const db=pool();let touchedInvoice=0;
 const result=await acknowledgeLabDownload({pool:db,labId:'L',deviceId:'D',orderId:'ord',files:valid,afterVerifiedDownload:null});
 assert.equal(result.verifiedFiles,1);
 assert(result.order.downloaded_at,'download must be server verified');
 assert.equal(touchedInvoice,0);
 assert(db.queries.findIndex(q=>q==='COMMIT')>db.queries.findIndex(q=>q.includes('UPDATE orders SET downloaded_at')));
 assert(!db.queries.includes('ROLLBACK'));assert(db.wasReleased());
});
test('legacy verified receipt still awaits invoice callback as before',async()=>{
 const {acknowledgeLabDownload}=await import(pathToFileURL(generated).href);
 const db=pool(),order=[];
 const result=await acknowledgeLabDownload({pool:db,labId:'L',deviceId:'D',orderId:'ord',files:valid,
  afterVerifiedDownload:async()=>{order.push('invoice');return {invoice:{id:'inv-1'}}}});
 assert.equal(result.invoice.id,'inv-1');assert.deepEqual(order,['invoice']);
 assert.equal(db.queries.at(-1),'COMMIT');
});
test('invalid file proof or other device never acknowledges or invoices',async()=>{
 const {acknowledgeLabDownload}=await import(pathToFileURL(generated).href);
 for(const bad of [{files:[{...valid[0],bytes:7}],deviceId:'D'}, {files:valid,deviceId:'OTHER'}]){
  const db=pool();let invoices=0;
  await assert.rejects(()=>acknowledgeLabDownload({pool:db,labId:'L',orderId:'ord',files:bad.files,deviceId:bad.deviceId,afterVerifiedDownload:async()=>invoices++}));
  assert.equal(invoices,0);
  assert(db.queries.includes('ROLLBACK'));
  assert(!db.queries.includes('COMMIT'));
  assert(db.wasReleased());
 }
});
