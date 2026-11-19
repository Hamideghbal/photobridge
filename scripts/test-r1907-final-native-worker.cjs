'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{performance}=require('node:perf_hooks');
const root=path.join(__dirname,'..');
const file=path.join(root,'dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js');
function section(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'real generated worker section missing: '+start);
 return source.slice(a,b);
}
function harness(){
 const source=fs.readFileSync(file,'utf8'),scheduler=fs.readFileSync(path.join(__dirname,'r1907-native-download-scheduler.js.txt'),'utf8');
 assert(source.includes('/* LAB104 R1907 scheduler integrated */'),'only run against final native bundle');
 const snippets=[section(source,'async function pb1568ProcessOrder(','async function pb1568AutoTick('),
  section(source,'async function pb1568AutoTick(',"if(typeof window!=='undefined'&&window.pbNativeStorage){"),scheduler].join('\n');
 const local=new Map(),tasks=new Map(),downloadStarts=[],reports=[],requests=[],listeners={},order=(id)=>({id,lab_id:'lab-A',number:id,created_at:'2099-01-01T00:00:00.000Z',file_count:1,status:'sent',settlement_mode:'postpaid',payment_status:'paid'});
 let rows=[order('A')],releaseInvoice;const pendingInvoice=new Promise(resolve=>releaseInvoice=resolve);
 const storage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};
 const env={
  window:{pbNativeStorage:{},__PB_LAB104_NATIVE__:true},
  document:{visibilityState:'visible'},
  localStorage:storage,Map,Promise,Date,Number,String,Math,JSON,Set,Error,
  console:{warn:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({supported:true})}),
  Me:async(route,options)=>{
   requests.push(route);
   if(route==='/api/auth/me')return {lab:{id:'lab-A'}};
   if(route==='/api/lab/automation')return {settings:{autoDownloadEnabled:true,invoiceTiming:'after_verified_download',autoPrintInvoice:false}};
   if(route==='/api/lab/orders')return {orders:[...rows]};
   if(/^\/api\/lab\/orders\/[AB]$/.test(route)){
    const id=route.slice(-1);return {files:[{id:'file-'+id,local_only:false}],order:order(id)};
   }
   if(route.endsWith('/automation-invoice')){
    const id=route.split('/')[4];if(id==='A')await pendingInvoice;
    return {invoice:{id:'invoice-'+id,pdf_ready:false}};
   }
   return {ok:true};
  },
  pb1450Root:async()=>{},
  pb1450Download:async detail=>{downloadStarts.push({id:detail.order.id,at:performance.now()});return {fallbackUsed:false}},
  pb1451AcknowledgeDownload:async()=>({order:{status:'downloaded',downloaded_at:'2026-11-19T00:00:00Z'},verifiedFiles:1}),
  pb1568PersistPdf:async()=>{},
  pb1568Thermal:async()=>{},
  pb1568Problem:error=>String(error?.message||error),
  pb1586NetworkFailure:()=>false,pb1586NetworkReason:()=>'',pb1586InvoiceProblem:()=>'',pb1586ShowNetworkProblem:()=>{},
  pb1581Report:(_order,p)=>reports.push({...p}),
  pb1568Work:{running:false,labId:null,lastError:''},
  pb1568State:(lab,id)=>tasks.get(lab+':'+id)||null,
  pb1568Save:(lab,id,state)=>tasks.set(lab+':'+id,{...state}),
  addEventListener:(name,fn)=>{listeners[name]=fn},
  dispatchEvent:()=>{},CustomEvent:class {},
  setTimeout,clearTimeout,setInterval,clearInterval,
 };
 vm.createContext(env);vm.runInContext(snippets,env);
 return {scan:()=>vm.runInContext('pb1568AutoTick()',env),rows:(value)=>rows=value,order,downloadStarts,reports,requests,tasks,finishA:()=>releaseInvoice(),env};
}
test('real generated scan launches order B file transfer while invoice A is blocked',async()=>{
 const h=harness(),started=performance.now();
 await h.scan();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(h.downloadStarts.map(v=>v.id),['A'],'order A must issue a real download operation; actual requests='+JSON.stringify(h.requests)+'; worker='+h.env.pb1568Work.lastError+'; tasks='+JSON.stringify([...h.tasks]));
 h.rows([h.order('A'),h.order('B')]);
 await h.scan();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(h.downloadStarts.map(v=>v.id),['A','B'],'order B transfer must not wait for invoice A');
 assert(h.downloadStarts[1].at-started<2000,'visible order should trigger transfer promptly');
 assert(h.reports.some(p=>p.phase==='verified'),'real downloaded bytes are server acknowledged before finance');
 assert(h.reports.some(p=>p.phase==='invoice_issuing'),'invoice-in-progress notification is emitted');
 await h.scan();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.downloadStarts.filter(v=>v.id==='A').length,1,'same order must not redownload while its invoice is blocked');
 h.finishA();
 await new Promise(resolve=>setTimeout(resolve,30));
 assert(h.reports.some(p=>p.phase==='invoice_issued'),'issued stage only after server invoice succeeds');
 assert(h.reports.some(p=>p.phase==='complete'),'complete stage only after finance/PDF success');
});
test('invoice failure in real generated worker does not announce success',async()=>{
 const h=harness(),old=h.env.Me;
 h.env.Me=async(route,options)=>{
  if(route.includes('automation-invoice'))throw Error('invoice_offline');
  return old(route,options);
 };
 h.rows([h.order('B')]);await h.scan();await new Promise(resolve=>setTimeout(resolve,30));
 assert(h.reports.some(p=>p.phase==='failed'&&p.stage!=='download'),'reports='+JSON.stringify(h.reports)+' worker='+h.env.pb1568Work.lastError+' requests='+JSON.stringify(h.requests));
 assert(!h.reports.some(p=>p.phase==='complete'));
});
