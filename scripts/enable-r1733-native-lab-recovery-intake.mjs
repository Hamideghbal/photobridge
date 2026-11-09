// R1733: Native Windows Lab-only UI repair. Web UI remains unchanged.
// Runs after R1728 and R1729, against the isolated lab-desktop-ui snapshot.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui',intake='photobridge-r1137-lab-local-intake.js';
const marker='/* PB1733 native Lab walk-in header fix */';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function one(src,old,next,label){
 const count=src.split(old).length-1;
 if(count!==1)throw Error('R1733 '+label+' anchor count '+count);
 return src.replace(old,next);
}
const nativeMount=[
 "function mount(){",
 " const workspace=document.querySelector('.labRoleWorkspace');",
 " const old=document.getElementById('pb1137LocalIntakeButton');",
 " const queue=/^\\/lab\\/(?:orders(?:\\/|$)|album(?:s|[-/]|$)|print(?:\\/|$))/.test(location.pathname);",
 " if(!workspace||!queue){old?.remove();return;}",
 " // R1736: an inactive filter strip can exist while the visible header is elsewhere.",
 " const visible=el=>!!el&&el.hidden!==true&&(typeof el.getClientRects!=='function'||el.getClientRects().length>0);",
 " const secondary=workspace.querySelector('.pb1148SecondaryHeader.pb1174QueueNav');",
 " const top=workspace.querySelector('.labSingleHeader');",
 " const target=visible(secondary)?secondary:visible(top)?top:workspace;",
 " const button=old||node('button',pb1733IntakeLabel(),'pb1137Launch');",
 " if(!old){button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=open;}",
 " if(button.classList?.contains&&!button.classList.contains('pb1736NativeWalkin'))button.classList.add('pb1736NativeWalkin');",
 " if(button.dataset)button.dataset.pbNativeIntakeVersion='r1736';",
 " if(button.hidden)button.hidden=false;",
 " const label=opening?'در حال آماده‌سازی…':pb1733IntakeLabel();",
 " if(button.textContent!==label)button.textContent=label;",
 " if(button.getAttribute('aria-label')!==pb1733IntakeLabel())button.setAttribute('aria-label',pb1733IntakeLabel());",
 " // Keep the action visible; the existing open() checks server primary, folder and permissions.",
 " if(!opening&&button.disabled)button.disabled=false;",
 " let paired=false;try{paired=!!storage()?.deviceId?.();}catch{}",
 " const hint=!paired?'برای ثبت سفارش، وضعیت دستگاه اصلی و پوشه را بررسی کنید.':",
 "  primaryState===false?'دستگاه اصلی هنگام بازکردن فرم دوباره تأیید می‌شود.':",
 "  'ثبت سفارش حضوری در برنامه ویندوز';",
 " if(button.title!==hint)button.title=hint;",
 " if(button.parentElement!==target)target.prepend(button);",
 " if(paired&&primaryState===null&&!checking)checkPrimary();",
 "}",
].join('\n');
const loc=root+'/'+intake;
let js=fs.readFileSync(loc,'utf8');
if(!js.includes(marker)){
 js=one(js,'let active=null,opening=false;',
  "let active=null,opening=false;\nconst pb1733IntakeLabel=()=>/^\\/lab\\/album(?:s|[-/]|$)/.test(location.pathname)?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری';",
  'intake title helper');
 // Previous native build stages can replace these literal labels. The visible
 // launcher is authoritatively repainted by mount(), so cosmetic old-label
 // replacements must never be required for a successful production build.
 js=js.replaceAll("launch.textContent='ثبت سفارش عکس حضوری';","launch.textContent=pb1733IntakeLabel();");
 // Patch the constructed modal at its display boundary, independently of how
 // upstream stages named its heading or accessibility label.
 js=one(js," modal.showModal();",[
  " modal.setAttribute('aria-label',pb1733IntakeLabel());",
  " const pb1733DialogHeading=modal.querySelector('header h2');",
  " if(pb1733DialogHeading)pb1733DialogHeading.textContent=pb1733IntakeLabel();",
  " modal.showModal();"
 ].join('\n'),'intake modal display');
 const start=js.indexOf('function mount(){');
 const stop=js.indexOf('\nlet primaryState=null,checking=false,primaryCheckedAt=0;',start);
 if(start<0||stop<start)throw Error('R1733 native intake mount boundary changed');
 js=js.slice(0,start)+nativeMount+js.slice(stop);
 js=one(js,"window.addEventListener('photobridge-auth-session-changed',()=>{primaryState=null;primaryCheckedAt=0;schedule();});",
  "window.addEventListener('photobridge-auth-session-changed',()=>{primaryState=null;primaryCheckedAt=0;schedule();});\nwindow.addEventListener('online',()=>{primaryState=null;primaryCheckedAt=0;schedule();});\nwindow.addEventListener('focus',()=>{if(Date.now()-primaryCheckedAt>45000){primaryState=null;schedule();}});",
  'native device retry');
 js+='\n'+marker+'\n';
 fs.writeFileSync(loc,js);
}
execFileSync(process.execPath,['--check',loc],{stdio:'inherit'});
// Preserve the original intake button when a secondary-tab refresh rebuilds its row.
const headerName='photobridge-r1147-lab-admin-header.js',hpath=root+'/'+headerName;
let header=fs.readFileSync(hpath,'utf8');
const nativeHeaderSource="const source=document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs')||document.querySelector('.mainQueueFilters');";
const nativeQueueSource="/* PB1736 native current queue source */const queue=/^\\/lab\\/(?:orders(?:\\/|$)|album(?:s|[-/]|$)|print(?:\\/|$))/.test(location.pathname);const source=queue?document.querySelector('.labRoleWorkspace .mainQueueFilters'):(document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs'));";
// R1188 already prioritizes the live queue by route before the native
// snapshot is assembled. Preserve its correct code rather than requiring
// the obsolete pre-R1188 selector string (the cause of the Liara build failure).
const upstreamPriority="const source=queueRoute?document.querySelector('.labRoleWorkspace .mainQueueFilters'):(document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs'));";
if(header.includes(nativeHeaderSource))header=one(header,nativeHeaderSource,nativeQueueSource,'native queue prioritization');
else if(header.includes(upstreamPriority)&&!header.includes('PB1736 native current queue source'))
 header=one(header,upstreamPriority,'/* PB1736 native current queue source: existing R1188 priority */'+upstreamPriority,'already prioritized queue');
else if(!header.includes('PB1736 native current queue source'))header=one(header,'function secondary(h){','function secondary(h){\n /* PB1736 native current queue source: independent mount fallback */','native header fallback');

if(!header.includes('/* PB1733 keep intake across header rebuild */')){
 header=one(header,'  row.replaceChildren();',
  "  const pb1733Intake=row.querySelector('#pb1137LocalIntakeButton');\n  row.replaceChildren();\n  if(pb1733Intake)row.prepend(pb1733Intake);\n  /* PB1733 keep intake across header rebuild */",
  'header rebuild');
}
fs.writeFileSync(hpath,header);
execFileSync(process.execPath,['--check',hpath],{stdio:'inherit'});
for(const name of ['r1733-native-intake.css','r1733-native-auth-help.js']){
 fs.copyFileSync('scripts/'+name,root+'/'+name);
 if(name.endsWith('.js'))execFileSync(process.execPath,['--check',root+'/'+name],{stdio:'inherit'});
}
const htmlPath=root+'/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('r1733-native-intake.css')){
 html=one(html,'</head>','<link rel="stylesheet" href="/r1733-native-intake.css?v=r1733&nativeQueue=r1736">\n</head>','CSS inclusion');
}
if(!html.includes('r1733-native-auth-help.js')){
 html=one(html,'</body>','<script defer src="/r1733-native-auth-help.js?v=r1733"></script>\n</body>','recovery helper inclusion');
}
// Make the Windows native WebView request the newly patched intake script.
const nativeIntakeScript=/photobridge-r1137-lab-local-intake\.js\?[^"'\s<>]+/g;
const nativeHits=[...html.matchAll(nativeIntakeScript)];
if(nativeHits.length>1)throw Error('R1735 duplicate native intake script URL');
if(nativeHits.length===1)html=html.replace(nativeIntakeScript,url=>url.includes('nativeQueue=r1736')?url:url+'&nativeQueue=r1736');
fs.writeFileSync(htmlPath,html);
const manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('R1733 invalid Lab UI manifest');
for(const name of [intake,headerName,'r1733-native-intake.css','r1733-native-auth-help.js','index.html']){
 const bytes=fs.readFileSync(root+'/'+name),sha=hash(bytes);
 const entry=manifest.files.find(x=>x.name===name);
 if(entry){entry.sha256=sha;}else{manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:sha});}
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1733] Native Lab walk-in visibility and password recovery',manifest.build.slice(0,12));
