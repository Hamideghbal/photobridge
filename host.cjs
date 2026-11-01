'use strict';
const http=require('node:http');
const {exempt,checkWriteAccess}=require('./write-access.cjs');
const fs=require('node:fs');
const path=require('node:path');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const OFFLINE_BLOCK=/\/(?:zibal|upload|presign|download|installer|password|ai-studio|video-guides)(?:\/|$)/i;
function createHost({store,sync,request:upstreamRequest,roots,token,onLogin,onLogout,nativeStorage,pdfRenderer,isOnline=()=>true}){
  let offlineUntil=0;const request=async(...args)=>{try{const response=await upstreamRequest(...args);offlineUntil=0;return response;}catch(error){offlineUntil=Date.now()+15000;throw error;}};
  const connectionOffline=()=>isOnline()===false||Date.now()<offlineUntil;
  const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
  const server=http.createServer(async(req,res)=>{
    try{
      const origin='http://127.0.0.1:'+server.address().port;
      if(req.headers.host!=='127.0.0.1:'+server.address().port)return json(res,403,{error:'invalid_host'});
      const url=new URL(req.url,origin);
      if(url.pathname==='/start'&&url.searchParams.get('token')===token){res.writeHead(302,{'Set-Cookie':'desktop='+token+'; HttpOnly; SameSite=Strict; Path=/','Location':'/lab'});return res.end()}
      if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()==='desktop='+token))return json(res,403,{error:'desktop_locked'});
      if(req.headers.origin&&req.headers.origin!==origin)return json(res,403,{error:'invalid_origin'});

      if(url.pathname==='/desktop/status'){const state=store.get('auth')?sync.status():{signedIn:false,online:false,syncing:false,pending:0,conflicts:[]};return json(res,200,{...state,internetConnected:state.online===true&&!connectionOffline(),localBusiness:store.get('auth')&&store.get('localBusinessActive:'+store.get('labId'))?(store.get('localBusiness:v1:'+store.get('labId'))?new (require('./local-business.cjs').LocalBusiness)(store).status():{enabled:true,initialized:false,pending:0,conflicts:[],syncIssues:[]}):null,uiTrayUpdateSupported:true,nativeVersion:store.get('nativeVersion')||null,uiKnownGoodBuild:store.get('uiKnownGoodBuild')||null,uiBuild:store.get('uiBuild')||null,uiLastCheckedAt:store.get('uiLastCheckedAt')||null,uiDownloadedAt:store.get('uiDownloadedAt')||null,uiAppliedAt:store.get('uiAppliedAt')||null,updateError:store.get('updateError')||null})}
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
      if(url.pathname==='/api/auth/me'&&store.get('auth'))return json(res,200,store.get('auth'));

      if(url.pathname.startsWith('/api/')){
        if(!store.get('auth')||!store.get('labId'))return json(res,401,{error:'lab_auth_required'});
        if(url.pathname==='/api/lab/events'&&req.method==='GET'){await require('./live-events-host.cjs').streamLabEvents({req,res,store,request,lab:store.get('labId')});return;}
        if(url.pathname==='/api/lab/write-access'&&req.method==='GET'&&connectionOffline()){const access=await checkWriteAccess(store,async()=>{throw Error('offline')});const saved=store.get('writeAccess:'+store.get('labId'));return json(res,access.allowed?200:403,{...access,labId:store.get('labId'),activeUntil:saved?.activeUntil||null,serverNow:new Date().toISOString(),offline:true});}
        if(!exempt(req.method,req.url)){const access=await checkWriteAccess(store,connectionOffline()?async()=>{throw Error('offline')}:(p,options={})=>request(p,{...options,signal:AbortSignal.timeout(3500)}));if(!access.allowed)return json(res,403,access)}
        if(await require('./local-business-host.cjs').localBusinessHost({req,res,url,bytes,store,nativeStorage,offline:connectionOffline(),json,pdfRenderer,request})){if(!['GET','HEAD'].includes(req.method)&&res.statusCode<300)sync.wake?.();return;}
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
          if(connectionOffline()&&nativeStorage){if(url.pathname==='/api/lab/download-device'&&req.method==='GET'){try{return json(res,200,await nativeStorage.device())}catch{}}if(url.pathname==='/api/lab/download-device'&&req.method==='POST'){try{const body=JSON.parse(bytes.toString()||'{}');return json(res,200,await nativeStorage.register(body.force===true))}catch{}}if(url.pathname==='/api/lab/storage-target'&&req.method==='GET'){try{const current=await nativeStorage.status();if(current.root&&current.permission==='granted')return json(res,200,{configured:true,active:true,isThisDevice:true,isSelectedDevice:true,path:current.root.displayPath,offline:true,localOnly:true});}catch{}}}
          try{
            const up=await request(req.url,{method:req.method,...(['POST','PUT'].includes(req.method)?{body:bytes,headers:{'Content-Type':'application/json'}}:{})});
            const body=Buffer.from(await up.arrayBuffer());
            if(store.get('labId')!==storageAccount||store.get('deviceId')!==storageDevice)return json(res,401,{error:'account_changed'});
            if(url.pathname==='/api/lab/download-device'&&req.method==='GET'&&up.ok){try{require('./offline-device.cjs').saveDevice(store,JSON.parse(body.toString('utf8')))}catch{}}
            res.writeHead(up.status,{'Content-Type':up.headers.get('content-type')||'application/json','Cache-Control':'no-store'});return res.end(body);
          }catch{if(store.get('labId')!==storageAccount||store.get('deviceId')!==storageDevice)return json(res,401,{error:'account_changed'});if(url.pathname==='/api/lab/download-device'&&req.method==='GET'){const saved=require('./offline-device.cjs').offlineDevice(store);if(saved)return json(res,200,saved)}return json(res,503,{error:'download_device_registration_offline',message:'ثبت یا بررسی سیستم اصلی به اتصال اینترنت نیاز دارد. پوشهٔ انتخاب‌شده حفظ می‌شود؛ پس از اتصال دوباره تلاش کنید.'})}
        }
        /* R1472 confirmed financial writes */if(await require('./live-finance.cjs').forwardLiveFinance({req,res,bytes,contentType,store,request,json,sync}))return;
        if(['GET','HEAD'].includes(req.method)){
          try{
            const up=await request(req.url,{method:req.method});
            const body=Buffer.from(await up.arrayBuffer()),mime=up.headers.get('content-type')||'application/octet-stream';
            if(up.ok&&req.method==='GET'&&mime.includes('application/json')&&body.length<12e6)store.cache(req.url,up.status,mime,body.toString('base64'));
            res.writeHead(up.status,{'Content-Type':mime,'Cache-Control':'no-store'});
            return req.method==='HEAD'?res.end():res.end(body);
          }catch{
            const cached=store.cached(req.url);
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
      if(['native-storage.js','desktop-overlay.js'].includes(name)){res.writeHead(200,{'Content-Type':MIME['.js'],'Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,name)))}
      for(const root of roots()){
        const file=path.resolve(root,name),resolvedRoot=path.resolve(root);
        if(!file.startsWith(resolvedRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())continue;
        const type=MIME[path.extname(file)]||'application/octet-stream';
        res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});
        if(name==='index.html'){
          let html=fs.readFileSync(file,'utf8');html=html.replace(/<head(?:\s[^>]*)?>/i,match=>match+'<script src="/native-storage.js"></script>');const end=html.toLowerCase().lastIndexOf('</body>');
          html=(end<0?html:html.slice(0,end))+'<script src="/desktop-overlay.js"></script>'+(end<0?'':html.slice(end));
          return res.end(html);
        }
        if(name==='photobridge-r1137-lab-local-intake.js')return res.end(require('./offline-ui.cjs').patchOfflineIntake(fs.readFileSync(file,'utf8')));
        if(name==='assets/index-UIRefine-v655-r84.js')return res.end(require('./storage-bundle.cjs').patchStorageBundle(fs.readFileSync(file,'utf8')));
        return fs.createReadStream(file).pipe(res);
      }
      return json(res,404,{error:'not_found'});
    }catch(e){return json(res,e.status||500,{error:e.message||'desktop_error',message:e.message})}
  });
  return server;
}
async function readBody(req){if(['GET','HEAD'].includes(req.method))return{bytes:Buffer.alloc(0),contentType:''};const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>50e6)throw Object.assign(Error('request_too_large'),{status:413});chunks.push(c)}return{bytes:Buffer.concat(chunks),contentType:String(req.headers['content-type']||'')}}
async function readJson(req){const{bytes}=await readBody(req);try{return bytes.length?JSON.parse(bytes.toString()):{}}catch{return{}}}
module.exports={createHost};
