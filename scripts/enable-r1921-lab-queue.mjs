import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
// Run last: early Liara transforms require pristine list and animation anchors.
const uiPath='dist/web/assets/index-UIRefine-v655-r84.js';
const apiPath='dist/api/server.js';
const pageModule='dist/api/lab-order-queue-page.js';
if(!fs.existsSync(pageModule))throw Error('R1921 pagination module missing');
let ui=fs.readFileSync(uiPath,'utf8'),api=fs.readFileSync(apiPath,'utf8');
function once(from,to,label){
 const count=ui.split(from).length-1;
 if(count!==1)throw Error('R1921 '+label+' anchor mismatch: '+count);
 ui=ui.replace(from,to);
}
once(
 'function Uf({lab:t,liveVersion:a=0,search:s="",onSearch:r,modeFilter:o="print",routeRoot:l="orders",quickAccess:c,onQuickCustomize:m,onQuickNavigate:g}){var Ka,Aa,Ma,Wa,Fa,Ga;const[p,f]=x.useState([])',
 'function Uf({lab:t,liveVersion:a=0,search:s="",onSearch:r,modeFilter:o="print",routeRoot:l="orders",quickAccess:c,onQuickCustomize:m,onQuickNavigate:g}){var Ka,Aa,Ma,Wa,Fa,Ga;const[pb1921Page,pb1921SetPage]=x.useState(1),[pb1921Meta,pb1921SetMeta]=x.useState({counts:{flow:0,ready:0,completed:0},pages:1,total:0}),[pb1921Query,pb1921SetQuery]=x.useState(s),[pb1921Latest]=x.useState({id:0}),[p,f]=x.useState([])',
 'queue hooks');
const fetchStart=ui.indexOf('const ye=()=>Me("/api/lab/orders',ui.indexOf('function Uf('));
const suffix=';x.useEffect(()=>{ye()},[a]);';
const fetchEnd=fetchStart<0?-1:ui.indexOf(suffix,fetchStart);
if(fetchStart<0||fetchEnd<fetchStart||fetchEnd-fetchStart>900)throw Error('R1921 queue fetch not matched');
ui=ui.slice(0,fetchStart)+
 'const ye=()=>{const le=++pb1921Latest.id;return Me("/api/lab/orders?"+new URLSearchParams({tab:T,page:String(pb1921Page),mode:o,q:pb1921Query}).toString()).then(nt=>{if(le!==pb1921Latest.id)return;f(nt.orders||[]);pb1921SetMeta({counts:nt.counts||{flow:0,ready:0,completed:0},pages:nt.pages||1,total:nt.total||0});if(nt.page&&nt.page!==pb1921Page)pb1921SetPage(nt.page)})};x.useEffect(()=>{const le=window.setTimeout(()=>{pb1921SetPage(1);pb1921SetQuery(s)},260);return()=>window.clearTimeout(le)},[s]);x.useEffect(()=>{ye().catch(()=>{})},[a,T,pb1921Page,pb1921Query,o]);'
 +ui.slice(fetchEnd+suffix.length);
const geStart=ui.indexOf('ge={flow:p.filter(le=>Ye(le)==="flow").length,ready:p.filter',ui.indexOf('function Uf('));
const geEnd=geStart<0?-1:ui.indexOf(',bt=Be.map(le=>String(le.id))',geStart);
if(geStart<0||geEnd<geStart||geEnd-geStart>750)throw Error('R1921 client queue counts incompatible');
ui=ui.slice(0,geStart)+'ge=pb1921Meta.counts,Be=p'+ui.slice(geEnd);
once('const Nt=Be.slice(0,Le)','const Nt=Be','render ten results immediately');
once('Q=async(le,nt=!1)=>{if(le===T)return;const xt=window.scrollX','Q=async(le,nt=!1)=>{if(le===T)return;pb1921SetPage(1);const xt=window.scrollX','tab navigation');
once('Gt=async(le,nt)=>{const xt=nt==="ready"','Gt=async(le,nt)=>{pb1921SetPage(1);const xt=nt==="ready"','status navigation');
once('},T),Se&&e.jsx($f','},T),e.jsx(cg,{page:pb1921Page,pages:pb1921Meta.pages,total:pb1921Meta.total,pageSize:10,onPage:pb1921SetPage}),Se&&e.jsx($f','page buttons');
const delStart=ui.indexOf('ma=le=>!(le!=null&&le.downloaded_at)',ui.indexOf('function Uf('));
const delEnd=delStart<0?-1:ui.indexOf(',_a=async le=>',delStart);
if(delStart<0||delEnd<delStart||delEnd-delStart>2500)throw Error('R1921 legacy delete source incompatible');
const hide='ma=le=>!!(le&&le.id),si=async le=>{if(E||!le?.id||!confirm("سفارش #"+V(le.number)+" از صف کاری پنهان شود؟\\nفاکتور، پرداخت‌ها و فایل‌های سفارش حذف نخواهند شد."))return;C(le.id);try{await Me("/api/lab/orders/"+le.id+"/queue-hide",{method:"POST",body:"{}"});(h==null?void 0:h.id)===le.id&&(S(null),I(null));await ye();P("سفارش #"+V(le.number)+" از صف کاری خارج شد؛ سوابق مالی محفوظ است")}catch{alert("خارج کردن سفارش از صف انجام نشد؛ دوباره تلاش کن."),await ye().catch(()=>{})}finally{C("")}}';
ui=ui.slice(0,delStart)+hide+ui.slice(delEnd);
once('un=async le=>{var Jt;const nt=le.invoice_required===!1;C(le.id);let xt=null,Mt="",qt=!1;try{if(nt){',
'un=async le=>{var Jt;const nt=le.invoice_required===!1;C(le.id);let xt=null,Mt="",qt=!1;try{if(!nt&&le.downloaded_at&&le.invoice_id&&le.invoice_pdf_ready){await Me("/api/lab/orders/"+le.id,{method:"PATCH",body:JSON.stringify({status:"ready"})});await Gt(le,"ready");P("سفارش #"+V(le.number)+" آماده تحویل شد؛ فاکتور موجود است و بررسی پوشه لازم نیست");return}if(nt){','issued invoice path');
once('return nt==="download"?kn(le,["downloaded","printing","reviewing","ready_print","printed","ready","completed"]):nt==="print"?',
'return nt==="download"?(!!le.downloaded_at||kn(le,["downloaded","printing","reviewing","ready_print","printed","ready","completed"])):nt==="print"?','downloaded timestamp');
once(':nt==="download"?!rn(le,"download")&&["sent","received"].includes(le.status):nt==="print"?',
':nt==="download"?!le.downloaded_at&&!rn(le,"download")&&["sent","received"].includes(le.status):nt==="print"?','no old folder recheck');
// Preserve deep links for archived recovered orders beyond the first ten rows.
const rStart=ui.indexOf('const nt=p.find(xt=>String(xt.id)===String(le));nt&&',ui.indexOf('function Uf('));
if(rStart>=0){
 const rEnd=ui.indexOf('},[p.length]);',rStart);
 if(rEnd>rStart&&rEnd-rStart<420){
  const chunk=ui.slice(rStart,rEnd);
  ui=ui.slice(0,rStart)+chunk.replace('nt&&','nt?').replace(/\)$/,'):Me("/api/lab/orders/"+le).then(xt=>xt.order&&Tt(xt.order,!1)).catch(()=>{})')+ui.slice(rEnd);
 }
}
const imp="import {createGalleryMessaging} from './gallery-messaging.js';";
if(api.split(imp).length!==2)throw Error('R1921 main API imports incompatible');
api=api.replace(imp,imp+"\nimport {pageLabOrders,setQueueHidden} from './lab-order-queue-page.js';");
const apiList="        if (req.method === 'GET' && url.pathname === '/api/lab/orders') {";
if(api.split(apiList).length!==2)throw Error('R1921 lab orders GET not found');
const hideRoute=[
"        const pb1921Hide=url.pathname.match(/^\\/api\\/lab\\/orders\\/([0-9a-f-]{36})\\/queue-hide$/i);",
"        if(pb1921Hide&&(req.method==='POST'||req.method==='DELETE')){",
"            const hidden=req.method==='POST';",
"            const result=await setQueueHidden(pool,{labId,actorId:a.userId,orderId:pb1921Hide[1],hidden});",
"            if(result.ok)await audit(a.userId,labId,hidden?'order.queue_hide':'order.queue_restore','order',pb1921Hide[1],{hidden}).catch(()=>{});",
"            return sendJson(res,result.status,result);",
"        }",
""].join('\n');
api=api.replace(apiList,hideRoute+apiList+"\n            if(url.searchParams.has('tab'))return sendJson(res,200,await pageLabOrders(pool,labId,url));");
const indexPath='dist/web/index.html';let index=fs.readFileSync(indexPath,'utf8');
const asset=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
if([...index.matchAll(asset)].length!==1)throw Error('R1921 UI asset URL incompatible');
index=index.replace(asset,v=>v.includes('&queue=r1921')?v:v+'&queue=r1921');
fs.writeFileSync(uiPath,ui);
fs.writeFileSync(apiPath,api);
fs.writeFileSync(indexPath,index);
for(const file of [uiPath,apiPath,pageModule])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1921-lab-queue.mjs'],{stdio:'inherit'});
console.log('[R1921] Final 10-row queue paging, search, queue-only hide and post-download workflow checked');
