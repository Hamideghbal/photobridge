/* R1966: stable desktop store chooser and first-class photographer calendar tab. */
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const write=(path,content)=>fs.writeFileSync(path,content);
function once(source,oldText,newText,description){
 const count=source.split(oldText).length-1;
 if(count!==1)throw new Error('[R1966] '+description+' anchor count '+count);
 return source.replace(oldText,()=>newText);
}
function multiple(source,oldText,newText,expected,description){
 const count=source.split(oldText).length-1;
 if(count!==expected)throw new Error('[R1966] '+description+' anchor count '+count);
 return source.split(oldText).join(newText);
}

const navPath='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=read(navPath);
if(!nav.includes('/* R1966: standalone photographer calendar in stable desktop chrome. */')){
 // R1976: R1966 used to create the calendar tab itself. When independent
 // visibility controls already created it, retain the Store/CRM compatibility
 // work and the current editor, without trying to add a second Calendar tab.
 if(nav.includes("if(key==='crm'||key==='calendar')frame.src=window.pbCrmFrameUrl?")){
  nav=once(nav,
    "active==='crm'?[]:",
    "['crm','calendar'].includes(active)?[]:",
    'CRM secondary navigation');
  nav=once(nav,
    "const choosing=active==='store'?(!doc?.querySelector('#photographerStoreRoleHeader')||doc.body?.classList.contains('pbR96ChoosingStore'))",
    "const choosing=active==='store'?(!storeHeader||!!doc?.body?.classList.contains('pbR96ChoosingStore'))",
    'Store chooser header');
  const modernCrm=nav.match(/if\(key==='crm'\|\|key==='calendar'\)frame\.src=[^\n;]+;else\{/g)||[];
  if(modernCrm.length!==1)throw Error('[R1966] independent CRM source expected once, got '+modernCrm.length);
  nav=once(nav,modernCrm[0],
    "if(key==='crm'||key==='calendar'){const crmUrl=window.pbCrmFrameUrl?window.pbCrmFrameUrl('photographer'):'/customer-crm.html?portal=photographer&pbDesktopContent=1';const u=new URL(crmUrl,location.origin);u.searchParams.set('pbDesktopContent','1');u.searchParams.set('pbCrmDesktopTab',key);if(key==='calendar')u.searchParams.set('view','calendar');else u.searchParams.delete('view');frame.src=u.pathname+u.search;}else{",
    'two isolated CRM iframe routes');
  nav=once(nav,
    "if(key==='crm'&&u.pathname!=='/customer-crm.html')",
    "if((key==='crm'||key==='calendar')&&u.pathname!=='/customer-crm.html')",
    'CRM iframe safe navigation');
  nav=once(nav,
    "document.documentElement.classList.toggle('pbCrmDesktopActive',active==='crm');",
    "document.documentElement.classList.toggle('pbCrmDesktopActive',active==='crm'||active==='calendar');",
    'CRM Calendar header state');
  // Earlier R1461 compatibility stages can inject the old CRM-only opener.
  // Canonicalize it here so Calendar remains a real desktop navigation route.
  if(nav.includes("if(key==='print'||key==='crm'){open(key);return;}"))
   nav=nav.replaceAll("if(key==='print'||key==='crm'){open(key);return;}",
     "if(key==='print'||key==='crm'||key==='calendar'){open(key);return;}");
  if(!nav.includes("if(key==='print'||key==='crm'||key==='calendar'){open(key);return;}"))
   throw Error('[R1966] independent Calendar opener missing');
  nav=once(nav,
    "closePanels();panel.hidden=false;selected=key;document.documentElement.classList.add('pb1126PanelOpen');",
    "closePanels();panel.hidden=false;selected=key;document.documentElement.classList.add('pb1126PanelOpen');\n   if(key==='calendar'&&panel.dataset.pb1966CalendarSeen==='1')panel.querySelector('iframe')?.contentDocument?.querySelector('#nav button[data-view=\"calendar\"]')?.click();\n   if(key==='calendar')panel.dataset.pb1966CalendarSeen='1';",
    'refresh appointments');
  nav="/* R1966: standalone photographer calendar in stable desktop chrome. */\n"+nav;
  new Function(nav);write(navPath,nav);
 }else{
 // CRM delivery appends a release token to this href before R1966 runs.
 const crmTab=nav.match(/\['crm','مشتریان','\/customer-crm\.html\?portal=photographer[^']*'\],/g)||[];
 if(crmTab.length!==1)throw new Error('[R1966] CRM tab reference count '+crmTab.length);
 nav=once(nav,crmTab[0],crmTab[0]+"['calendar','تقویم مشتریان','/customer-crm.html?portal=photographer&view=calendar'],",'main navigation calendar tab');
 nav=once(nav,
  "active==='crm'?[]:",
  "['crm','calendar'].includes(active)?[]:",
  'CRM secondary navigation must not clone unrelated buttons');
 nav=once(nav,
  "const choosing=active==='store'?(!doc?.querySelector('#photographerStoreRoleHeader')||doc.body?.classList.contains('pbR96ChoosingStore'))",
  "const choosing=active==='store'?(!storeHeader||!!doc?.body?.classList.contains('pbR96ChoosingStore'))",
  'chooser hides all stale store controls until an active store is ready');
 nav=once(nav,
  "const frame=document.createElement('iframe');frame.title=key==='crm'?'دفتر مشتریان':key==='store'?'فروشگاه':'چاپ';",
  "const frame=document.createElement('iframe');frame.title=key==='calendar'?'تقویم مشتریان':key==='crm'?'دفتر مشتریان':key==='store'?'فروشگاه':'چاپ';",
  'calendar iframe title');
 // R1867's CRM delivery wrapper controls the iframe URL, so keep its cache policy.
 const crmFrame=nav.match(/if\(key==='crm'\)frame\.src=[^\n;]+;else\{/g)||[];
 if(crmFrame.length!==1)throw new Error('[R1966] CRM iframe branch count '+crmFrame.length);
 nav=once(nav,crmFrame[0],
  "if(key==='crm'||key==='calendar'){const crmUrl=window.pbCrmFrameUrl?window.pbCrmFrameUrl('photographer'):'/customer-crm.html?portal=photographer&pbDesktopContent=1';const u=new URL(crmUrl,location.origin);u.searchParams.set('pbDesktopContent','1');u.searchParams.set('pbCrmDesktopTab',key);if(key==='calendar')u.searchParams.set('view','calendar');else u.searchParams.delete('view');frame.src=u.pathname+u.search;}else{",
  'two isolated CRM iframe routes');
 nav=once(nav,
  "if(key==='crm'&&u.pathname!=='/customer-crm.html')",
  "if((key==='crm'||key==='calendar')&&u.pathname!=='/customer-crm.html')",
  'prevent recursive CRM navigation from either tab');
 nav=once(nav,
  "document.documentElement.classList.toggle('pbCrmDesktopActive',active==='crm');",
  "document.documentElement.classList.toggle('pbCrmDesktopActive',active==='crm'||active==='calendar');",
  'calendar shares CRM shell visibility');
 nav=once(nav,
  "if(key==='print'||key==='crm'){open(key);return;}",
  "if(key==='print'||key==='crm'||key==='calendar'){open(key);return;}",
  'calendar opener');
 nav=multiple(nav,
  "['store','print','crm'].includes(panel)",
  "['store','print','crm','calendar'].includes(panel)",
  2,'calendar restores across back, reload and direct links');
 nav=once(nav,
  "closePanels();panel.hidden=false;selected=key;document.documentElement.classList.add('pb1126PanelOpen');",
  "closePanels();panel.hidden=false;selected=key;document.documentElement.classList.add('pb1126PanelOpen');\n   if(key==='calendar'&&panel.dataset.pb1966CalendarSeen==='1')panel.querySelector('iframe')?.contentDocument?.querySelector('#nav button[data-view=\"calendar\"]')?.click();\n   if(key==='calendar')panel.dataset.pb1966CalendarSeen='1';",
  'refresh appointments on calendar revisit');
 nav="/* R1966: standalone photographer calendar in stable desktop chrome. */\n"+nav;
 new Function(nav);
 write(navPath,nav);
 }
}

const cssPath='dist/web/photobridge-r1126-desktop-navigation.css';
let css=read(cssPath);
if(!css.includes('/* R1966: keep desktop Store filter chips inside the chooser flow. */')){
 css+='\n/* R1966: keep desktop Store filter chips inside the chooser flow. */\n'+
 '@media(min-width:821px){\n'+
 'html.pb1126Embedded body.pbR96ChoosingStore #storeChooserPanelR96 .pbR96StoreChooser #storeChooserFiltersR1231{'+
 'position:static!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;'+
 'transform:none!important;z-index:auto!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;'+
 'justify-content:center!important;gap:7px!important;width:100%!important;max-width:100%!important;min-height:0!important;'+
 'height:auto!important;margin:12px 0 14px!important;padding:0!important;clear:both!important;box-sizing:border-box!important}\n'+
 'html.pb1126Embedded body.pbR96ChoosingStore #storeChooserPanelR96 .pbR96StoreChooser{'+
 'display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important}\n'+
 'html.pb1126Desktop.pb1127Choosing body #pb1126ChromeHost #pb1126DesktopHeader>.pb1126Secondary{display:none!important}\n'+
 '}\n';
 write(cssPath,css);
}

const crmPath='dist/web/customer-crm.html';
let crm=read(crmPath);
if(!crm.includes('id="pbR1966StandaloneCrmBoot"')){
 const head='<script id="pbR1966StandaloneCrmBoot">(function(){var p=new URLSearchParams(location.search);var tab=p.get("pbCrmDesktopTab");if(p.get("pbDesktopContent")==="1"&&(tab==="crm"||tab==="calendar"))document.documentElement.classList.add(tab==="calendar"?"pbR1966CalendarTab":"pbR1966CrmTab");})();</script>'+
 '<style id="pbR1966StandaloneCrmStyle">html.pbR1966CrmTab #nav button[data-view="calendar"]{display:none!important}html.pbR1966CalendarTab #nav{display:none!important}html.pbR1966CalendarTab main{padding-top:12px!important}html.pbR1966CalendarTab #calendar.view:not([hidden]){display:block!important}</style>';
 crm=once(crm,'</head>',head+'</head>','CRM desktop-only view isolation');
 write(crmPath,crm);
}

// The JS and CSS URLs were previously immutable. Bust both from each entry
// page after every other writer but before the final compressed-asset stage.
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let page=read(path);
 for(const asset of ['photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css']){
  let found=0;
  const pattern=new RegExp(asset.replaceAll('.','[.]')+'\\?[^"\\x27<>\\s]+','g');
  page=page.replace(pattern,url=>{found++;return url.includes('r1966=1')?url:url+'&r1966=1'});
  if(!found)throw new Error('[R1966] missing '+asset+' in '+path);
 }
 write(path,page);
}
console.log('[R1966] stable Store chooser and separate photographer calendar tab prepared; mobile CRM and appointment logic untouched');
