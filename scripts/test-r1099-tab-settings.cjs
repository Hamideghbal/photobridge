const {test}=require('node:test'),assert=require('node:assert/strict');
test('persisted photographer tab settings include one shared Customers switch for lab + photographer',async()=>{
 const {handlePhotographerTabSettings:handle,PHOTOGRAPHER_TABS_KEY:key}=await import('../dist/api/photographer-tab-settings.js');
 let saved=null,calls=[];
 const pool={query:async(sql,args)=>{
  calls.push({sql,args});
  if(sql.startsWith('INSERT'))saved=JSON.parse(args[1]);
  return {rows:saved?[{value:saved}]:[]};
 }};
 async function request(method,role='photographer',tabs,path='/api/admin/photographer-tabs'){
  let result;
  const a={userId:'u',platformRole:role};
  const used=await handle({req:{method},res:{setHeader(){}},url:{pathname:path},a,pool,
    requireRole:(user,wanted)=>user?.platformRole===wanted,
    bodyJson:async()=>({tabs}),sendJson:(res,status,body)=>result={status,body},audit:async()=>{}});
  assert(used);return result;
 }
 const defaults={ai:true,album:true,instagram:true,customers:true};
 assert.deepEqual((await request('GET','platform_admin')).body.tabs,defaults);
 const before=calls.length;
 assert.equal((await request('PUT','photographer',{...defaults,customers:false})).status,403);
 assert.equal(calls.length,before);
 assert.equal((await request('PUT','platform_admin',{...defaults,ai:'false'})).status,400);
 assert.equal(saved,null);
 for(const disabled of ['ai','album','instagram','customers']){
  const tabs={...defaults,[disabled]:false};
  assert.equal((await request('PUT','platform_admin',tabs)).status,200);
  assert.deepEqual(saved,tabs);
  for(const role of ['photographer','lab']){
   assert.deepEqual((await request('GET',role,null,'/api/photographer/navigation-tabs')).body,
    {tabs,adminBypass:false});
  }
  assert.deepEqual((await request('GET','platform_admin',null,'/api/photographer/navigation-tabs')).body,
   {tabs:{...defaults,customers:tabs.customers},adminBypass:true});
 }
 // Old installations only stored three keys. Customers defaults to ON for both roles.
 saved={ai:true,album:false,instagram:true};
 assert.deepEqual((await request('GET','platform_admin')).body.tabs,{...saved,customers:true});
 assert.equal((await request('GET','lab',null,'/api/photographer/navigation-tabs')).body.tabs.customers,true);
 assert(calls.every(c=>c.args[0]===key));
});
