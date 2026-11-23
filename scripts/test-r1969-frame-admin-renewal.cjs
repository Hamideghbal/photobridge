'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const uuid='11111111-1111-4111-8111-111111111111';

function routeSource(){
 const s=read('dist/api/server.js');
 const start=s.indexOf('const pb1969FrameRenew=');
 const end=s.indexOf("    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops')",start);
 assert(start>=0&&end>start,'R1969 route must follow R1824 and precede admin create-shop');
 return s.slice(start,end);
}
test('R1969: server route validates admin, category and month count without payments',()=>{
 const source=routeSource();
 assert.doesNotThrow(()=>new vm.Script('(async()=>{'+source+'})()'));
 assert(source.includes("requireRole(a,'platform_admin')"));
 assert(source.includes("['frame','chassis','frame_chassis'].includes("));
 assert(source.includes("error:'frame_store_only'"));
 assert(source.includes("GREATEST(COALESCE(active_until,now()),now())"));
 assert(source.includes('FOR UPDATE'));
 assert(source.includes('COMMIT'));
 assert(source.includes("free:true"));
 assert(source.includes("platform_admin.frame_store_credit_grant"));
 assert(!source.includes('INSERT INTO'),'no payment/wallet history writes');
 assert(!source.includes('active=true'),'renewal must not activate a suspended or inactive store');
 assert(!source.includes('suspended=false'),'renewal must not lift suspension');
 assert(!source.includes('UPDATE labs'),'lab subscription unchanged');
});
test('R1969: only frame/chassis stores renew; camera/labs and invalid requests denied',async()=>{
 const code=routeSource();
 const run=new Function('req','url','a','requireRole','sendJson','bodyJson','pool','audit','res','return (async()=>{'+code+'})()');
 async function call({category='frame_chassis',months=3,authorized=true,deleted=false,until='2026-11-15T00:00:00Z',path='/api/admin/equipment-rental/shops/'+uuid+'/grant-frame-renewal',method='POST'}={}){
  const sql=[],audits=[];
  const shop={id:uuid,name:'شاسی آزمایشی',business_category:category,deleted_at:deleted?new Date():null,active_until:until};
  const client={query:async(q,params=[])=>{
   sql.push({q,params});
   if(String(q).startsWith('SELECT id,name,business_category'))return {rows:[shop]};
   if(String(q).startsWith('UPDATE equipment_rental_shops'))return {rows:[{active_until:'2027-02-15T00:00:00Z'}]};
   return {rows:[]};
  },release:()=>{}};
  const res=await run({method},{pathname:path},{userId:uuid},()=>authorized,
   (_res,status,payload)=>({status,payload}),async()=>({months}),{connect:async()=>client},
   async(...args)=>{audits.push(args)},null);
  return {res,sql,audits};
 }
 for(const category of ['frame','chassis','frame_chassis']){
  const ret=await call({category});
  assert.equal(ret.res.status,200,category);
  assert.equal(ret.res.payload.free,true,category);
  assert.equal(ret.res.payload.months,3,category);
  assert.equal(ret.sql.filter(x=>String(x.q).startsWith('UPDATE equipment_rental_shops')).length,1,category);
  assert.equal(ret.audits.length,1,category);
  assert.equal(ret.sql.find(x=>String(x.q).startsWith('UPDATE equipment_rental_shops')).params[1],3);
 }
 for(const category of ['equipment_rental','equipment_sale','equipment_rental_sale']){
  const ret=await call({category});
  assert.equal(ret.res.status,403,category);
  assert.equal(ret.res.payload.error,'frame_store_only');
  assert(!ret.sql.some(x=>String(x.q).startsWith('UPDATE')),category);
 }
 assert.equal((await call({authorized:false})).res.status,403);
 assert.equal((await call({months:0})).res.status,400);
 assert.equal((await call({months:25})).res.status,400);
 assert.equal((await call({months:2.5})).res.status,400);
 assert.equal((await call({until:null})).res.status,409);
 assert.equal((await call({deleted:true})).res.status,404);
 assert.equal((await call({path:'/api/admin/labs/'+uuid+'/renew'})).res,undefined);
 assert.equal((await call({method:'GET'})).res,undefined);
});
test('R1969: frame/chassis button appears only in correct admin store rows',()=>{
 const ui=read('dist/web/photobridge-v904r19-admin-stores.js');
 assert.doesNotThrow(()=>new vm.Script(ui));
 assert(ui.includes('data-pb1969-frame-renew'));
 assert(ui.includes('pb1969RenewFrameShop(shop,'));
 assert(ui.includes('["frame","chassis","frame_chassis"].includes(String(s.business_category||""))'));
 assert(ui.includes('/grant-frame-renewal'));
 assert(ui.includes('تعداد ماه تمدید رایگان'));
 assert(ui.includes('تمدید رایگان ثبت شد'));
 assert(ui.includes('data-pb1824-renew'),'existing camera renewal must remain intact');
 const html=read('dist/web/index.html');
 assert(html.includes('photobridge-v904r19-admin-stores.js?v=r1969'));
});
test('R1969: build patches after R1824 and before final compression; no migration',()=>{
 const s=read('scripts/liara-fast-build.mjs');
 const old=s.indexOf("deployStep('./enable-r1824-camera-store-only.mjs')");
 const frame=s.indexOf("deployStep('./enable-r1969-frame-admin-renewal.mjs')");
 const finalize=s.lastIndexOf("deployStep('./enable-r1897-final-lab-assets.mjs')");
 assert(old>=0&&frame>old&&finalize>frame);
 const patch=read('scripts/enable-r1969-frame-admin-renewal.mjs');
 assert(!patch.includes('migrations/'));
 assert(!patch.includes('lab-desktop'));
 assert(read('DEPLOY_REVISION.txt').includes('r1969-frame-admin-free-renewal'));
});
