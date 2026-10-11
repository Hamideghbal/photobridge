import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {adminMobileEntityScope,adminMobileEntityVisible,filterAdminMobileEntities} from '../dist/api/admin-mobile-entity-scope.js';

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
function db({viewer='',owned=[{id:A,mobile:'09120000000'}],activeMembers=[]}={}){
 const calls=[];
 return {calls,async query(sql,params){
  calls.push({sql,params});
  if(sql.includes('owner_mobile'))return {rows:owned.filter(r=>params[0].includes(r.id)).map(r=>({entity_id:r.id,owner_mobile:r.mobile}))};
  if(sql.startsWith('SELECT mobile FROM users'))return {rows:viewer?[{mobile:viewer}]:[]};
  if(sql.includes('SELECT DISTINCT')&&sql.includes('AND active=true'))return {rows:activeMembers.filter(id=>params[0].includes(id)).map(id=>({entity_id:id}))};
  throw new Error('Unexpected SQL: '+sql.slice(0,150));
 }};
}
test('admin-mobile-owned lab is never listed for an unrelated photographer',async()=>{
 const dbx=db({viewer:'09123333333'});
 assert.deepEqual(await filterAdminMobileEntities(dbx,'lab','random-user',[{id:A,name:'Arbitrary Name'},{id:B,name:'Other Lab'}]),[{id:B,name:'Other Lab'}]);
 assert.equal(await adminMobileEntityVisible(dbx,'lab','random-user',A),false);
 const ownerSql=dbx.calls.find(x=>x.sql.includes('owner_mobile')).sql;
 assert.match(ownerSql,/lab_memberships/);
 assert.match(ownerSql,/m.role=\$2/);
 assert.match(ownerSql,/pa.platform_role='platform_admin'/);
 assert.match(ownerSql,/RIGHT\(REGEXP_REPLACE/);
});
test('same admin mobile in a distinct photographer account can see the lab',async()=>{
 const dbx=db({viewer:'+989120000000'});
 assert.equal(await adminMobileEntityVisible(dbx,'lab','owner-photo',A),true);
 assert.deepEqual((await adminMobileEntityScope(dbx,'lab','owner-photo',[A])).ownerMatched,new Set([A]));
});
test('only active explicit lab or store memberships grant a second photographer access',async()=>{
 for(const kind of ['lab','shop']){
  const active=db({viewer:'09129999999',activeMembers:[A]});
  const current=await adminMobileEntityScope(active,kind,'second-photo',[A]);
  assert(current.restricted.has(A)&&current.allowed.has(A));
  assert.equal(current.ownerMatched.size,0);
  const ownerSql=active.calls.find(x=>x.sql.includes('owner_mobile')).sql;
  const expectedRole=kind==='lab'?'lab_admin':'shop_admin';
  assert.equal(active.calls.find(x=>x.sql.includes('owner_mobile')).params[1],expectedRole);
  assert.match(ownerSql,kind==='lab'?/lab_memberships/:/equipment_rental_shop_memberships/);
  const cancelled=db({viewer:'09129999999',activeMembers:[]});
  assert.equal(await adminMobileEntityVisible(cancelled,kind,'second-photo',A),false);
  assert.match(cancelled.calls.at(-1).sql,/active=true/);
 }
});
test('ordinary labs and stores are unaffected, with arbitrary business names',async()=>{
 for(const kind of ['lab','shop']){
  const dbx=db({owned:[],viewer:'09127777777'});
  const list=[{id:A,name:'صوفیا'},{id:B,name:'Admin Equipment'}];
  assert.deepEqual(await filterAdminMobileEntities(dbx,kind,'photo',list),list);
  assert.equal(dbx.calls.length,1,'no owner, no private-user membership lookup');
 }
});
test('unauthenticated store directory excludes admin-phone-owned shops',async()=>{
 const dbx=db({owned:[{id:A,mobile:'09120000000'}]});
 assert.deepEqual(await filterAdminMobileEntities(dbx,'shop',null,[{id:A},{id:B}]),[{id:B}]);
 assert.equal(dbx.calls.length,1);
});
test('production server checks server-side scope on list, direct request and select',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 assert.equal(server.split('/* PB_R1106_ADMIN_MOBILE_SCOPE */').length-1,1);
 assert.match(server,/const adminScope=await adminMobileEntityScope\(db,'shop',userId,\[shopId\]\)/);
 assert.match(server,/const publicShops=await filterAdminMobileEntities\(pool,'shop',null,q.rows\)/);
 assert.match(server,/const shopScope=await adminMobileEntityScope\(pool,'shop',a.userId,q.rows.map/);
 assert.match(server,/labs=await filterAdminMobileEntities\(pool,'lab',a.userId,labs\)/);
 assert.match(server,/visibleMemberships=await filterAdminMobileEntities\(pool,'lab',a.userId,memberships.rows\)/);
 assert.match(server,/lab_admin_scope_forbidden/);
 assert.match(server,/if\(!scope.restricted.has\(String\(targetLab\)\)\&\&!await photographerCanDiscoverLabs/);
 assert(!server.includes('await pool.query(`UPDATE equipment_rental_shops SET private_admin_only=true'),'never classify stores by name');
 assert(!server.includes("COALESCE(s.private_admin_only,false)=false OR $2::boolean=true"));
});
