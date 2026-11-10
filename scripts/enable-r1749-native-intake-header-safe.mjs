// R1749 — experimental Windows-only real intake button visibility guard.
// This does not change order submission, account details, SMS, site UI, or device authorization.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root='dist/web/lab-desktop-ui';
const intakeName='photobridge-r1137-lab-local-intake.js';
const headerName='photobridge-r1147-lab-admin-header.js';
const cssName='photobridge-r1147-lab-admin-header.css';
const once=(source,needle,replacement,label)=>{
 const count=source.split(needle).length-1;
 if(count!==1)throw Error('[R1749] '+label+' expected once, found '+count);
 return source.replace(needle,replacement);
};
const expandRootQueue=(source,prefix,label)=>{
 const begin=source.indexOf(prefix);
 if(begin<0||source.indexOf(prefix,begin+prefix.length)!==-1)throw Error('[R1749] '+label+' predicate missing/repeated');
 const end=source.indexOf('\n',begin);
 const line=source.slice(begin,end<0?undefined:end);
 if(!line.includes('&&/^')||!line.endsWith('.test(location.pathname);'))throw Error('[R1749] '+label+' predicate not recognized');
 const changed=line.replace('&&/^',"&&((location.pathname==='/lab'&&!!document.querySelector('.labRoleWorkspace .stageQueueWorkspace'))||/^").replace(/\.test\(location\.pathname\);$/,'.test(location.pathname));');
 return source.slice(0,begin)+changed+source.slice(end<0?source.length:end);
};

const intakePath=root+'/'+intakeName;
let intake=fs.readFileSync(intakePath,'utf8');
if(!intake.includes('/* PB1749 native visible intake */')){
 const begin=intake.indexOf('function mount(){');
 const end=intake.indexOf('\nlet primaryState=',begin);
 if(begin<0||end<=begin)throw Error('[R1749] intake mount cannot be isolated');
 let mount=intake.slice(begin,end);
 mount=once(mount,
  "const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');",
  "const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain')||document.querySelector('.labRoleWorkspace');",
  'native workspace host');
 mount=expandRootQueue(mount,' const desktopQueue=','root /lab queue');
 const h=[...mount.matchAll(/\bconst\s+header\s*=\s*desktopQueue\s*\?[^;\n]+;/g)];
 const t=[...mount.matchAll(/\bconst\s+target\s*=\s*([^;\n]+);/g)];
 if(h.length!==1||t.length!==1)throw Error('[R1749] header/target match '+h.length+'/'+t.length);
 if(!h[0][0].includes('pb1148SecondaryHeader.pb1174QueueNav')||!t[0][1].includes('.mainQueueFilters'))
  throw Error('[R1749] unexpected header and fallback targets');
 mount=mount.replace(h[0][0],
  "const header=desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null;");
 mount=mount.replace(t[0][0],
  "const visibleFallback=desktopQueue?document.querySelector('.labRoleWorkspace .labSingleHeader'):null;\n const target=header||visibleFallback||("+t[0][1].trim()+");");
 intake=intake.slice(0,begin)+'/* PB1749 native visible intake */\n'+mount+intake.slice(end);
 fs.writeFileSync(intakePath,intake);
}
execFileSync(process.execPath,['--check',intakePath],{stdio:'inherit'});
if(!intake.includes("button.id='pb1137LocalIntakeButton'")||!intake.includes('/api/lab/download-device')||!intake.includes('primaryState'))
 throw Error('[R1749] original button / device permission guard missing');

const headerPath=root+'/'+headerName;
let header=fs.readFileSync(headerPath,'utf8');
if(!header.includes('/* PB1749 retained real intake button */')){
 header=once(header,'  row.replaceChildren();',
  "  /* PB1749 retained real intake button */\n  const retainedIntake=row.querySelector('#pb1137LocalIntakeButton');\n  row.replaceChildren();\n  if(retainedIntake)row.prepend(retainedIntake);",
  'retaining real button through header rebuild');
 header=expandRootQueue(header," const isQueue=source.classList.contains('mainQueueFilters')&&",'header root /lab queue');
 header=once(header,
  'if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake);',
  "if(isQueue&&intake){intake.classList.remove('pb1174QueueLaunch');if(intake.parentElement!==row)row.prepend(intake);}",
  'real intake relocation');
 header=once(header,
  "row.querySelector(':scope>.pb1174QueueLaunch')?.remove();",
  "row.querySelector(':scope>.pb1174QueueLaunch:not(#pb1137LocalIntakeButton)')?.remove();",
  'retired proxy removal');
 fs.writeFileSync(headerPath,header);
}
execFileSync(process.execPath,['--check',headerPath],{stdio:'inherit'});

const cssPath=root+'/'+cssName;
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('/* PB1749 visible real native intake */')){
 css += '\n/* PB1749 visible real native intake */\n';
 css += '@media(min-width:821px) and (hover:hover) and (pointer:fine){\n';
 css += 'html body #root .labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav>#pb1137LocalIntakeButton{display:inline-flex!important;visibility:visible!important;opacity:1!important;order:-1!important;flex:0 0 auto!important;margin-inline-end:auto!important;position:relative!important;z-index:2!important}\n';
 css += 'html body #root .labRoleWorkspace .labSingleHeader>#pb1137LocalIntakeButton{display:inline-flex!important;visibility:visible!important;opacity:1!important;flex:0 0 auto!important}\n';
 css += '}\n';
 fs.writeFileSync(cssPath,css);
}
const manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1749] unexpected Windows update manifest');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of [intakeName,headerName,cssName]){
 const entry=manifest.files.find(f=>f.name===name);
 if(!entry)throw Error('[R1749] native file missing from manifest: '+name);
 entry.sha256=hash(fs.readFileSync(root+'/'+name));
}
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1749] Windows-only: preserve real intake launcher in visible header, without order/SMS changes.');
