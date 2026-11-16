// R1865: album upload cancellation, per-photo verified progress and safe
// reconciliation. Applied after R1819 and R1864, without changing print.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const asset='assets/index-UIRefine-v655-r84.js';
const once=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('[R1865] '+label+' expected one anchor; found '+n);
 return s.replace(a,b);
};
let server=fs.readFileSync('dist/api/server.js','utf8');
const endpoint=fs.readFileSync('scripts/r1865-album-reconcile-route.js.txt','utf8');
server=once(server,
 "        const customerOrder = url.pathname.match(/^\\/api\\/customer\\/orders\\/([0-9a-f-]+)$/);",
 endpoint+"        const customerOrder = url.pathname.match(/^\\/api\\/customer\\/orders\\/([0-9a-f-]+)$/);",
 'album-only reconciler');
fs.writeFileSync('dist/api/server.js',server);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
const statusClass='pb1865AlbumFileStatus';
const bt=String.fromCharCode(96);
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let source=fs.readFileSync(file,'utf8');
 const start=source.indexOf('function Kv('),end=source.indexOf('function ',start+12);
 if(start<0||end<=start)throw Error('[R1865] album editor missing '+root);
 let kv=source.slice(start,end);
 kv=once(kv,'Ga=$e=>{if(je||Y!=="idle")return;','Ga=$e=>{if(je)return;',root+' allow remove after error');
 kv=once(kv,'className:"albumFileRemove","aria-label":"حذف",disabled:je||Y!=="idle"',
   'className:"albumFileRemove","aria-label":"حذف",disabled:je',root+' enable removal');
 kv=once(kv,
  'Lt=Array.isArray(ht==null?void 0:ht.files)?ht.files:[],pn=new Set',
  "Lt=(Array.isArray(ht==null?void 0:ht.files)?ht.files:[]).filter(row=>['active','pending'].includes(String(row.original_state))).sort((a,b)=>Number(b.original_state==='active')-Number(a.original_state==='active')),pn=new Set",
  root+' recover active only, before pending');
 kv=once(kv,
   'String(Ln.original_state||"")==="active"?{...Yt,progress:100}:(String(Ln.original_state||"")==="pending"&&Kt.push(String(Ln.id)),Yt)):Yt',
   'String(Ln.original_state||"")==="active"?{...Yt,progress:100,serverFileId:String(Ln.id)}:(String(Ln.original_state||"")==="pending"&&Kt.push(String(Ln.id)),{...Yt,progress:0,serverFileId:null})):{...Yt,progress:0,serverFileId:null}',
   root+' require active server row for restored 100');
 kv=once(kv,'}catch{return gt}},xe=async()=>',
   '}catch(err){throw err}},pb1865Cancel=()=>{if(!je)return;dt.current+=1;try{qe.current?.abort()}catch{};qe.current=null;d(!1);Re("error");pe("ارسال متوقف شد. برگه‌های تأییدشده حفظ شدند؛ برای ادامه «ادامه ارسال» را بزن.");},xe=async()=>',
   root+' stop upload');
 const marker='albumData:{bindingTypeId:PB1864AlbumBindingId(l,pb1539Binding),sizeId:';
 const fieldStart=kv.indexOf(marker);
 const braceStart=fieldStart+'albumData:'.length,braceEnd=kv.indexOf('}',braceStart);
 if(fieldStart<0||braceEnd<=braceStart||braceEnd-braceStart>1100)
    throw Error('[R1865] frozen album metadata changed '+root);
 const meta=kv.slice(braceStart,braceEnd+1);
 if(!meta.includes('spreads:Qn')||!meta.includes('paperCounts:_t')||!meta.includes('extraIds:[...Le]'))
    throw Error('[R1865] album metadata must be complete '+root);
 kv=once(kv,'const gt=++dt.current,ht=new AbortController;',
   'const pb1865AlbumData=()=>('+meta+');const gt=++dt.current,ht=new AbortController;',
   root+' metadata factory');
 kv=once(kv,'albumData:'+meta,'albumData:pb1865AlbumData()',root+' initial draft');
 kv=once(kv,
   'ce.current=ce.current.map(fn=>fn.id===Yn.id?{...fn,progress:100}:fn),pt(ce.current)',
   'ce.current=ce.current.map(fn=>fn.id===Yn.id?{...fn,progress:100,serverFileId:String(An.fileId)}:fn),pt(ce.current)',
   root+' verified upload id');
 const submit='const $n=await Me('+bt+'/api/customer/orders/$'+'{sn.id}/submit'+bt+',{method:"POST"});';
 kv=once(kv,submit,fs.readFileSync('scripts/r1865-album-before-submit.js.txt','utf8')+submit,root+' safe submit');
 kv=once(kv,
   'Ln==="album_file_count_mismatch"?"تعداد فایل‌های سفارش با تعداد صفحات آلبوم هماهنگ نیست."',
   'Ln==="album_file_count_mismatch"?"تعداد برگه‌های آلبوم با فایل‌های تأییدشده هماهنگ نیست (انتظار: "+String(sn?.data?.expected??"؟")+"، موجود: "+String(sn?.data?.actual??"؟")+").":Ln==="album_stale_files_need_review"?"برگه‌های اضافه از ارسال قبلی بررسی نشدند؛ سفارش و فایل‌های موفق حفظ شده‌اند.":Ln==="album_reconcile_missing_uploads"||Ln==="album_server_file_id_missing"?"برخی برگه‌ها هنوز روی سرور تأیید نشده‌اند؛ آن‌ها را دوباره ارسال کنید."',
   root+' actionable mismatch');
 kv=once(kv,
   'e.jsx("button",{className:"primary",disabled:je,onClick:xe,children:je?',
   'je&&e.jsx("button",{type:"button",className:"pb1865AlbumCancel",onClick:pb1865Cancel,children:"لغو ارسال"}),e.jsx("button",{className:"primary",disabled:je,onClick:xe,children:je?',
   root+' cancellation button');
 kv=once(kv,
   'e.jsxs("label",{className:"albumFilePaperSelect",onClick:ht=>ht.stopPropagation()',
   'e.jsx("div",{className:"'+statusClass+' "+(Number($e.progress||0)>=100?"success":je&&Number($e.progress||0)>0?"sending":"waiting"),role:"status",children:Number($e.progress||0)>=100?"✓ ارسال شد و تأیید شد":je&&Number($e.progress||0)>0?"در حال ارسال · "+V(Math.round(Number($e.progress||0)))+"٪":"ارسال نشده"}),e.jsxs("label",{className:"albumFilePaperSelect",onClick:ht=>ht.stopPropagation()',
   root+' per-page status label');
 source=source.slice(0,start)+kv+source.slice(end);
 fs.writeFileSync(file,source);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlFile=root+'/index.html';
 let html=fs.readFileSync(htmlFile,'utf8');
 html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1865-album-upload.css?v=r1865"></head>',root+' style');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&albumUpload=r1865')?url:url+'&albumUpload=r1865');
 fs.writeFileSync(htmlFile,html);
 fs.copyFileSync('scripts/r1865-album-upload.css',root+'/photobridge-r1865-album-upload.css');
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of [asset,'index.html','photobridge-r1865-album-upload.css']){
 const entry=manifest.files.find(x=>x.name===name);
 if(entry)entry.sha256=hash(fs.readFileSync(native+'/'+name));
 else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:hash(fs.readFileSync(native+'/'+name))});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1865] album cancel, per-file state, draft refresh and consent-gated stale rows');
