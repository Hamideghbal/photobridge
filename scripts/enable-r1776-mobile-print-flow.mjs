// Final web-only mobile fix. Do not mutate Windows UI snapshots.
import fs from 'node:fs';
const file='dist/web/photobridge-v904r99-lab-chooser.js';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('/* R1776 mobile order overview entry */')){
 source=source.replace("let running=false,lastPath=''","let pb1776ConfirmedActiveLab='';\n  let running=false,lastPath=''");
 const confirmed="const data=await api('/api/customer/labs');\n      if(epoch!==runEpoch||!isPrintRoute())return;";
 if(source.split(confirmed).length!==2)throw Error('R1776 live directory anchor');
 source=source.replace(confirmed,confirmed+"\n      pb1776ConfirmedActiveLab=String(data.activeLabId||'');");
 source=source.replace("if(force&&!refresh){","if(force&&!refresh){pb1776ConfirmedActiveLab='';");
 const anchor="const id=sel.dataset.select;sel.disabled=true;try{";
 if(source.split(anchor).length!==2)throw Error('R1776 chooser entry anchor');
 source=source.replace(anchor,anchor+`
/* R1776 mobile order overview entry */
const mobile=window===window.top&&window.matchMedia?.('(max-width:820px)')?.matches;
// Re-entering the currently active Lab can reuse its mounted React workspace.
// A different Lab still uses the select API and a fresh document to isolate data.
const reuse=mobile&&pb1776ConfirmedActiveLab===String(id)&&String(currentData?.activeLabId||'')===String(id)&&!!document.querySelector('.photographerMain.photographerPrintWorkspace');
if(reuse){
 sessionStorage.setItem(SESSION_KEY,id);
 cleanup();
 history.replaceState(history.state,'','/photographer/orders/flow?workspace=print');
 dispatchEvent(new PopStateEvent('popstate',{state:history.state}));
 return;
}
`);
 const url="const u=new URL(location.href);u.searchParams.delete('pbLabChooser');u.searchParams.set('pbEntryDone','lab');";
 if(source.split(url).length!==2)throw Error('R1776 chooser destination anchor');
 source=source.replace(url,"const u=new URL(mobile?'/photographer/orders/flow?workspace=print':location.href,location.origin);u.searchParams.delete('pbLabChooser');u.searchParams.set('pbEntryDone','lab');");
 fs.writeFileSync(file,source);
}
// iPhone photographer pages also load this Lab-only observer. False is not a
// DOM node: optional chaining on false throws on every body mutation.
const labFile='dist/web/photobridge-r1483-lab-mobile.js';
let lab=fs.readFileSync(labFile,'utf8');
const old="const main=enabled&&document.querySelector('.labRoleWorkspace main.appWorkspacePage');";
if(lab.includes(old)){lab=lab.replace(old,"const main=enabled?document.querySelector('.labRoleWorkspace main.appWorkspacePage'):null;");fs.writeFileSync(labFile,lab);}
else if(!lab.includes("const main=enabled?document.querySelector('.labRoleWorkspace main.appWorkspacePage'):null;"))throw Error('R1776 phone observer guard');
fs.copyFileSync('scripts/r1776-mobile-print-flow.css','dist/web/photobridge-r1776-mobile-print-flow.css');
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('photobridge-r1776-mobile-print-flow.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1776-mobile-print-flow.css?v=r1776">\n</head>');
for(const name of ['photobridge-v904r99-lab-chooser.js','photobridge-r1483-lab-mobile.js']){
 html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+')([^"\'<>\\s]*)','g'),(_,asset,q)=>asset+(q.includes('mobileFlow=r1776')?q:q+(q.includes('?')?'&':'?')+'mobileFlow=r1776'));
}
fs.writeFileSync('dist/web/index.html',html);
console.log('[R1776] Mobile orders/composer controls, full dock viewport and active-Lab fast entry.');
