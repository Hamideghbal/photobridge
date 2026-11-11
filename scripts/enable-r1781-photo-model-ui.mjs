/* R1781: final post-pricing photographer and public walk-in model choosers. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
if(ui.includes('/* PB1781 PHOTO MODEL CHOOSERS */'))throw Error('[R1781] already installed');
const patches=JSON.parse(fs.readFileSync('scripts/r1781-model-ui-patches.json','utf8'));
const ranges={ul:['function Ul(','function Tv('],ej:['function ej(','function vh('],sw:['function sw(','function rw(']};
for(const scope of ['ul','ej','sw']){
 const [from,to]=ranges[scope],start=ui.indexOf(from),end=ui.indexOf(to,start+from.length);
 if(start<0||end<0||end<=start)throw Error('[R1781] '+scope+' section bounds');
 let part=ui.slice(start,end);
 for(const patch of patches.filter(p=>p.scope===scope)){
  const count=part.split(patch.from).length-1;
  if(count!==1)throw Error('[R1781] '+patch.id+' anchor count '+count);
  part=part.replace(patch.from,patch.to);
 }
 ui=ui.slice(0,start)+part+ui.slice(end);
}
const noneLabel='Da={luster:"لاستر",silk:"سیلک",metallic:"متالیک"}';
if(ui.split(noneLabel).length!==2)throw Error('[R1781] site paper label missing');
ui=ui.replace(noneLabel,'Da={luster:"لاستر",silk:"سیلک",metallic:"متالیک",none:"بدون چاپ عکس"}');
ui+='\n/* PB1781 PHOTO MODEL CHOOSERS */\n'+fs.readFileSync('scripts/r1781-chassis-model-selector.js.txt','utf8');
fs.writeFileSync(file,ui);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
if(!html.includes('photobridge-r1781-model-order-ui.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1781-model-order-ui.css?v=r1781"></head>');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('modelOrder=r1781')?url:url+'&modelOrder=r1781');
fs.writeFileSync(htmlFile,html);
// The native Lab snapshot gets only the non-print item label; preserve all native
// workflow behavior and refresh the hot-update manifest integrity checks.
const nativeRoot='dist/web/lab-desktop-ui',nativePath=nativeRoot+'/assets/index-UIRefine-v655-r84.js';
let native=fs.readFileSync(nativePath,'utf8');
if(native.split(noneLabel).length!==2)throw Error('[R1781] native paper label missing');
native=native.replace(noneLabel,'Da={luster:"لاستر",silk:"سیلک",metallic:"متالیک",none:"بدون چاپ عکس"}');
fs.writeFileSync(nativePath,native);
execFileSync(process.execPath,['--check',nativePath],{stdio:'inherit'});
const manifestPath=nativeRoot+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const entry=manifest.files?.find(row=>row.name==='assets/index-UIRefine-v655-r84.js');
if(!entry)throw Error('[R1781] native manifest JS entry missing');
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
entry.sha256=digest(fs.readFileSync(nativePath));
manifest.build=digest(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1781] photographer/walk-in exact model selectors and no-paper orders installed; Windows Lab label and manifest updated.');
