import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {patchServer,patchPanel,patchBook,patchIndex,patchLabs} from './enable-r2114-mobile-directory-speed.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const server=read('dist/api/server.js'),panel=read('dist/web/photobridge-r1106-mobile-store-panel.js'),labs=read('dist/web/photobridge-v904r99-lab-chooser.js'),book=read('dist/api/equipment-rental-book.html'),index=read('dist/web/index.html');
test('mobile Store directory skips inventory aggregates; desktop/full SQL retains them and both enforce access rules',async()=>{
 const a=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/customer/equipment-rental/shops')"),b=server.indexOf('const customerRentalShopSelect',a);
 const body=server.slice(a,b);
 const run=new Function('req','url','a','res','sendJson','ensureEquipmentRentalV727Schema','photographerInitialOriginContext','pool','equipmentRentalInvitedShopIds','testAccountSql','adminMobileViewerSql','testAccountVisibleSql','normalizeMobile','EQUIPMENT_STORE_PREVIEW_ADMIN_MOBILE_V802','isProductionShop','reachAllows','return (async()=>{'+body+'})()');
 for(const mode of ['1','0']){
  let queries=[],origins=0;
  const rows=[{id:'invited',name:'Invited',connected:true,rental_enabled:true},{id:'outside',name:'Outside',rental_enabled:true},{id:'production',name:'Production',business_category:'frame',sale_enabled:true}];
  const pool={query:async sql=>{queries.push(sql);return {rows:sql.includes('SELECT province,city')?[{}]:rows}}};
  const result=await run({method:'GET'},new URL('https://x/api/customer/equipment-rental/shops?pbDirectory='+mode),{labRole:'customer',userId:'u'},null,(_r,status,data)=>({status,data}),async()=>{},async()=>{origins++;return {originType:'rental',primaryShopId:'invited'}},pool,async()=>['invited'],()=> 'false',()=> 'false',()=> 'true',x=>x,'test',s=>s.business_category==='frame',()=>true);
  assert.equal(origins,1);assert.equal(result.status,200);assert.deepEqual(result.data.shops.map(s=>s.id),['invited','production']);
  const q=queries.find(sql=>sql.includes('FROM equipment_rental_shops s'));
  assert.match(q,/s\.active=true/);assert.match(q,/collaboration_status/);assert.match(q,/connected/);
  if(mode==='1'){assert.doesNotMatch(q,/equipment_(?:rental|sale)_items/);assert.match(q,/LEFT JOIN LATERAL/);assert.match(q,/pb_member\.settlement_mode/)}
  else{assert.match(q,/min_daily_price/);assert.match(q,/min_sale_price/);assert.match(q,/active_items DESC/)}
 }
 const denied=await run({method:'GET'},new URL('https://x/api/customer/equipment-rental/shops?pbDirectory=1'),null,null,(_r,status,data)=>({status,data}));assert.equal(denied.status,401);
});
test('Lab list reads run concurrently and keep invitation, visibility and primary ordering logic',()=>{
 const a=server.indexOf('/* PB2114 concurrent lab directory reads */'),b=server.indexOf('const customerLabRequest',a),s=server.slice(a,b);
 assert.match(s,/Promise\.all\(\[/);assert.match(s,/photographerInitialOriginContext\(a\.userId\)/);assert.match(s,/invitedLabIds/);assert.match(s,/testAccountVisibleSql/);assert.match(s,/sortPrimary/);
});
test('mobile frame prefetch is consumed once and only the matching frame can uncover its panel',()=>{
 assert.match(panel,/installEarlyDirectory\(frame,kind,q\);frame\.src=frame\.dataset\.pb2099Entry/);
 assert.match(panel,/panel\.querySelector\('iframe'\)!==frame/);
 assert.match(panel,/validFrame\(kind,new URL/);
 assert.match(book,/delete f\.__pb2114Directory/);
 const early=book.match(/<script id="pb1837ChooserPrefetch">([\s\S]*?)<\/script>/)[1];
 assert.equal((early.match(/\bfetch\(/g)||[]).length,1,'no duplicate legacy prefetch');
 assert.match(index,/delete frame\.__pb2114Directory/);
 assert.match(labs,/PB2114 lab directory ready/);
});
test('Store boot loads the list before nonessential header requests, preserving desktop route',()=>{
 const a=book.indexOf('/* PB2114 chooser first paint */'),b=book.indexOf('if(walletPayment)',a),s=book.slice(a,b);
 assert.match(s,/if\(!mobileDirectory\)void loadPhotographerIdentity/);
 assert.match(s,/pbDirectory=1/);
 assert.ok(s.indexOf('renderShops();renderStoreChooserR96();')<s.indexOf('requestAnimationFrame(()=>setTimeout(()=>void loadPhotographerIdentity'));
 assert.match(s,/if\(!directShop\)/);
});
test('final transformations are idempotent and prior login and logout changes survive',()=>{
 assert.equal(patchServer(server),server);assert.equal(patchPanel(panel),panel);assert.equal(patchBook(book),book);assert.equal(patchIndex(index),index);assert.equal(patchLabs(labs),labs);
 assert.match(index,/PB2113 rental account probe/);assert.match(index,/pb2112PhotographerLogout/);
});
