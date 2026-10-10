// Exercise the production route body with isolated, read-only database fixtures.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
const start=source.indexOf("    if (req.method === 'GET' && (url.pathname === '/api/public/photographer-signup/context'");
const end=source.indexOf('    const publicPhotographerInvite =',start);
assert(start>=0&&end>start,'production context handler must exist');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const handler=new AsyncFunction('req','res','url','pool','normalizePhotographerInviteCode','normalizeMobile','photographerInviteUsable','photographerInviteMobileBindingValid','equipmentRentalInviteRequiredFields','photographerInvitePublicView','sendJson','console',source.slice(start,end));
async function run({existing=true,failAt=0}={}){
  let queries=0;
  const invite={issuer_type:'rental',issuer_rental_shop_id:'shop',resolved_rental_shop_name:'Store',resolved_rental_shop_required_fields:{nationalId:true}};
  const member={id:'member',mobile:'09120000001',name:'Studio',photographer_enabled:existing,active:true,photographer_profile_user_id:existing?'member':null};
  const pool={async query({text}){
    queries++;
    if(queries===failAt)throw new Error('fixture database timeout');
    if(text.includes('SELECT pi.*'))return {rows:[invite]};
    if(text.includes('FROM users u LEFT JOIN photographer_profiles')&&text.includes('ANY('))return {rows:[member]};
    if(text.includes('FROM users u JOIN photographer_profiles'))return {rows:existing?[member]:[]};
    if(text.includes('SELECT m.birth_jalali'))return {rows:[{profile_birth_jalali:'1370/01/01',national_id:'0012345678'}]};
    return {rows:[]};
  }};
  return handler({method:'GET'},{},new URL('http://localhost/api/public/photographer-signup/context?invite=PB-TEST&mobile=09120000001'),pool,x=>x,x=>x,()=>true,()=>true,()=>({nationalId:true}),()=>({issuerType:'rental'}),(_res,status,body)=>({status,body}),{error(){}});
}
test('production context preserves member identity and saved fields',async()=>{
  const result=await run();
  assert.equal(result.status,200);
  assert.equal(result.body.existingAccount.exists,true);
  assert.equal(result.body.membershipProfile.birthJalali,'1370/01/01');
  assert.equal(result.body.membershipProfile.nationalId,'0012345678');
});
test('a store-only preregistration remains a new signup',async()=>{
  const result=await run({existing:false});
  assert.equal(result.status,200);
  assert.equal(result.body.existingAccount,null);
});
test('identity/profile lookup errors never classify a member as new',async()=>{
  // Invite, identity, legacy profile and membership profile queries.
  for(const failAt of [1,2,3,6]){
    const result=await run({failAt});
    assert.equal(result.status,503,`query ${failAt} must fail closed`);
    assert.equal(result.body.error,'invite_temporarily_unavailable');
  }
});
test('public invite response cannot reset the authoritative account classification',async()=>{
  const publicStart=source.indexOf('    const publicPhotographerInvite =',end);
  const publicEnd=source.indexOf("    if (req.method === 'GET' && url.pathname === '/api/public/photographer-signup/context')",publicStart);
  assert(publicStart>=0&&publicEnd>publicStart);
  const publicHandler=new AsyncFunction('req','res','url','pool','photographerInviteByCode','photographerInviteUsable','photographerInvitePublicView','sendJson','console',source.slice(publicStart,publicEnd));
  const result=await publicHandler({method:'GET'},{},new URL('http://localhost/api/public/photographer-invites/PB-TEST'),{},async()=>({issuer_type:'rental',issuer_rental_shop_id:'shop'}),()=>true,()=>({issuerType:'rental'}),(_res,status,body)=>({status,body}),{error(){}});
  assert.equal(result.status,200);
  assert.equal(result.body.signupContext,null);
});
