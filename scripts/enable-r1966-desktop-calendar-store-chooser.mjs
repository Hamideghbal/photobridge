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

// R1976: apply after R1966 generated calendar source so that the controls
// survive every Liara build and frozen Windows UI generation.
nav=read(navPath);
if(!nav.includes('/* R1976 independent CRM tabs + centered Print */')){
 const oldFilter="if(['ai','album','instagram'].includes(key)&&settings.tabs[key]===false)";
 if(!nav.includes(oldFilter))throw Error('[R1976] desktop settings filter anchor missing');
 nav=nav.replace(oldFilter,"if((['ai','album','instagram'].includes(key)&&settings.tabs[key]===false)||(['crm','calendar'].includes(key)&&(!crmVisibilityVerified||settings.tabs[key==='crm'?'customers':'calendar']!==true)))");
 // CRM's UI tab 'crm' maps to settings key 'customers'; fail closed until authenticated API confirms it.
 const stateAnchor="let settings={tabs:{ai:false,album:false,instagram:false}},chrome";
 if(!nav.includes(stateAnchor))throw Error('[R1977] desktop default state anchor missing');
 nav=nav.replace(stateAnchor,`let settings={tabs:{ai:false,album:false,instagram:false,customers:false,calendar:false}},crmVisibilityVerified=false,chrome`);
 // Older UI writers may alter the existing event listener's exact source text.
 // Listen independently rather than patching its internals, keeping CI builds stable.
 const registrationAnchor="let walletBalance=null,walletRefreshing=false;";
 if(!nav.includes(registrationAnchor))throw Error('[R1977] desktop registration anchor missing');
 nav=nav.replace(registrationAnchor,
  "window.addEventListener('photobridge-navigation-tabs',e=>{if(e.detail?.tabs){crmVisibilityVerified=true;schedule();}});"+
  "window.addEventListener('photobridge-auth-session-changed',()=>{crmVisibilityVerified=false;schedule();});"+
  registrationAnchor);

 const orderStart="const ordered=tabs.map(([key])=>nav.querySelector('[data-pb1126-kind=\"'+key+'\"]')).filter(Boolean);";
 if(!nav.includes(orderStart))throw Error('[R1976] desktop tab sort anchor missing');
 nav=nav.replace(orderStart,orderStart+"if(settings.connectedLab===true){const p=ordered.find(b=>b.dataset.pb1126Kind==='print');if(p){ordered.splice(ordered.indexOf(p),1);ordered.splice(Math.floor(ordered.length/2),0,p);}}");
 // A disabled pane must not remain open while a setting changes.
 const renderAnchor="scheduled=false;if(!document.body)return;";
 if(!nav.includes(renderAnchor))throw Error('[R1976] render anchor missing');
 nav=nav.replace(renderAnchor,renderAnchor+"if(selected&&['crm','calendar'].includes(selected)&&(!crmVisibilityVerified||settings.tabs[selected==='crm'?'customers':'calendar']!==true)){closePanels();}");
 nav="/* R1976 independent CRM tabs + centered Print */\n"+nav;
 new Function(nav);write(navPath,nav);
}


 // R1978: the first Print click opens a forced lab chooser; a subsequent click
 // on the already-selected Print tab must reopen it after the lab was chosen.
 // Keep the native Orders board as the landing page (R1977).
nav=read(navPath);
if(!nav.includes('/* R1978 reopen Print lab chooser on intentional click */')){
 const navigateAnchor='function navigate(key){';
 if(nav.split(navigateAnchor).length!==2)throw Error('[R1978] desktop Print navigation anchor missing');
 nav=nav.replace(navigateAnchor,navigateAnchor+`
  // R1978: reset a cached Print frame only when its chooser is no longer visible.
  if(key==='print'&&panels.has('print')){
   const frame=panels.get('print')?.querySelector('iframe');
   if(frame&&!frame.contentDocument?.querySelector('#pbR99LabChooser')){
    frame.src='/photographer/orders/flow?workspace=print&pbLabChooser=1&pbDesktopContent=1&pb1978Refresh='+Date.now();
    if(selected==='print')return;
   }
  }
 `);
 nav='/* R1978 reopen Print lab chooser on intentional click */\\n'+nav;
 new Function(nav);write(navPath,nav);
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
