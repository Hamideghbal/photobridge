/* R1834: direct camera Store tab routing; no lab, server, frame or chassis changes. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
function replaceOnce(s,a,b,name){const n=s.split(a).length-1;if(n!==1)throw Error('[R1834] '+name+' count '+n);return s.replace(a,b)}
const navPath='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=read(navPath);
const helper=read('scripts/r1834-camera-store-routing.js.txt');
new Function('panels',helper+';return pb1834OpenCameraPanel');
nav=replaceOnce(nav,' function render(){',helper+'\n function render(){','live camera Store routing helper');
nav=replaceOnce(nav,
 "     copy.onclick=()=>{original.click();requestAnimationFrame(()=>{schedule();reveal(motionContent(doc));});};",
 "     if(cameraStore&&original.dataset.storePanel){\n"+
 "      const panelId=original.dataset.storePanel;\n"+
 "      copy.dataset.storePanel=panelId;\n"+
 "      copy.onclick=()=>{if(pb1834OpenCameraPanel(panelId,doc))requestAnimationFrame(()=>{schedule();reveal(motionContent(panels.get('store')?.querySelector('iframe')?.contentDocument||doc));});};\n"+
 "     }else copy.onclick=()=>{original.click();requestAnimationFrame(()=>{schedule();reveal(motionContent(doc));});};",
 'live camera Store tab action');
// Explicit Store navigation opens selection; refresh persistence is handled by R1835.
if(!nav.includes("const cameraStoreControls=cameraStore?visible:[]")||
 !nav.includes("for(const original of (active==='store'||storeHeader)?[]:visible)"))
 throw Error('[R1834] expected R1831/R1833 Store isolation missing');
new Function(nav);write(navPath,nav);
const cssPath='dist/web/photobridge-r1126-desktop-navigation.css';
let css=read(cssPath);
if(css.includes('/* R1834: camera Store tabs'))throw Error('[R1834] already applied');
write(cssPath,css+'\n'+read('scripts/r1834-camera-store-routing.css'));
function mark(path,asset){
 let text=read(path),needle=asset+'?';
 const first=text.indexOf(needle),second=text.indexOf(needle,first+needle.length);
 if(first<0||second>=0)throw Error('[R1834] '+path+' '+asset+' references not unique');
 const quotedEnd=text.indexOf('"',first),singleEnd=text.indexOf("'",first);
 const end=singleEnd>=0&&singleEnd<quotedEnd?singleEnd:quotedEnd;
 if(end<first||text.slice(first,end).includes('r1834='))throw Error('[R1834] '+asset+' query invalid');
 text=text.slice(0,end)+'&r1834=1'+text.slice(end);
 write(path,text);
}
for(const page of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 mark(page,'photobridge-r1126-desktop-navigation.js');
 mark(page,'photobridge-r1126-desktop-navigation.css');
}
execFileSync(process.execPath,['--check',navPath],{stdio:'inherit'});
console.log('[R1834] camera Store tabs route to live iframe panels; selected Store stays open; print/lab controls remain isolated');
