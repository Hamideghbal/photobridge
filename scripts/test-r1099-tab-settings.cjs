const {test}=require('node:test'),assert=require('node:assert/strict');
test('independent persisted settings, admin-only writes, trusted-role bypass and validation',async()=>{
 const {handlePhotographerTabSettings:handle,PHOTOGRAPHER_TABS_KEY:key}=await import('../dist/api/photographer-tab-settings.js');
 let saved=null,calls=[];
 const pool={query:async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('INSERT'))saved=JSON.parse(args[1]);return {rows:saved?[{value:saved}]:[]}}};
 async function request(method,admin=false,tabs,path='/api/admin/photographer-tabs'){
 let result;
 const used=await handle({req:{method},res:{setHeader(){}},url:{pathname:path},a:{userId:'u',platformRole:admin?'platform_admin':'photographer'},pool,requireRole:(a,r)=>a?.platformRole===r,bodyJson:async()=>({tabs}),sendJson:(res,status,body)=>result={status,body},audit:async()=>{}});assert(used);return result;
 }
 assert.deepEqual((await request('GET',true)).body.tabs,{ai:true,album:true,instagram:true});
 const before=calls.length;assert.equal((await request('PUT',false,{ai:false,album:false,instagram:false})).status,403);assert.equal(calls.length,before);
 assert.equal((await request('PUT',true,{ai:'false',album:true,instagram:true})).status,400);assert.equal(saved,null);
 for(const disabled of ['ai','album','instagram']){
 const tabs={ai:true,album:true,instagram:true,[disabled]:false};assert.equal((await request('PUT',true,tabs)).status,200);assert.deepEqual(saved,tabs);
 assert.deepEqual((await request('GET',false,null,'/api/photographer/navigation-tabs')).body,{tabs,adminBypass:false});
 assert.deepEqual((await request('GET',true,null,'/api/photographer/navigation-tabs')).body,{tabs:{ai:true,album:true,instagram:true},adminBypass:true});
 }
 assert(calls.every(c=>c.args[0]===key));
});
