const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const server=fs.readFileSync('dist/api/server.js','utf8');
const begin=server.indexOf('async function photographerCanDiscoverLabs(userId) {');
const end=server.indexOf('// v904R11',begin);
assert(begin>=0&&end>begin,'discover eligibility source not found');
const fn=server.slice(begin,end).trim();

async function eligibility({labOrigin,originLabId=null,activeOrigin=false,standalone=false}){
 const calls=[];
 const sandbox={
  photographerJoinedViaLabInvite:async()=>labOrigin,
  photographerInitialOriginContext:async()=>({originType:labOrigin?'lab':'site',primaryLabId:originLabId}),
  pool:{query:async(sql,params)=>{
   calls.push({sql,params});
   if(labOrigin)return {rows:[{origin_lab_connected:activeOrigin}]};
   return {rows:[{can_discover:standalone}]};
  }}
 };
 const evaluate=vm.runInNewContext('('+fn+')',sandbox);
 return {result:await evaluate('test-user'),calls};
}
test('originating laboratory actively collaborating keeps lab-origin discovery scoped',async()=>{
 const r=await eligibility({labOrigin:true,originLabId:'11111111-1111-4111-8111-111111111111',activeOrigin:true});
 assert.equal(r.result,false);
 assert.equal(r.calls.length,1);
 assert.equal(r.calls[0].params[1],'11111111-1111-4111-8111-111111111111');
 assert.match(r.calls[0].sql,/m\.user_id=\$1 AND m\.role='customer' AND m\.active=true/);
 assert.match(r.calls[0].sql,/m\.lab_id=\$2::uuid/);
 assert.match(r.calls[0].sql,/l\.service_only=false/);
});
test('originating lab removes membership; photographer immediately can discover all public labs',async()=>{
 const r=await eligibility({labOrigin:true,originLabId:'11111111-1111-4111-8111-111111111111',activeOrigin:false});
 assert.equal(r.result,true);
});
test('other lab membership cannot hold the photographer to a revoked original invitation',async()=>{
 const r=await eligibility({labOrigin:true,originLabId:'22222222-2222-4222-8222-222222222222',activeOrigin:false});
 assert.equal(r.result,true);
 assert.match(r.calls[0].sql,/AND \(\$2::uuid IS NULL OR m\.lab_id=\$2::uuid\)/);
});
test('legacy lab-origin account with no active lab also becomes discoverable',async()=>{
 const r=await eligibility({labOrigin:true,originLabId:null,activeOrigin:false});
 assert.equal(r.result,true);
 assert.equal(r.calls[0].params[1],null);
});
test('legacy account with unidentifiable origin but an active real lab stays restricted',async()=>{
 const r=await eligibility({labOrigin:true,originLabId:null,activeOrigin:true});
 assert.equal(r.result,false);
});
test('site and non-lab origins keep existing standalone-member discovery behavior',async()=>{
 assert.equal((await eligibility({labOrigin:false,standalone:true})).result,true);
 assert.equal((await eligibility({labOrigin:false,standalone:false})).result,false);
});
test('historical inviter lookup precedes fallback to a later active membership',()=>{
 const origin=server.slice(server.indexOf('async function photographerInitialOriginContext('),server.indexOf('async function photographerJoinedViaLabInvite('));
 assert(origin.includes("a.action IN ('invitation.register','photographer.invite_redeem')"));
 assert(origin.indexOf('FROM audit_log a')<origin.indexOf('FROM lab_memberships m JOIN labs l'));
});
test('discovery and collaboration requests use the same gate, without changing historical origin',()=>{
 const listing=server.slice(server.indexOf("url.pathname === '/api/customer/labs'"),server.indexOf('const customerLabSelect ='));
 assert(listing.includes('await photographerCanDiscoverLabs(a.userId)'));
 assert(listing.includes('invitedLabIds = canDiscoverLabs ? []'));
 assert(listing.includes('if (canDiscoverLabs)'));
 assert(listing.includes('l.photographer_discovery_enabled=true'));
 assert(listing.includes("if (!(await photographerCanDiscoverLabs(a.userId)))"));
 assert(!server.slice(begin,end).includes('UPDATE users'));
 assert(!server.slice(begin,end).includes('UPDATE lab_memberships'));
});
