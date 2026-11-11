/* R1788: consistent chassis/frame catalog controls on site + installed Windows Lab.
   Preserves existing model IDs, stored rate columns and historical order invoices. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pb1777AddPricingUi} from './enable-r1777-chassis-frame-model-pricing.mjs';

const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const once=(s,a,b,label)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('[R1788] '+label+' anchor '+count);
 return s.replace(a,b);
};
const within=(s,from,to,fn,label)=>{
 const a=s.indexOf(from),b=a<0?-1:s.indexOf(to,a+from.length);
 if(a<0||b<=a)throw Error('[R1788] '+label+' bounds');
 return s.slice(0,a)+fn(s.slice(a,b))+s.slice(b);
};
const paletteIcon='e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":true,children:e.jsx("path",{d:"M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 1.7-3.9 1.6 1.6 0 0 1 1.2-2.7h2A4.1 4.1 0 0 0 22 10.5 9 9 0 0 0 12 3ZM7 11h.01M9.5 7.5h.01M14.5 7.5h.01M17 11h.01"})})';
const editIcon='e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":true,children:e.jsx("path",{d:"m15 4 5 5M4 20l4-1 12-12-4-4L4 15v5Z"})})';
const trashIcon='e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":true,children:e.jsx("path",{d:"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"})})';
function repairTariffs(src,label){
 src=within(src,'function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)',part=>{
  // Default chassis/frame columns are full catalog models, not anonymous fixed labels.
  part=once(part,'["chassis","قیمت شاسی"]','["chassis",pb1539Label("chassis","قیمت شاسی")]','legacy chassis header '+label);
  part=once(part,'["frame","قیمت قاب"]','["frame",pb1539Label("frame","قیمت قاب")]','legacy frame header '+label);
  part=once(part,'(k==="album_binding_price"||k.startsWith("pb1539_"))','(k==="album_binding_price"||k==="chassis"||k==="frame"||k.startsWith("pb1539_"))','desktop legacy rename '+label);
  part=once(part,'(C==="album_binding_price"||C.startsWith("pb1539_"))','(C==="album_binding_price"||C==="chassis"||C==="frame"||C.startsWith("pb1539_"))','compact legacy rename '+label);
  const oldPhoto='k.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===k.slice(7))?.kind==="frame"&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1539Types.find(t=>t.id===k.slice(7))),children:"عکس و رنگ"})';
  const newPhoto='(k==="frame"||k.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===k.slice(7))?.kind==="frame")&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch pb1788PaletteIcon",title:"عکس و رنگ قاب","aria-label":"عکس و رنگ "+E,onClick:()=>pb1777SetEdit(pb1539Types.find(t=>t.id===(k==="frame"?"frame":k.slice(7)))),children:'+paletteIcon+'})';
  part=once(part,oldPhoto,newPhoto,'single palette icon in catalog header '+label);
  // Before R1788 each size's compact price cell duplicated this action.
  const perSize='C.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===C.slice(7))?.kind==="frame"&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1539Types.find(t=>t.id===C.slice(7))),children:"عکس و رنگ"}),';
  part=once(part,perSize,'','remove repeated palette from size cells '+label);
  return part;
 },'lab tariff '+label);
 src=within(src,'function Qj(','function Zj(',part=>{
  // Keep the original fixed rate columns, but display their editable catalog names.
  part=once(part,'pb1777Fields=PB1437TariffFields().flatMap(field=>',
   'pb1777Fields=PB1437TariffFields().map(field=>["chassis","frame"].includes(field[0])?[field[0],(pb1777Catalog.types||[]).find(t=>t.id===field[0])?.name||field[1]]:field).flatMap(field=>',
   'walk-in legacy display names '+label);
  part=once(part,',p=(I,T,k)=>',
   ',pb1788Rename=(id,old)=>pb1543CatalogDialog({title:"ویرایش نام مدل",description:"نام جدید این مدل را وارد کنید.",inputLabel:"نام مدل",initialValue:old,submitLabel:"ذخیره نام",onSubmit:async name=>{if(name===old)return;await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({id,name})});await g()}}),pb1788Delete=(id,name)=>pb1543CatalogDialog({title:"حذف مدل",description:"مدل «"+name+"» از تعرفه‌های قابل انتخاب حذف شود؟ سفارش‌های قبلی حفظ می‌شوند.",confirmation:true,submitLabel:"حذف مدل",onSubmit:async()=>{await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({id,active:false})});await g()}}),p=(I,T,k)=>',
   'walk-in rename/remove actions '+label);
  const oldHeader='pb1777Fields.map(([k,label])=>e.jsxs("b",{children:[label,k.startsWith("pb1539_")&&pb1777Models.find(v=>v.id===k.slice(7))?.kind==="frame"&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1777Models.find(v=>v.id===k.slice(7))),children:"عکس و رنگ"})]},k))';
  const newHeader='pb1777Fields.map(([k,label])=>e.jsxs("b",{className:"pb1788WalkinHeader",children:[e.jsx("span",{className:"pb1541TariffTitle",title:label,children:label}),e.jsxs("span",{className:"pb1541TariffActions",children:[(["chassis","frame"].includes(k)||k.startsWith("pb1539_")&&pb1777Models.some(v=>v.id===k.slice(7)))&&e.jsx("button",{type:"button",className:"pb1539Rename",title:"ویرایش نام مدل","aria-label":"ویرایش نام "+label,onClick:()=>pb1788Rename(k.startsWith("pb1539_")?k.slice(7):k,label),children:'+editIcon+'}),(k==="frame"||k.startsWith("pb1539_")&&pb1777Models.find(v=>v.id===k.slice(7))?.kind==="frame")&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch pb1788PaletteIcon",title:"عکس و رنگ قاب","aria-label":"عکس و رنگ "+label,onClick:()=>pb1777SetEdit((pb1777Catalog.types||[]).find(v=>v.id===(k==="frame"?"frame":k.slice(7)))),children:'+paletteIcon+'}),k.startsWith("pb1539_")&&pb1777Models.some(v=>v.id===k.slice(7))&&e.jsx("button",{type:"button",className:"pb1540BindingDelete",title:"حذف مدل","aria-label":"حذف مدل "+label,onClick:()=>pb1788Delete(k.slice(7),label),children:'+trashIcon+'})]})]},k))';
  part=once(part,oldHeader,newHeader,'walk-in one header action group per model '+label);
  return part;
 },'walk-in tariff '+label);
 return src;
}
// The desktop third header clones actions and used to rename every "+ جدید" to "سایز جدید".
function correctNavigation(s,label){
 const old="raw.includes('جدید')?'سایز جدید'";
 const newer="raw.includes('قاب')?'قاب جدید':raw.includes('شاسی')?'شاسی جدید':raw.includes('جدید')?'سایز جدید'";
 return once(s,old,newer,'pricing action titles '+label);
}
const root='dist/web',bundle='assets/index-UIRefine-v655-r84.js';
const site=root+'/'+bundle,nav='photobridge-r1372-third-header.js';
let web=read(site);
if(!web.includes('pb1777Fields='))throw Error('[R1788] R1777 site catalog missing');
web=repairTariffs(web,'site');write(site,web);
const nativeRoot=root+'/lab-desktop-ui',nativeJs=nativeRoot+'/'+bundle;
let native=read(nativeJs);
if(!native.includes('pb1777Fields=')){
 native=pb1777AddPricingUi(native);
 if(!native.includes('function PB1777FrameModelEditor('))native+='\n'+read('scripts/r1777-frame-model-editor.js.txt');
}
native=repairTariffs(native,'Windows Lab');
write(nativeJs,native);
for(const folder of [root,nativeRoot]){
 const label=folder===root?'site':'Windows Lab';
 write(folder+'/'+nav,correctNavigation(read(folder+'/'+nav),label));
}
const cssName='photobridge-r1788-frame-tariff.css',sourceCss=root+'/'+cssName;
for(const file of ['photobridge-r1777-frame-color-picker.css',cssName]){
 fs.copyFileSync(root+'/'+file,nativeRoot+'/'+file);
}
const refresh=(folder)=>{
 let html=read(folder+'/index.html');
 if(!html.includes(cssName))html=html.replace('</head>','<link rel="stylesheet" href="/'+cssName+'?v=r1788"></head>');
 if(!html.includes('photobridge-r1777-frame-color-picker.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1777-frame-color-picker.css?v=r1788"></head>');
 html=html.replace(/((?:index-UIRefine-v655-r84|photobridge-r1372-third-header)\.js\?[^"']*)/g,v=>v.includes('&frameTariff=r1788')?v:v+'&frameTariff=r1788');
 write(folder+'/index.html',html);
};
refresh(root);refresh(nativeRoot);
execFileSync(process.execPath,['--check',site],{stdio:'inherit'});
execFileSync(process.execPath,['--check',nativeJs],{stdio:'inherit'});
execFileSync(process.execPath,['--check',root+'/'+nav],{stdio:'inherit'});
execFileSync(process.execPath,['--check',nativeRoot+'/'+nav],{stdio:'inherit'});
const manifestFile=nativeRoot+'/manifest.json',manifest=JSON.parse(read(manifestFile));
if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1788] invalid native manifest');
for(const name of [bundle,nav,'index.html','photobridge-r1777-frame-color-picker.css',cssName]){
 const entry=manifest.files.find(v=>v.name===name),digest=sha(nativeRoot+'/'+name);
 if(entry)entry.sha256=digest;
 else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:digest});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(manifest));
console.log('[R1788] site + native model tariffs, correct actions, editable legacy labels, single palette icon and verified native manifest');
