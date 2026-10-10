const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const portal=fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8');
const sync=fs.readFileSync(path.join(root,'dist/api/storeDesktopSync.js'),'utf8');
const demo={id:'sample',shop_id:'shop-a',title:'Demo Camera',sku:'SOFIA-DEMO-R-001',deleted_at:null,active:true};
const deleted={id:'deleted',shop_id:'shop-a',title:'Deleted',sku:'cam-deleted',deleted_at:'2026-01-01T00:00:00Z',active:false};
const real={id:'real',shop_id:'shop-a',title:'Owned Equipment',sku:'MY-0001',deleted_at:null,active:true};
const disabled={id:'inactive',shop_id:'shop-a',title:'Owned Inactive Equipment',sku:null,deleted_at:null,active:false};
function apiEnv(payload){
  const left=portal.indexOf('api=async(url,opt={})=>');
  assert(left!==-1,'portal API must be available');
  const right=portal.indexOf('let pb834GalleryState',left);
  assert(right>left,'portal API boundary expected');
  const source=portal.slice(left,right).trim();
  assert(source.includes('PB_R1093_READONLY_INVENTORY_FILTER'),'new filter must be injected into source');
  const env={fetch:async()=>({ok:true,json:async()=>structuredClone(payload)}),pbR100F11StaffTest:()=>false};
  vm.runInNewContext('globalThis.api='+source.replace(/^api=/,''),env);
  return env.api;
}
test('read-only portal excludes only demo or deleted inventory from existing Windows SQLite snapshots',async()=>{
  const api=apiEnv({shop:{id:'shop-a'},items:[real,demo,deleted,disabled],saleItems:[demo,real,deleted,disabled],bookings:[{id:'booking-1',item_id:'sample'}]});
  const res=await api('/api/rental/overview');
  assert.deepEqual(Array.from(res.items,x=>x.id),['real','inactive']);
  assert.deepEqual(Array.from(res.saleItems,x=>x.id),['real','inactive']);
  assert.equal(res.bookings[0].id,'booking-1','rental history untouched');
});
test('other endpoints remain unmodified by the inventory filter',async()=>{
  const api=apiEnv({items:[demo,real]});
  assert.deepEqual(Array.from((await api('/api/rental/catalog')).items,x=>x.id),['sample','real']);
});
test('desktop snapshot queries are shop-scoped and exclude demo and soft-deleted inventory',()=>{
  assert.match(sync,/const inventory=name==='items'\|\|name==='saleItems'/);
  assert.match(sync,/WHERE shop_id=\$1 AND deleted_at IS NULL AND \(sku IS NULL OR sku NOT ILIKE 'SOFIA-DEMO-%'\)/);
  assert.match(sync,/WHERE shop_id=\$1 ORDER BY id/,'history tables unchanged');
  assert.match(sync,/entities\.bookingItems=/,'booking items and history preserved');
  assert.doesNotMatch(sync,/DELETE FROM equipment_rental_items|DELETE FROM equipment_sale_items/,'never delete source inventory');
});
