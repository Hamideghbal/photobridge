const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=fs.readFileSync('dist/api/server.js','utf8');
const ui=fs.readFileSync('dist/web/photobridge-v904r98-invite-stable.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
test('deletion marker commits with role removal, retaining user and finance history',()=>{
 const i=api.indexOf("if (adminPhotographerAccount && req.method === 'DELETE')");
 const j=api.indexOf("if (req.method === 'GET' && url.pathname === '/api/admin/album-cover-presets')",i);
 const p=api.slice(i,j);
 assert.ok(i>=0&&j>i&&p.includes('INSERT INTO audit_log'));
 assert.ok(p.indexOf('INSERT INTO audit_log')<p.indexOf("await c.query('COMMIT')"));
 assert.match(p,/UPDATE users SET photographer_enabled=false/);
 assert.doesNotMatch(p,/DELETE FROM users/);
});
test('old redemptions cannot bypass new full registration after admin deletion',()=>{
 assert.match(api,/const adminDeletedPhotographer = await photographerAdminRemovalRecord\(pool,existing\)/);
 assert.match(api,/const existingPhotographer = !adminDeletedPhotographer && existing/);
 assert.match(api,/existingPhotographer:!adminDeletedPhotographer/);
 assert.match(api,/!identity.adminDeletedPhotographer/);
 assert.match(api,/rejoiningAccount:adminDeletedPhotographer\?\{required:true/);
});
test('server requires new password location and birth and uses editable name',()=>{
 const a=api.indexOf("if (req.method === 'POST' && url.pathname === '/api/public/photographer-signup') {");
 const b=api.indexOf("if (req.method === 'POST' && url.pathname === '/api/public/photographer-signup/verify')",a);
 const code=api.slice(a,b);
 for(const x of ['name_required','birth_date_required','location_required','map_location_required','password_too_short','rejoinAfterAdminDeletion:Boolean(adminDeletedPhotographer)'])assert.ok(code.includes(x),x);
 assert.match(code,/const payload = existingPhotographer \? .* : \{ inviteCode, name, province, city/);
 assert.match(api,/p.rejoinAfterAdminDeletion!==true/);
 assert.match(api,/p.rejoinAfterAdminDeletion===true/);
 assert.match(api,/studioName: existingPhotographer \? .* : name/);
 assert.match(api,/userId = String\(existing.id\);\s*reusedExisting = true/);
});
test('old studio name is merely editable prefill',()=>{
 assert.match(ui,/function prefillRejoiningName\(form\)/);
 assert.match(ui,/if\(!String\(input.value\|\|''\).trim\(\)\)setInputValue\(input,previousName\)/);
 const prefill=ui.slice(ui.indexOf('function prefillRejoiningName(form)'),ui.indexOf('function PB1411RentalShopName(',ui.indexOf('function prefillRejoiningName(form)')));
 assert.doesNotMatch(prefill,/input.readOnly=true/);
 assert.match(ui,/prefillRejoiningName\(form\);identityBox\(form\)/);
 assert.match(html,/photobridge-v904r98-invite-stable\.js\?v=r1417&rejoin=r1549/);
});
test('audited deleted account preserves owner identity and prior name',async()=>{
 const a=api.indexOf('async function photographerAdminRemovalRecord('),b=api.indexOf('async function photographerIdentityByMobile(',a);
 const f=vm.runInNewContext('('+api.slice(a,b).trim()+')');
 const db={query:async arg=>{assert.match(arg.text,/platform_admin.photographer_delete/);return{rows:[{studio_name:'نام قبلی'}]}}};
 assert.equal(await f(db,{id:'u1',photographer_enabled:true}),null);
 const result=await f(db,{id:'u1',photographer_enabled:false,photographer_profile_user_id:null});
 assert.equal(result.userId,'u1');assert.equal(result.name,'نام قبلی');
});

test('inactive admin-deleted identity cannot become a duplicate account on rejoin',async()=>{
 const start=api.indexOf('async function photographerIdentityByMobile('),end=api.indexOf('// Verified PhotoBridge accounts can accept',start);
 const identity=vm.runInNewContext('('+api.slice(start,end).trim()+')',{
    normalizeMobile:s=>s,
    photographerAdminRemovalRecord:async(_,row)=>row.id==='deleted' ? {userId:'deleted',name:'عکاسی قبلی'} : null
 });
 const db={query:async()=>({rowCount:1,rows:[{id:'deleted',mobile:'09123456789',active:false,photographer_enabled:false,photographer_profile_user_id:null,photographer_invite_redeemed:false}]})};
 const result=await identity(db,'09123456789');
 assert.equal(result.id,'deleted');
 assert.equal(result.existingPhotographer,false);
 assert.equal(result.adminDeletedPhotographer.userId,'deleted');
});
test('inactive rejoin blocked at context, submit and OTP; editable name saved consistently',()=>{
 const a=api.indexOf("if (req.method === 'GET' && (url.pathname === '/api/public/photographer-signup/context'");
 const b=api.indexOf("const publicPhotographerInvite =",a);
 assert.match(api.slice(a,b),/adminDeletedPhotographer && existing.active !== true/);
 const c=api.indexOf("if (req.method === 'POST' && url.pathname === '/api/public/photographer-signup')");
 const d=api.indexOf("if (req.method === 'POST' && url.pathname === '/api/public/photographer-signup/verify')",c);
 assert.match(api.slice(c,d),/adminDeletedPhotographer && existing.active !== true/);
 assert.match(api,/adminDeletedPhotographer && existing\?\.active !== true/);
 assert.match(api,/const updateSharedStudioName = Boolean\(adminDeletedPhotographer/);
 assert.match(api,/name=CASE WHEN \$5::boolean THEN \$6::text ELSE name END/);
 assert.match(api,/passwordHash: existingPhotographer \? .* : String\(challenge.password_hash\)/);
});
