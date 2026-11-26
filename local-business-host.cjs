'use strict';
const {LocalBusiness,canonical}=require('./local-business.cjs');
function localActive(store){return!!store.get('localBusinessActive:'+store.get('labId'));}
async function localBusinessHost({req,res,url,bytes,store,nativeStorage,offline,json,pdfRenderer,request,financeScope,financeAccount,hasStageProof}){
 if(!store.get('auth')||!store.get('labId'))return false;
 // These navigation reads use the standard proxy and never need a local
 // business migration or SQLite write before reaching the server.
 if(req.method==='GET'&&['/api/lab/dashboard','/api/lab/profile-image','/api/lab/hours','/api/lab/album-settings','/api/lab/sms-settings','/api/lab/snappbox/settings','/api/lab/site'].includes(url.pathname))return false;
 const lab=store.get('labId'),same=()=>{if(store.get('labId')!==lab||!store.get('auth'))throw Object.assign(Error('حساب تغییر کرده است؛ دوباره تلاش کنید.'),{code:'account_changed',status:401});};
 if(!offline&&req.method==='GET'&&url.pathname==='/api/lab/finance/summary'&&url.searchParams.has('pbNativeOverview')){
  const snapshot=store.get('localBusiness:v1:'+lab);
  // On a fresh workstation the website summary already covers the account.
  // A persisted local ledger still supplies its own reconciled figures.
  if(!snapshot)return false;
  if(url.searchParams.get('pbNativeOverview')==='initial'&&snapshot.snapshotAt&&store.cached(url.pathname)){
   const {refreshFinance}=require('./finance-refresh.cjs');
   void refreshFinance(store,request,{focus:'overview',scope:financeScope?.(),getAccount:financeAccount,getScope:financeScope}).catch(()=>{});
   const result=new LocalBusiness(store).summary(snapshot,url.searchParams);
   json(res,200,result);
   return true;
  }
 }
 require('./document-policy.cjs').applyPolicy(store);
 const engine=new LocalBusiness(store),raw=url.pathname,p=canonical(req.url);let b={};try{b=bytes?.length?JSON.parse(bytes.toString()):{}}catch{}
 const isPrint=/^\/desktop\/local-invoices\//.test(raw);
 if(!offline&&!localActive(store)&&!isPrint&&['GET','HEAD'].includes(req.method)&&!(req.method==='GET'&&p==='/api/lab/delegated-orders/bootstrap'&&(store.cached(req.url)||store.cached(p)||store.cached(p+'?mode=print'))))return false;
 const canRead=['/api/lab/orders','/api/lab/archive','/api/lab/invoices','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/finance/summary','/api/lab/finance/ledger','/api/lab/finance/customer-statement','/api/lab/delegated-orders/bootstrap'].includes(p)||/^\/api\/lab\/(orders\/[^/]+(?:\/invoice-pricing)?|delegated-customers\/[^/]+\/account-summary)$/.test(p);
 const invoiceRoute=raw.match(/^\/api\/lab\/invoices\/([^/]+)\/(download|preview|pdf-upload|pdf-complete)$/),printRoute=raw.match(/^\/desktop\/local-invoices\/([^/]+)\/(pdf|print)$/);
 const businessWrite=!['GET','HEAD','OPTIONS'].includes(req.method)&&/^\/api\/lab\/(?:orders|order-files|invoices|finance|delegated-orders|delegated-customers|customers)(?:\/|$)/.test(p);if(!canRead&&!engine.supports(req.method,p)&&!invoiceRoute&&!printRoute&&!businessWrite)return false;
 store.set('localBusinessActive:'+store.get('labId'),true);
 if(!store.get(engine.key())&&!offline&&request){const paths=['/api/lab/finance/summary','/api/lab/orders','/api/lab/archive','/api/lab/invoices','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/delegated-orders/bootstrap'];await Promise.allSettled(paths.filter(p=>!store.cached(p)).map(async p=>{const r=await request(p,{signal:AbortSignal.timeout(3500)});if(!r.ok)return;const data=Buffer.from(await r.arrayBuffer());same();if(data.length<12e6&&(r.headers.get('content-type')||'').includes('application/json'))store.cache(p,r.status,'application/json',data.toString('base64'));}));same();}
 engine.state();
 try{
  if(req.method==='POST'&&/^\/api\/lab\/delegated-orders\/[^/]+\/submit$/.test(p)){
   const orderId=p.split('/')[4],order=engine.state().orders[orderId],files=b.desktopLocalFiles;
   if(!nativeStorage||!Array.isArray(files)||!files.length||files.length!==order?.files?.length||new Set(files.map(f=>JSON.stringify([f.rootId,f.parts]))).size!==files.length)throw Object.assign(Error('ذخیرهٔ عکس‌ها باید کامل و بررسی شود.'),{code:'local_files_not_verified',status:409});
   for(const file of files){file.sha256=await require('./local-file-proof.cjs').fileProof(nativeStorage,file);same();}
  }
  // On reconnect, do not keep presenting the offline print-size snapshot:
  // it may contain sizes the server has since disabled or renamed. Fetch the
  // current bootstrap before a fresh online walk-in, but retain offline-only
  // customer profiles and always fall back to the local cache on outage.
  if(req.method==='GET'&&p==='/api/lab/delegated-orders/bootstrap'&&!offline&&request){
   try{
    const upstream=await request(req.url,{signal:AbortSignal.timeout(1300)});
    if(upstream.ok){
     const live=await upstream.json();same();
     if(Array.isArray(live.printSizes)&&Array.isArray(live.customers)){
      const localCustomers=Object.values(engine.state().customers).filter(c=>c.origin_offline===true&&!c.serverId&&!c.remote);
      const seen=new Set(live.customers.map(c=>String(c.id)));
      store.cache(req.url,upstream.status,'application/json',Buffer.from(JSON.stringify(live)).toString('base64'));
      const canonicalBootstrap=p+(url.searchParams.get('mode')==='print'?'?mode=print':'');store.cache(canonicalBootstrap,upstream.status,'application/json',Buffer.from(JSON.stringify(live)).toString('base64'));
      json(res,200,{...live,customers:[...live.customers,...localCustomers.filter(c=>!seen.has(String(c.id)))]});
      return true;
     }
    }
   }catch{same();/* Use last verified local bootstrap if server briefly drops. */}
  }
  if(req.method==='GET'&&!offline){
   const {refreshFinance,routes}=require('./finance-refresh.cjs');
   if(routes.some(([route])=>route===p)){
    const overview=p==='/api/lab/finance/summary'?url.searchParams.get('pbNativeOverview'):null;
    const options={force:p==='/api/lab/invoices',focus:overview?'overview':p,scope:financeScope?.(),getAccount:financeAccount,getScope:financeScope};
    const snapshot=overview==='initial'&&store.cached(p)&&engine.state().snapshotAt;
    if(snapshot)void refreshFinance(store,request,options).catch(()=>{});
    else await refreshFinance(store,request,options);
   }
  }
  const policy=require('./document-policy.cjs').routePolicy(store,req.method,req.url,b,offline);
  const {invoiceStageRequest,requiresInvoice}=require('./invoice-stage-guard.cjs');
  const stageRequest=invoiceStageRequest(req.method,p,b);
  if(stageRequest&&(policy.kind==='local'||!hasStageProof?.(stageRequest.orderId,b))){
   let detail;
   if(policy.kind==='local')detail=engine.read('/api/lab/orders/'+(policy.target?.id||stageRequest.orderId));
   else{const forwarded=require('./document-policy.cjs').remoteRequest(store,'/api/lab/orders/'+stageRequest.orderId,{},policy.target),response=await request(forwarded.url);detail=await response.json();same();if(!response.ok){json(res,response.status,detail);return true;}}
   if(requiresInvoice(detail)){json(res,409,{error:'order_invoice_required',message:'ابتدا فاکتور سفارش را صادر کنید؛ مرحلهٔ کار تغییر نکرد.'});return true;}
  }
  const detailMatch=p.match(/^\/api\/lab\/orders\/([^/]+)(?:\/invoice-pricing)?$/);
  if(req.method==='GET'&&detailMatch&&!offline){const state=engine.state(),doc=Object.values(state.orders).find(o=>o.id===detailMatch[1]||o.serverId===detailMatch[1]);if(!doc||require('./document-policy.cjs').shared(doc)){const forwarded=require('./document-policy.cjs').remoteRequest(store,req.url,{},doc),response=await request(forwarded.url);const rawData=await response.json();same();const data=response.ok&&p==='/api/lab/orders/'+detailMatch[1]?require('./download-order-detail.cjs').normalizeDownloadOrderDetail(rawData,String((doc?.serverId||detailMatch[1]))):rawData;if(response.ok&&data.order){store.transaction(()=>{const live=engine.state();const old=doc||{};live.orders[old.id||data.order.id]={...data.order,...old,status:data.order.status??old.status,album_stage:data.order.album_stage??old.album_stage,updated_at:data.order.updated_at||old.updated_at,document_revision:data.order.document_revision??old.document_revision,remote:old.id?old.remote:true,files:old.files?.length?old.files.map(f=>{const remote=data.files?.find(r=>r.id===(f.serverId||f.id));return remote?{...f,...remote,id:f.id,serverId:f.serverId||remote.id}:f;}):data.files||[]};store.set(engine.key(),live);});}if(response.ok&&data.invoice)require('./remote-invoice-cache.cjs').rememberRemoteInvoice(store,data.invoice,doc?.id||detailMatch[1]);json(res,response.status,data);return true;}}
  if(policy.kind==='remote'){
   const forwarded=require('./document-policy.cjs').remoteRequest(store,req.url,b,policy.target);let response;
   try{response=await request(forwarded.url,{method:req.method,headers:{'Content-Type':'application/json','x-photobridge-shared-policy':'1'},body:JSON.stringify({...forwarded.body,desktopOperationId:b.desktopOperationId||req.headers['x-photobridge-local-operation']})});}catch{throw Object.assign(Error('این تغییر آنلاین تأیید نشد؛ در صف آفلاین ثبت نشده است. پیش از تکرار، وضعیت سایت را بررسی کنید.'),{code:'shared_online_unconfirmed',status:503});}
   const data=await response.json();same();if(response.ok&&data.invoice)require('./remote-invoice-cache.cjs').rememberRemoteInvoice(store,data.invoice,policy.target?.id);if(response.ok)require('./read-cache.cjs').confirmWrite(store,['/api/lab/orders','/api/lab/invoices','/api/lab/finance/summary','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/finance/ledger']);if(response.ok&&policy.target&&data.order){store.transaction(()=>{const state=engine.state(),doc=state.orders[policy.target.id];if(doc){doc.status=data.order.status;doc.album_stage=data.order.album_stage;doc.updated_at=data.order.updated_at;doc.document_revision=data.order.document_revision;state.orderSnapshotBody=store.cached('/api/lab/orders')?.body;}store.set(engine.key(),state);});}json(res,response.status,data);return true;
  }
  if(invoiceRoute||printRoute){engine.refreshInvoiceSnapshot();const invoiceId=(invoiceRoute||printRoute)[1],s=engine.state(),inv=Object.values(s.invoices).find(i=>i.id===invoiceId||i.serverId===invoiceId)||null;if(!inv){json(res,404,{error:'invoice_not_found',message:'فاکتور روی این دستگاه موجود نیست.'});return true;}
   if(invoiceRoute&&['download','preview'].includes(invoiceRoute[2])){json(res,200,{url:'/desktop/local-invoices/'+inv.id+'/pdf',localCommitted:true});return true;}
   if(invoiceRoute){if(invoiceRoute[2]==='pdf-upload'){const raw=String(b.pdfBase64||'').replace(/^data:[^,]+,/,''),pdf=Buffer.from(raw,'base64');if(pdf.length<5||pdf.length>10e6||pdf.subarray(0,5).toString()!=='%PDF-')throw Object.assign(Error('فایل PDF معتبر نیست.'),{code:'invalid_invoice_pdf',status:400});store.db.prepare('INSERT OR REPLACE INTO local_invoice_pdf VALUES(?,?,?)').run(store.get('labId'),inv.id,pdf);}json(res,200,{invoice:inv,localCommitted:true});return true;}
   const html=require('./local-invoice.cjs').invoiceHtml(engine.decorateInvoice(s,inv),engine.bootstrap().lab);
   if(printRoute[2]==='print'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return true;}
   let pdf=(!inv.origin_offline||inv.pdfDisplayNumber===engine.decorateInvoice(s,inv).number&&inv.pdfDisplayVersion===2)&&!inv.serverNumber&&store.db.prepare('SELECT bytes FROM local_invoice_pdf WHERE lab=? AND id=?').get(store.get('labId'),inv.id)?.bytes;
   if(!pdf){if(!pdfRenderer)throw Object.assign(Error('چاپ PDF در این محیط در دسترس نیست.'),{status:503});pdf=await pdfRenderer(html);same();}
   res.writeHead(200,{'Content-Type':'application/pdf','Cache-Control':'no-store','Content-Disposition':'inline; filename="invoice-'+inv.id+'.pdf"'});res.end(Buffer.from(pdf));return true;
  }

  same();const result=engine.handle(req.method,req.url,b,String(req.headers['x-photobridge-local-operation']||b.desktopOperationId||''),{isolated:policy.kind==='local',offline});if(result===null)throw Object.assign(Error('این عملیات برای سند مستقل آفلاین پشتیبانی نمی‌شود.'),{code:'offline_operation_unsupported',status:409});
  json(res,200,result);return true;
 }catch(error){json(res,error.status||400,{error:error.code||error.message,message:error.message,...(error.missingPricing?{missingPricing:error.missingPricing,pricingRequirements:error.pricingRequirements}:{})});return true;}
}
module.exports={localBusinessHost,localActive};
