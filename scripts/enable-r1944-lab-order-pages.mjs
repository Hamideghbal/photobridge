// R1944 — bounded read-only Lab pages; no migration, delete or finance changes.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const once=(s,before,after,label)=>{
 const n=s.split(before).length-1;
 if(n!==1)throw Error('[R1944] '+label+' source anchor count '+n);
 return s.replace(before,after);
};
const backend='dist/api/server.js';
let api=fs.readFileSync(backend,'utf8');
if(!api.includes('/* PB1944 ten-order server pages */')) {
 const old="        if (req.method === 'GET' && url.pathname === '/api/lab/orders') {";
 const route=[
 "        /* PB1944 ten-order server pages */",
 "        // Existing /api/lab/orders remains intact for legacy clients.",
 "        if (req.method === 'GET' && url.pathname === '/api/lab/orders' && url.searchParams.get('paged') === '1') {",
 "            const queue = (await import('./lab-order-pages-r1944.cjs')).default;",
 "            try { return sendJson(res, 200, await queue.listLabOrdersPage(pool,labId,url)); }",
 "            catch (error) { if(error.status===400)return sendJson(res,400,{error:error.message}); throw error; }",
 "        }"
 ].join('\n')+'\n'+old;
 api=once(api,old,route,'opt-in backend route');
 fs.writeFileSync(backend,api);
}
const css="/* PB1944 lab queue toolbar */\n.r1944Toolbar{flex:1 0 100%;width:100%;grid-column:1/-1;direction:rtl;box-sizing:border-box;position:sticky;top:0;z-index:45;background:#fff;border:1px solid #dce6f7;border-radius:13px;box-shadow:0 4px 15px rgba(33,62,110,.07);padding:9px 12px;margin:7px 0 8px}\n:has(> .r1944Toolbar){flex-wrap:wrap!important}\n.r1944ToolbarInner{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}\n.r1944Search{flex:1 1 225px;max-width:390px;min-width:160px;border:1px solid #cfddf2;background:#f8fbff;border-radius:9px;padding:10px 12px;font:inherit;font-size:13px;outline:none;color:#12365d;direction:rtl}\n.r1944Search:focus{border-color:#3478f6;box-shadow:0 0 0 3px rgba(40,111,245,.12)}\n.r1944PageSummary{font-size:12px;font-weight:600;color:#657999;white-space:nowrap}\n.r1944Pager{display:flex;align-items:center;justify-content:center;gap:5px;direction:rtl;flex-wrap:wrap}\n.r1944PageButton{border:1px solid #d6e1f2;color:#2f537c;background:#fff;border-radius:8px;min-width:31px;height:33px;padding:0 9px;font:600 12px inherit;cursor:pointer}\n.r1944PageButton.active{background:#2767ec;color:white;border-color:#2767ec}\n.r1944PageButton:disabled{opacity:.38;cursor:default}\n.r1944PageButton:not(:disabled):hover{border-color:#2767ec;color:#1746ad}\n.r1944PageButton.active:hover{color:#fff}\n@media(max-width:650px){.r1944Toolbar{padding:7px 8px;border-radius:10px;margin:5px 0}.r1944ToolbarInner{gap:6px}.r1944Search{flex-basis:100%;max-width:none;font-size:12px}.r1944Pager{order:2;flex:1}.r1944PageSummary{order:3;font-size:11px}}";
const tb=",e.jsx(\"div\",{className:\"r1944Toolbar\",children:e.jsxs(\"div\",{className:\"r1944ToolbarInner\",children:[\ne.jsx(\"input\",{type:\"search\",className:\"r1944Search\",value:r1944Query,onChange:le=>r1944SetQuery(le.target.value),placeholder:\"جست‌وجو: شماره سفارش، عکاس، مشتری یا نام عکس…\",\"aria-label\":\"جست‌وجوی همه سفارش‌های این وضعیت\"}),\ne.jsx(\"span\",{className:\"r1944PageSummary\",children:r1944Error?r1944Error:r1944Pending?\"در حال دریافت سفارش‌ها…\":\"نمایش \"+V(r1944Total?((r1944Page-1)*10+1):0)+\" تا \"+V(Math.min(r1944Page*10,r1944Total))+\" از \"+V(r1944Total)+\" سفارش\"}),\ne.jsxs(\"div\",{className:\"r1944Pager\",children:[\ne.jsx(\"button\",{type:\"button\",className:\"r1944PageButton\",disabled:r1944Pending||r1944Page<=1,onClick:()=>r1944SetPage(v=>Math.max(1,v-1)),children:\"قبلی\"}),\n...Array.from({length:Math.min(r1944Pages,5)},(_,nt)=>{const first=Math.max(1,Math.min(r1944Pages-4,r1944Page-2)),num=first+nt;return e.jsx(\"button\",{type:\"button\",className:\"r1944PageButton\"+(num===r1944Page?\" active\":\"\"),onClick:()=>r1944SetPage(num),disabled:r1944Pending,\"aria-current\":num===r1944Page?\"page\":void 0,children:V(num)},num)}),\ne.jsx(\"button\",{type:\"button\",className:\"r1944PageButton\",disabled:r1944Pending||r1944Page>=r1944Pages,onClick:()=>r1944SetPage(v=>Math.min(r1944Pages,v+1)),children:\"بعدی\"})\n]})]})})";
const newYe="/* PB1944 server-paged lab queue */\nconst pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>{\n const seq=++pbLiveOrders.current.seq;\n pbLiveOrders.current.active=true;\n r1944SetPending(true);r1944SetError(\"\");\n const query=String(r1944DebouncedQuery||\"\").trim();\n const uri=\"/api/lab/orders?paged=1&mode=\"+encodeURIComponent(o)+\"&stage=\"+encodeURIComponent(T)+\"&page=\"+r1944Page+\"&q=\"+encodeURIComponent(query)+\"&pbNativeLiveStatus=\"+Date.now();\n // An offline installed Lab may only have the legacy cached endpoint.\n // Never lose its locally cached orders due to the new server paging URL.\n const nativeOffline=!!(window.pbNativeStorage&&typeof navigator!==\"undefined\"&&navigator.onLine===false);\n // R1945: never leave the lab without its orders when the opt-in paged API fails.\n // The legacy endpoint is read-only and remains available for previous clients.\n const pb1945Legacy=()=>Me(\"/api/lab/orders\").then(data=>({...data,__pb1945Legacy:true}));\n return (nativeOffline?pb1945Legacy():Me(uri).catch(async(error)=>{\n  const status=Number(error?.status||error?.data?.status||0);\n  if(status===401||status===403)throw error;\n  const cached=await pb1945Legacy();\n  if(seq===pbLiveOrders.current.seq)r1944SetError(\"نمایش پشتیبان سفارش‌ها؛ صفحه‌بندی کامل موقتاً در دسترس نیست\");\n  return cached;\n })).then(data=>{\n  if(!pbLiveOrders.current.active||seq!==pbLiveOrders.current.seq)return;\n  const useLegacy=nativeOffline||!!data.__pb1945Legacy;\n  const local=useLegacy ? (data.orders||[]).filter(le=>String(le.mode||\"print\")===o&&le.status!==\"uploading\"&&le.status!==\"cancelled\") : [];\n  const matchText=(le)=>String([le.number,le.customer_name,le.customer_mobile,le.folder_latin_name,le.invoice_number].join(\" \")).toLowerCase().includes(query.toLowerCase());\n  const stageOf=le=>le.status===\"ready\"?\"ready\":le.status===\"completed\"?\"completed\":\"flow\";\n  const matching=useLegacy?local.filter(le=>!query||matchText(le)):null;\n  const stage=useLegacy?matching.filter(le=>stageOf(le)===T).sort((a,b)=>String(b.created_at||\"\").localeCompare(String(a.created_at||\"\"))):null;\n  const offlineTotal=useLegacy?stage.length:0;\n  const visible=pb1753VisibleLabOrders(useLegacy?stage.slice((r1944Page-1)*10,r1944Page*10):data.orders||[],o);\n  f(previous=>(window.pb1631PreserveExits?.(visible,previous)||visible).slice(0,10));\n  const counts=useLegacy?{flow:matching.filter(le=>stageOf(le)===\"flow\").length,ready:matching.filter(le=>stageOf(le)===\"ready\").length,completed:matching.filter(le=>stageOf(le)===\"completed\").length}:data.counts||{flow:0,ready:0,completed:0};\n  r1944SetCounts(counts);\n  r1944SetPages(useLegacy?Math.max(1,Math.ceil(offlineTotal/10)):Math.max(1,Number(data.pages||1)));\n  r1944SetTotal(useLegacy?offlineTotal:Math.max(0,Number(data.total||0)));\n  const totalPages=useLegacy?Math.max(1,Math.ceil(offlineTotal/10)):Math.max(1,Number(data.pages||1));\n  if(r1944Page>totalPages)r1944SetPage(totalPages);\n }).catch(error=>{\n  if(seq===pbLiveOrders.current.seq)r1944SetError(\"دریافت سفارش‌ها انجام نشد؛ دوباره تلاش کنید\");\n  throw error;\n }).finally(()=>{if(seq===pbLiveOrders.current.seq)r1944SetPending(false)});\n}";
const newList="const Ye=le=>le.status===\"ready\"?\"ready\":le.status===\"completed\"||le.status===\"cancelled\"?\"completed\":\"flow\",\nge=r1944Counts,\nBe=p,\nbt=Be.map(le=>String(le.id)).join(\"|\");\nx.useEffect(()=>Ge(Be.length),[T,o,bt]);\nconst Nt=Be";
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';
 let src=fs.readFileSync(path,'utf8');
 if(!src.includes('/* PB1944 server-paged lab queue */')){
  const uf=src.indexOf('function Uf(');
  if(uf<0)throw Error('[R1944] Lab component missing '+root);
  const state='const[p,f]=x.useState([]),',si=src.indexOf(state,uf);
  if(si<0||si>uf+24000)throw Error('[R1944] Lab list state anchor missing '+root);
  src=src.slice(0,si)+state+'[r1944Page,r1944SetPage]=x.useState(1),[r1944Query,r1944SetQuery]=x.useState(""),[r1944DebouncedQuery,r1944SetDebouncedQuery]=x.useState(""),[r1944Counts,r1944SetCounts]=x.useState({flow:0,ready:0,completed:0}),[r1944Pages,r1944SetPages]=x.useState(1),[r1944Total,r1944SetTotal]=x.useState(0),[r1944Pending,r1944SetPending]=x.useState(false),[r1944Error,r1944SetError]=x.useState(""),'+src.slice(si+state.length);
  const ref='se=x.useRef(null),ue=x.useRef(null),';
  src=once(src,ref,ref+'r1944Request=x.useRef(0),','request ref '+root);
  const oldStart='const pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>{';
  const begin=src.indexOf(oldStart,uf),effect=begin<0?-1:src.indexOf(';x.useEffect(',begin);
  if(begin<0||effect<begin)throw Error('[R1944] live queue refresh anchor missing: '+root);
  src=src.slice(0,begin)+newYe+src.slice(effect);
  const effectBegin=src.indexOf(';x.useEffect(',begin+newYe.length);
  const oldEnd=src.indexOf(';const Ye=le=>',effectBegin);
  if(effectBegin<0||oldEnd<effectBegin)throw Error('[R1944] live queue effect changed: '+root);
  let effectText=src.slice(effectBegin,oldEnd);
  const dep='[a,o,t?.id]';
  if(effectText.split(dep).length!==2)throw Error('[R1944] live refresh dependencies changed: '+root);
  effectText=effectText.replace(dep,'[a,o,t?.id,T,r1944Page,r1944DebouncedQuery]');
  const more=";x.useEffect(()=>{const timer=window.setTimeout(()=>r1944SetDebouncedQuery(String(r1944Query||s||\"\")),270);return()=>window.clearTimeout(timer)},[r1944Query,s]);x.useEffect(()=>{r1944SetPage(1)},[T,o,r1944DebouncedQuery])";
  const nextField=src.indexOf(',tt=le=>',oldEnd);
  if(nextField<oldEnd)throw Error('[R1944] queue card handlers missing '+root);
  src=src.slice(0,effectBegin)+effectText+more+';'+newList+src.slice(nextField);
  const tab='children:["تحویل‌شده ",e.jsx("b",{children:V(ge.completed)})]})';
  const pos=src.indexOf(tab);
  if(pos<0)throw Error('[R1946] missing tabs');
  console.log('[R1946_TAB_CONTEXT]',root,JSON.stringify({left:src.slice(Math.max(0,pos-1100),pos),right:src.slice(pos+tab.length,pos+tab.length+1600)}));
  src=once(src,tab,tab+tb,'tab toolbar '+root);
  fs.writeFileSync(path,src);
 }
 execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 const htmlFile=root+'/index.html';
 let html=fs.readFileSync(htmlFile,'utf8');
 const id='<style id="pb1944-lab-pager">';
 if(!html.includes(id))html=html.replace('</head>',id+css+'</style>\n</head>');
 if(!html.includes(id))throw Error('[R1944] sticky toolbar stylesheet missing '+root);
 fs.writeFileSync(htmlFile,html);
}
execFileSync(process.execPath,['--check',backend],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/api/lab-order-pages-r1944.cjs'],{stdio:'inherit'});
console.log('[R1944] server pages, native/web React toolbar, status counts, search installed.');
