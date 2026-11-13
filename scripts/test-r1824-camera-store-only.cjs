'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

test('R1824: patch script changes ONLY camera-store portal/admin and the isolated server route',()=>{
 const script=read('scripts/enable-r1824-camera-store-only.mjs');
 const paths=[...script.matchAll(/(?:read|write)\('([^']+)'/g)].map(x=>x[1]);
 assert(paths.includes('dist/api/server.js'));
 assert(paths.includes('dist/api/equipment-rental-portal.html'));
 assert(paths.includes('dist/web/photobridge-v904r19-admin-stores.js'));
 assert(paths.includes('dist/web/index.html'));
 assert(!paths.some(x=>/lab-desktop-ui|lab-storefront|frame-store|photographer\/finance|lab-invoice/i.test(x)));
 assert(!script.includes('dist/web/assets/index-UIRefine-v655-r84.js'),'shared web bundle unchanged');
 assert(!script.includes('dist/api/lab-'),'lab API templates untouched');
});
test('R1824: camera category guard excludes ALL frame and chassis shops',()=>{
 const server=read('dist/api/server.js');
 const start=server.indexOf('const pb1824AdminCameraRenew=');
 const end=server.indexOf("    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops')",start);
 assert(start>0&&end>start,'isolated admin endpoint inserted before create-shop route');
 const snippet=server.slice(start,end);
 assert(snippet.includes("!['equipment_rental','equipment_sale','equipment_rental_sale'].includes("));
 assert(snippet.includes("error:'camera_store_only'"));
 assert(snippet.includes("requireRole(a,'platform_admin')"));
 assert(snippet.includes("GREATEST(COALESCE(active_until,now()),now())"));
 assert(!snippet.includes('suspended=false'),'renewal never clears suspension');
 assert(!snippet.includes('UPDATE labs'),'lab data never updated');
 assert(!snippet.includes('payment_method'),'no payment record or charge created');
});
test('R1824: administrator extension only updates dates for camera; blocks frame, labs and unauthorized calls',async()=>{
 const code=read('dist/api/server.js');
 const first=code.indexOf('const pb1824AdminCameraRenew=');
 const last=code.indexOf("    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops')",first);
 const source=code.slice(first,last);
 assert.doesNotThrow(()=>new vm.Script('(async()=>{'+source+'})()'));
 const run=new Function('req','url','a','requireRole','sendJson','bodyJson','pool','audit','res','return (async()=>{'+source+'})();');
 const uuid='11111111-1111-4111-8111-111111111111';
 async function call(category,months=3,authorized=true,path='/api/admin/equipment-rental/shops/'+uuid+'/grant-renewal'){
  const sql=[];
  const shop={id:uuid,name:'آزمایش',business_category:category,active_until:'2026-11-15T00:00:00Z',deleted_at:null};
  const client={query:async(q,params=[])=>{sql.push({q,params});if(String(q).startsWith('SELECT id,name,business_category'))return {rows:[shop]};if(String(q).startsWith('UPDATE equipment_rental_shops'))return {rows:[{active_until:'2027-02-15T00:00:00Z'}]};return {rows:[]}},release:()=>{}};
  const ret=await run({method:'POST'},{pathname:path},{userId:uuid},()=>authorized,(res,status,payload)=>({status,payload}),async()=>({months}),{connect:async()=>client},async()=>{},null);
  return {ret,sql};
 }
 const camera=await call('equipment_sale',3);
 assert.equal(camera.ret.status,200);
 assert.equal(camera.ret.payload.free,true);
 assert.equal(camera.ret.payload.months,3);
 const sql=camera.sql.find(x=>x.q.startsWith('UPDATE equipment_rental_shops'));
 assert(sql);
 assert.equal(sql.params[1],3);
 for(const frame of ['frame','chassis','frame_chassis']){
  const testShop=await call(frame,3);
  assert.equal(testShop.ret.status,403,frame);
  assert.equal(testShop.ret.payload.error,'camera_store_only');
  assert(!testShop.sql.some(x=>x.q.startsWith('UPDATE')),frame+' must never be renewed');
 }
 const unauthorized=await call('equipment_sale',3,false);
 assert.equal(unauthorized.ret.status,403);
 assert.equal(unauthorized.sql.length,0);
 const badMonths=await call('equipment_sale',0);
 assert.equal(badMonths.ret.status,400);
 const lab=await call('equipment_sale',3,true,'/api/admin/labs/'+uuid+'/renew');
 assert.equal(lab.ret,undefined);
 assert.equal(lab.sql.length,0);
});
test('R1824: desktop scrollbar is scoped to camera and ONLY office/sales/rent tabs',()=>{
 const html=read('dist/api/equipment-rental-portal.html');
 assert(html.includes("['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))"));
 assert(html.includes("['bookings','sales','items'].includes(tab)"));
 assert(html.includes('html.pb1824CameraScroll::-webkit-scrollbar'));
 assert(html.includes('width:12px!important;height:auto!important;display:block!important'));
 assert(html.includes('@media (min-width:851px)'));
 assert(!html.includes("['frame','chassis','frame_chassis'].includes(String(data?.shop?.business_category||''))&&['bookings','sales','items']"));
});
test('R1824: camera invite can be copied when SMS provider fails, never claimed as SMS sent',()=>{
 const server=read('dist/api/server.js'),start=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/rental/photographer-invites/send-sms')"),end=server.indexOf('    // Store-origin photographers',start);
 const snippet=server.slice(start,end);
 assert(snippet.includes("context==='invite'&&['equipment_rental','equipment_sale','equipment_rental_sale']"));
 assert(snippet.includes("sms:{sent:false,error:code}"));
 assert(snippet.includes('url:inviteUrl'));
 assert(snippet.includes('const out=await sendSms('),'existing SMS attempt is still first');
 const html=read('dist/api/equipment-rental-portal.html');
 assert(html.includes("data?.shop?.business_category||''))&&out?.sms?.sent===false"));
 assert(html.includes('pb1824CameraInviteCopy(out);return true;'));
 assert(html.includes('دعوت‌نامه برای این شماره ساخته شد، اما پیامک ارسال نشد'));
 assert(html.includes('navigator.clipboard.writeText(input.value)'));
});
test('R1824: admin UI offers free renewal only to camera stores; platform still renders frame rows without it',()=>{
 const js=read('dist/web/photobridge-v904r19-admin-stores.js');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert(js.includes('data-pb1824-renew'));
 assert(js.includes('pb1824RenewCameraShop(shop)'));
 assert(js.includes('["equipment_rental","equipment_sale","equipment_rental_sale"].includes(String(s.business_category||""))'));
 assert(js.includes('grant-renewal'));
 assert(js.includes('تعداد ماه تمدید رایگان'));
 assert(js.includes('free:true')===false,'free flag belongs to the backend route');
});
test('R1824: installer is after all previous lab and album release steps',()=>{
 const build=read('scripts/liara-fast-build.mjs');
 assert(build.indexOf("deployStep('./enable-r1824-camera-store-only.mjs')")>build.indexOf("deployStep('./enable-r1822-finance-newest-first.mjs')"));
 assert(read('dist/web/index.html').includes('photobridge-v904r19-admin-stores.js?v=r1824'));
 assert(read('DEPLOY_REVISION.txt').includes('r1824-camera-store-only'));
});
