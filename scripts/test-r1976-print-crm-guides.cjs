'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const path=require('node:path');
const readRoot=p=>read(path.join(__dirname,'..',p));
const api=()=>import('../dist/api/photographer-tab-settings.js');

test('R1976 legacy Customers-disabled setting keeps four separate CRM entries disabled until enabled',async()=>{
 const {normalizePhotographerTabs}=await api();
 const old=normalizePhotographerTabs({ai:true,album:true,instagram:true,customers:false});
 for(const key of ['customers','calendar','lab_customers','lab_calendar'])assert.equal(old[key],false,key);
 const defaults=normalizePhotographerTabs(null);
 for(const key of ['customers','calendar','lab_customers','lab_calendar'])assert.equal(defaults[key],true,key);
});
test('R1976 independent lab and photographer Calendar/Customers respect admin toggles',async()=>{
 const {photographerTabsForUser}=await api();
 const settings={ai:false,album:false,instagram:false,customers:false,calendar:true,lab_customers:true,lab_calendar:false};
 const p=photographerTabsForUser(settings,{platformRole:'photographer'},'photographer').tabs;
 const l=photographerTabsForUser(settings,{platformRole:'lab_manager'},'lab').tabs;
 assert.equal(p.customers,false);assert.equal(p.calendar,true);
 assert.equal(l.customers,true);assert.equal(l.calendar,false);
 const admin=photographerTabsForUser(settings,{platformRole:'platform_admin'},'lab');
 assert.equal(admin.tabs.customers,true);assert.equal(admin.tabs.calendar,false);
 assert.equal(admin.tabs.ai,true);assert.equal(admin.adminBypass,true);
});
test('R1976 GET returns role-scoped visibility and does not cache stale admin settings',async()=>{
 const {handlePhotographerTabSettings}=await api();
 const settings={customers:false,calendar:true,lab_customers:true,lab_calendar:false};
 for(const [portal,wantCustomers,wantCalendar] of [['photographer',false,true],['lab',true,false]]){
  let result,headers={};
  const pool={query:async()=>({rows:[{value:settings}]})};
  const ok=await handlePhotographerTabSettings({req:{method:'GET',headers:{'x-photobridge-portal':portal}},url:{pathname:'/api/photographer/navigation-tabs'},a:{platformRole:'photographer'},res:{setHeader:(k,v)=>{headers[k]=v}},pool,requireRole:()=>false,sendJson:(_res,status,payload)=>{result={status,payload}}});
  assert.equal(ok,true);assert.equal(result.status,200);
  assert.equal(result.payload.tabs.customers,wantCustomers);
  assert.equal(result.payload.tabs.calendar,wantCalendar);
  assert.equal(headers['cache-control'],'no-store');
 }
});
test('R1976 old admin save preserves independent switches and rejects invalid keys',async()=>{
 const {handlePhotographerTabSettings}=await api();
 const before={ai:true,album:true,instagram:true,customers:false,calendar:true,lab_customers:false,lab_calendar:true};
 let saved,result;
 const pool={query:async(q,args)=>{
   if(q.startsWith('SELECT'))return {rows:[{value:before}]};
   if(q.startsWith('INSERT INTO platform_settings')){saved=JSON.parse(args[1]);return {rows:[]}}
   throw Error('unexpected SQL');
 }};
 const args={url:{pathname:'/api/admin/photographer-tabs'},a:{userId:'admin'},res:{setHeader(){}},pool,requireRole:()=>true,sendJson:(_res,status,payload)=>{result={status,payload}},audit:async()=>{}};
 await handlePhotographerTabSettings({...args,req:{method:'PUT',headers:{}},bodyJson:async()=>({tabs:{ai:false,album:true,instagram:true,customers:true}})});
 assert.equal(result.status,200);
 assert.equal(saved.calendar,true);assert.equal(saved.lab_customers,false);assert.equal(saved.lab_calendar,true);
 await handlePhotographerTabSettings({...args,req:{method:'PUT',headers:{}},bodyJson:async()=>({tabs:{ai:true,album:true,instagram:true,unknown:true}})});
 assert.equal(result.status,400);
});
test('R1976 all UI enhancements parse and are mounted once in their actual documents',()=>{
 for(const file of ['dist/web/photobridge-r1761-crm-nav.js','dist/web/photobridge-r1099-photographer-tabs.js','dist/web/photobridge-r1126-desktop-navigation.js','dist/web/customer-crm-host.js','dist/web/photobridge-r1976-crm-pane-visibility.js','dist/web/photobridge-r1976-connected-print-entry.js','dist/web/photobridge-workflow-guides-v572.js'])
  assert.doesNotThrow(()=>new vm.Script(readRoot(file),{filename:file}),file);
 const index=readRoot('dist/web/index.html'),crm=readRoot('dist/web/customer-crm.html');
 assert.equal(index.split('photobridge-r1976-connected-print-entry.js').length-1,1);
 assert.equal(crm.split('photobridge-r1976-crm-pane-visibility.js').length-1,1);
});
test('R1976 linked photographers start at print chooser once, never hijack manual Gallery navigation',()=>{
 const source=readRoot('dist/web/photobridge-r1976-connected-print-entry.js');
 assert.match(source,/api\/customer\/labs/);
 assert.match(source,/memberships/);
 assert.match(source,/m\?\.active===true/);
 assert.match(source,/m\?\.service_only!==true/);
 assert.match(source,/workspace=print&pbLabChooser=1/);
 assert.match(source,/sessionStorage\.setItem\(currentKey,'done'\)/);
 assert.match(source,/if\(connected&&entry\(\)\)location\.replace\(PRINT\)/);
 assert.match(source,/pb1976PrintCentered/);
});
test('R1976 guides remain next to Print Photo and Album tabs and use existing video slots',()=>{
 const guides=readRoot('dist/web/photobridge-workflow-guides-v572.js');
 for(const kind of ['print-mobile','print-desktop','album-mobile','album-desktop'])assert(guides.includes(kind),kind);
 assert(guides.includes("openContextGuide(kind,b)"));
 assert(guides.includes("if(!print)return;"));
 assert(guides.includes("album.after(a)"));
 assert(guides.includes("video.controls=true"));
});
test('R1976 admin groups four role-independent controls, no shared Customers flag',()=>{
 const admin=readRoot('dist/web/photobridge-r1099-photographer-tabs.js'),desktop=readRoot('dist/web/photobridge-r1126-desktop-navigation.js'),crm=readRoot('dist/web/photobridge-r1761-crm-nav.js');
 for(const key of ['customers','calendar','lab_customers','lab_calendar'])assert(admin.includes("name=\"'+key+'\"")||admin.includes("'"+key+"'"),key);
 assert(admin.includes('مشتریان عکاس')&&admin.includes('تقویم مشتریان لابراتوار'));
 assert(desktop.includes("settings.tabs.customers!==true"));
 assert(desktop.includes("settings.tabs.calendar!==true"));
 assert(crm.includes("enabled={customers:data?.tabs?.customers===true,calendar:data?.tabs?.calendar===true}"));
 assert(crm.includes("['customers','calendar'].filter"));
});
