import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1192: R1190 already makes the React laboratory queue instant on ALL
// clients. Preserve it, stop residual mobile queue CSS transitions and
// remove the Store controller's synchronous forced layout on tab switches.
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const react=fs.readFileSync(bundle,'utf8');
const start=react.indexOf('const ee=(le,nt,xt)=>');
const end=start<0?-1:react.indexOf(',Q=async(le,nt=!1)=>',start);
if(start<0||end<start)throw Error('[R1192] React lab queue switch missing');
const current=react.slice(start,end);
if(!current.includes('xt();R({direction:"forward",phase:"idle"')||current.includes('340')||current.includes('560'))
 throw Error('[R1192] unexpected legacy 900ms mobile tab wait');
if(!react.includes('let le=Math.min(Be.length,24);Ge(le)'))
 throw Error('[R1192] immediate lab photo-card batches missing');

const motion='dist/web/photobridge-v904r100f27-header-calendar-motion.js';
let js=fs.readFileSync(motion,'utf8');
const from=js.indexOf('  function restartPanelAnimation(panel){');
const to=from<0?-1:js.indexOf('  function init(){',from);
const replacement=[
 '  // R1192 mobile tab reflow removed: no forced offsetWidth or double RAF.',
 '  function enhanceTabs(){',
 "    const root=$('#storePhotographerWorkspace');if(!root||root.__pbf27Motion)return Boolean(root);",
 '    root.__pbf27Motion=true;',
 '    return true;',
 '  }',
 ''
].join('\n');
if(from>=0&&to>from)js=js.slice(0,from)+replacement+js.slice(to);
else if(!js.includes('R1192 mobile tab reflow removed'))throw Error('[R1192] Store motion hook missing');
fs.writeFileSync(motion,js);

const cssPath='dist/web/photobridge-r1192-mobile-pwa-tab-stability.css';
if(!fs.readFileSync(cssPath,'utf8').includes('.labOrderScrollArea.queuePageTurn'))
 throw Error('[R1192] stable mobile CSS missing');
const tag='<link rel="stylesheet" href="/photobridge-r1192-mobile-pwa-tab-stability.css?v=r1192">';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(path,'utf8');
 if(!html.includes(tag)){
  if(html.includes('photobridge-r1192-mobile-pwa-tab-stability.css'))throw Error('[R1192] stale CSS URL');
  if(!html.includes('</body>'))throw Error('[R1192] closing body missing in '+path);
  html=html.replace('</body>',tag+'\n</body>');
 }
 if(path==='dist/api/equipment-rental-book.html'){
  const re=/photobridge-v904r100f27-header-calendar-motion\.js\?v=[^"']+/g;
  if([...html.matchAll(re)].length!==1)throw Error('[R1192] Store panel controller expected once');
  html=html.replace(re,value=>value.includes('&touch=r1192')?value:value+'&touch=r1192');
 }
 if(path==='dist/web/index.html'){
  const re=/index-UIRefine-v655-r84\.js\?v=[^"']+/g;
  if([...html.matchAll(re)].length!==1)throw Error('[R1192] React script expected once');
  html=html.replace(re,value=>value.includes('&touch=r1192')?value:value+'&touch=r1192');
 }
 fs.writeFileSync(path,html);
}
execFileSync(process.execPath,['--check',motion],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1192-mobile-pwa-tabs.cjs'],{stdio:'inherit'});
