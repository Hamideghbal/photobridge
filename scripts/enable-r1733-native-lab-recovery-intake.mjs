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
 " const provider=storage();",
 " const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');",
 " const old=document.getElementById('pb1137LocalIntakeButton');",
 " const queue=/^\\/lab\\/(?:orders(?:\\/|$)|album(?:s|[-/]|$)|print(?:\\/|$))/.test(location.pathname);",
 " if(!host||!queue){old?.remove();return;}",
 " // The queue header is authoritative, but can mount a frame later than the intake script.",
 " const header=document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav');",
 " const target=header||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace')||host;",
 " const button=old||node('button',pb1733IntakeLabel(),'pb1137Launch');",
 " if(!old){button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=open;}",
 " const label=pb1733IntakeLabel();",
 " // The outer intake MutationObserver watches childList. Never rewrite text",
 " // on an unchanged button, or it will schedule endless repaints.",
 " if(button.textContent!==label)button.textContent=label;",
 " if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);",
 " const ready=!!provider?.deviceId?.();",
 " if(button.disabled===ready)button.disabled=!ready;",
 " const hint=!ready?'امکان ثبت سفارش حضوری پس از راه‌اندازی ذخیره‌سازی روی این دستگاه فعال می‌شود.':",
 "  primaryState===false?'تأیید دستگاه اصلی در زمان بازکردن سفارش دوباره بررسی می‌شود.':",
 "  'ثبت سفارش حضوری؛ قبل از ثبت، دستگاه اصلی دوباره بررسی می‌شود.';",
 " if(button.title!==hint)button.title=hint;",
 " if(button.parentElement!==target)target.prepend(button);",
 " // Never hide the entry after a transient network/auth failure. The real order",
 " // still validates primary device with a fresh server response in open().",
 " if(ready&&primaryState===null&&!checking)checkPrimary();",
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
 ].join('\\n'),'intake modal display');
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
if(!header.includes('/* PB1733 keep intake across header rebuild */')){
 header=one(header,'  row.replaceChildren();',
  "  const pb1733Intake=row.querySelector('#pb1137LocalIntakeButton');\n  row.replaceChildren();\n  if(pb1733Intake)row.prepend(pb1733Intake);\n  /* PB1733 keep intake across header rebuild */",
  'header rebuild');
 fs.writeFileSync(hpath,header);
}
execFileSync(process.execPath,['--check',hpath],{stdio:'inherit'});
for(const name of ['r1733-native-intake.css','r1733-native-auth-help.js']){
 fs.copyFileSync('scripts/'+name,root+'/'+name);
 if(name.endsWith('.js'))execFileSync(process.execPath,['--check',root+'/'+name],{stdio:'inherit'});
}
const htmlPath=root+'/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('r1733-native-intake.css')){
 html=one(html,'</head>','<link rel="stylesheet" href="/r1733-native-intake.css?v=r1733">\n</head>','CSS inclusion');
}
if(!html.includes('r1733-native-auth-help.js')){
 html=one(html,'</body>','<script defer src="/r1733-native-auth-help.js?v=r1733"></script>\n</body>','recovery helper inclusion');
}
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
