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
 assert.doesNotMatch(ui,/input.readOnly=true/);
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
