/* R1788: visible native tariffs, exact action labels and once-per-model controls. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,v)=>fs.writeFileSync(p,v);
const once=(source,oldText,newText,what)=>{
 const count=source.split(oldText).length-1;
 if(count!==1)throw Error('[R1788] '+what+' anchor count '+count);
 return source.replace(oldText,newText);
};
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const resources=['dist/web','dist/web/lab-desktop-ui'];
const bundle='assets/index-UIRefine-v655-r84.js';
const navName='photobridge-r1372-third-header.js';
const stylesheet='photobridge-r1788-tariff-actions.css';

const photoIcon='e.jsx("svg",{viewBox:"0 0 24 24",width:18,height:18,fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsxs("g",{children:[e.jsx("rect",{x:3,y:3,width:18,height:18,rx:3}),e.jsx("circle",{cx:8.5,cy:8.5,r:1.5}),e.jsx("path",{d:"m4 19 6-6 4 3 3-4 3 3"})]})})';

const pricingLabelOld="if(data.kind==='pricing')label=raw.includes('صحافی')?'صحافی جدید':raw.includes('چاپ')?'چاپ':raw.includes('جدید')?'سایز جدید':raw.includes('ذخیره')?(original.disabled?'در حال ذخیره…':'ذخیره'):raw;";
const pricingLabelNew="if(data.kind==='pricing')label=raw.includes('شاسی')&&raw.includes('جدید')?'شاسی جدید':raw.includes('قاب')&&raw.includes('جدید')?'قاب جدید':raw.includes('صحافی')&&raw.includes('جدید')?'صحافی جدید':raw.includes('جدید')?'سایز جدید':raw.includes('چاپ')?'چاپ':raw.includes('ذخیره')?(original.disabled?'در حال ذخیره…':'ذخیره'):raw;";

function updateUi(source,root){
 const t0=source.indexOf('function tw({data:t,onSaved:a,labName:s=""}){');
 const t1=source.indexOf('function Na(t)',t0);
 if(t0<0||t1<t0)throw Error('[R1788] '+root+' colleague tariff component missing');
 let tariff=source.slice(t0,t1);
 tariff=once(tariff,'["chassis","قیمت شاسی"]','["chassis",pb1539Label("chassis","قیمت شاسی")]','colleague legacy chassis label');
 tariff=once(tariff,'["frame","قیمت قاب"]','["frame",pb1539Label("frame","قیمت قاب")]','colleague legacy frame label');
 tariff=once(tariff,'(k==="album_binding_price"||k.startsWith("pb1539_"))','(k==="album_binding_price"||k==="chassis"||k==="frame"||k.startsWith("pb1539_"))','colleague desktop rename');
 tariff=once(tariff,'(C==="album_binding_price"||C.startsWith("pb1539_"))','(C==="album_binding_price"||C==="chassis"||C==="frame"||C.startsWith("pb1539_"))','colleague mobile rename');
 tariff=tariff.replaceAll('ویرایش نام صحافی','ویرایش نام مدل');
 if(tariff.includes('C.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===C.slice(7))?.kind==="frame"'))throw Error('[R1788] frame media controls repeated for each size '+root);
 source=source.slice(0,t0)+tariff+source.slice(t1);

 const w0=source.indexOf('function Qj('),w1=source.indexOf('function Zj(',w0);
 if(w0<0||w1<=w0)throw Error('[R1788] '+root+' walk-in tariff component missing');
 let walkin=source.slice(w0,w1);
 walkin=once(walkin,'const pb1777Models=',
   'const pb1788Rename=(id,old)=>pb1543CatalogDialog({title:"ویرایش نام مدل",initialValue:old,inputLabel:"نام مدل",submitLabel:"ذخیره نام",onSubmit:async name=>{if(name===old)return;await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({id,name})});await g()}}),pb1788Delete=(id,name)=>pb1543CatalogDialog({title:"حذف مدل",description:"مدل «"+name+"» حذف شود؟ تعرفه و فاکتورهای قبلی حفظ می‌شوند.",confirmation:true,submitLabel:"حذف مدل",onSubmit:async()=>{await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({id,active:false})});await g()}}),pb1777Models=',
   'walk-in catalog edit controls');
 walkin=once(walkin,
   'PB1437TariffFields().flatMap(field=>[field,...',
   'PB1437TariffFields().flatMap(field=>[[field[0],(field[0]==="chassis"||field[0]==="frame")?pb1777Catalog.types?.find(t=>t.id===field[0])?.name||field[1]:field[1]],...',
   'walk-in legacy names');

 const headStart=walkin.indexOf('pb1777Fields.map(([k,label])=>');
 const headEnd=headStart<0?-1:walkin.indexOf(']},k))',headStart);
 if(headStart<0||headEnd<0||headEnd-headStart>3500)throw Error('[R1788] '+root+' walk-in model header bounds');
 const oldHeader=walkin.slice(headStart,headEnd+6);
 if(!oldHeader.includes('pb1777FrameEditLaunch'))throw Error('[R1788] '+root+' frame editor not found');
 const header='pb1777Fields.map(([k,label])=>e.jsxs("b",{children:[e.jsx("span",{className:"pb1541TariffTitle",children:label}),e.jsxs("span",{className:"pb1541TariffActions",children:['
 + '(k==="chassis"||k==="frame"||k.startsWith("pb1539_"))&&e.jsx("button",{type:"button",className:"pb1539Rename",title:"ویرایش نام مدل","aria-label":"ویرایش نام "+label,onClick:()=>pb1788Rename(k.startsWith("pb1539_")?k.slice(7):k,label),children:"✎"}),'
 + '(k==="frame"||k.startsWith("pb1539_")&&pb1777Models.find(v=>v.id===k.slice(7))?.kind==="frame")&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",title:"عکس و رنگ","aria-label":"ویرایش عکس و رنگ قاب",onClick:()=>pb1777SetEdit((pb1777Catalog.types||[]).find(v=>v.id===(k==="frame"?"frame":k.slice(7)))),children:'+photoIcon+'}),'
 + 'k.startsWith("pb1539_")&&e.jsx("button",{type:"button",className:"pb1540BindingDelete",title:"حذف مدل","aria-label":"حذف "+label,onClick:()=>pb1788Delete(k.slice(7),label),children:"×"})'
 + ']})]},k))';
 walkin=once(walkin,oldHeader,header,'walk-in header controls');
 source=source.slice(0,w0)+walkin+source.slice(w1);
 return source;
}
for(const root of resources){
 const navFile=root+'/'+navName;
 let navigation=read(navFile);
 navigation=once(navigation,pricingLabelOld,pricingLabelNew,root+' exact action labels');
 write(navFile,navigation);
 const jsPath=root+'/'+bundle;
 let ui=updateUi(read(jsPath),root);
 write(jsPath,ui);
 execFileSync(process.execPath,['--check',jsPath],{stdio:'inherit'});
 let html=read(root+'/index.html');
 if(!html.includes(stylesheet))html=html.replace('</head>','<link rel="stylesheet" href="/'+stylesheet+'?v=r1788"></head>');
 html=html.replace(/((?:index-UIRefine-v655-r84|photobridge-r1372-third-header)\.js\?[^"']*)/g,u=>u.includes('&tariffPolish=r1788')?u:u+'&tariffPolish=r1788');
 write(root+'/index.html',html);
}
const nativeRoot=resources[1],nativeManifest=nativeRoot+'/manifest.json';
fs.copyFileSync(resources[0]+'/'+stylesheet,nativeRoot+'/'+stylesheet);
const manifest=JSON.parse(read(nativeManifest));
if(manifest.channel!=='lab'||manifest.protocol!==1)throw Error('[R1788] Windows manifest channel mismatch');
for(const name of [bundle,navName,stylesheet,'index.html']){
 const value=hash(fs.readFileSync(nativeRoot+'/'+name));
 const entry=manifest.files.find(f=>f.name===name);
 if(entry)entry.sha256=value;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:value});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(nativeManifest,JSON.stringify(manifest));
console.log('[R1788] web/native model columns, legacy name editing, exact buttons, one frame media icon per model');
