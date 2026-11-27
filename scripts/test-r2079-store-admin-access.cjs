'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const read=p=>fs.readFileSync(p,'utf8'),store='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333',manager='44444444-4444-4444-8444-444444444444';
const route=read('scripts/r2079-store-admin-route.txt');
async function call(opts={}){
 const sql=[],audits=[];
 const c={query:async(q,p=[])=>{sql.push({q,p});
  if(q.startsWith('SELECT id,name,mobile_verified_at'))return {rows:opts.users??[{id:manager,name:'new manager',mobile_verified_at:'2026-11-27',platform_role:'user'}]};
  if(q.startsWith('SELECT id,name,manager_mobile'))return {rows:opts.shops??[{id:store,name:'target',manager_mobile:'09120000000',deleted_at:null,private_admin_only:false}]};
  if(q.startsWith('SELECT m.shop_id,m.role'))return {rows:opts.conflicts??[]};
  if(q.startsWith('SELECT id FROM equipment_rental_shops'))return {rows:opts.duplicate??[]};
  if(q.startsWith('SELECT user_id FROM equipment_rental_shop_memberships'))return {rows:[{user_id:admin}]};
  if(q.startsWith('UPDATE equipment_rental_shops SET manager_mobile'))return {rows:[{id:store,manager_mobile:p[1],manager_name:p[2]}]};
  if(opts.writeError&&q.startsWith('INSERT INTO equipment_rental_shop_memberships'))throw Error('simulated');
  return {rows:[]};
 },release(){}};
 const pool={connect:async()=>c,query:async(q,p)=>{sql.push({q,p});return {rows:opts.previewShop??[{id:store,name:'target',suspended:false}]}}};
 const run=new Function('req','url','a','requireRole','sendJson','pool','audit','normalizeMobile','bodyJson','res','return (async()=>{'+route+'})()');
 const result=await run({method:'POST'},{pathname:'/api/admin/equipment-rental/shops/'+store+'/'+(opts.action||'transfer-manager')},{userId:admin},()=>opts.authorized!==false,(_r,status,payload)=>({status,payload}),pool,async(...a)=>audits.push(a),String,async()=>opts.body??{mobile:'09123456789',confirm:true},null);
 return {result,sql,audits};
}
test('R2079 manager transfer is atomic and changes only selected shop memberships, never users/sessions/finances',async()=>{
 const {result,sql,audits}=await call();
 assert.equal(result.status,200);assert.equal(result.payload.shop.id,store);assert.equal(result.payload.shop.manager_mobile,'09123456789');
 assert.equal(sql[0].q,'BEGIN');assert.equal(sql.at(-1).q,'COMMIT');assert.equal(audits.length,1);
 const writes=sql.filter(x=>/^(UPDATE|INSERT INTO|DELETE FROM)/.test(x.q));assert.equal(writes.length,3);
 for(const {q,p} of writes){assert.equal(p[0],store);assert(!/\b(?:users|sessions|orders|invoices|wallets)\b/i.test(q))}
 assert(writes[0].q.includes("role='shop_admin' AND user_id<>$2"));
 assert(writes[0].q.includes("role='handover_staff' AND user_id=$2"));
 assert(!writes[0].q.includes("role='photographer'"));assert.equal(writes[1].p[1],manager);
});
test('R2079 deny ambiguous, absent, unverified, admin, private and cross-store accounts without changing access',async()=>{
 const cases=[
  {authorized:false},{body:{mobile:'09123456789'}},{body:{mobile:'123',confirm:true}},{users:[]},
  {users:[{id:manager},{id:other}]},{users:[{id:manager,platform_role:'user',mobile_verified_at:null}]},
  {users:[{id:admin,platform_role:'platform_admin',mobile_verified_at:'yes'}]},
  {shops:[{id:store,deleted_at:'yes'}]},{shops:[{id:store,private_admin_only:true}]},
  {conflicts:[{shop_id:other,role:'shop_admin'}]},{duplicate:[{id:other}]}
 ];
 for(const opts of cases){const {result,sql}=await call(opts);assert(result.status>=400,JSON.stringify(opts));assert(!sql.some(x=>/^(UPDATE|INSERT INTO|DELETE FROM)/.test(x.q)),JSON.stringify(opts))}
 await assert.rejects(call({writeError:true}),/simulated/);
});
test('R2079 admin preview is explicit, authorized, audited and does not issue any new session',async()=>{
 const ok=await call({action:'preview'});assert.equal(ok.result.status,200);assert.equal(ok.result.payload.url,'/rental?pbAdminShop='+store);assert.equal(ok.sql.length,1);assert.equal(ok.audits.length,1);
 assert.equal((await call({action:'preview',authorized:false})).result.status,403);
 assert.equal((await call({action:'preview',previewShop:[]})).result.status,404);
 assert.equal((await call({action:'preview',previewShop:[{id:store,suspended:true}]})).result.status,409);
 const source=read('scripts/r2079-store-preview-auth.txt'),queries=[];
 const pool={query:async(q,p)=>{queries.push({q,p});return {rows:p[0]==='admin-cookie'?[{id:admin,name:'Admin',mobile:'09120000000',shop_id:p[1]}]:[]}}};
 const {scope,auth}=new Function('requestPortal','cookie','sessionCookieName','pool','tokenHash',source+'return {scope:pb2079PreviewScope,auth:pb2079PreviewAuth};')(
  req=>req.headers['x-photobridge-portal']||'rental',(req,key)=>req.cookies?.[key],p=>p,pool,t=>t);
 const req={method:'GET',url:'/api/rental/overview',headers:{'x-photobridge-admin-store':store},cookies:{admin:'admin-cookie',rental:'ordinary-cookie'}};
 assert.equal(scope(req),store);const actor=await auth(req,scope(req));assert.equal(actor.rentalShopId,store);assert.equal(actor.userId,admin);assert.equal(actor.platformRole,'user');assert.equal(actor.adminStorePreview,true);
 assert.equal((await auth(req,other)).rentalShopId,other);assert.equal(await auth({...req,cookies:{rental:'ordinary-cookie'}},store),null);assert.equal(await auth(req,'invalid'),null);
 assert.equal(scope({...req,headers:{}}),null);
 assert.equal(scope({...req,url:'/api/admin/maintenance'}),'!invalid');
 assert.equal(scope({...req,url:'/api/rental/bookings/'+other+'/commitment?pbAdminShop='+store,headers:{}}),store);
 assert(queries.every(x=>x.q.includes("u.platform_role='platform_admin'")&&x.q.includes('s.id=$2')));
});
test('R2079 final release preserves ordinary login, prevents wrong-cookie logout and exposes both admin actions',()=>{
 const s=read('dist/api/server.js'),ui=read('dist/web/photobridge-v904r19-admin-stores.js'),p=read('dist/api/equipment-rental-portal.html'),html=read('dist/web/index.html');
 assert(s.indexOf('if(pb2079Scope!==null)return pb2079PreviewAuth')<s.indexOf('const token = requestSessionToken(req);',s.indexOf('async function auth(req)')));
 assert(s.includes("if(!a?.adminStorePreview)return sendJson(res,403")||s.includes("if (!a?.adminStorePreview)return sendJson(res,403"));
 assert(s.includes('if (activeToken && !bearerToken(req) && !a.adminStorePreview)'));
 assert(s.includes('if(url.pathname==="/api/auth/logout")return sendJson(res,200,{ok:true})'));
 assert(ui.includes('data-pb2079-open-store')&&ui.includes('data-pb2079-transfer-manager')&&ui.includes('pb2079TransferManager(shop,'));
 assert(ui.includes('data-pb1969-frame-renew')&&ui.includes('data-pb1824-renew'));
 assert(p.indexOf('id="pb2079StorePreview"')<1000);
 assert(p.includes("headers.set('x-photobridge-admin-store',scope)"));
 assert(p.includes('if(window.pb2079StorePreview){window.pb2079StorePreview.back();return;}'));
 assert(html.includes('storeAdmin=r2081')&&html.includes('frameRenew=r2076'));
 for(const file of ['dist/web/photobridge-v904r19-admin-stores.js','dist/web/index.html'])for(const [ext,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(file+ext))assert(decode(fs.readFileSync(file+ext)).equals(fs.readFileSync(file)),file+ext);
});

test('R2081: preview scope gate works with shifted CRM middleware, before every API handler',async()=>{
 const source=read('scripts/enable-r2079-store-admin-access.mjs');
 const from=source.indexOf('function serverPatch('),to=source.indexOf('function uiPatch(',from);
 assert(from>=0&&to>from);
 const once=(s,a,b,label)=>{assert.equal(s.split(a).length,2,label);return s.replace(a,()=>b)};
 const patch=new Function('once','read',source.slice(from,to)+'return serverPatch;')(once,p=>read(p));
 const fixture="async function auth(req) {\n return legacyAuth(req);\n}\nasync function api(req, res, url) {\n    /* New middleware before ordinary authentication */\n    const a = await auth(req);\n    if(await handleChangedCRM())return;\n    if (activeToken && !bearerToken(req)) setSessionCookie(res,activeToken);\n    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops') { return 200; }\n}";
 const patched=patch(fixture);
 assert(patched.indexOf('const pb2079Scope=pb2079PreviewScope(req);',patched.indexOf('async function api('))<patched.indexOf('New middleware'));
 assert(patched.includes('if (activeToken && !bearerToken(req) && !a.adminStorePreview)'));
 const server=read('dist/api/server.js'),entry=server.indexOf('async function api(req, res, url) {');
 assert(entry>=0);
 const gate=server.slice(entry,entry+1200);
 assert.match(gate,/if\(pb2079Scope!==null\)\{\s*const a=await auth\(req\);\s*if\(!a\?\.adminStorePreview\)/);
 assert.match(gate,/admin_store_preview_operation_unavailable/);
 // Execute the generated gate in isolation, not just a string check.
 const i=gate.indexOf('{')+1,j=gate.indexOf('    }',gate.indexOf('admin_store_preview_operation_unavailable'))+5;
 const guard=gate.slice(i,j);
 const run=new Function('req','res','url','auth','pb2079PreviewScope','sendJson','return (async()=>{'+guard+';return {status:204};})()');
 async function invoke(path,scope,actor){let n=0;const result=await run({},null,{pathname:path},async()=>{n++;return actor},()=>scope,(_r,status,payload)=>({status,payload}));return {status:result.status,authCalls:n}}
 assert.deepEqual(await invoke('/api/rental/overview',null,null),{status:204,authCalls:0});
 assert.deepEqual(await invoke('/api/rental/overview',store,null),{status:403,authCalls:1});
 assert.deepEqual(await invoke('/api/admin/maintenance','!invalid',null),{status:403,authCalls:1});
 assert.deepEqual(await invoke('/api/auth/logout',store,{adminStorePreview:true}),{status:200,authCalls:1});
 assert.deepEqual(await invoke('/api/rental/notifications',store,{adminStorePreview:true}),{status:403,authCalls:1});
 assert.deepEqual(await invoke('/api/rental/overview',store,{adminStorePreview:true}),{status:204,authCalls:1});
});
