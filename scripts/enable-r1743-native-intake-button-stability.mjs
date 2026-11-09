// R1743: fix the real Windows Lab launch button after a native UI hot update.
// No proxy controls, no new permission APIs, no changes to orders or local files.
// The original mount placed the button under .mainQueueFilters, which the
// R1147 desktop header CSS hides after it creates .pb1174QueueNav. Its
// selector searched the wrong parent for the visible, fixed secondary header.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui';
const replace=(source,from,to,label)=>{
 const n=source.split(from).length-1;
 if(n!==1)throw Error('[R1743] '+label+' anchor count '+n);
 return source.replace(from,to);
};
const intakeName='photobridge-r1137-lab-local-intake.js';
const intakePath=root+'/'+intakeName;
let intake=fs.readFileSync(intakePath,'utf8');
if(!intake.includes('/* PB1743 native button target */')){
 intake=replace(intake,
  "const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');",
  "/* PB1743 native button target */\n const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain')||document.querySelector('.labRoleWorkspace');",
  'native mount host');
 intake=replace(intake,
  "const header=desktopQueue?host.querySelector('.pb1148SecondaryHeader.pb1174QueueNav'):null;\n const target=header||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}",
  "const header=desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null;\n // The hidden queue filter is never the preferred target on Windows desktop.\n const visibleFallback=desktopQueue?document.querySelector('.labRoleWorkspace .labSingleHeader'):null;\n const target=header||visibleFallback||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}",
  'native visible header');
 // Retain the established v2268 native callback exactly as earlier stages
 // generated it. The visible-header target fixes its placement; no click-hook
 // rewrite, proxy action, or registration change is needed.
 fs.writeFileSync(intakePath,intake);
}
execFileSync(process.execPath,['--check',intakePath],{stdio:'inherit'});
const buttonAt=intake.indexOf("button.id='pb1137LocalIntakeButton'");
if(buttonAt<0||!/\bbutton\.(?:onclick\s*=|addEventListener\s*\(\s*['"]click['"])/.test(intake.slice(Math.max(0,buttonAt-500),buttonAt+1600)))
 throw Error('[R1743] original intake click handler missing');
if(!intake.includes("!provider||!provider.deviceId()"))throw Error('[R1743] original device guard changed');

const headerName='photobridge-r1147-lab-admin-header.js';
const headerPath=root+'/'+headerName;
let header=fs.readFileSync(headerPath,'utf8');
if(!header.includes('/* PB1743 preserve native launch while rebuilding header */')){
 header=replace(header,
  '  row.replaceChildren();',
  "   /* PB1743 preserve native launch while rebuilding header */\n   const retainedLaunch=row.querySelector('#pb1137LocalIntakeButton');\n   row.replaceChildren();\n   if(retainedLaunch){retainedLaunch.classList.add('pb1174QueueLaunch');row.prepend(retainedLaunch);}",
  'header rebuild keeps original launch');
 header=replace(header,
  'if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake);',
  "  if(isQueue&&intake){intake.classList.add('pb1174QueueLaunch');if(intake.parentElement!==row)row.prepend(intake);}",
  'header retains one real launch');
 fs.writeFileSync(headerPath,header);
}
execFileSync(process.execPath,['--check',headerPath],{stdio:'inherit'});
if(!header.includes("row.querySelector(':scope>button[data-pb1173-index]"))throw Error('[R1743] original header tab routing missing');

const cssName='photobridge-r1147-lab-admin-header.css';
const cssPath=root+'/'+cssName;
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('/* PB1743 native launch visible in queue header */')){
 css+='\n/* PB1743 native launch visible in queue header */\n';
 css+='@media(min-width:821px) and (hover:hover) and (pointer:fine){\n';
 css+=' html body #root .labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav>#pb1137LocalIntakeButton{display:inline-flex!important;order:-1!important;flex:0 0 auto!important;margin-inline-end:auto!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:2!important}\n';
 css+=' html body #root .labRoleWorkspace .labSingleHeader>#pb1137LocalIntakeButton{display:inline-flex!important;flex:0 0 auto!important;visibility:visible!important;opacity:1!important}\n';
 css+='}\n';
 fs.writeFileSync(cssPath,css);
}
const manifestPath=root+'/manifest.json',m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(m.channel!=='lab'||!Array.isArray(m.files))throw Error('[R1743] native UI manifest invalid');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of [intakeName,headerName,cssName]){
 const entry=m.files.find(f=>f.name===name);
 if(!entry)throw Error('[R1743] native UI manifest missing '+name);
 entry.sha256=sha(fs.readFileSync(root+'/'+name));
}
m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(m));
console.log('[R1743] Real Windows walk-in button anchored to visible header and preserved across header rebuilds.');
