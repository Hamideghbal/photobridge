import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1187: remove whole-panel translateY during desktop photo tab changes.
// Header button press and underline movement stay untouched.
const patches=[
  ['dist/web/photobridge-r1126-desktop-navigation.js',
    "el.animate([{opacity:.35,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.25,.65,.35,1)'})",
    "el.animate([{opacity:.85},{opacity:1}],{duration:420,easing:'cubic-bezier(.25,.65,.35,1)'})"],
  ['dist/web/photobridge-r1163-desktop-gallery-header.js',
    "content?.animate?.([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'})",
    "content?.animate?.([{opacity:.85},{opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'})"],
  ['dist/web/photobridge-r1147-lab-admin-header.js',
    "panel?.animate?.([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'})",
    "panel?.animate?.([{opacity:.85},{opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'})"],
  ['dist/web/photobridge-r1147-lab-admin-header.js',
    "document.querySelector('.labRolePageScrollArea')?.animate([{opacity:.7,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'})",
    "document.querySelector('.labRolePageScrollArea')?.animate([{opacity:.85},{opacity:1}],{duration:180,easing:'ease-out'})"]
];
for(const [path,before,after] of patches){
 const source=fs.readFileSync(path,'utf8');
 const occurrences=source.split(before).length-1;
 if(occurrences===1)fs.writeFileSync(path,source.replace(before,after));
 else if(!source.includes(after))throw Error('[R1187] missing or ambiguous panel motion in '+path);
}

// Bust cached copies, retaining the existing release prefix for legacy checks.
const scripts=[
 'photobridge-r1126-desktop-navigation',
 'photobridge-r1163-desktop-gallery-header',
 'photobridge-r1147-lab-admin-header'
];
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(path,'utf8');
 for(const name of scripts){
  const rx=new RegExp('('+name+'\\.js\\?v=[^"\\s&]+)(?:&motion=r1187)?(?=")','g');
  const count=[...html.matchAll(rx)].length;
  if(path==='dist/web/index.html'&&count!==1)throw Error('[R1187] expected one '+name+' in index.html, got '+count);
  if(count>1)throw Error('[R1187] duplicate '+name+' in '+path);
  html=html.replace(rx,'$1&motion=r1187');
 }
 fs.writeFileSync(path,html);
}
for(const path of [...new Set(patches.map(row=>row[0]))])execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1187-photo-tab-jitter.cjs'],{stdio:'inherit'});
