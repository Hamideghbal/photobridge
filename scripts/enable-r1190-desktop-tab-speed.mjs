import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1190: fix the concrete 340+560ms wait left behind by the removed lab
// 3D queue animation, and stabilize browser Store content independently.
const appFile='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(appFile,'utf8');
const start=ui.indexOf('const ee=(le,nt,xt)=>new Promise(');
const end=start<0?-1:ui.indexOf(',Q=async(le,nt=!1)=>',start);
if(start>=0&&end>start){
 const old=ui.slice(start,end);
 for(const marker of ['window.setTimeout','560','340','phase:"out"','phase:"in"']){
  if(!old.includes(marker))throw Error('[R1190] unexpected lab queue transition: '+marker);
 }
 const replacement='const ee=(le,nt,xt)=>{if(ue.current!=null){window.clearTimeout(ue.current);ue.current=null}xt();R({direction:"forward",phase:"idle",nonce:Date.now()});return Promise.resolve()}';
 ui=ui.slice(0,start)+replacement+ui.slice(end);
}else if(!ui.includes('const ee=(le,nt,xt)=>{if(ue.current!=null)'))throw Error('[R1190] lab queue transition target not found');

const slow='x.useEffect(()=>{if(Ge(0),!Be.length)return;let le=0;const nt=window.setTimeout(()=>Ge(1),35),xt=window.setInterval(()=>{le+=1,Ge(Math.min(Be.length,le+1)),le+1>=Be.length&&window.clearInterval(xt)},105);return()=>{window.clearTimeout(nt),window.clearInterval(xt)}},[T,o,s,bt]);';
const fast='x.useEffect(()=>{if(!Be.length){Ge(0);return}let le=Math.min(Be.length,24);Ge(le);let nt=0;const xt=()=>{le=Math.min(Be.length,le+24);Ge(le);if(le<Be.length)nt=requestAnimationFrame(xt)};if(le<Be.length)nt=requestAnimationFrame(xt);return()=>{if(nt)cancelAnimationFrame(nt)}},[T,o,s,bt]);';
if(ui.includes(slow))ui=ui.replace(slow,fast);
else if(!ui.includes(fast))throw Error('[R1190] lab list batches no longer match source');
fs.writeFileSync(appFile,ui);

// Owner Store has a second Web Animations API per-content slide in the inline
// pb918SharedTabMotion helper. Its tab/button feedback remains unchanged.
const portal='dist/api/equipment-rental-portal.html';
let html=fs.readFileSync(portal,'utf8');
const anchor=html.indexOf('<script id="pb918SharedTabMotion">');
const reveal=html.indexOf(' function reveal(root){',anchor);
const tail=html.indexOf('\n const select=window.selectRentalTab;',reveal);
if(anchor<0||reveal<anchor||tail<reveal)throw Error('[R1190] Store content reveal not found');
const old=html.slice(reveal,tail);
if(old.includes("translate:'0 -4px'")&&old.includes('targets.slice(0,6)')){
 html=html.slice(0,reveal)+' function reveal(root){return /* PB1190 no whole-content motion */;}\n'+html.slice(tail);
}else if(!old.includes('PB1190 no whole-content motion'))throw Error('[R1190] unexpected Store reveal helper');
const cssTag='<link rel="stylesheet" href="/photobridge-r1190-desktop-tab-stability.css?v=r1190">';
const insertCSS=source=>source.includes(cssTag)?source:source.includes('photobridge-r1190-desktop-tab-stability.css')?(()=>{throw Error('[R1190] stale CSS tag')})():source.replace('</body>',cssTag+'\n</body>');
html=insertCSS(html);
fs.writeFileSync(portal,html);

// Photographer Store is an independent browser page; stabilize its panel
// without changing mobile or disabling the moving header indicator.
const book='dist/api/equipment-rental-book.html';
let bookHtml=fs.readFileSync(book,'utf8');
bookHtml=insertCSS(bookHtml);
fs.writeFileSync(book,bookHtml);

// Force the primary lab React bundle to refresh in browsers after publish.
const index='dist/web/index.html';
let root=fs.readFileSync(index,'utf8');
const rx=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
const matches=[...root.matchAll(rx)];
if(matches.length!==1)throw Error('[R1190] expected one production React module reference');
root=root.replace(rx,v=>v.includes('&speed=r1190')?v:v+'&speed=r1190');
fs.writeFileSync(index,root);

const cssPath='dist/web/photobridge-r1190-desktop-tab-stability.css';
if(!fs.readFileSync(cssPath,'utf8').includes('rentalAppReady'))throw Error('[R1190] desktop store stylesheet missing');
execFileSync(process.execPath,['--check',appFile],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1190-desktop-tab-speed.cjs'],{stdio:'inherit'});
