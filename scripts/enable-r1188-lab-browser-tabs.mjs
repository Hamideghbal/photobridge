import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1188 only changes the browser-served lab UI. The downloadable Windows
// desktop executable, offline sync, invoices and authenticated APIs are untouched.
function once(path,before,after,label){
 const source=fs.readFileSync(path,'utf8');
 const count=source.split(before).length-1;
 if(count===1){fs.writeFileSync(path,source.replace(before,after));return;}
 if(count===0&&label==='active route queue source'&&source.includes('/* PB1188 prefer active queue tabs in browser */'))return;
 if(count===0&&source.includes(after))return;
 throw Error('[R1188] unexpected '+label+' occurrence count '+count+' in '+path);
}

const intake='dist/web/photobridge-r1137-lab-local-intake.js';
// The click handler STILL calls the authenticated primary-device endpoint and
// rejects orders on an unregistered or secondary device. Do not hide the entry
// point just because the browser has not yet passed its device check: show it,
// then explain the constraint in the existing order dialog if necessary.
once(intake,
 "if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host||!provider||!provider.deviceId()){old?.remove();return;}\n if(primaryState===null){checkPrimary();return;}if(!primaryState){old?.remove();return;}",
 "/* PB1188 browser entry point stays visible; submitting still requires primary device */\n if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host||!provider){old?.remove();return;}\n if(primaryState===null&&provider.deviceId())checkPrimary();",
 'device-dependent button visibility');

const header='dist/web/photobridge-r1147-lab-admin-header.js';
// Prioritize the currently displayed queue. Mounted but inactive settings and
// finance tab strips must not steal the second header on print/album routes.
once(header,
 "const source=document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs')||document.querySelector('.mainQueueFilters');",
 "/* PB1188 prefer active queue tabs in browser */const queueRoute=/^\\/lab\\/(?:orders(?:\\/|$)|album(?:s|[-/]|$)|print(?:\\/|$))/.test(location.pathname);\n  const source=queueRoute?document.querySelector('.labRoleWorkspace .mainQueueFilters'):(document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs'));",
 'active route queue source');

// R1187 changed full-pane translation into full-pane opacity animation.
// Even that compositing pass still makes all photos/text flicker on some
// Windows monitors. Keep the stable tab underline and button feedback only.
once(header,
 "panel?.animate?.([{opacity:.85},{opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});",
 "/* PB1188 fixed scroll viewport; only the selected tab animates */",
 'lab status panel reveal');
once(header,
 "nav.addEventListener('click',e=>{if(!e.target.closest('button')||matchMedia('(prefers-reduced-motion:reduce)').matches)return;document.querySelector('.labRolePageScrollArea')?.animate([{opacity:.85},{opacity:1}],{duration:180,easing:'ease-out'});});h.append(nav);",
 "/* PB1188 no animation on the full laboratory scroll viewport */h.append(nav);",
 'lab main tab reveal');

// Force fresh scripts in the SITE HTML. Preserve historical version tokens and
// the R1187 query param so all other release guards still recognize the URLs.
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');
for(const name of ['photobridge-r1137-lab-local-intake','photobridge-r1147-lab-admin-header']){
 const rx=new RegExp(name+'\\.js\\?v=[^"\\s]+','g');
 const matches=[...html.matchAll(rx)];
 if(matches.length!==1)throw Error('[R1188] expected one '+name+' script in site HTML');
 html=html.replace(rx,value=>value.replace(/&site=r1188/g,'')+'&site=r1188');
}
fs.writeFileSync(index,html);

for(const file of [intake,header])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1188-lab-browser-tabs.cjs'],{stdio:'inherit'});
