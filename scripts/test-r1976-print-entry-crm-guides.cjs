'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
async function module(){return import('../dist/api/photographer-tab-settings.js')}
test('R1976 legacy shared Customers off remains off for all four independent panes',async()=>{
 const {normalizePhotographerTabs}=await module();
 const legacy=normalizePhotographerTabs({ai:true,album:true,instagram:true,customers:false});
 for(const key of ['customers','calendar','labCustomers','labCalendar'])assert.equal(legacy[key],false,key);
 const split=normalizePhotographerTabs({customers:false,calendar:true,labCustomers:true,labCalendar:false});
 assert.equal(split.customers,false);assert.equal(split.calendar,true);
 assert.equal(split.labCustomers,true);assert.equal(split.labCalendar,false);
});
test('R1976 each portal receives only its own CRM/Calendar visibility',async()=>{
 const {photographerTabsForUser}=await module();
 const settings={customers:false,calendar:true,labCustomers:true,labCalendar:false};
 const photographer=photographerTabsForUser(settings,{platformRole:'photographer'},'photographer');
 const lab=photographerTabsForUser(settings,{labRole:'lab_admin'},'lab');
 assert.equal(photographer.tabs.customers,false);assert.equal(photographer.tabs.calendar,true);
 assert.equal(lab.tabs.customers,true);assert.equal(lab.tabs.calendar,false);
 const admin=photographerTabsForUser(settings,{platformRole:'platform_admin'},'photographer');
 assert.equal(admin.tabs.customers,false);assert.equal(admin.tabs.calendar,true);
});
test('R1976 API uses authenticated membership for Print first, admin PUT preserves independent values',async()=>{
 const {handlePhotographerTabSettings}=await module();
 let value={ai:true,album:true,instagram:true,customers:false,calendar:false,labCustomers:true,labCalendar:false};
 const pool={query:async(sql,params)=>{
  if(sql.startsWith('SELECT value FROM platform_settings'))return {rows:[{value}],rowCount:1};
  if(sql.startsWith('SELECT 1 FROM lab_memberships')){assert.equal(params[0],'person');return {rowCount:1,rows:[{}]}}
  if(sql.startsWith('INSERT INTO platform_settings')){value=JSON.parse(params[1]);return {rowCount:1,rows:[]}}
  throw Error('unexpected query '+sql);
 }};
 const sendJson=(_res,status,json)=>{result={status,...json}};
 let result=null;const opts={res:{setHeader(){}},a:{userId:'person',labRole:'customer'},pool,requireRole:()=>true,bodyJson:async()=>({tabs:{calendar:true,labCustomers:false}}),sendJson,audit:async()=>{}};
 await handlePhotographerTabSettings({...opts,req:{method:'GET',headers:{'x-photobridge-portal':'photographer'}},url:{pathname:'/api/photographer/navigation-tabs'}});
 assert.equal(result.status,200);assert.equal(result.connectedLab,true);assert.equal(result.tabs.customers,false);
 await handlePhotographerTabSettings({...opts,req:{method:'GET',headers:{'x-photobridge-portal':'lab'}},url:{pathname:'/api/photographer/navigation-tabs'}});
 assert.equal(result.connectedLab,false);assert.equal(result.tabs.customers,true);assert.equal(result.tabs.calendar,false);
 await handlePhotographerTabSettings({...opts,req:{method:'PUT',headers:{}},url:{pathname:'/api/admin/photographer-tabs'}});
 assert.equal(result.status,200);assert.equal(value.customers,false);assert.equal(value.calendar,true);
 assert.equal(value.labCustomers,false);assert.equal(value.labCalendar,false);
});
test('R1976 no shared CRM switch remains in browser, and video guides are present before lab choice',()=>{
 const admin=read('dist/web/photobridge-r1099-photographer-tabs.js');
 const crm=read('dist/web/photobridge-r1761-crm-nav.js');
 const guide=read('dist/web/photobridge-workflow-guides-v572.js');
 const inside=read('dist/web/photobridge-r1976-crm-visibility.js');
 const html=read('dist/web/customer-crm.html');
 const build=read('scripts/enable-r1966-desktop-calendar-store-chooser.mjs');
 for(const [name,source] of [['admin',admin],['CRM',crm],['guides',guide],['inner CRM',inside]]){
  assert.doesNotThrow(()=>new vm.Script(source),name);
 }
 for(const key of ['customers','calendar','labCustomers','labCalendar'])assert(admin.includes(key),key);
 assert(crm.includes('enabled[pane]!==true'));
 assert(crm.includes('enabled[button.dataset.pbCrmPane]!==true'));
 assert(inside.includes('pb1976CustomersOff'));
 assert(inside.includes('pb1976CalendarOff'));
 assert(html.includes('photobridge-r1976-crm-visibility.js?v=r1976'));
 assert(guide.includes("if(!print)return; // R1976"));
 assert(guide.includes("kind:'print'"));assert(guide.includes("kind:'album'"));
 assert(build.includes('/* R1976 independent CRM tabs + centered Print */'));
 assert(admin.includes("next.connectedLab===true"));
 assert(admin.includes("pb1976PrintLanding"));
 assert(admin.includes("pbLabChooser=1"));
});
