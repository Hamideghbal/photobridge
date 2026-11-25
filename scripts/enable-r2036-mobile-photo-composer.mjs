/* R2036: mobile photographer photo composer only. Leave native/desktop bytes alone. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R2036] '+label+' anchor count '+n);return s.replace(a,b)};
const guard=read('scripts/r2036-mobile-photo-guard.js.txt');
const actions=read('scripts/r2036-mobile-photo-actions.js.txt');
const root='dist/web/';
const changed=[];
function patch(name,fn){
 const p=root+name;let s=read(p);
 if(!s.includes('/* PB2036 photo-only ownership */')){
  s=once(s,"'use strict';","'use strict';\n"+guard,'mobile scope '+name);
  s=fn(s);
  new Function(s);
  write(p,s);
 }
 changed.push(name);
}
patch('photobridge-ui-fixes-v765.js',s=>{
 // v765 was recreating the hidden plus and writing scroll geometry each
 // time F41 removed it. Keep overview plus, album and desktop logic intact.
 s=once(s,'function ensureModeActions(w){','function ensureModeActions(w){\n    if(pb2036MobilePhoto(w)){if(!w.classList.contains("pb765Composing"))w.classList.add("pb765Composing");document.getElementById("pb765-add")?.remove();return null;}', 'disable legacy composer action writer');
 s=once(s,'function syncGeometry(w){','function syncGeometry(w){\n    if(pb2036MobilePhoto(w))return;', 'one geometry owner');
 s=once(s,'function resetScrollGeometry(w){','function resetScrollGeometry(w){\n    if(pb2036MobilePhoto(w))return;', 'no reset in active composer');
 return s;
});
patch('photobridge-ui-fixes-v768.js',s=>once(s,'function animateEntry(w){','function animateEntry(w){\n    if(pb2036MobilePhoto(w)){wasComposing=composing(w);entryDueUntil=0;return;}', 'no photo entry translation'));
patch('photobridge-v786-route-stability.js',s=>once(s,'if(force||leftPrint||(routeChanged&&!isPrint))cleanupPrintLeak();','if((force||leftPrint||(routeChanged&&!isPrint))&&!pb2036MobilePhoto(main))cleanupPrintLeak();','no cleanup of active composer on history writes'));
patch('photobridge-v807-mobile-scroll-store-fix.js',s=>once(s,
 "    const root=document.documentElement,x=print();\n",
 "    const root=document.documentElement,x=print();\n    if(pb2036MobilePhoto(x)){for(const cls of ['pb807PrintNormal','pb807PrintFinance'])if(root.classList.contains(cls))root.classList.remove(cls);if(!root.classList.contains('pb807PrintComposer'))root.classList.add('pb807PrintComposer');return;}\n",
 'stop competing hidden-state writes'));
patch('photobridge-v818-print-finance-composer-fix.js',s=>once(s,'function ensureComposerActions(w){','function ensureComposerActions(w){\n    if(pb2036MobilePhoto(w))return;', 'F41 alone owns composer controls'));
patch('photobridge-v904r100f41-header-date-name-fit.js',s=>{
 s=once(s,'  function ensureComposerActions(){',actions+'\n  function ensureComposerActions(){','install native action proxies');
 const anchor='    const comp=orderComposer();r.hidden=!comp;if(comp){';
 s=once(s,anchor,'    const photoWorkspace=$(".photographerMain.photographerPrintWorkspace");\n    if(pb2036MobilePhoto(photoWorkspace)){pb2036SyncPhoto(r,photoWorkspace);pb2036WatchPhoto(r,photoWorkspace);return;}\n    pb2036StopPhoto();\n'+anchor,'replace photo composer send row');
 s=once(s,"    document.body.classList.remove('pbF37PrintMode','pbF37PrintComposer');", "    pb2036StopPhoto();\n    document.body.classList.remove('pbF37PrintMode','pbF37PrintComposer');",'clean on exit');
 return s;
});
const cssName='photobridge-r2036-mobile-photo-composer.css';
write(root+cssName,read('scripts/r2036-mobile-photo-composer.css'));
const htmlPath=root+'index.html';let html=read(htmlPath);
if(!html.includes(cssName))html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r2036">\n</head>','web stylesheet');
for(const name of changed){
 const pattern=new RegExp(name.replaceAll('.','\\.')+'\\?[^"\'<>\\s]*','g');
 const hits=[...html.matchAll(pattern)];
 if(hits.length!==1)throw Error('[R2036] web asset URL '+name+' count '+hits.length);
 html=html.replace(pattern,url=>url.includes('mobilePhoto=r2036')?url:url+'&mobilePhoto=r2036');
}
write(htmlPath,html);
for(const name of changed)execFileSync(process.execPath,['--check',root+name],{stdio:'inherit'});
console.log('[R2036] mobile photo composer: one scroll owner, real Send and no-print product actions; desktop snapshots untouched');
