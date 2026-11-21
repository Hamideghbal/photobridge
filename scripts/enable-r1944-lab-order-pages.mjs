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
const list="/* PB1944 server-paged lab queue */\nconst ye=()=>{\nconst seq=++r1944Request.current;\nr1944SetPending(true);r1944SetError(\"\");\nconst query=String(r1944Query||s||\"\").trim();\nconst uri=\"/api/lab/orders?paged=1&mode=\"+encodeURIComponent(o)+\"&stage=\"+encodeURIComponent(T)+\"&page=\"+r1944Page+\"&q=\"+encodeURIComponent(query);\nreturn Me(uri).then(le=>{\nif(seq!==r1944Request.current)return;\nf((le.orders||[]).slice(0,10));\nr1944SetCounts(le.counts||{flow:0,ready:0,completed:0});\nr1944SetPages(Math.max(1,Number(le.pages||1)));\nr1944SetTotal(Math.max(0,Number(le.total||0)));\nif(r1944Page>Math.max(1,Number(le.pages||1)))r1944SetPage(Math.max(1,Number(le.pages||1)));\n}).catch(error=>{\nif(seq===r1944Request.current)r1944SetError(\"دریافت فهرست انجام نشد؛ دوباره تلاش کنید\");\nthrow error;\n}).finally(()=>{if(seq===r1944Request.current)r1944SetPending(false)});\n};\nx.useEffect(()=>{r1944SetPage(1)},[T,o,s,r1944Query]);\nx.useEffect(()=>{\nconst timeout=window.setTimeout(()=>{ye().catch(()=>{})},(r1944Query||s)?280:0);\nreturn()=>{window.clearTimeout(timeout);r1944Request.current++};\n},[a,T,o,s,r1944Page,r1944Query]);\nconst Ye=le=>le.status===\"ready\"?\"ready\":le.status===\"completed\"||le.status===\"cancelled\"?\"completed\":\"flow\",\nge=r1944Counts,\nBe=p,\nbt=Be.map(le=>String(le.id)).join(\"|\");\nx.useEffect(()=>Ge(Be.length),[T,o,s,bt]);\nconst Nt=Be";
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';
 let src=fs.readFileSync(path,'utf8');
 if(!src.includes('/* PB1944 server-paged lab queue */')){
  const uf=src.indexOf('function Uf(');
  if(uf<0)throw Error('[R1944] Lab component missing '+root);
  const state='const[p,f]=x.useState([]),',si=src.indexOf(state,uf);
  if(si<0||si>uf+24000)throw Error('[R1944] Lab list state anchor missing '+root);
  src=src.slice(0,si)+state+'[r1944Page,r1944SetPage]=x.useState(1),[r1944Query,r1944SetQuery]=x.useState(""),[r1944Counts,r1944SetCounts]=x.useState({flow:0,ready:0,completed:0}),[r1944Pages,r1944SetPages]=x.useState(1),[r1944Total,r1944SetTotal]=x.useState(0),[r1944Pending,r1944SetPending]=x.useState(false),[r1944Error,r1944SetError]=x.useState(""),'+src.slice(si+state.length);
  const ref='se=x.useRef(null),ue=x.useRef(null),';
  src=once(src,ref,ref+'r1944Request=x.useRef(0),','request ref '+root);
  const begin=src.indexOf('const ye=()=>Me("/api/lab/orders")',uf);
  const end=begin<0?-1:src.indexOf(',tt=le=>',begin);
  if(begin<0||end<begin){
  const tokens=['const ye=','ye=()=>','/api/lab/orders','const Ye=','tt=le=>','Be=p.filter','const Nt=','labOrderScrollArea'];
  const diag=tokens.map(token=>{const pos=src.indexOf(token,uf);return {token,pos,near:pos<0?'':src.slice(Math.max(0,pos-100),pos+460)}});
  throw Error('[R1944] Lab list fetch section missing '+root+' '+JSON.stringify({uf,begin,end,diag}));
}
  src=src.slice(0,begin)+list+src.slice(end);
  const tab='children:["تحویل‌شده ",e.jsx("b",{children:V(ge.completed)})]})';
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
