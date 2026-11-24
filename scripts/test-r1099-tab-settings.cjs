const {test}=require('node:test'),assert=require('node:assert/strict');
test('R1976 admin CRUD keeps four independent CRM switches and old shared Customers disable',async()=>{
 const {handlePhotographerTabSettings:handle,PHOTOGRAPHER_TABS_KEY:key,normalizePhotographerTabs}=await import('../dist/api/photographer-tab-settings.js');
 let saved=null,calls=[];
 const pool={query:async(sql,args)=>{
  calls.push({sql,args});
  if(sql.startsWith('INSERT')){saved=JSON.parse(args[1]);return {rows:[],rowCount:1};}
  if(sql.startsWith('SELECT 1 FROM lab_memberships'))return {rows:[{}],rowCount:1};
  return {rows:saved?[{value:saved}]:[],rowCount:saved?1:0};
 }};
 const request=async(method,role='photographer',tabs,path='/api/admin/photographer-tabs',portal='photographer')=>{
  let result;const a={userId:'u',platformRole:role};
  const used=await handle({req:{method,headers:{'x-photobridge-portal':portal}},res:{setHeader(){}},url:{pathname:path},a,pool,
   requireRole:(u,wanted)=>u?.platformRole===wanted,bodyJson:async()=>({tabs}),sendJson:(res,status,body)=>result={status,body},audit:async()=>{}});
  assert.equal(used,true);return result;
 };
 const defaults=normalizePhotographerTabs(null);
 assert.deepEqual((await request('GET','platform_admin')).body.tabs,defaults);
 assert.equal((await request('PUT','photographer',{...defaults,customers:false})).status,403);
 assert.equal(saved,null);
 assert.equal((await request('PUT','platform_admin',{...defaults,calendar:'false'})).status,400);
 const independent={...defaults,customers:false,calendar:true,labCustomers:true,labCalendar:false};
 assert.equal((await request('PUT','platform_admin',independent)).status,200);
 assert.deepEqual(saved,independent);
 const photo=(await request('GET','photographer',null,'/api/photographer/navigation-tabs','photographer')).body;
 assert.equal(photo.tabs.customers,false);assert.equal(photo.tabs.calendar,true);assert.equal(photo.connectedLab,true);
 const lab=(await request('GET','lab',null,'/api/photographer/navigation-tabs','lab')).body;
 assert.equal(lab.tabs.customers,true);assert.equal(lab.tabs.calendar,false);assert.equal(lab.connectedLab,false);
 const admin=(await request('GET','platform_admin',null,'/api/photographer/navigation-tabs','photographer')).body;
 assert.equal(admin.tabs.customers,false);assert.equal(admin.tabs.calendar,true);
 assert.equal(admin.adminBypass,true);
 // Older open dialogs must never re-enable new/disabled switches.
 assert.equal((await request('PUT','platform_admin',{ai:false,album:true,instagram:true})).status,200);
 assert.equal(saved.customers,false);assert.equal(saved.calendar,true);assert.equal(saved.labCalendar,false);
 saved={ai:true,album:false,instagram:true,customers:false};
 const old=normalizePhotographerTabs(saved);
 for(const name of ['customers','calendar','labCustomers','labCalendar'])assert.equal(old[name],false);
 assert(calls.some(c=>c.args?.[0]===key));
});
