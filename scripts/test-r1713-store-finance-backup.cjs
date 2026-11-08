'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {Blob}=require('node:buffer');
const page=()=>fs.readFileSync('dist/web/store-finance-backup.html','utf8');
const script=()=>fs.readFileSync('dist/web/photobridge-r1713-store-finance-backup.js','utf8');
const shopId='20000000-0000-4000-8000-000000000001';
const studioId='10000000-0000-4000-8000-000000000123';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('R1713 store backup copies Lab progress/CSP style without order archive or restore',()=>{
 const html=page(),code=script();
 assert.match(html,/photobridge-lab-web-backup\.css/);
 assert.match(html,/id="backupProgress"/);
 assert.match(html,/id="start"/);
 assert.match(html,/default-src 'none'/);
 assert.match(html,/محدودیت پاسخ API/);
 assert.doesNotMatch(code,/\/api\/lab\//);
 assert.doesNotMatch(code,/\/api\/rental\/archive/);
 assert.doesNotMatch(code,/\/api\/rental\/orders/);
 assert.match(code,/restoreSupported:false/);
 assert.match(code,/x-photobridge-portal':'rental'/);
 assert.match(code,/rentalRole!=='shop_admin'/);
 assert.match(fs.readFileSync('dist/web/photobridge-r1713-store-backup-entry.js','utf8'),/id='pb1713StoreFinanceBackupEntry'/);
 assert.match(fs.readFileSync('dist/api/equipment-rental-portal.html','utf8'),/photobridge-r1713-store-backup-entry\.js/);
});
function harness(responses){
 const nodes=new Map(),calls=[];let exported=null,downloaded=0;
 function node(id){
  if(nodes.has(id))return nodes.get(id);
  const attrs={};
  const value={
   id,style:{},disabled:true,children:id==='steps'?Array.from({length:7},()=>({className:''})):[],
   textContent:'',className:'',
   setAttribute(k,v){attrs[k]=v},
   getAttribute(k){return attrs[k]},
   addEventListener(name,handler){this['on'+name]=handler},
   append(){},remove(){},click(){downloaded++}
  };
  nodes.set(id,value);return value;
 }
 for(const name of ['start','backupProgress','backupProgressBar','backupPercent','backupStage','message','steps'])node(name);
 const context={
  document:{getElementById:node,createElement:()=>node('link'),body:{append(){}}},
  Blob,
  URL:{createObjectURL(blob){exported=blob;return 'blob:local-test'},revokeObjectURL(){}},
  setTimeout(){},
  fetch:async(path,options)=>{
   calls.push({path,options});
   const reply=responses[path];
   return {ok:reply!==undefined,status:reply===undefined?404:200,json:async()=>reply};
  },
  console
 };
 vm.runInNewContext(script(),context);
 return {nodes,calls,get exported(){return exported},get downloaded(){return downloaded}};
}
test('R1713 exports scoped invoices, sales, payments, and ledgers only after all steps succeed',async()=>{
 const urls={
  '/api/auth/me':{user:{rentalRole:'shop_admin',rentalShopId:shopId},rentalShop:{id:shopId,name:'فروشگاه تست'}},
  '/api/rental/overview':{shop:{id:shopId},photographers:[{user_id:studioId,name:'عکاسی تست',active:true}],saleOrders:[{id:'sale1',shop_id:shopId,total_amount:45000}]},
  '/api/rental/accounting':{summary:{balance:20000},balances:[{user_id:studioId,balance:20000}],entries:[{id:'pay1',shop_id:shopId,entry_type:'payment',amount:25000}],invoices:[{id:'inv1',shop_id:shopId,total_amount:45000}]},
  ['/api/rental/accounting/ledger?photographerId='+studioId]:{photographerId:studioId,entries:[{id:'pay1',shop_id:shopId,entry_type:'payment',amount:25000}],summary:{balance:20000}}
 };
 const h=harness(urls);
 await flush();
 assert.equal(h.nodes.get('start').disabled,false);
 h.nodes.get('start').onclick();
 await flush();await flush();
 assert.equal(h.downloaded,1);
 assert(h.exported);
 const backup=JSON.parse(await h.exported.text());
 assert.equal(backup.format,'photobridge-store-finance-readable-snapshot');
 assert.equal(backup.store.id,shopId);
 assert.equal(backup.restoreSupported,false);
 assert.equal(backup.datasets.rentalInvoices.length,1);
 assert.equal(backup.datasets.salesDocuments.length,1);
 assert.equal(backup.datasets.receipts.length,1);
 assert.equal(backup.datasets.ledgerByPhotographer.length,1);
 assert.equal(backup.datasets.bookings,undefined);
 assert.equal(backup.datasets.archive,undefined);
 assert(h.calls.every(x=>x.options.headers['x-photobridge-portal']==='rental'));
 assert.equal(h.nodes.get('backupProgress').getAttribute('aria-valuenow'),'100');
});
test('R1713 blocks staff and mismatched store and never writes a partial backup',async()=>{
 const staff=harness({'/api/auth/me':{user:{rentalRole:'handover_staff',rentalShopId:shopId},rentalShop:{id:shopId}}});
 await flush();
 assert.equal(staff.nodes.get('start').disabled,true);
 assert.equal(staff.downloaded,0);
 const wrong=harness({
  '/api/auth/me':{user:{rentalRole:'shop_admin',rentalShopId:shopId},rentalShop:{id:shopId,name:'فروشگاه'}},
  '/api/rental/overview':{shop:{id:'99999999-0000-4000-8000-000000000001'},saleOrders:[]}
 });
 await flush();wrong.nodes.get('start').onclick();await flush();await flush();
 assert.equal(wrong.downloaded,0);
 assert.match(wrong.nodes.get('message').textContent,/فروشگاه فعال تغییر کرده/);
});