'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');

test('R1966: photographer desktop main row has independent Customers and Calendar tabs',()=>{
 const js=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(js.includes("['crm','مشتریان','/customer-crm.html?portal=photographer'],['calendar','تقویم مشتریان'"));
 assert(js.includes("if(key==='print'||key==='crm'||key==='calendar'){open(key);return;}"));
 assert(js.includes("['crm','calendar'].includes(active)?[]:"));
 assert(js.includes("key==='calendar'?'تقویم مشتریان'"));
 assert(js.includes("pbCrmDesktopTab='+key+(key==='calendar'?'&view=calendar':'')"));
 assert.equal(js.split("['store','print','crm','calendar'].includes(panel)").length-1,2);
 assert(js.includes("panel.dataset.pb1966CalendarSeen"),'revisiting the Calendar refreshes its appointments');
 new Function(js);
});

test('R1966: Store chooser keeps filter chips in card flow and hides stale secondary header',()=>{
 const js=read('dist/web/photobridge-r1126-desktop-navigation.js');
 const css=read('dist/web/photobridge-r1126-desktop-navigation.css');
 assert(js.includes("active==='store'?(!storeHeader||!!doc?.body?.classList.contains('pbR96ChoosingStore'))"));
 assert(css.includes('/* R1966: keep desktop Store filter chips inside the chooser flow. */'));
 assert(css.includes('#storeChooserPanelR96 .pbR96StoreChooser #storeChooserFiltersR1231'));
 assert(css.includes('position:static!important'));
 assert(css.includes('pb1127Choosing body #pb1126ChromeHost #pb1126DesktopHeader>.pb1126Secondary{display:none!important}'));
 assert(css.includes('@media(min-width:821px)'), 'mobile Store layout remains untouched');
});

test('R1966: standalone Calendar uses current CRM appointment logic; customers no longer duplicate calendar tab',()=>{
 const html=read('dist/web/customer-crm.html');
 const cal=read('dist/web/customer-calendar.js');
 assert(html.includes('id="pbR1966StandaloneCrmBoot"'));
 assert(html.includes('tab==="calendar"?"pbR1966CalendarTab":"pbR1966CrmTab"'));
 assert(html.includes('html.pbR1966CrmTab #nav button[data-view="calendar"]{display:none!important}'));
 assert(html.includes('html.pbR1966CalendarTab #nav{display:none!important}'));
 assert(cal.includes("if(params.get('view')==='calendar'"),'calendar deep-link auto-selects the existing functional appointment page');
 assert(html.includes('id="cal-form-dialog"'), 'booking dialogs are preserved');
});

test('R1966: both entry pages bust navigation JS and CSS, build executes after CRM writers',()=>{
 for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  const html=read(path);
  for(const asset of ['photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css']){
   const first=html.indexOf(asset+'?');
   assert(first>=0,path+': missing '+asset);
   const end=html.indexOf('"',first);
   assert(end>first);
   assert(html.slice(first,end).includes('&r1966=1'),path+': stale '+asset+' URL');
  }
 }
 const build=read('scripts/liara-fast-build.mjs');
 const crm=build.lastIndexOf("deployStep('./enable-crm-delivery.mjs')");
 const patch=build.lastIndexOf("deployStep('./enable-r1966-desktop-calendar-store-chooser.mjs')");
 const final=build.lastIndexOf("deployStep('./enable-r1897-final-lab-assets.mjs')");
 assert(crm>=0&&patch>crm&&final>patch,'CRM writer, R1966 and final compression order');
});
