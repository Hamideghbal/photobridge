const {test}=require('node:test'),assert=require('node:assert/strict');
test('R1976 persistent admin settings control Customers and Calendar independently for both portal roles',async()=>{
 const {handlePhotographerTabSettings:handle,PHOTOGRAPHER_TABS_KEY:key,normalizePhotographerTabs}=await import('../dist/api/photographer-tab-settings.js');
 let saved=null,calls=[];
 const pool={query:async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('INSERT'))saved=JSON.parse(args[1]);return {rows:saved?[{value:saved}]:[]}}};
 async function request(method,role='photographer',tabs,path='/api/admin/photographer-tabs',portal=role==='lab'?'lab':'photographer'){
  let result,headers={};
  const a={userId:'u',platformRole:role};
  const used=await handle({req:{method,headers:{'x-photobridge-portal':portal}},res:{setHeader(k,v){headers[k]=v}},url:{pathname:path},a,pool,
   requireRole:(user,wanted)=>user?.platformRole===wanted,
   bodyJson:async()=>({tabs}),sendJson:(_res,status,body)=>result={status,body},audit:async()=>{}});
  assert(used);return {...result,headers};
 }
 const defaults={ai:true,album:true,instagram:true,customers:true,calendar:true,lab_customers:true,lab_calendar:true};
 assert.deepEqual((await request('GET','platform_admin')).body.tabs,defaults);
 const before=calls.length;
 assert.equal((await request('PUT','photographer',defaults)).status,403);
 assert.equal(calls.length,before);
 assert.equal((await request('PUT','platform_admin',{...defaults,calendar:'false'})).status,400);
 assert.equal(saved,null);
 for(const disabled of ['customers','calendar','lab_customers','lab_calendar']){
  const tabs={...defaults,[disabled]:false};
  assert.equal((await request('PUT','platform_admin',tabs)).status,200);
  assert.deepEqual(saved,tabs);
  const p=await request('GET','photographer',null,'/api/photographer/navigation-tabs');
  const l=await request('GET','lab',null,'/api/photographer/navigation-tabs','lab');
  assert.equal(p.body.tabs.customers,tabs.customers);
  assert.equal(p.body.tabs.calendar,tabs.calendar);
  assert.equal(l.body.tabs.customers,tabs.lab_customers);
  assert.equal(l.body.tabs.calendar,tabs.lab_calendar);
  assert.equal(p.headers['cache-control'],'no-store');
  assert.equal(l.headers['cache-control'],'no-store');
 }
 // Older admin windows send the three original keys. Persist independent flags.
 const beforeLegacy={...defaults,customers:false,calendar:true,lab_customers:false,lab_calendar:false};
 saved=beforeLegacy;
 const update={ai:false,album:true,instagram:true};
 assert.equal((await request('PUT','platform_admin',update)).status,200);
 assert.deepEqual(saved,{...beforeLegacy,...update});
 // Before R1976, one disabled Customers choice disabled both role panes.
 assert.deepEqual(normalizePhotographerTabs({customers:false}),{...defaults,customers:false,calendar:false,lab_customers:false,lab_calendar:false});
 saved={ai:true,album:false,instagram:true};
 assert.deepEqual((await request('GET','platform_admin')).body.tabs,{...defaults,album:false});
 assert(calls.every(c=>c.args[0]===key));
});