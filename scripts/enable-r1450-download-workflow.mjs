import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1450 verified download workflow */')){
 const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1450 anchor '+a.slice(0,120));ui=ui.replace(a,b)};
 const section=(a,b,body)=>{const start=ui.indexOf(a),end=ui.indexOf(b,start+a.length);if(start<0||end<0)throw Error('R1450 section '+a);ui=ui.slice(0,start)+body+ui.slice(end)};
 // Keep a single styled download action in the original workflow timeline.
 once('e.jsx("button",{type:"button",className:"pbActionButton compact pb1445RepairDownload",disabled:!!E||y.order.status==="cancelled",onClick:()=>Vn(y.order),children:E===y.order.id?"در حال بررسی و دریافت…":"بررسی و تکمیل دانلود"}),','');
 once('(le.downloaded_at||["downloaded","printing","reviewing","ready_print","printed","ready","completed"].includes(String(le.status||"")))&&e.jsx("button",{type:"button",className:"pb1445RepairDownload",disabled:!!E,onClick:()=>Vn(le),children:E===le.id?"در حال بررسی و دریافت…":"بررسی و تکمیل دانلود"}),','');
 once(',e.jsx("button",{disabled:E===le.id,onClick:()=>Vn(le),children:"ادامه دریافت"})','');
 section('async function Dg(','async function Zy(', 'async function Dg(t,a,s={}){return pb1450Download(t,a,s)}');
 section('Vn=async le=>',',un=async le=>',`Vn=async(le,options={})=>{
  if(E)return;
  C(le.id);F({orderId:le.id,phase:'checking',done:0,total:le.file_count||0,current:'در حال بررسی فایل‌های واقعی پوشه'});
  try{
   const detail=await Me('/api/lab/orders/'+le.id);
   const result=await Dg(detail,value=>F({orderId:le.id,...value}),options);
   let warning='';
   if(!detail.order.downloaded_at&&!['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(detail.order.status||''))){
    try{if(detail.order.mode==='album')await Me('/api/lab/orders/'+le.id+'/album-download-complete',{method:'POST',body:'{}'});else await It(le,'downloaded')}
    catch(error){warning='فایل‌ها کامل‌اند، اما ثبت مرحله دانلود در سرور انجام نشد؛ صفحه را تازه‌سازی و دوباره تلاش کنید.'}
   }
   B(value=>value+1);await ye();
   alert(warning||(result.alreadyComplete?'همه '+V(result.done)+' فایل سفارش در پوشه درست و کامل‌اند؛ دریافت دوباره لازم نبود.':V(result.done)+' فایل سفارش کامل دریافت و با فهرست سرور تطبیق داده شد.'));
  }catch(error){pb1450Notify(error);B(value=>value+1)}
  finally{C('');F(null)}
 }`);
 once('aa=async(le,nt)=>{if(!E){','aa=async(le,nt)=>{if(!E){if(nt==="download"||nt==="download_print")return Vn(le,{force:pb1450Retry(le,yc(le.id))});');
 once('la=(le,nt)=>o==="album"?','la=(le,nt)=>(nt==="download"||nt==="download_print")?pb1450CanDownload(le):o==="album"?');
 once('const Zt=rn(le,Jt.key),Bt=la(le,Jt.key)', 'const Zt=(Jt.key==="download"||Jt.key==="download_print")?rn(le,Jt.key)&&yc(le.id)?.localComplete!==false:rn(le,Jt.key),Bt=la(le,Jt.key)');
 once('rt=Jt.key==="download"&&qt?"ادامه دریافت":Jt.label','rt=(Jt.key==="download"||Jt.key==="download_print")?(E===le.id?(xt?.phase==="checking"||xt?.phase==="scanning"?"در حال بررسی…":"در حال دریافت…"):pb1450Retry(le,Mt)?"دانلود مجدد":Jt.label):Jt.label');
 once('disabled:!Bt||E===le.id,onClick:()=>aa(le,Jt.key)','disabled:!Bt||!!E,onClick:()=>aa(le,Jt.key)');
 once('qt=Mt&&!rn(le,"download")&&Number(Mt.total||0)>0&&Number(Mt.done||0)<Number(Mt.total||0)?Mt:null','qt=Mt&&Number(Mt.total||0)>0&&(Mt.localComplete===false||Number(Mt.done||0)<Number(Mt.total||0))?Mt:null');
 // These are the original stage handlers. Block them before invoice, status, or UI movement.
 once('It=async(le,nt,xt)=>{const Mt=await Me(', 'It=async(le,nt,xt)=>{if(nt==="printing"&&!await pb1450AllowStage(le)){B(value=>value+1);return{blocked:true}}const Mt=await Me(');
 once('gn=async le=>{if(!E){C(le.id);try{await It(le,"completed")','gn=async le=>{if(!E){C(le.id);try{if(!await pb1450AllowStage(le))return;await It(le,"completed")');
 once('un=async le=>{var Jt;const nt=le.invoice_required===!1;', 'un=async le=>{var Jt;if(!await pb1450AllowStage(le)){B(value=>value+1);return}const nt=le.invoice_required===!1;');
 once('Cn=async(le,nt)=>{var Jt;if(E)return;','Cn=async(le,nt)=>{var Jt;if(E)return;if(["printing","binding","ready","completed"].includes(nt)&&!await pb1450AllowStage(le)){B(value=>value+1);return}');
 once('if(le==="download_print")return nt>0?void 0:y.order.downloaded_at?Cn(y.order,"printing"):Vn(y.order);','if(le==="download_print")return Vn(y.order,{force:pb1450Retry(y.order,yc(y.order.id))});');
 once('options:R0,onChange:ja','options:R0.map(option=>option.value==="download_print"?{...option,label:pb1450Retry(y.order,yc(y.order.id))?"دانلود مجدد":"دانلود / چاپ"}:option),onChange:ja');
 once("if (error?.name !== 'NotFoundError') throw error;",'if (!pb1450Missing(error)) throw error;');
 // Native ENOENT used to be missed by zy(), then swallowed by Vn() for already-ready orders.
 section('X=async K=>{var fe,be;',',re=async(K,fe)=>',`X=async K=>{if(t!=='lab')return;f(K.order.id);S({done:0,total:K.files.length,current:''});try{const result=await Dg(K,value=>S(value),{force:true});alert(V(result.done)+' فایل سفارش دوباره دریافت و بررسی شد.')}catch(error){pb1450Notify(error)}finally{f('');S(null)}}`);
 ui+='\n/* PB1450 verified download workflow */\n'+fs.readFileSync('scripts/r1450-download-workflow.js','utf8');
 fs.writeFileSync(file,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/downloadRepair=r1445/g,'downloadRepair=r1450');
fs.writeFileSync('dist/web/index.html',html);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
