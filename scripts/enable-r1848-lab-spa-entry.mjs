import fs from 'node:fs';
function once(text,before,after,label){if(text.split(before).length!==2)throw Error('R1848 missing/ambiguous '+label);return text.replace(before,()=>after)}
const index='dist/web/index.html',chooser='dist/web/photobridge-v904r99-lab-chooser.js',bundle='dist/web/assets/index-UIRefine-v655-r84.js';
let html=fs.readFileSync(index,'utf8'),js=fs.readFileSync(chooser,'utf8'),app=fs.readFileSync(bundle,'utf8');
if(!html.includes('window.__PB1848StartLabEntry=function')){
 let entry=fs.readFileSync('scripts/r1847-lab-entry.js','utf8');
 entry=once(entry," const q=new URLSearchParams(location.search)"," window.__PB1848StartLabEntry=function(){\n const q=new URLSearchParams(location.search)",'entry initializer');
 entry=once(entry,"resource+(entry.labId?'?_lab='+encodeURIComponent(entry.labId):'')","resource+(entry.labId?(resource.includes('?')?'&':'?')+'_lab='+encodeURIComponent(entry.labId):'')",'paged prefetch URL');
 entry=once(entry,'controller.abort();if(window.__PB1847EntryEarly===entry)',"if(!entry.ordersDelivered)controller.abort();if(window.__PB1847EntryEarly===entry)",'do not cancel optional home after first orders paint');
 entry=once(entry,"entry.orders=load('orders');","const supplied=window.__PB1848SelectedEntry;delete window.__PB1848SelectedEntry;const cached=supplied&&String(supplied.userId||'')===String(window.__PB1848AuthUserId||'')&&supplied.userId&&(!entry.labId||String(supplied.labId)===entry.labId)&&Date.now()-Number(supplied.at||0)<12000?supplied:null;entry.ordersUserId=cached?String(cached.userId):'';entry.orders=cached?Promise.resolve(cached):load('orders?pageSize=30&offset=0&view=flow&mode=print');",'use in-memory select page or prefetch first active page');
 entry=once(entry,' check();\n})();'," check();\n };\n window.__PB1848StartLabEntry();\n})();",'initializer close');
 html=html.replace(/(<script id="pb1847LabEntry">)[\s\S]*?(<\/script>)/,(_all,start,end)=>start+entry+end);
}
if(!js.includes('/* R1848 SPA entry */')){
 const selectCall="const selected=await api('/api/customer/labs/'+encodeURIComponent(id)+'/select',{method:'POST',body:'{}'});";
 js=once(js,selectCall,"const PB1848WantEntry=window===window.top&&!new URLSearchParams(location.search).has('pbDesktopContent')&&!new URLSearchParams(location.search).has('pbUtilityWindow')&&window.__PB1848AuthUserId&&window.__PB1848PrintEntryReady;const selected=await api('/api/customer/labs/'+encodeURIComponent(id)+'/select',{method:'POST',body:'{}',headers:{'Content-Type':'application/json',...(PB1848WantEntry?{'x-photobridge-print-entry':'1'}:{})}});",'optional first page on ready SPA select');
 const previous="location.replace(u.pathname+'?'+u.searchParams.toString())";
 const next=`/* R1848 SPA entry */if(PB1848WantEntry&&selected.entry&&String(selected.entry.labId)===String(id))window.__PB1848SelectedEntry=selected.entry;const target=u.pathname+'?'+u.searchParams.toString();const embedded=window!==window.top||u.searchParams.get('pbDesktopContent')==='1'||u.searchParams.has('pbUtilityWindow')||document.documentElement.classList.contains('pb1126Embedded');if(!embedded&&window.__PB1848PrintEntryReady&&window.__PB1848StartLabEntry&&document.querySelector('#root .photographerMain')){history.pushState(history.state,'',target);window.__PB1848StartLabEntry();dispatchEvent(new CustomEvent('photobridge-lab-entry',{detail:{labId:id,lab:selected?.lab||{id}}}));dispatchEvent(new CustomEvent('photobridge-lab-selected',{detail:{labId:id}}));dispatchEvent(new PopStateEvent('popstate'))}else location.replace(target)`;
 js=once(js,previous,next,'chooser SPA transition with embedded fallback');
}
if(!app.includes('/* R1848 active-lab state swap */')){
 const before='if(x.useEffect(()=>{De(),pt()},[]),';
 const after=`/* R1848 active-lab state swap */const [PB1848Epoch,PB1848SetEpoch]=x.useState(0);x.useEffect(()=>{const P=async event=>{const id=String(event.detail?.labId||'');if(!id)return;PB1848SetEpoch(value=>value+1);O(true);f(null);await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));f({lab:{...event.detail.lab,id,service_only:false},profile:{studio_name:t.user.photographerName||t.user.name||''},status:{open:false,message:'در حال دریافت وضعیت لابراتوار…'},prices:[],orderStats:{total:0,active:0,ready:0},recentOrders:[],walletBalance:null,__pbEntryPending:true});O(false);De(id).then(data=>{if(String(data?.lab?.id||'')!==id)location.replace(location.href)}).catch(error=>{if(error.status===401||error.status===403)location.replace(location.href);else console.warn('[PhotoBridge lab context]',error)})};window.addEventListener('photobridge-lab-entry',P);window.__PB1848PrintEntryReady=true;return()=>{window.removeEventListener('photobridge-lab-entry',P);delete window.__PB1848PrintEntryReady}},[]);`+before;
 app=once(app,before,after,'React workspace entry event');
 const hfStart=app.indexOf('function Hf('),hfEnd=app.indexOf('function ',hfStart+15);let hf=app.slice(hfStart,hfEnd);hf=hf.replaceAll('V(p.walletBalance||0)',"(p.__pbEntryPending?'…':V(p.walletBalance||0))");app=app.slice(0,hfStart)+hf+app.slice(hfEnd);
 app=once(app,'`orders:${_e}`','`orders:${_e}:${PB1848Epoch}`','remount first orders page even when choosing the active lab');
}

// Preserve the legacy 300-order response unless the new optional page is requested.
const serverFile='dist/api/server.js';let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes("from './customer-orders-page.js'")){
 const section=server.slice(server.indexOf("if (req.method === 'GET' && url.pathname === '/api/customer/orders')"));
 const select=section.match(/pool\.query\(`(SELECT o\.\*,[\s\S]*?)\n          WHERE o\.lab_id=/)?.[1];
 if(!select)throw Error('R1848 original orders projection missing');
 const helper=fs.readFileSync('scripts/r1848-customer-orders-page.js','utf8').replace('__PB1848_DETAIL_SQL__',()=>select);
 fs.writeFileSync('dist/api/customer-orders-page.js',helper);
 server="import {customerOrdersPage} from './customer-orders-page.js';\n"+server;
 const anchor="        if (req.method === 'GET' && url.pathname === '/api/customer/orders') {";
 server=once(server,anchor,anchor+"\n            const page=await customerOrdersPage(pool,labId,a.userId,url.searchParams);if(page)return sendJson(res,page.status,page.body);",'optional orders page handler');
 const selectReply='            return sendJson(res, 200, { ok: true, lab: publicRow });';
 const entryReply=`            let entry=null;
            if(req.headers['x-photobridge-print-entry']==='1'){
                try{const page=await customerOrdersPage(pool,targetLab,a.userId,new URLSearchParams('pageSize=30&offset=0&view=flow&mode=print'));if(page?.status===200)entry={...page.body,userId:a.userId,role:'customer',at:Date.now()}}catch(error){console.warn('[PhotoBridge entry page]',String(error?.message||error))}
            }
            return sendJson(res,200,{ok:true,lab:publicRow,...(entry?{entry}:{})});`;
 server=once(server,selectReply,entryReply,'opt-in first page after all original select authorization and audit checks');

 fs.writeFileSync(serverFile,server);
}
let start=app.indexOf('function Zg('),end=app.indexOf('function ',start+15);
let orders=app.slice(start,end);
if(!orders.includes('PB1848Page')){
 orders=once(orders,'const[c,m]=x.useState([]),','const [PB1848Page,PB1848SetPage]=x.useState({offset:0,hasMore:false,counts:null}),[PB1848Loading,PB1848SetLoading]=x.useState(false);const PB1848PageRef=x.useRef({offset:0});const[c,m]=x.useState([]),','page state');
 orders=once(orders,'re=()=>{const De=++v.current;','re=(more=false)=>{more=more===true;const offset=more?PB1848PageRef.current.offset:0,wanted=more?30:Math.max(30,PB1848PageRef.current.offset);PB1848SetLoading(true);const De=++v.current;','page fetch');
 const legacyRead='Me(`/api/customer/orders?_lab=${encodeURIComponent(o||"")}&_seq=${De}-${Date.now()}`)';
 const pagedRead='Promise.all(Array.from({length:Math.ceil(wanted/100)},(_,index)=>Me(`/api/customer/orders?_lab=${encodeURIComponent(o||"")}&_seq=${De}-${Date.now()}&pageSize=${Math.min(100,wanted-index*100)}&offset=${offset+index*100}&view=${encodeURIComponent(a)}&mode=${encodeURIComponent(l)}`))).then(pages=>({...pages[0],orders:pages.flatMap(page=>page.orders||[]),pagination:{...pages[0].pagination,limit:wanted,hasMore:pages[pages.length-1].pagination?.hasMore||false}}))';
 orders=once(orders,legacyRead,pagedRead,'bounded active status and refresh loaded pages only');
 orders=once(orders,'Ee=Array.from(new Map(ot.map(we=>[String(we.id),we])).values())','Ee=Array.from(new Map([...(more?J.current:[]),...ot].map(we=>[String(we.id),we])).values())','append unique page orders');
 orders=once(orders,'return J.current=Ee,m(Ee),T(pt.paymentSettings||null),Ee})','return PB1848PageRef.current={offset:Math.min(offset+(pt.pagination?.limit||30),pt.pagination?.total??offset+30),hasMore:!!pt.pagination?.hasMore,counts:pt.pagination?.counts||null},PB1848SetPage(PB1848PageRef.current),J.current=Ee,m(Ee),T(pt.paymentSettings||null),Ee}).finally(()=>PB1848SetLoading(false))','page metadata');
 orders=once(orders,'x.useEffect(()=>{v.current+=1,J.current=[]','x.useEffect(()=>{PB1848PageRef.current={offset:0,hasMore:false,counts:null};PB1848SetPage(PB1848PageRef.current);v.current+=1,J.current=[]','reset paging on active lab/status change');
 orders=once(orders,'clearInterval(pt)}},[o])','clearInterval(pt)}},[o,a,l])','refresh active tab only');
 orders=once(orders,'Z={flow:','Z=PB1848Page.counts||{flow:','complete server counts');
 orders=once(orders,',f&&e.jsx(Oc,',',PB1848Page.hasMore&&e.jsx("button",{type:"button",className:"secondary pb1848LoadOrders",disabled:PB1848Loading,onClick:()=>re(true),children:PB1848Loading?"در حال دریافت…":"نمایش سفارش‌های بیشتر"}),f&&e.jsx(Oc,','load more control');
 app=app.slice(0,start)+orders+app.slice(end);
}

// Request preview URLs only when a customer's thumbnail approaches the viewport.
start=app.indexOf('function yv(');end=app.indexOf('function ',start+15);let thumbs=app.slice(start,end);
if(!thumbs.includes('PB1848Thumb')){
 thumbs=once(thumbs,'const[s,r]=x.useState("")','const PB1848Thumb=x.useRef(null),[PB1848Seen,PB1848SetSeen]=x.useState(false);x.useEffect(()=>{if(typeof IntersectionObserver==="undefined"){PB1848SetSeen(true);return}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){PB1848SetSeen(true);observer.disconnect()}},{rootMargin:"160px"});if(PB1848Thumb.current)observer.observe(PB1848Thumb.current);return()=>observer.disconnect()},[t.id]);const[s,r]=x.useState("")','thumbnail visibility');
 thumbs=once(thumbs,'x.useEffect(()=>{let c=!0;','x.useEffect(()=>{if(!PB1848Seen)return;let c=!0;','defer preview request');
 thumbs=once(thumbs,'[t.id]),e.jsxs("button",{','[t.id,PB1848Seen]),e.jsxs("button",{ref:PB1848Thumb,','thumbnail ref');
 thumbs=once(thumbs,'e.jsx("img",{src:s,','e.jsx("img",{loading:"lazy",decoding:"async",src:s,','lazy image bytes');
 app=app.slice(0,start)+thumbs+app.slice(end);
}
if(!app.includes('const PB1848EntryUI=')){
// An old workspace request must not release a newer entry skeleton or abort its prefetch.
start=app.indexOf('async function Me(');end=app.indexOf('async function PB1847OriginalApi(',start);let api=app.slice(start,end);
api=once(api,'const early=window.__PB1847EntryEarly;','const PB1848EntryUI=window.__PB1847EntryUI;const early=window.__PB1847EntryEarly;','capture entry generation');
api=once(api,'try{const data=await PB1847OriginalApi(t,a);',"try{const data=await PB1847OriginalApi(t,a);if(new URL(t,location.origin).pathname==='/api/auth/me')window.__PB1848AuthUserId=String(data?.user?.id||data?.user?.userId||'');",'bind in-memory payload to authenticated user');
api=once(api,"catch(error){if(error.status===401||error.status===403)window.__PB1847EntryUI?.remove();throw error}","catch(error){if(error.status===401||error.status===403){delete window.__PB1848AuthUserId;delete window.__PB1848SelectedEntry;window.__PB1847EntryUI?.remove()}throw error}",'discard entry identity on authorization failure');
api=api.replaceAll('window.__PB1847EntryUI?.ordersReady()', '(PB1848EntryUI===window.__PB1847EntryUI&&PB1848EntryUI?.ordersReady())');
app=app.slice(0,start)+api+app.slice(end);
app=once(app,"if(key&&early[key]&&(!requested||!early.labId||requested===early.labId)){","if(key&&early[key]&&(!requested||!early.labId||requested===early.labId)&&(key!=='orders'||!early.ordersUserId||early.ordersUserId===window.__PB1848AuthUserId)&&(key!=='orders'||(url.searchParams.get('pageSize')==='30'&&Number(url.searchParams.get('offset')||0)===0&&(url.searchParams.get('view')||'flow')==='flow'&&(url.searchParams.get('mode')||'print')==='print'))){",'only reuse matching first page');
}
fs.writeFileSync(index,html);fs.writeFileSync(chooser,js);fs.writeFileSync(bundle,app);
console.log('R1848: reuse loaded SPA for website lab entry; full navigation for embedded/unready documents');
