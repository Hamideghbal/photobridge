'use strict';
const http=require('node:http');
const {exempt,checkWriteAccess}=require('./write-access.cjs');
const {liveEditRoute,forwardLiveEdit}=require('./lab-live-edits.cjs');
const fs=require('node:fs');
const path=require('node:path');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const OFFLINE_BLOCK=/\/(?:zibal|upload|presign|download|installer|password|ai-studio|video-guides)(?:\/|$)/i;
function createHost({store,sync,request:upstreamRequest,roots,token,onLogin,onLogout,nativeStorage,pdfRenderer,thermalPrinter,backups,isOnline=()=>true,getReadEpoch=()=>0}){
  let offlineUntil=0;const request=async(...args)=>{try{const response=await upstreamRequest(...args);offlineUntil=0;return response;}catch(error){if(!args[1]?.signal?.aborted)offlineUntil=Date.now()+15000;throw error;}};
  const connectionOffline=()=>isOnline()===false||Date.now()<offlineUntil;
  const pageReads=new Map(),warmOrders=new Map(),stageProofs=new Map();
  const warmPageMs=30000;
  let orderGeneration=0,financeGeneration=0,stageAccess=null;
  const pageScope=()=>JSON.stringify([store.get('labId'),store.get('deviceId'),store.get('auth'),getReadEpoch()]);
  const financeScope=()=>JSON.stringify([pageScope(),financeGeneration]);
  function readPage(key,route,preload=false){
    const pending=pageReads.get(key);
    if(pending){
      if(preload||!pending.preload)return pending.flight;
      const retry=()=>readPage(key,route);
      return pending.flight.then(result=>validPage(result)||[401,403].includes(result.status)?result:retry(),retry);
    }
    const flight=(async()=>{
      const response=await (preload?upstreamRequest:request)(route,{method:'GET'});
      return {status:response.status,ok:response.ok,mime:response.headers.get('content-type')||'application/octet-stream',body:Buffer.from(await response.arrayBuffer())};
    })().finally(()=>pageReads.delete(key));
    pageReads.set(key,{flight,preload});
    return flight;
  }
  const firstPage=mode=>'/api/lab/orders?paged=1&mode='+mode+'&stage=flow&page=1&q=';
  function validPage(result,query=''){
    if(!result.ok||!result.mime.includes('application/json'))return null;
    try{
      const page=JSON.parse(result.body.toString());
      if(!Array.isArray(page?.orders)||!Number.isSafeInteger(page.total)||!Number.isSafeInteger(page.pages)||!page.counts)return null;
      // Some compatible servers can return the default page when a search
      // cannot be applied. Use the renderer's filtered fallback in that case.
      return !query||page.query===query?page:null;
    }catch{return null;}
  }
  function rememberStageProofs(page,scope){
    if(!stageProofs.size||stageProofs.values().next().value.scope!==scope)stageProofs.clear();
    for(const order of page.orders){
      if(!order?.id)continue;
      stageProofs.delete(order.id);
      if(order.invoice_id||order.invoice_required===false){
        stageProofs.set(order.id,{scope,at:Date.now(),revision:order.document_revision,updatedAt:order.updated_at});
        if(stageProofs.size>200)stageProofs.delete(stageProofs.keys().next().value);
      }
    }
  }
  function hasStageProof(orderId,body){
    const proof=stageProofs.get(orderId);
    return proof?.scope===pageScope()&&Date.now()-proof.at<30000&&
      (body.expectedRevision!=null&&proof.revision!=null
        ? String(body.expectedRevision)===String(proof.revision)
        : Boolean(body.expectedUpdatedAt&&body.expectedUpdatedAt===proof.updatedAt));
  }
  function rememberFirstPage(key,mode,result){
    if(result.body.length>=12e6||!validPage(result))return;
    warmOrders.set(mode,{key,result,at:Date.now()});
  }
  function warmedFirstPage(key,mode){
    const warm=warmOrders.get(mode);
    if(warm?.key===key&&Date.now()-warm.at<warmPageMs)return warm.result;
  }
  async function warmOrderPage(mode){
    const scope=pageScope(),generation=orderGeneration,route=firstPage(mode);
    const key=JSON.stringify([scope,generation,route]);
    if(warmedFirstPage(key,mode)&&Date.now()-warmOrders.get(mode).at<5000)return;
    const result=await readPage(key,route,true);
    if(scope===pageScope()&&generation===orderGeneration)rememberFirstPage(key,mode,result);
  }
  function confirmedStageAccess(scope){
    if(stageAccess?.scope!==scope)return false;
    const age=Date.now()-stageAccess.receivedAt;
    return age>=0&&age<5000&&stageAccess.serverTime+age<stageAccess.expiresAt;
  }
  function rememberStageAccess(result,scope){
    if(scope!==pageScope())return;
    stageAccess=null;
    if(!result.ok||!result.mime.includes('application/json'))return;
    try{
      const access=JSON.parse(result.body.toString()),serverTime=Date.parse(access.serverNow);
      const expiresAt=access.activeUntil==null?Infinity:Date.parse(access.activeUntil);
      if(access.allowed===true&&access.labId===store.get('labId')&&Number.isFinite(serverTime)&&expiresAt>serverTime){
        stageAccess={scope,serverTime,expiresAt,receivedAt:Date.now()};
      }
    }catch{/* Only a validated live approval can be reused. */}
  }
  const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
  const server=http.createServer(async(req,res)=>{
    try{
      const origin='http://127.0.0.1:'+server.address().port;
      if(req.headers.host!=='127.0.0.1:'+server.address().port)return json(res,403,{error:'invalid_host'});
      const url=new URL(req.url,origin);
      if(url.pathname==='/start'&&url.searchParams.get('token')===token){res.writeHead(302,{'Set-Cookie':'desktop='+token+'; HttpOnly; SameSite=Strict; Path=/','Location':'/lab'});return res.end()}
      if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()==='desktop='+token))return json(res,403,{error:'desktop_locked'});
      if(req.headers.origin&&req.headers.origin!==origin)return json(res,403,{error:'invalid_origin'});

      // The native host owns offline storage and updates; a PWA worker must not intercept its verified UI.
      if(req.headers['service-worker']==='script'||/^\/(?:photobridge-sw[^/]*|service-worker|sw)\.js$/.test(url.pathname))return json(res,410,{error:'native_service_worker_disabled'});
      if(url.pathname===require('./native-font.cjs').fontPath&&req.method==='GET'){res.writeHead(200,{'Content-Type':'font/woff2','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'assets','photobridge-vazirmatn.woff2')));}
      if(url.pathname==='/desktop/backups'&&req.method==='GET'){if(!store.get('auth')||!store.get('labId'))return json(res,401,{error:'login_required'});res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; font-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});return res.end(fs.readFileSync(path.join(__dirname,'backup.html')));}
      if(url.pathname==='/desktop/warm-view'&&req.method==='GET'){
        if(!store.get('auth')||!store.get('labId'))return json(res,401,{error:'lab_auth_required'});
        const view=url.searchParams.get('view');
        if(!['print','album','finance'].includes(view))return json(res,400,{error:'invalid_view'});
        if(!connectionOffline()&&Date.now()>=(sync?.nativeDownloadPriorityUntil||0)){
          if(view!=='finance')void warmOrderPage(view).catch(()=>{});
          else if(store.get('localBusinessActive:'+store.get('labId'))&&store.get('documentPolicy:'+store.get('labId'))===1){
            void require('./finance-refresh.cjs').refreshFinance(store,upstreamRequest,{scope:financeScope(),getAccount:pageScope,warm:true}).catch(()=>{});
          }
        }
        res.writeHead(204,{'Cache-Control':'no-store'});return res.end();
      }
      if(url.pathname==='/desktop/backup-assets/font'&&req.method==='GET'){if(!store.get('auth')||!store.get('labId'))return json(res,401,{error:'login_required'});res.writeHead(200,{'Content-Type':'font/woff2','Cache-Control':'private, max-age=86400'});return res.end(fs.readFileSync(path.join(__dirname,'assets','photobridge-vazirmatn.woff2')));}
      if(await require('./backup-host.cjs').backupHost({req,res,url,manager:backups,store,json,readJson}))return;
      // R1568: authenticated native-only printer configuration and spool operations.
      if(url.pathname.startsWith('/desktop/thermal/')){
        if(!store.get('auth')||!store.get('labId'))return json(res,401,{error:'login_required'});
        if(!thermalPrinter)return json(res,501,{error:'thermal_host_upgrade_required'});
        try{
          if(url.pathname==='/desktop/thermal/status'&&req.method==='GET')return json(res,200,await thermalPrinter.status());
          if(url.pathname==='/desktop/thermal/config'&&req.method==='PUT')return json(res,200,await thermalPrinter.configure(await readJson(req)));
          if(url.pathname==='/desktop/thermal/print'&&req.method==='POST')return json(res,200,await thermalPrinter.print(await readJson(req)));
          return json(res,405,{error:'method_not_allowed'});
        }catch(error){return json(res,error.status||500,{error:String(error.message||'thermal_printer_failed')});}
      }
      if(url.pathname==='/desktop/ui-proof'&&req.method==='GET')return json(res,200,await require('./ui-diagnostics.cjs').diskProof({roots:roots(),version:require('./package.json').version,store}));
      if(url.pathname==='/desktop/status'){const state=store.get('auth')?sync.status():{signedIn:false,online:false,syncing:false,pending:0,conflicts:[]};return json(res,200,{...state,internetConnected:state.online===true&&!connectionOffline(),localBusiness:store.get('auth')&&store.get('localBusinessActive:'+store.get('labId'))?(store.get('localBusiness:v1:'+store.get('labId'))?new (require('./local-business.cjs').LocalBusiness)(store).status():{enabled:true,initialized:false,pending:0,conflicts:[],syncIssues:[]}):null,uiTrayUpdateSupported:true,backupSupported:!!backups,nativeVersion:store.get('nativeVersion')||null,uiKnownGoodBuild:store.get('uiKnownGoodBuild')||null,uiBuild:store.get('uiBuild')||null,uiLastCheckedAt:store.get('uiLastCheckedAt')||null,uiDownloadedAt:store.get('uiDownloadedAt')||null,uiAppliedAt:store.get('uiAppliedAt')||null,updateError:store.get('updateError')||null})}
      if(url.pathname==='/desktop/sync'&&req.method==='POST'){if(!store.get('auth'))return json(res,401,{error:'login_required'});return json(res,200,await sync.run())}
      if(url.pathname==='/desktop/local-business/retry'&&req.method==='POST'){if(!store.get('auth'))return json(res,401,{error:'login_required'});const input=await readJson(req);if(input.reviewed!==true)return json(res,400,{error:'review_required'});const engine=new (require('./local-business.cjs').LocalBusiness)(store);const changed=store.transaction(()=>{const state=engine.state();if(String(input.id).startsWith('pdf:')){const doc=state.invoices[String(input.id).slice(4)];if(!doc)return false;delete doc.pdfSyncError;doc.remotePdfUploaded=false;store.set(engine.key(),state);return true;}if(String(input.id).startsWith('import:')){const id=String(input.id).slice(7),doc=state.orders[id]||state.invoices[id]||state.expenses[id];if(!doc)return false;delete doc.importError;store.set(engine.key(),state);return true;}if(String(input.id).startsWith('storage:')){const order=state.orders[String(input.id).slice(8)];if(!order)return false;delete order.serverStorageVersion;delete order.storageRepairError;store.set(engine.key(),state);return true;}if(String(input.id).startsWith('auto:')){const adjustment=state.adjustments[String(input.id).slice(5)];if(!adjustment?.auto_discount||adjustment.serverId)return false;delete adjustment.syncError;store.set(engine.key(),state);return true;}const event=state.events.find(e=>e.id===input.id&&e.state!=='synced');if(!event)return false;event.state='pending';delete event.error;store.set(engine.key(),state);return true;});if(!changed)return json(res,404,{error:'local_event_not_found'});void sync.run();return json(res,200,{ok:true});}
      if(url.pathname==='/desktop/retry'&&req.method==='POST'){const p=await readJson(req);store.retry(String(p.id||''));void sync.run();return json(res,200,{ok:true})}
      if(url.pathname==='/desktop/archive-conflict'&&req.method==='POST'){if(!store.get('auth'))return json(res,401,{error:'login_required'});const p=await readJson(req);if(p.reviewed!==true)return json(res,400,{error:'review_required'});if(!store.archiveConflict(String(p.id||'')))return json(res,409,{error:'conflict_not_found'});return json(res,200,{ok:true})}
      if(url.pathname==='/desktop/discard'&&req.method==='POST'){const p=await readJson(req);store.discard(String(p.id||''));return json(res,200,{ok:true})}

      const {bytes,contentType}=await readBody(req);
      if(await require('./local-files-host.cjs').localFilesHost({req,res,url,store,nativeStorage,offline:connectionOffline(),json}))return;
      if(url.pathname.startsWith('/desktop/local-invoices/')&&await require('./local-business-host.cjs').localBusinessHost({req,res,url,bytes,store,nativeStorage,offline:connectionOffline(),json,pdfRenderer,request}))return;
      if(url.pathname==='/api/auth/lab-login'&&req.method==='POST'){
        const previous=store.get('cookie');
        try{
          const up=await request(url.pathname,{method:'POST',body:bytes.toString(),headers:{'Content-Type':contentType||'application/json'}});
          const data=await up.json().catch(()=>({}));
          if(up.ok)await onLogin(data);else store.set('cookie',previous);
          return json(res,up.status,data);
        }catch(e){store.set('cookie',previous);throw e}
      }
      if(url.pathname==='/api/auth/logout'&&req.method==='POST'){const out=await onLogout();return json(res,200,{ok:true,...out})}
      if(url.pathname==='/api/auth/me')return json(res,200,store.get('auth')||null);

      if(url.pathname.startsWith('/api/')){
        if(!store.get('auth')||!store.get('labId'))return json(res,401,{error:'lab_auth_required'});
        if(req.method==='GET'&&url.pathname==='/api/lab/intake-live/download/device'){
          const {status,data}=await require('./native-intake-device.cjs').readIntakeDevice({
            store,nativeStorage,request,isOnline,opening:url.searchParams.get('purpose')==='open',getReadEpoch
          });
          return json(res,status,data);
        }
        if(req.method==='PATCH'&&/^\/api\/lab\/order-files\/[0-9a-f-]+\/print-settings$/i.test(url.pathname))return json(res,409,{error:'order_details_read_only',message:'جزئیات ثبت‌شدهٔ سفارش فقط قابل مشاهده است.'});
        if(url.pathname==='/api/lab/events'&&req.method==='GET'){if(connectionOffline())return json(res,503,{error:'internet_offline'});await require('./live-events-host.cjs').streamLabEvents({req,res,store,request,lab:store.get('labId')});return;}
        if(url.pathname==='/api/lab/write-access'&&req.method==='GET'&&connectionOffline()){const access=await checkWriteAccess(store,async()=>{throw Error('offline')});const saved=store.get('writeAccess:'+store.get('labId'));return json(res,access.allowed?200:403,{...access,labId:store.get('labId'),activeUntil:saved?.activeUntil||null,serverNow:new Date().toISOString(),offline:true});}
        let editorBody;
        if(['PATCH','POST'].includes(req.method)&&/^\/api\/lab\/(?:customers\/|print-catalog(?:\/|$))/.test(url.pathname)){
          try{editorBody=JSON.parse(bytes.toString());}catch{}
        }
        const liveEdit=liveEditRoute(req.method,url.pathname,editorBody);
        const editScope=liveEdit?pageScope():null;
        if(!exempt(req.method,req.url)){
          const manualIntakeWrite=req.method==='POST'&&/^\/api\/lab\/delegated-orders(?:\/|$)/.test(url.pathname);
          let knownStage=false;
          if(!connectionOffline()&&confirmedStageAccess(pageScope())&&/^\/api\/lab\/orders\//.test(url.pathname)){
            let body;
            try{body=JSON.parse(bytes.toString());}catch{}
            const stage=body&&require('./invoice-stage-guard.cjs').invoiceStageRequest(req.method,url.pathname,body);
            if(stage&&hasStageProof(stage.orderId,body)){
              const target=store.get('localBusiness:v1:'+store.get('labId'))?.orders?.[stage.orderId];
              knownStage=!target?.origin_offline||require('./document-policy.cjs').shared(target);
            }
          }
          // Reuse the lab's freshly polled approval for a known shared stage.
          // The upstream mutation still enforces live entitlement and revision.
          if(!knownStage){
            const access=await checkWriteAccess(store,(liveEdit?isOnline()===false:connectionOffline())?async()=>{throw Error('offline')}:(p,options={})=>request(p,{...options,signal:AbortSignal.timeout(manualIntakeWrite?1100:3500)}));
            if(!access.allowed)return json(res,403,access);
          }
        }
        // LAB104: run only after account/authorization gates; never enqueue a receipt.
        if(await require('./receipt-forward.cjs').forwardReceipt({req,res,url,bytes,contentType,store,request,offline:connectionOffline,json,enabled:require('./package.json').version==='1.0.104'}))return;
        if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(liveEdit?.kind==='debt'||/^\/api\/lab\/(?:orders|order-files|delegated-orders|invoices|finance|customers|delegated-customers)(?:\/|$)/.test(url.pathname))){
          financeGeneration++;
          res.once('finish',()=>{
            financeGeneration++;
            if(res.statusCode<300){
              const orderId=url.pathname.match(/^\/api\/lab\/orders\/([^/]+)/)?.[1];
              if(orderId)stageProofs.delete(orderId);
              else if(/^\/api\/lab\/(?:invoices|finance)\//.test(url.pathname))stageProofs.clear();
            }
          });
        }
        if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(liveEdit?.kind==='name'||/^\/api\/lab\/(?:orders|order-files|delegated-orders)(?:\/|$)/.test(url.pathname))){
          orderGeneration++;
          res.once('finish',()=>{orderGeneration++;});
        }
        if(liveEdit&&await forwardLiveEdit({route:liveEdit,req,res,url,bytes,contentType,store,request,isOnline,scope:editScope,getScope:pageScope,json})){
          if(req.method==='POST'&&liveEdit.kind==='debt'&&res.statusCode<300)sync.wake?.();
          return;
        }
        const pagedOrders=['GET','HEAD'].includes(req.method)&&url.pathname==='/api/lab/orders'&&url.searchParams.get('paged')==='1';
        // A failed background request must not stall the next order's media or
        // the reads needed to start its notification-triggered download.
        const foregroundDownload=['GET','HEAD'].includes(req.method)&&(
          /^\/api\/lab\/order-files\/[0-9a-f-]{36}\/(?:content|preview|download)$/i.test(url.pathname)||
          /^\/api\/lab\/orders\/[0-9a-f-]{36}$/i.test(url.pathname)||
          url.pathname==='/api/lab/automation'
        );
        const readOffline=foregroundDownload?isOnline()===false:connectionOffline();
        // The legacy local list has no page/count fields. Its renderer fallback
        // computes both from the local orders, including orders made offline.
        if(pagedOrders&&isOnline()===false)return json(res,503,{error:'online_connection_required'});
        if(!pagedOrders&&await require('./local-business-host.cjs').localBusinessHost({req,res,url,bytes,store,nativeStorage,offline:readOffline,json,pdfRenderer,request,financeScope,financeAccount:pageScope,hasStageProof})){if(!['GET','HEAD'].includes(req.method)&&res.statusCode<300)sync.wake?.();return;}
        let parsedLocalBody;const localBody=()=>{if(parsedLocalBody)return parsedLocalBody;try{return parsedLocalBody=bytes.length?JSON.parse(bytes.toString()):{}}catch{return parsedLocalBody={}}};
        const localOrders=require('./offline-orders.cjs'),logicalUrl=localOrders.canonical(req.url);
        const existingLocal=localOrders.pendingOrders(store).some(x=>req.url.includes(x.id)||localBody().clientOrderId===x.id);
        if(connectionOffline()||existingLocal){
          if(req.method==='POST'&&/\/delegated-orders\/[0-9a-f-]+\/submit(?:\/download)?$/.test(url.pathname)){
            const files=localBody().desktopLocalFiles,expected=localOrders.pendingOrders(store).find(x=>req.url.includes(x.id))?.files;if(!nativeStorage||!Array.isArray(files)||!files.length||files.length!==expected||new Set(files.map(f=>JSON.stringify([f.rootId,f.parts]))).size!==files.length)return json(res,409,{error:'local_files_not_verified'});
            for(const file of files)file.sha256=await require('./local-file-proof.cjs').fileProof(nativeStorage,file);
          }
          const local=localOrders.localRequest(store,req.method,req.url,localBody());
          if(local)return json(res,200,local);
          if(connectionOffline()&&require('./live-finance.cjs').invoiceAction(req.method,logicalUrl,localBody())){
            const duplicate=store.rows().find(x=>x.state==='pending'&&x.url===logicalUrl&&JSON.stringify(x.body)===JSON.stringify(localBody()));
            const queued=duplicate?{id:duplicate.id}:store.enqueue(req.method,logicalUrl,localBody());
            return json(res,202,{ok:true,desktopPending:true,offline:true,operationId:queued.id,message:'روی این دستگاه ذخیره شد؛ در انتظار تأیید سرور'});
          }
        }
        // Workstation registration needs a live answer, never a queued success.
        /* R1386 live storage target */if((url.pathname==='/api/lab/download-device'||url.pathname==='/api/lab/storage-target'||url.pathname==='/api/lab/storage-target/activate'||url.pathname==='/api/lab/storage-target/hello'||url.pathname==='/api/lab/storage-picker')&&['GET','PUT','POST'].includes(req.method)){
          const storageAccount=store.get('labId'),storageDevice=store.get('deviceId');
          if(nativeStorage&&req.method==='GET'&&url.pathname==='/api/lab/download-device'&&store.get('nativeStorageRoot:'+storageAccount)?.localStandalone)return json(res,200,await nativeStorage.device());
          if(connectionOffline()&&nativeStorage){if(url.pathname==='/api/lab/download-device'&&req.method==='GET'){try{return json(res,200,await nativeStorage.device({offline:true}))}catch{}}if(url.pathname==='/api/lab/download-device'&&req.method==='POST'){try{const body=JSON.parse(bytes.toString()||'{}');return json(res,200,await nativeStorage.register(body.force===true))}catch{}}if(url.pathname==='/api/lab/storage-target'&&req.method==='GET'){try{const current=await nativeStorage.status();if(current.root&&current.permission==='granted')return json(res,200,{configured:true,active:true,isThisDevice:true,isSelectedDevice:true,path:current.root.displayPath,offline:true,localOnly:true});}catch{}}}
          try{
            const up=await request(req.url,{...(req.method==='GET'&&url.pathname==='/api/lab/download-device'?{signal:AbortSignal.timeout(1100)}:{}),method:req.method,...(['POST','PUT'].includes(req.method)?{body:bytes,headers:{'Content-Type':'application/json'}}:{})});
            const body=Buffer.from(await up.arrayBuffer());
            if(store.get('labId')!==storageAccount||store.get('deviceId')!==storageDevice)return json(res,401,{error:'account_changed'});
            if(url.pathname==='/api/lab/download-device'&&req.method==='GET'&&up.ok){try{require('./offline-device.cjs').saveDevice(store,JSON.parse(body.toString('utf8')))}catch{}}
            res.writeHead(up.status,{'Content-Type':up.headers.get('content-type')||'application/json','Cache-Control':'no-store'});return res.end(body);
          }catch{if(store.get('labId')!==storageAccount||store.get('deviceId')!==storageDevice)return json(res,401,{error:'account_changed'});if(url.pathname==='/api/lab/download-device'&&req.method==='GET'){if(nativeStorage){try{return json(res,200,await nativeStorage.device({offline:true}))}catch{}}const saved=require('./offline-device.cjs').offlineDevice(store);if(saved)return json(res,200,saved)}return json(res,503,{error:'download_device_registration_offline',message:'ثبت یا بررسی سیستم اصلی به اتصال اینترنت نیاز دارد. پوشهٔ انتخاب‌شده حفظ می‌شود؛ پس از اتصال دوباره تلاش کنید.'})}
        }
        /* R1472 confirmed financial writes */if(await require('./live-finance.cjs').forwardLiveFinance({req,res,bytes,contentType,store,request,json,sync}))return;
        if(['GET','HEAD'].includes(req.method)){
          let cacheUrl=req.url,upstreamUrl=req.url;
          const openPage=pagedOrders&&url.searchParams.get('pbNativeOpen')==='1';
          if(pagedOrders&&(url.searchParams.has('pbNativeLiveStatus')||openPage)){
            const cacheRoute=new URL(req.url,origin);
            cacheRoute.searchParams.delete('pbNativeOpen');
            upstreamUrl=cacheRoute.pathname+cacheRoute.search;
            cacheRoute.searchParams.delete('pbNativeLiveStatus');
            cacheUrl=cacheRoute.pathname+cacheRoute.search;
          }else if(url.pathname==='/api/lab/finance/summary'&&url.searchParams.has('pbNativeOverview')){
            const summaryRoute=new URL(req.url,origin);
            summaryRoute.searchParams.delete('pbNativeOverview');
            upstreamUrl=cacheUrl=summaryRoute.pathname+summaryRoute.search;
          }
          try{
            if(pagedOrders?isOnline()===false:readOffline)throw Error('internet_offline');
            const pagedRead=pagedOrders&&req.method==='GET';
            const accessRead=req.method==='GET'&&url.pathname==='/api/lab/write-access';
            const catalogRead=req.method==='GET'&&url.pathname==='/api/lab/print-catalog';
            const scope=pagedRead||accessRead||catalogRead?pageScope():null,generation=orderGeneration;
            const catalogTicket=catalogRead?require('./read-cache.cjs').beginRead(store,cacheUrl):null;
            let result,servedWarm=false;
            if(pagedRead){
              const key=JSON.stringify([scope,generation,cacheUrl]),mode=url.searchParams.get('mode');
              const warmed=openPage?warmedFirstPage(key,mode):null;
              servedWarm=Boolean(warmed);
              if(warmed&&Date.now()-warmOrders.get(mode).at>=5000)void warmOrderPage(mode).catch(()=>{});
              result=warmed||await readPage(key,upstreamUrl);
              if(scope!==pageScope())return json(res,401,{error:'account_changed'});
              if(!warmed&&generation===orderGeneration&&['print','album'].includes(mode)&&cacheUrl===firstPage(mode)){
                rememberFirstPage(key,mode,result);
              }
            }else{
              const controller=new AbortController();
              const abort=()=>controller.abort();
              res.once('close',abort);
              if(res.destroyed)abort();
              try{
                const up=await request(upstreamUrl,{method:req.method,signal:controller.signal});
                const mime=up.headers.get('content-type')||'application/octet-stream';
                // Auth, device and payment gates remain upstream. Never buffer a verified
                // binary response in the localhost host: the renderer needs its first chunk.
                if(req.method==='GET'&&up.ok&&up.body&&/^(?:image\/|application\/octet-stream(?:;|$))/i.test(mime)){
                  const headers={'Content-Type':mime,'Cache-Control':'no-store'};
                  for(const name of ['content-disposition','x-pb-file-name','x-pb-fallback-original','etag','last-modified']){
                    const value=up.headers.get(name);
                    if(value!==null)headers[name]=value;
                  }
                  // Fetch may transparently decompress encoded bodies. Preserve
                  // byte counts and range metadata only when bytes are unchanged.
                  if(!up.headers.get('content-encoding')||up.headers.get('content-encoding')==='identity'){
                    for(const name of ['content-length','content-range','accept-ranges']){
                      const value=up.headers.get(name);
                      if(value!==null)headers[name]=value;
                    }
                  }
                  const body=Readable.from(up.body,{objectMode:false});
                  res.writeHead(up.status,headers);
                  res.flushHeaders();
                  try{await pipeline(body,res);}
                  catch(error){if(!res.destroyed)res.destroy(error);}
                  return;
                }
                result={status:up.status,ok:up.ok,mime,body:Buffer.from(await up.arrayBuffer())};
                const detail=url.pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})$/i);
                if (req.method==='GET'&&up.ok&&detail&&mime.includes('application/json')){
                  try{
                    const raw=JSON.parse(result.body.toString());
                    const data=require('./download-order-detail.cjs').normalizeDownloadOrderDetail(raw,detail[1]);
                    if(data!==raw)result.body=Buffer.from(JSON.stringify(data));
                  }catch{/* Leave malformed or unrecognized upstream data untouched. */}
                }
              }finally{res.off('close',abort);}
            }
            const {status,ok,mime,body}=result;
            if(accessRead)rememberStageAccess(result,scope);
            if(catalogRead&&scope!==pageScope())return json(res,401,{error:'account_changed'});
            if(pagedRead&&ok){
              const page=validPage(result,(url.searchParams.get('q')||'').trim().slice(0,100));
              if(!page)return json(res,502,{error:'invalid_paged_orders'});
              if(!servedWarm&&generation===orderGeneration)rememberStageProofs(page,scope);
            }
            if(ok&&!servedWarm&&req.method==='GET'&&(!pagedRead||generation===orderGeneration)&&mime.includes('application/json')&&body.length<12e6){
              const cached=store.cached?.(cacheUrl),encoded=body.toString('base64');
              if(!cached||cached.status!==status||cached.mime!==mime||cached.body!==encoded){
                if(catalogTicket)require('./read-cache.cjs').commitRead(store,catalogTicket,status,mime,encoded);
                else store.cache(cacheUrl,status,mime,encoded);
              }
            }
            res.writeHead(status,{'Content-Type':mime,'Cache-Control':'no-store'});
            return req.method==='HEAD'?res.end():res.end(body);
          }catch{
            if(res.destroyed)return;
            if(pagedOrders)return json(res,503,{error:'online_connection_required'});
            const cached=store.cached(cacheUrl);
            if(cached){res.writeHead(cached.status,{'Content-Type':cached.mime,'Cache-Control':'no-store','X-PhotoBridge-Offline':'1'});return res.end(Buffer.from(cached.body,'base64'))}
            return json(res,503,{error:'online_connection_required',message:'این بخش هنوز در این دستگاه ذخیره نشده است.'});
          }
        }
        // Print-alert presence is a *transient heartbeat*, not an order or
        // customer edit. Never enqueue it when offline or the server is slow.
        // Unlike business mutations, a failed presence request may safely be
        // retried by the live page on its next poll, without preserving history.
        if(req.method==='POST'&&url.pathname==='/api/lab/print-alert/presence'){
          try{
            const up=await request(req.url,{method:req.method,body:bytes,headers:{'Content-Type':contentType||'application/json'}});
            const response=Buffer.from(await up.arrayBuffer());
            res.writeHead(up.status,{'Content-Type':up.headers.get('content-type')||'application/json','Cache-Control':'no-store'});
            return res.end(response);
          }catch{return json(res,503,{error:'online_connection_required',message:'ارتباط اعلان چاپ موقتاً در دسترس نیست.'})}
        }
        /* PB1402 voice direct */if((req.method==='POST'&&/^\/api\/lab\/chat\/[0-9a-f-]+\/voice$/.test(url.pathname))||contentType.startsWith('multipart/form-data')||OFFLINE_BLOCK.test(url.pathname)){
          try{
            const up=await request(req.url,{method:req.method,body:bytes,headers:{'Content-Type':contentType}});
            const body=Buffer.from(await up.arrayBuffer()),mime=up.headers.get('content-type')||'application/json';
            res.writeHead(up.status,{'Content-Type':mime,'Cache-Control':'no-store'});return res.end(body);
          }catch{return json(res,503,{error:'online_connection_required',message:'این عملیات به اینترنت نیاز دارد.'})}
        }
        let payload={};
        try{payload=bytes.length?JSON.parse(bytes.toString()):{}}catch{return json(res,400,{error:'invalid_json'})}
        if(!store.rows().length){
          try{
            const up=await request(req.url,{method:req.method,body:JSON.stringify(payload)}),data=await up.json().catch(()=>({}));
            if(up.ok){void sync.run();return json(res,up.status,data)}
            if(up.status<500)return json(res,up.status,data);
          }catch{}
        }
        const queued=store.enqueue(req.method,req.url,payload);void sync.run();
        return json(res,202,{ok:true,...queued,message:'تغییر در برنامه ذخیره شد و پس از اتصال همگام می‌شود.'});
      }

      let name=decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const ext=path.extname(name);if(!name||!ext)name='index.html';
      if(name.includes('..')||name.includes('\\'))return json(res,403,{});
      // Native bridge assets are pinned to this installed app, even after UI updates.
      // The desktop overlay includes native-only intake improvements and must not
      // silently revert when the verified website UI updates its bundled copy.
      if(['native-storage.js','desktop-overlay.js','backup-ui.js'].includes(name)){res.writeHead(200,{'Content-Type':MIME['.js'],'Cache-Control':'no-store','X-PhotoBridge-Native-Version':require('./package.json').version,'X-PhotoBridge-Native-Pid':String(process.pid)});return res.end(fs.readFileSync(path.join(__dirname,name)))}
      if(name==='native-queue.css'){
        res.writeHead(200,{'Content-Type':MIME['.css'],'Cache-Control':'no-store'});
        return res.end(fs.readFileSync(path.join(__dirname,name)));
      }
      for(const root of roots()){
        const file=path.resolve(root,name),resolvedRoot=path.resolve(root);
        if(!file.startsWith(resolvedRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())continue;
        const type=MIME[path.extname(file)]||'application/octet-stream';
        res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-PhotoBridge-Native-Version':require('./package.json').version,'X-PhotoBridge-Native-Pid':String(process.pid)});
        if(name==='index.html'){
          let html=require('./native-font.cjs').injectNativeFont(fs.readFileSync(file,'utf8'));html=html.replace(/<head(?:\s[^>]*)?>/i,match=>match+'<script src="/native-storage.js"></script>');html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/native-queue.css"></head>');html=require('./native-first-paint.cjs').injectFirstPaint(html);const end=html.toLowerCase().lastIndexOf('</body>');
          html=(end<0?html:html.slice(0,end))+'<script src="/desktop-overlay.js"></script>'+(end<0?'':html.slice(end));
          return res.end(html);
        }
        if(path.extname(file)==='.css')return res.end(require('./native-font.cjs').patchNativeFontCss(fs.readFileSync(file,'utf8')));
        if(name==='photobridge-r1372-third-header.js')return res.end(require('./navigation-header-patch.cjs').patchThirdNavigation(fs.readFileSync(file,'utf8')));
        if(name==='photobridge-r1147-lab-admin-header.js')return res.end(require('./navigation-header-patch.cjs').patchNavigationHeader(fs.readFileSync(file,'utf8')));
        if(name==='photobridge-r1631-order-exit.js')return res.end(require('./native-queue-presentation.cjs').patchNativeOrderExit(fs.readFileSync(file,'utf8')));
        if(name==='photobridge-r1137-lab-local-intake.js')return res.end(require('./offline-ui.cjs').patchOfflineIntake(fs.readFileSync(file,'utf8')));
        if(name==='assets/index-UIRefine-v655-r84.js'){
          return res.end(require('./native-renderer-bundle.cjs').compile(file,require('./package.json').version));
        }
        return fs.createReadStream(file).pipe(res);
      }
      return json(res,404,{error:'not_found'});
    }catch(e){if(res.headersSent){res.destroy(e);return;}return json(res,e.status||500,{error:e.message||'desktop_error',message:e.message})}
  });
  return server;
}
async function readBody(req){if(['GET','HEAD'].includes(req.method))return{bytes:Buffer.alloc(0),contentType:''};const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>50e6)throw Object.assign(Error('request_too_large'),{status:413});chunks.push(c)}return{bytes:Buffer.concat(chunks),contentType:String(req.headers['content-type']||'')}}
async function readJson(req){const{bytes}=await readBody(req);try{return bytes.length?JSON.parse(bytes.toString()):{}}catch{return{}}}
module.exports={createHost};
