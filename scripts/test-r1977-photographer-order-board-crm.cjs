'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

test('R1977 connected photographer opens native Print orders, not upload-only chooser',()=>{
 const source=read('dist/web/photobridge-r1099-photographer-tabs.js');
 const chrome=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(source.includes("next.connectedLab===true"));
 assert(source.includes("location.replace('/photographer/orders')"));
 assert(!source.includes("location.replace('/photographer/orders/flow"),'initial landing must not replace order board');
 assert(source.includes("pb1976PrintLanding"),'one-time landing guard remains in place');
 assert(chrome.includes("location.pathname)?'print'")||chrome.includes("location.pathname)?'print':"),'orders are a native Print tab');
 assert(source.includes("el.dataset.pbCrmPane==='customers'"));
 assert(source.includes("el.dataset.pbCrmPane==='calendar'"));
 assert.doesNotThrow(()=>new vm.Script(source));
});

test('R1977 desktop CRM + Calendar are gated by authenticated role-specific API keys',()=>{
 const source=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(source.includes('crmVisibilityVerified=false'),'do not reveal cached CRM preferences before server verification');
 assert(source.includes('crmVisibilityVerified=true'),'authenticated nav fetch must authorize CRM tabs');
 assert(source.includes("settings.tabs[selected==='crm'?'customers':'calendar']!==true"),'disabled active CRM panes close');
 const start=source.indexOf("if((['ai','album','instagram'].includes(key)");
 const end=source.indexOf('{button?.remove();continue;}',start);
 assert(start>=0&&end>start,'generated desktop filter not found');
 const predicate=source.slice(start+3,end-1);
 const blocked=new Function('key','settings','crmVisibilityVerified','return '+predicate+';');
 const settings={tabs:{ai:true,album:true,instagram:true,customers:false,calendar:true}};
 assert.equal(blocked('crm',settings,true),true,'CRM must disappear when photographer Customers off');
 assert.equal(blocked('calendar',settings,true),false,'Calendar remains independently enabled');
 assert.equal(blocked('crm',{tabs:{...settings.tabs,customers:true}},true),false);
 assert.equal(blocked('calendar',settings,false),true,'unverified cached permissions are fail-closed');
 assert.equal(blocked('print',settings,false),false,'Print must stay available');
 assert.equal(blocked('gallery',settings,false),false,'Gallery must remain available');
 assert.doesNotThrow(()=>new vm.Script(source));
});
