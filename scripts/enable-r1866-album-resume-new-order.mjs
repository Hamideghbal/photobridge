// R1866: preserve verified album pages on resume, separate a cleared draft
// from a new order, and use the single action beside the price summary.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const asset='assets/index-UIRefine-v655-r84.js';
function once(source,oldText,newText,label){
 const count=source.split(oldText).length-1;
 if(count!==1)throw Error('[R1866] '+label+' expected one match, saw '+count);
 return source.replace(oldText,newText);
}
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let source=fs.readFileSync(file,'utf8');
 const start=source.indexOf('function Kv('),end=source.indexOf('function ',start+12);
 if(start<0||end<=start)throw Error('[R1866] album editor missing');
 let kv=source.slice(start,end);
 // Until the server verifies a recovered file, no persisted local percentage
 // is proof of a complete object. This is also important after cancelled PUTs.
 kv=once(kv,'ce.current=pn,pt(pn),Ze(',
  'ce.current=pn.map(row=>({...row,progress:0})),pt(ce.current),Ze(',root+' unverified restored progress');
 // The UI refresh is read-only: do not discard any pending server upload simply
 // because the user reopened the editor. On retry, pending uploads may be reset.
 kv=once(kv,'Bt=async($e,gt)=>{try{',
  'Bt=async($e,gt,pb1866InspectOnly=!1)=>{try{',root+' inspection parameter');
 kv=once(kv,'for(const Yt of Kt)await Me(',
  'for(const Yt of Kt)pb1866InspectOnly||await Me(',root+' no remote mutation on restore');
 kv=once(kv,
  '(jn=gt.order)!=null&&jn.id&&(Re("error"),pe("ارسال نیمه‌کاره بازیابی شد؛ فایل‌های کامل حفظ شده‌اند. بعد از وصل‌شدن اینترنت «ادامه ارسال» را بزن."))',
  '(jn=gt.order)!=null&&jn.id&&(Re("error"),pe("ارسال نیمه‌کاره بازیابی شد؛ وضعیت فایل‌ها از سرور بررسی می‌شود."),void Bt(String(jn.id),pn,!0).catch(()=>pe("ارتباط با سرور برقرار نشد؛ برای بررسی و ادامه از دکمه پایین استفاده کنید.")))',
  root+' verify recovered files without resending');
 // A newly chosen page must not steal an old active row merely because its
 // name/size match a prior removed page. Older cached drafts retain the
 // compatibility fallback; new selections require their own upload file ID.
 kv=once(kv,
  'paperOverride:Nt||"luster",progress:0};return Bu(',
  'paperOverride:Nt||"luster",progress:0,pb1866New:!0};return Bu(',
  root+' mark new file');
 kv=once(kv,
  'if(!In||pn.has(In)||String(($n==null?void 0:$n.original_name)||"")!==sn',
  'if((Yt.pb1866New&&!Yt.serverFileId)||(Yt.serverFileId&&In!==String(Yt.serverFileId))||!In||pn.has(In)||String(($n==null?void 0:$n.original_name)||"")!==sn',
  root+' match by real file ID when available');
 // Save the presigned file ID BEFORE the PUT. If the browser closes after the
 // server completes the file but before the UI stores 100%, recovery can still
 // find the exact active row without uploading a duplicate.
 kv=once(kv,
  'st.current=String(An.fileId||""),await rs(',
  'st.current=String(An.fileId||""),ce.current=ce.current.map(fn=>fn.id===Yn.id?{...fn,serverFileId:String(An.fileId),progress:1}:fn),pt(ce.current),await P(!1,ce.current).catch(()=>{}),await rs(',
  root+' persist assigned upload ID');
 // Browser PUT progress can reach 100 before /uploads/complete verifies the
 // object. Hold UI transfer progress below 100 until the server accepts it.
 kv=once(kv,
  'Ba.id===Yn.id?{...Ba,progress:fn}:Ba',
  'Ba.id===Yn.id?{...Ba,progress:Math.min(99,fn)}:Ba',
  root+' never label unverified PUT as complete');
 // A cancelled partial page must not look uploaded; preserve only completed
 // rows, and persist this truthful state for the next page load.
 kv=once(kv,
  'pb1865Cancel=()=>{if(!je)return;dt.current+=1;try{qe.current?.abort()}catch{};qe.current=null;d(!1);Re("error");pe("ارسال متوقف شد. برگه‌های تأییدشده حفظ شدند؛ برای ادامه «ادامه ارسال» را بزن.");}',
  'pb1865Cancel=()=>{if(!je)return;dt.current+=1;try{qe.current?.abort()}catch{};qe.current=null;ce.current=ce.current.map(fn=>fn.serverFileId&&Number(fn.progress||0)>=100?{...fn,progress:100}:{...fn,progress:0});pt(ce.current);void P(!1,ce.current).catch(()=>{});d(!1);Re("error");pe("ارسال متوقف شد؛ فایل‌های تأییدشده حفظ شدند. از دکمه پایین ادامه دهید.");}',
  root+' cancel state');
 // Clearing the very last page is a new-order boundary. Keep the old order
 // on the server untouched for support, but never reuse its stale ID.
 const reset='he.current=null,Re("idle"),pe(""),A(0),Pt.current=!1,Tu(Xe)';
 kv=once(kv,
  'gt.length?P(!1,gt).catch(()=>{}):(Pt.current=!1,Tu(Xe))',
  'gt.length?P(!1,gt).catch(()=>{}):('+reset+')',
  root+' last page removal');
 kv=once(kv,
  '$e.length?P(!1,$e).catch(()=>{}):(Pt.current=!1,Tu(Xe))',
  '$e.length?P(!1,$e).catch(()=>{}):('+reset+')',
  root+' bulk removal');
 // Convert-to-JPEG changes the file name and byte count. The recovered local
 // Blob MUST match the uploaded Blob, or a valid server file will be missed.
 kv=once(kv,
  'Yn=ta[In],ce.current=ta,pt(ta)),ce.current=ce.current.map',
  'Yn=ta[In],ce.current=ta,pt(ta),await PB1866CacheConvertedFile(Xe,Yn)),ce.current=ce.current.map',
  root+' cache actual converted bytes');
 // A local 100% progress value alone never declares a page sent.
 kv=once(kv,
  'Number($e.progress||0)>=100?"success":je&&Number($e.progress||0)>0?"sending":"waiting"',
  'Number($e.progress||0)>=100&&$e.serverFileId?"success":je&&Number($e.progress||0)>0?"sending":"waiting"',
  root+' verified green status');
 kv=once(kv,
  'Number($e.progress||0)>=100?"✓ ارسال شد و تأیید شد":je&&Number($e.progress||0)>0?',
  'Number($e.progress||0)>=100&&$e.serverFileId?"✓ ارسال شد و تأیید شد":je&&Number($e.progress||0)>0?',
  root+' verified status text');
 // Existing R1865 drafts that were already poisoned by removed pages need
 // an explicit escape hatch, without deleting their old server files.
 kv=once(kv,
  'pe("ارسال متوقف شد؛ فایل‌های تأییدشده حفظ شدند. از دکمه پایین ادامه دهید.");},xe=async()=>',
  'pe("ارسال متوقف شد؛ فایل‌های تأییدشده حفظ شدند. از دکمه پایین ادامه دهید.");},pb1866StartFresh=()=>{if(je)return;if(!window.confirm("سفارش جدید با فایل‌های فعلی ساخته شود؟ ارسال‌های قبلی این سفارش دوباره استفاده نمی‌شوند و فایل‌های سرور حذف نخواهند شد."))return;he.current=null;ce.current=ce.current.map(fn=>({...fn,progress:0,serverFileId:null,pb1866New:!0}));pt(ce.current);A(0);Re("idle");pe("");void P(!1,ce.current).catch(()=>{});},xe=async()=>',
  root+' explicit fresh order');
 kv=once(kv,
  'je&&e.jsx("button",{type:"button",className:"pb1865AlbumCancel",onClick:pb1865Cancel',
  'Y==="error"&&he.current&&e.jsx("button",{type:"button",className:"pb1866AlbumFresh",onClick:pb1866StartFresh,children:"شروع سفارش جدید"}),je&&e.jsx("button",{type:"button",className:"pb1865AlbumCancel",onClick:pb1865Cancel',
  root+' new order action next to price');
 // One sending/retrying action beside the price summary; keep status notice,
 // but remove its duplicate top-of-page button.
 kv=once(kv,
  'children:je?"در حال ارسال…":Q?"ثبت سایز آزاد و ارسال آلبوم":"ثبت و ارسال سفارش آلبوم"',
  'children:je?"در حال ارسال…":Y==="error"&&he.current?"ادامه ارسال":Q?"ثبت سایز آزاد و ارسال آلبوم":"ثبت و ارسال سفارش آلبوم"',
  root+' main action label');
 const helper=[
 'async function PB1866CacheConvertedFile(key,row){',
 ' if(!row?.id||!row.file)return;',
 ' const db=await dh();',
 ' await new Promise((resolve,reject)=>{',
 '  const tx=db.transaction(Ws,"readwrite");',
 '  tx.objectStore(Ws).put(row.file,key+":"+row.id);',
 '  tx.oncomplete=()=>resolve();',
 '  tx.onerror=()=>reject(tx.error);',
 '  tx.onabort=()=>reject(tx.error||new Error("album_file_cache_failed"));',
 ' });',
 '}'
].join('\n');
source=source.slice(0,start)+kv+source.slice(end)+'\n'+helper+'\n';
 fs.writeFileSync(file,source);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlFile=root+'/index.html';
 let html=fs.readFileSync(htmlFile,'utf8');
 html=once(html,'</head>','<meta name="pb-album-resume" content="r1866"></head>',root+' cache marker');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,match=>match.includes('&albumResume=r1866')?match:match+'&albumResume=r1866');
 fs.writeFileSync(htmlFile,html);
 const cssFile=root+'/photobridge-r1865-album-upload.css';
 fs.appendFileSync(cssFile,'\n.albumUploadResumeNotice button{display:none!important}\n.pb1866AlbumFresh{display:block;width:100%;margin:8px 0;padding:9px 12px;background:#f5f7fb;border:1px solid #cad4e0;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}\n');
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const name of [asset,'index.html','photobridge-r1865-album-upload.css']){
 const row=manifest.files.find(f=>f.name===name);
 if(!row)throw Error('[R1866] missing Windows asset '+name);
 row.sha256=hash(fs.readFileSync(native+'/'+name));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1866] verified album resume, cleared order isolation, bottom retry only');
