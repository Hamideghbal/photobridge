import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/assets/index-UIRefine-v655-r84.js';
let src=fs.readFileSync(path,'utf8');
function replaceOne(s,a,b,tag){const n=s.split(a).length-1;if(n!==1)throw Error('R1183 '+tag+': '+n);return s.replace(a,b);}
async function pb1183PreviewFile(fileId){
 const bearer=Sr();
 const res=await fetch('/api/lab/order-files/'+fileId+'/content?download=0',{credentials:'include',headers:bearer?{authorization:'Bearer '+bearer}:{}});
 if(!res.ok){const body=await res.json().catch(()=>({}));throw new Error(String(body.error||'http_'+res.status))}
 const photo=await res.blob();
 if(!photo.size)throw new Error('empty_image');
 return URL.createObjectURL(photo);
}
async function pb1183Ky(fileId){
 const bearer=Sr();
 const res=await fetch('/api/lab/order-files/'+fileId+'/content?download=1',{credentials:'include',headers:bearer?{authorization:'Bearer '+bearer}:{}});
 if(!res.ok){const body=await res.json().catch(()=>({}));throw new Error(String(body.error||'download_http_'+res.status))}
 const encoded=res.headers.get('x-pb-file-name')||'';
 let filename='';try{filename=decodeURIComponent(encoded)}catch{}
 res.pbDownloadName=filename;res.pbDownloadBytes=Number(res.headers.get('content-length')||0);
 res.pbFallbackOriginal=res.headers.get('x-pb-fallback-original')==='1';
 return res;
}
function pb1183Explain(error){
 const value=String(error||'');
 if(value==='file_storage_unavailable')return 'فایل در فضای ذخیره‌سازی فعلاً قابل دریافت نیست';
 if(value==='file_not_found')return 'فایل روی سرور پیدا نشد';
 if(value==='local_file_only')return 'این فایل فقط روی سیستم دانلود اصلی قرار دارد';
 if(value==='payment_required')return 'تا پرداخت انجام نشود دریافت مجاز نیست';
 if(value==='forbidden'||value==='http_403')return 'دسترسی به این عکس مجاز نیست';
 if(value==='empty_image')return 'فایل عکس خالی است';
 return 'بارگذاری عکس انجام نشد';
}
if(!src.includes('PB1183 authenticated image transport')){
 const kyStart=src.indexOf('async function Ky(t){'),kyEnd=src.indexOf('async function Qy(',kyStart);
 if(kyStart<0||kyEnd<0)throw Error('R1183 download function missing');
 src=src.slice(0,kyStart)+pb1183Ky.toString().replace(/^async function pb1183Ky/,'async function Ky')+src.slice(kyEnd);
 const start=src.indexOf('function qu({file:t,detail:a,onOpen:s})'),end=src.indexOf('function Xu({files:t,initialIndex:a,onClose:s,onEdit:r,detail:o})',start);
 if(start<0||end<0)throw Error('R1183 preview component changed');
 let qu=src.slice(start,end);
 qu=replaceOne(qu,'const[r,o]=x.useState(""),[c,m]=x.useState(!1),g=x.useRef(null);',
 'const[r,o]=x.useState(""),[c,m]=x.useState(!1),[err,setErr]=x.useState(""),[retry,setRetry]=x.useState(0),g=x.useRef(null);','error state');
 qu=replaceOne(qu,'return o(""),(async()=>{','return o(""),setErr(""),(async()=>{','reset error state');
 qu=replaceOne(qu,'if(t!=null&&t.local_only&&a&&ai())try{',
 'if(a&&ai()&&(t!=null&&t.local_only||a.order&&a.order.downloaded_at))try{','prefer local after download');
 const tick=String.fromCharCode(96),expr='$'+'{t.id}';
 const before='if(!(t!=null&&t.local_only))try{const h=await Me('+tick+'/api/lab/order-files/'+expr+'/preview'+tick+');p&&o(h.url||"")}catch{}';
 const after='if(!(t!=null&&t.local_only))try{const h=await pb1183PreviewFile(t.id);if(p){f=h;o(h)}else URL.revokeObjectURL(h)}catch(h){p&&setErr(String(h&&h.message||"preview_failed"))}';
 qu=replaceOne(qu,before,after,'token-free thumbnail loading');
 qu=replaceOne(qu,'l.id]),r?e.jsx("img"','l.id,retry]),r?e.jsx("img"','thumbnail retry dependency');
 qu=replaceOne(qu,'e.jsx("span",{ref:g,className:"labPreviewPlaceholder",children:"▧"})',
 'e.jsxs("div",{ref:g,className:"labPreviewPlaceholder pb1183PreviewMessage",children:[err?e.jsx("small",{children:pb1183Explain(err)}):"▧",err&&e.jsx("button",{type:"button",onClick:()=>setRetry(k=>k+1),children:"تلاش مجدد"})]})','visible thumbnail error');
 src=src.slice(0,start)+qu+src.slice(end);
 const boxStart=src.indexOf('function Xu({files:t,initialIndex:a,onClose:s,onEdit:r,detail:o})'),boxEnd=src.indexOf('function O0(t)',boxStart);
 if(boxStart<0||boxEnd<0)throw Error('R1183 lightbox function missing');
 let xu=src.slice(boxStart,boxEnd);
 const yexpr='$'+'{y.id}';
 const old='if(!(y!=null&&y.local_only))try{const C=await Me('+tick+'/api/lab/order-files/'+yexpr+'/preview'+tick+');k&&g(C.url||"")}catch{}';
 const updated='if(!(y!=null&&y.local_only))try{const C=await pb1183PreviewFile(y.id);if(k){E=C;g(C)}else URL.revokeObjectURL(C)}catch(e){console.warn("PB1183 preview error",y.id,String(e&&e.message||""))}';
 xu=replaceOne(xu,old,updated,'token-free lightbox loading');
 xu=replaceOne(xu,'if(y!=null&&y.local_only&&o&&ai())try{',
 'if(o&&ai()&&(y!=null&&y.local_only||o.order&&o.order.downloaded_at))try{','local lightbox fallback');
 src=src.slice(0,boxStart)+xu+src.slice(boxEnd);
 const helper='/* PB1183 authenticated image transport */\n'+pb1183PreviewFile.toString()+'\n'+pb1183Explain.toString()+'\n';
 src=replaceOne(src,'function qu({file:t,detail:a,onOpen:s})',helper+'function qu({file:t,detail:a,onOpen:s})','helper injection');
 fs.writeFileSync(path,src);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
