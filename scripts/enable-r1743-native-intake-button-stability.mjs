// R1743 / R1744: keep the real Windows Lab intake button visible, without ever removing it as a legacy proxy.
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

const extendRootQueue=(source,prefix,label)=>{
 const i=source.indexOf(prefix);
 if(i<0||source.indexOf(prefix,i+prefix.length)!==-1)throw Error('[R1744] '+label+' selector missing or repeated');
 const end=source.indexOf('\n',i),line=source.slice(i,end<0?undefined:end);
 if(!line.includes('&&/^')||!line.endsWith('.test(location.pathname);'))throw Error('[R1744] '+label+' predicate changed');
 const expanded=line.replace('&&/^',"&&((location.pathname==='/lab'&&!!document.querySelector('.labRoleWorkspace .stageQueueWorkspace'))||/^").replace(/\.test\(location\.pathname\);$/,'.test(location.pathname));');
 return source.slice(0,i)+expanded+source.slice(end<0?source.length:end);
};
const intakeName='photobridge-r1137-lab-local-intake.js';
const intakePath=root+'/'+intakeName;
let intake=fs.readFileSync(intakePath,'utf8');
if(!intake.includes('/* PB1743 native button target */')){
 const start=intake.indexOf('function mount(){');
 const finish=intake.indexOf('\nlet primaryState=',start);
 if(start<0||finish<=start)throw Error('[R1745] native mount function not found');
 let mount=intake.slice(start,finish);
 // The existing native bundle was transformed by numerous prior Liara stages.
 // Match declarations by meaning, not by the exact previous header/target lines.
 mount=replace(mount,
  "const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');",
  "const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain')||document.querySelector('.labRoleWorkspace');",
  'native mount host');
 const headerRx=/\bconst\s+header\s*=\s*desktopQueue\s*\?[^;\n]+;/g;
 const targetRx=/\bconst\s+target\s*=\s*([^;\n]+);/g;
 const headerMatches=[...mount.matchAll(headerRx)];
 const targetMatches=[...mount.matchAll(targetRx)];
 if(headerMatches.length!==1||targetMatches.length!==1)throw Error('[R1745] native mount header/target count '+headerMatches.length+'/'+targetMatches.length);
 const oldHeader=headerMatches[0][0],oldTarget=targetMatches[0][1].trim();
 if(!oldHeader.includes('pb1148SecondaryHeader.pb1174QueueNav')||!oldTarget.includes('.mainQueueFilters'))throw Error('[R1745] native mount queue header semantics changed');
 mount=mount.replace(headerRx,"const header=desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null;");
 mount=mount.replace(targetRx,"const visibleFallback=desktopQueue?document.querySelector('.labRoleWorkspace .labSingleHeader'):null;\n const target=header||visibleFallback||("+oldTarget+");");
 mount=extendRootQueue(mount,' const desktopQueue=','native root queue');
 mount="/* PB1743 native button target */\n"+mount;
 intake=intake.slice(0,start)+mount+intake.slice(finish);
 fs.writeFileSync(intakePath,intake);
}
execFileSync(process.execPath,['--check',intakePath],{stdio:'inherit'});
const buttonAt=intake.indexOf("button.id='pb1137LocalIntakeButton'");
if(buttonAt<0||!/\bbutton\.(?:onclick\s*=|addEventListener\s*\(\s*['"]click['"])/.test(intake.slice(Math.max(0,buttonAt-500),buttonAt+1600)))
 throw Error('[R1743] original intake click handler missing');
// R1746: earlier build stages legitimately rewrite the syntactic device guard.
// Validate the existing primary-device verification flow instead of exact text.
const mountStart=intake.indexOf('function mount(){');
const mountEnd=intake.indexOf('let primaryState=',mountStart);
const mounted=mountStart>=0&&mountEnd>mountStart?intake.slice(mountStart,mountEnd):'';
if(!mounted.includes('primaryState')||!intake.includes('/api/lab/download-device'))
 throw Error('[R1746] native primary-device verification flow missing');

const headerName='photobridge-r1147-lab-admin-header.js';
const headerPath=root+'/'+headerName;
let header=fs.readFileSync(headerPath,'utf8');
if(!header.includes('/* PB1743 preserve native launch while rebuilding header */')){
 header=replace(header,
  '  row.replaceChildren();',
  "   /* PB1743 preserve native launch while rebuilding header */\n   const retainedLaunch=row.querySelector('#pb1137LocalIntakeButton');\n   row.replaceChildren();\n   if(retainedLaunch){retainedLaunch.classList.remove('pb1174QueueLaunch');row.prepend(retainedLaunch);}",
  'header rebuild keeps original launch');
 header=replace(header,
  'if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake);',
  "  if(isQueue&&intake){intake.classList.remove('pb1174QueueLaunch');if(intake.parentElement!==row)row.prepend(intake);}",
  'header retains one real launch');
 header=extendRootQueue(header," const isQueue=source.classList.contains('mainQueueFilters')&&",'native header root queue');
 header=replace(header,"row.querySelector(':scope>.pb1174QueueLaunch')?.remove();","row.querySelector(':scope>.pb1174QueueLaunch:not(#pb1137LocalIntakeButton)')?.remove();",'only legacy proxy may be removed');
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
