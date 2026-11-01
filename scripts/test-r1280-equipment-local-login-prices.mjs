import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {issueEquipmentStoreHandoff,consumeEquipmentStoreHandoff,equipmentHandoffOriginAllowed} from '../dist/api/equipment-office-handoff.js';
import {renderEquipmentPage} from '../dist/api/equipment-site-content.js';
const uuid='10000000-0000-4000-8000-000000000001',userId='20000000-0000-4000-8000-000000000001',host='store.example.test';
test('single-use store handoff retains source shop, does not store raw grant, cannot be replayed',async()=>{
 const cache=new Map();
 const db={query:async(sql,args=[])=>{
  if(sql.startsWith('DELETE FROM equipment_store_login_handoffs WHERE expires_at'))return {rows:[],rowCount:0};
  if(sql.includes('INSERT INTO equipment_store_login_handoffs')){cache.set(args[0],{user_id:args[1],shop_id:args[2],origin_host:args[3]});return {rows:[],rowCount:1};}
  if(sql.includes('DELETE FROM equipment_store_login_handoffs')&&sql.includes('RETURNING user_id')){let v=cache.get(args[0]);if(v?.origin_host!==args[1])v=null;if(v)cache.delete(args[0]);return {rows:v?[v]:[],rowCount:v?1:0};}
  if(sql.includes('SELECT 1 FROM equipment_store_domains'))return {rows:[{verified:1}],rowCount:1};
  throw Error('unexpected query '+sql);
 }};
 const token=await issueEquipmentStoreHandoff(db,{userId,shopId:uuid,host});
 assert.match(token,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(cache.has(token),false,'store only ticket hash');
 assert.equal(await consumeEquipmentStoreHandoff(db,{ticket:token,origin:'https://different.example.test'}),null);
 assert.deepEqual(await consumeEquipmentStoreHandoff(db,{ticket:token,origin:'https://'+host}),{userId,shopId:uuid});
 assert.equal(await consumeEquipmentStoreHandoff(db,{ticket:token,origin:'https://'+host}),null,'used ticket never works twice');
});
test('public equipment site keeps local login and no first-party credential screen redirect',()=>{
 const shop={id:uuid,name:'تجهیزات تست',sale_enabled:true,rental_enabled:true,city:'تهران'};
 const page=renderEquipmentPage(shop,{},'https://photobridge.ir',{hostname:host,pathname:'/'}).html;
 assert.match(page,/id="equipmentHeaderLogin"/);
 assert.match(page,/name="mobile"/);
 assert.match(page,/name="password"/);
 assert.doesNotMatch(page,/pbOfficeLogin=1/);
 assert.match(page,/equipment-site\.js\?v=r\d+/,'public equipment site loads the versioned live login bundle');
 const guide=renderEquipmentPage(shop,{},'https://photobridge.ir',{hostname:host,pathname:'/rental-equipment'}).html;
 assert.match(guide,/id="equipmentOfficePageLogin"/);
 assert.doesNotMatch(guide,/data-open-equipment-login/);
});
test('discount displays newest price first, previous price below, no percent badge',()=>{
 const web=readFileSync('dist/web/storefront.js','utf8'),portal=readFileSync('dist/api/equipment-rental-book.html','utf8');
 assert.match(web,/<strong class="pbSalePriceNew">/);
 assert.match(web,/<del class="pbSalePriceOld"/);
 assert.doesNotMatch(web,/frameDiscountBadge.*٪ تخفیف/);
 assert.match(portal,/<strong class="pbSalePriceNew">/);
 assert.match(portal,/<del class="pbSalePriceOld"/);
});
test('cross-domain exchange sends only the short-lived ticket as a POST, never a password',()=>{
 const js=readFileSync('dist/web/equipment-site.js','utf8');
 assert.match(js,/\/api\/auth\/customer-login/);
 assert.match(js,/\/api\/storefront\/office-handoff/);
 assert.match(js,/handoff\.method='POST'/);
 assert.match(js,/handoff\.submit\(\)/);
 assert.doesNotMatch(js,/password.*handoff\.appendChild/);
});

test('cross-site POST with Origin null is allowed only through a valid origin-bound ticket',()=>{
 assert.equal(equipmentHandoffOriginAllowed('null','https://store.example.test'),true);
 assert.equal(equipmentHandoffOriginAllowed(undefined,'https://store.example.test'),true);
 assert.equal(equipmentHandoffOriginAllowed('https://store.example.test','https://store.example.test'),true);
 assert.equal(equipmentHandoffOriginAllowed('https://attacker.test','https://store.example.test'),false);
 assert.equal(equipmentHandoffOriginAllowed('https://photobridge.ir','https://store.example.test'),false);
});
test('only the native login form is used on the office page, and brand header controls retain contrast',()=>{
 const css=readFileSync('dist/web/equipment-site.css','utf8');
 const js=readFileSync('dist/web/equipment-site.js','utf8');
 assert.match(js,/#equipmentHeaderLogin,#equipmentOfficePageLogin/);
 assert.match(css,/data-equipment-page='\/rental-equipment'/);
 assert.match(css,/\.photographer-dropdown\[open\]>summary\.equipment-office-entry/);
 assert.match(css,/\-webkit-text-fill-color:#fff/);
});
