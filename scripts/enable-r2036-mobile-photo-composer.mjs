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
 s=once(s,'raf=0;const w=workspace();','raf=0;const w=pb2042PhotoWorkspace()||workspace();\\n    if(pb2036MobilePhoto(w)){ensureModeActions(w);return;}','R2042 stop all legacy list/composer reconciliation while photo intake is active');
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
// R2040: three old finance/guide observers were repeatedly rewriting the
// hidden native row. Do not let them trigger each other on the photo composer.
for(const name of ['photobridge-v815-print-finance-tabs.js','photobridge-v816-print-finance-unify.js','photobridge-v817-print-header-stability.js','photobridge-v818-print-finance-composer-fix.js']){
 patch(name,s=>{
  s=once(s,'function sync(){\n    raf=0;','function sync(){\n    raf=0;\n    if(pb2036MobilePhoto(document.querySelector(".photographerMain.photographerPrintWorkspace")))return;','R2040 suspend hidden native row observers');
  if(name.includes('v818'))s=once(s,'function ensureComposerActions(w){','function ensureComposerActions(w){\n    if(pb2036MobilePhoto(w))return;', 'F41 alone owns composer controls');
  return s;
 });
}
patch('photobridge-ui-fixes-v749.js',s=>once(s,'function syncPrintLayout(){','function syncPrintLayout(){\n  if(pb2036MobilePhoto(document.querySelector(".photographerMain.photographerPrintWorkspace")))return;','R2040 skip legacy measured photo geometry'));
patch('photobridge-v904r100f41-header-date-name-fit.js',s=>{
 s=once(s,'  function ensureComposerActions(){',actions+'\n  function ensureComposerActions(){','install native action proxies');
 s=once(s,'function printAction(index){const w=', 'function printAction(index){const current=pb2042PhotoWorkspace()||$(".photographerMain.photographerPrintWorkspace");if(pb2036MobilePhoto(current))return pb2040PhotoAction(current,index);const w=', 'R2040 real photo actions after lab switch');
 s=once(s,'const crm=crmPane();if(crm)return crm;','const crm=crmPane();if(crm)return crm;\\n    if(pb2042PhotoWorkspace())return "print";','R2042 real composer before stale chooser or pending mode');
 s=once(s,"function printComposer(){const w=$('.photographerMain.photographerPrintWorkspace');","function printComposer(){const w=pb2042PhotoWorkspace()||$('.photographerMain.photographerPrintWorkspace');",'R2042 mounted composer fallback');
 s=once(s,"const w=$('.photographerMain.photographerPrintWorkspace');if(!w)return;","const w=pb2042PhotoWorkspace()||$('.photographerMain.photographerPrintWorkspace');if(!w)return;\\n    if(pb2036MobilePhoto(w)&&!w.classList.contains('photographerPrintWorkspace'))w.classList.add('photographerPrintWorkspace');",'R2042 recover actual print scope after route cleanup');
 s=once(s,"let r=$('#pbF37PrintComposerActions');if(!r){","let r=$('#pbF37PrintComposerActions');if(pb2042PhotoWorkspace()&&r&&(!r.querySelector('.pbF37Choose')||!r.querySelector('.pbF37Send'))){r.remove();r=null;}if(!r){",'R2042 recover incomplete legacy row');
 s=once(s,'    void loadMe();render();','    void loadMe();render();pb2040WatchLifecycle();','R2040 stable body lifecycle observer');

 const anchor='    const comp=orderComposer();r.hidden=!comp;if(comp){';
 s=once(s,anchor,'    const photoWorkspace=pb2042PhotoWorkspace()||$(".photographerMain.photographerPrintWorkspace");\n    if(pb2036MobilePhoto(photoWorkspace)){pb2036SyncPhoto(r,photoWorkspace);pb2036WatchPhoto(r,photoWorkspace);return;}\n    pb2036StopPhoto();\n'+anchor,'replace photo composer send row');
 s=once(s,"    document.body.classList.remove('pbF37PrintMode','pbF37PrintComposer');", "    pb2036StopPhoto();\n    document.body.classList.remove('pbF37PrintMode','pbF37PrintComposer');",'clean on exit');
 return s;
});
const cssName='photobridge-r2036-mobile-photo-composer.css';
write(root+cssName,read('scripts/r2036-mobile-photo-composer.css'));
const htmlPath=root+'index.html';let html=read(htmlPath);
if(!html.includes(cssName))html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r2036&mobileLifecycle=r2040&mobileReentry=r2042">\n</head>','web stylesheet');
for(const name of changed){
 const pattern=new RegExp(name.replaceAll('.','\\.')+'\\?[^"\'<>\\s]*','g');
 const hits=[...html.matchAll(pattern)];
 if(hits.length!==1)throw Error('[R2036] web asset URL '+name+' count '+hits.length);
 html=html.replace(pattern,url=>{if(!url.includes('mobilePhoto=r2036'))url+='&mobilePhoto=r2036';if(!url.includes('mobileLifecycle=r2040'))url+='&mobileLifecycle=r2040';return url.includes('mobileReentry=r2042')?url:url+'&mobileReentry=r2042'});
}
write(htmlPath,html);
for(const name of changed)execFileSync(process.execPath,['--check',root+name],{stdio:'inherit'});
console.log('[R2036] mobile photo composer: one scroll owner, real Send and no-print product actions; desktop snapshots untouched');
