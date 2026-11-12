
/* R1819: remove duplicate cover gallery and unused bulk album-page selection.
   Keep direct single-page removal, multi-upload and cover model selection working.
   Restore the flex trigger in the native custom album-size picker. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('[R1819] '+label+' expected one occurrence, got '+n);
 return s.replace(a,b);
};
const region=(s,start,end,patch,label)=>{
 const i=s.indexOf(start),j=i<0?-1:s.indexOf(end,i+start.length);
 if(i<0||j<=i)throw Error('[R1819] '+label+' bounds');
 return s.slice(0,i)+patch(s.slice(i,j))+s.slice(j);
};
const asset='assets/index-UIRefine-v655-r84.js';
const style='photobridge-r1819-album-cover-controls.css';
const colorTail='children:"برای این جنس و سایز رنگ قیمت‌گذاری‌شده‌ای وجود ندارد."})]})]}),';
const modelField='e.jsxs("label",{className:"pb1819CoverModelField",children:[e.jsx("span",{className:"pb1818CoverFieldLabel",children:"مدل جلد"}),e.jsx(wn,{value:String((At==null?void 0:At.id)||""),options:Ot.map(item=>({value:String(item.id),label:String(item.modelName||item.name||"مدل جلد")})),disabled:!Ot.length,placeholder:Ot.length?"انتخاب مدل جلد":"مدلی برای این رنگ وجود ندارد",onChange:id=>{Ma(String(id)),F(!0)}})]})';
const galleryOpen='e.jsxs("div",{className:"albumCoverOrderModels pb1818CoverModelBrowser",children:[';
const galleryClose='children:"برای رنگ انتخاب‌شده در این سایز هیچ مدل قیمت‌گذاری‌شده‌ای وجود ندارد."})]})';
const bulkStart='De.length>0&&e.jsx("button",{type:"button",className:"albumFileToolAction selectAll albumFileActionSelectAll ';
const bulkEnd='e.jsx("input",{ref:ve,type:"file"';
const cardSelect='e.jsx("button",{type:"button",className:"albumFileSelect "+(ot.has(String($e.id))?"selected":""),"aria-label":ot.has(String($e.id))?"لغو انتخاب":"انتخاب فایل","aria-pressed":ot.has(String($e.id)),onClick:()=>le(String($e.id)),children:ot.has(String($e.id))?"✓":""}),';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let src=read(file);
 src=region(src,'function Kv(','function ',kv=>{
  kv=once(kv,colorTail,'children:"برای این جنس و سایز رنگ قیمت‌گذاری‌شده‌ای وجود ندارد."})]}),'+modelField+']}),',root+' model dropdown beside material and color');
  const start=kv.indexOf(galleryOpen);
  const end=start<0?-1:kv.indexOf(galleryClose,start);
  if(start<0||end<=start||end-start>6000)throw Error('[R1819] '+root+' duplicate gallery boundaries');
  kv=kv.slice(0,start)+'null'+kv.slice(end+galleryClose.length);
  const bulkAt=kv.indexOf(bulkStart);
  const inputAt=bulkAt<0?-1:kv.indexOf(bulkEnd,bulkAt);
  if(bulkAt<0||inputAt<=bulkAt||inputAt-bulkAt>1400||
   !kv.slice(bulkAt,inputAt).endsWith(']})}),'))
   throw Error('[R1819] '+root+' bulk select/delete toolbar changed');
  kv=kv.slice(0,bulkAt)+']})}),'+kv.slice(inputAt);
  kv=once(kv,cardSelect,'',root+' remove per-page checkbox');
  kv=once(kv,'className:"albumFileCard albumFileQcCard "+$e.state+(ot.has(String($e.id))?" selected":"")',
   'className:"albumFileCard albumFileQcCard "+$e.state',root+' clear selection-only card decoration');
  if(!kv.includes('className:"pb1819CoverModelField"')||
     !kv.includes('className:"pb1818CoverPreviewImage"')||
     !kv.includes('className:"albumFileRemove"')||
     !kv.includes('className:"albumFilePaperSelect"')||
     !kv.includes('multiple:!0')||
     kv.includes('className:"albumCoverOrderModels pb1818CoverModelBrowser"')||
     kv.includes('className:"albumFileSelect ')||
     kv.includes('className:"albumFileActionSelectAll')||
     kv.includes('className:"albumFileActionDelete'))
   throw Error('[R1819] '+root+' cover / page workflow verification failed');
  return kv;
 },root+' album component');
 write(file,src);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlPath=root+'/index.html';
 let html=once(read(htmlPath),'</head>','<link rel="stylesheet" href="/'+style+'?v=r1819"></head>',root+' style include');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url+'&albumEditor=r1819');
 write(htmlPath,html);
}
fs.copyFileSync('dist/web/'+style,'dist/web/lab-desktop-ui/'+style);
const native='dist/web/lab-desktop-ui',manifestFile=native+'/manifest.json';
const manifest=JSON.parse(read(manifestFile));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const name of [asset,style,'index.html']){
 const sha256=hash(fs.readFileSync(native+'/'+name));
 const existing=manifest.files.find(x=>x.name===name);
 if(existing)existing.sha256=sha256;
 else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(manifest));
console.log('[R1819] fixed size arrow, model dropdown + single preview, album page single-remove only, web/native synced');
