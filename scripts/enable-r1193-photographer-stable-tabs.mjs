import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1193 examines real browser entrypoints for all photographer tabs, beyond
// the lab and photographer Store covered in R1190/R1192.
function patchOnce(file,oldValue,newValue,label){
 let s=fs.readFileSync(file,'utf8');
 const occurrences=s.split(oldValue).length-1;
 if(occurrences===1){s=s.replace(oldValue,newValue);fs.writeFileSync(file,s);return}
 if(occurrences===0&&s.includes(newValue))return;
 throw Error('[R1193] '+label+' unexpected occurrence '+occurrences);
}
const core='dist/web/assets/index-UIRefine-v655-r84.js';
const original='!o&&!l&&typeof r.startViewTransition=="function"?r.startViewTransition(s):s()';
const fixed='!o&&!l&&!/^\\/(?:photographer|lab)(?:\\/|$)/.test(location.pathname)&&typeof r.startViewTransition=="function"?r.startViewTransition(s):s()';
patchOnce(core,original,fixed,'browser view transition in photographer and laboratory navigation');

const navigation='dist/web/photobridge-r1126-desktop-navigation.js';
patchOnce(navigation,
 "function reveal(el){if(!el||matchMedia('(prefers-reduced-motion:reduce)').matches)return;",
 "function reveal(el){if(!el||window.__PB_ALLOW_WHOLE_PAGE_MOTION__!==true||matchMedia('(prefers-reduced-motion:reduce)').matches)return;",
 'desktop main tab whole-pane opacity fade');

// Header button feedback remains but do not synchronously force a full page
// layout to restart the animation when switching the tab.
patchOnce(navigation,
 "el.style.setProperty('animation','none','important');void el.offsetWidth;\n   el.style.setProperty('animation','pb1134HeaderMove .26s cubic-bezier(.2,.8,.2,1)','important');",
 "/* R1193: no synchronous layout flush on photographer tab press */\n   el.animate?.([{transform:'translateY(2px) scale(.98)'},{transform:'translateY(0) scale(1)'}],{duration:180,easing:'ease-out'});",
 'photographer tab press forced layout');

const gallery='dist/web/photobridge-r1163-desktop-gallery-header.js';
patchOnce(gallery,
 "target.click();\n        if(animate){\n          // React commits",
 "target.click();\n        if(animate&&window.__PB_ALLOW_WHOLE_PAGE_MOTION__===true){\n          // React commits",
 'gallery manager full media panel flash');

// Keep old version tokens used by existing safeguards; insert before last
// legacy &motion=r1187 tag rather than replacing other release stamps.
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(path,'utf8');
 for(const name of ['photobridge-r1126-desktop-navigation','photobridge-r1163-desktop-gallery-header']){
  const rx=new RegExp('('+name+'\\.js\\?v=[^"\\s]*?)(?:&photographer=r1193)?(&motion=r1187")','g');
  const matches=[...html.matchAll(rx)];
  if(path==='dist/web/index.html'&&matches.length!==1)throw Error('[R1193] expected 1 '+name+' in site');
  if(matches.length>1)throw Error('[R1193] duplicate '+name+' in '+path);
  html=html.replace(rx,'$1&photographer=r1193$2');
 }
 if(path==='dist/web/index.html'){
  const re=/(index-UIRefine-v655-r84\.js\?v=[^"']+?)(?:&photographer=r1193)?(&touch=r1192")/g;
  if([...html.matchAll(re)].length!==1)throw Error('[R1193] React module cache key not found');
  html=html.replace(re,'$1&photographer=r1193$2');
  const cssTag='<link rel="stylesheet" href="/photobridge-r1193-photographer-stable-tabs.css?v=r1193">';
  if(!html.includes(cssTag)){
   if(!html.includes('</body>'))throw Error('[R1193] site body missing');
   html=html.replace('</body>',cssTag+'\n</body>');
  }
 }
 fs.writeFileSync(path,html);
}
const css='dist/web/photobridge-r1193-photographer-stable-tabs.css';
if(!fs.readFileSync(css,'utf8').includes('photographerRolePageScrollArea'))
 throw Error('[R1193] photographer CSS missing');
for(const file of [core,navigation,gallery])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1193-photographer-stable-tabs.cjs'],{stdio:'inherit'});
