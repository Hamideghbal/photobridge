/* R1851 Upload Health, photographer browser: passive, privacy-limited observer.
   Never touches application upload promises, image bytes, order creation or cleanup. */
(function(){
  'use strict';
  if(window.PB1851||!/^\/(photographer|customer)(\/|$)/.test(location.pathname))return;
  var nativeFetch=window.fetch.bind(window);
  var nativeOpen=XMLHttpRequest.prototype.open,nativeSend=XMLHttpRequest.prototype.send;
  var eventKey='pb1851-events-v1',sessionKey='pb1851-session-v1',historyKey='pb1851-history-v1';
  var queue=[],history=[],flushing=false,scheduled=0,disabled=false,orderId=null,labContext=null;
  var byServerFile=new Map(),bySignedUrl=new Map(),active=null,card=null;
  var uuid=function(){return crypto.randomUUID();};
  function saved(k){try{return JSON.parse(sessionStorage.getItem(k)||'null');}catch(_){return null;}}
  function store(k,v){try{sessionStorage.setItem(k,JSON.stringify(v));}catch(_){}}
  var oldSession=saved(sessionKey),session=oldSession&&Date.now()-oldSession.at<21600000?oldSession:{id:uuid(),at:Date.now()};
  store(sessionKey,session);
  queue=Array.isArray(saved(eventKey))?saved(eventKey).slice(-120):[];
  history=Array.isArray(saved(historyKey))?saved(historyKey).slice(-120):[];
  function online(){return navigator.onLine!==false;}
  function emit(stage,state,extra){
    extra=extra||{};
    var ev={eventId:uuid(),sessionId:session.id,stage:stage,state:state,client:innerWidth<700?'mobile':'web',
      online:online(),orderId:extra.orderId||orderId||null,
      fileId:extra.fileId||null,attemptId:extra.attemptId||null,
      serverFileId:extra.serverFileId||null,
      sentBytes:Number.isSafeInteger(extra.sentBytes)?extra.sentBytes:null,
      totalBytes:Number.isSafeInteger(extra.totalBytes)?extra.totalBytes:null,
      durationMs:Number.isSafeInteger(extra.durationMs)?extra.durationMs:null,
      errorCode:extra.errorCode?String(extra.errorCode).replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,80):null,
      httpStatus:Number.isInteger(extra.httpStatus)?extra.httpStatus:null};
    queue.push(ev);queue=queue.slice(-120);store(eventKey,queue);
    history.push(ev);history=history.slice(-120);store(historyKey,history);
    schedule();
  }
  function schedule(){
    if(disabled||scheduled)return;
    scheduled=setTimeout(function(){scheduled=0;void flush();},1300);
  }
  async function flush(){
    if(disabled||flushing||!queue.length||!online())return;
    flushing=true;
    try{
      while(queue.length&&online()){
        var batch=queue.slice(0,16);
        var response=await nativeFetch('/api/customer/uploads/health-events'+(labContext?'?_lab='+encodeURIComponent(labContext):''),{
          method:'POST',credentials:'same-origin',
          headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},
          body:JSON.stringify({events:batch}),signal:AbortSignal.timeout(8000)});
        if(response.status===404||response.status===503){disabled=true;break;}
        if(response.status===400||response.status===403||response.status===409){
          // Stale reports (e.g. a deliberately deleted draft) cannot block uploads.
          queue.splice(0,batch.length);store(eventKey,queue);
          if(response.status===409){session={id:uuid(),at:Date.now()};store(sessionKey,session);}
          continue;
        }
        if(!response.ok)break;
        queue.splice(0,batch.length);store(eventKey,queue);
      }
    }catch(_){}finally{flushing=false;}
  }
  function fileMeta(serverId){return byServerFile.get(String(serverId||''))||null;}
  function ensureCard(){
    if(card||!document.body)return;
    card=document.createElement('aside');card.id='pb1851-upload-health';
    card.dir='rtl';card.setAttribute('role','status');card.setAttribute('aria-live','polite');
    card.style.cssText='position:fixed;bottom:78px;right:12px;z-index:2147483000;max-width:min(360px,calc(100vw - 24px));background:#eff5ff;color:#183253;border:1px solid #bacfeb;box-shadow:0 6px 22px #0002;border-radius:14px;padding:12px 14px;font:14px/1.8 Tahoma,sans-serif;display:none';
    var label=document.createElement('div');label.id='pb1851-upload-title';
    var bar=document.createElement('progress');bar.id='pb1851-upload-progress';bar.max=100;bar.value=0;bar.style.cssText='display:block;width:100%;margin:6px 0';
    var actions=document.createElement('div');actions.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin-top:5px';
    var exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='گزارش خطا';
    exportButton.style.cssText='border:0;border-radius:8px;padding:4px 10px;background:#d9e8ff;color:#163c67';
    exportButton.addEventListener('click',exportDiagnostics);
    var close=document.createElement('button');close.type='button';close.textContent='بستن';
    close.style.cssText='border:0;border-radius:8px;padding:4px 10px;background:#e5e9ee';
    close.addEventListener('click',function(){card.style.display='none';});
    actions.append(exportButton,close);card.append(label,bar,actions);document.body.append(card);
  }
  function show(message,progress,failed){
    ensureCard();if(!card)return;
    card.style.display='block';
    card.style.background=failed?'#fff2eb':'#eff5ff';
    card.querySelector('#pb1851-upload-title').textContent=message;
    var bar=card.querySelector('#pb1851-upload-progress');
    bar.style.display=Number.isFinite(progress)?'block':'none';
    if(Number.isFinite(progress))bar.value=Math.max(0,Math.min(100,progress));
  }
  function failText(status,onlineValue){
    if(onlineValue===false)return 'اینترنت قطع شده؛ فایل را نگه دارید و بعد از اتصال، از داخل سفارش دوباره تلاش کنید.';
    if(status===413)return 'حجم فایل از حد مجاز بیشتر است؛ اندازهٔ فایل را بررسی کنید.';
    if(status===401||status===403)return 'دسترسی یا لینک ارسال معتبر نیست؛ صفحه را بررسی کرده و دوباره تلاش کنید.';
    if(status===429)return 'درخواست‌های زیادی ارسال شده؛ کمی بعد دوباره تلاش کنید.';
    if(status===422)return 'دریافت فایل یا تبدیل فرمت به مشکل خورده؛ اصل عکس را نگه دارید.';
    return 'ارسال این فایل کامل نشد؛ فایل اصلی را نگه دارید و از داخل سفارش دوباره تلاش کنید.';
  }
  function exportDiagnostics(){
    var data={version:'r1851',sessionId:session.id,exportedAt:new Date().toISOString(),
      events:history.map(function(e){return {eventId:e.eventId,stage:e.stage,state:e.state,
        errorCode:e.errorCode,httpStatus:e.httpStatus,durationMs:e.durationMs,
        totalBytes:e.totalBytes,sentBytes:e.sentBytes,online:e.online};})};
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var href=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=href;a.download='photobridge-upload-health-'+session.id.slice(0,8)+'.json';
    a.click();setTimeout(function(){URL.revokeObjectURL(href);},1000);
  }
  function watchStage(path,method){
    if(method!=='POST')return '';
    if(path==='/api/customer/orders')return 'create';
    if(path==='/api/customer/uploads/presign')return 'presign';
    if(path==='/api/customer/uploads/complete')return 'complete';
    if(/^\/api\/customer\/orders\/[0-9a-f-]+\/submit$/i.test(path))return 'submit';
    return '';
  }
  function bodyObject(init){
    try{
      if(typeof init?.body==='string'&&init.body.length<32768)return JSON.parse(init.body);
    }catch(_){}
    return {};
  }
  window.fetch=function(input,init){
    var raw=typeof input==='string'?input:input&&input.url||'';
    var url;try{url=new URL(raw,location.href);}catch(_){return nativeFetch(input,init);}
    var method=String(init?.method||input?.method||'GET').toUpperCase();
    var stage=url.origin===location.origin?watchStage(url.pathname,method):'';
    var signed=method==='PUT'&&(bySignedUrl.get(raw)||bySignedUrl.get(url.href));
    if(signed){
      var putAttemptId=uuid(),putStart=performance.now();
      show('در حال انتقال فایل به لابراتوار…',NaN,false);
      emit('transfer','started',{...signed,attemptId:putAttemptId,totalBytes:signed.bytes});
      return nativeFetch(input,init).then(function(response){
        emit('transfer',response.ok?'ok':'failed',{...signed,attemptId:putAttemptId,
          httpStatus:response.status,durationMs:Math.round(performance.now()-putStart),
          totalBytes:signed.bytes,sentBytes:response.ok?signed.bytes:null,
          errorCode:response.ok?null:'http_'+response.status});
        if(!response.ok)show(failText(response.status,online()),NaN,true);
        else show('فایل منتقل شد؛ در حال تأیید دریافت…',100,false);
        return response;
      },function(error){
        emit('transfer',error?.name==='AbortError'?'aborted':'failed',{...signed,
          attemptId:putAttemptId,httpStatus:0,
          durationMs:Math.round(performance.now()-putStart),
          errorCode:error?.name==='AbortError'?'aborted':'network_error'});
        if(error?.name!=='AbortError')show(failText(0,online()),NaN,true);
        throw error;
      });
    }
    if(!stage)return nativeFetch(input,init);
    if(url.searchParams.has('_lab'))labContext=url.searchParams.get('_lab');
    var body=bodyObject(init),begin=performance.now(),attemptId=uuid();
    var existing=fileMeta(body.fileId),logicalFileId=existing&&existing.fileId||null;
    var order=body.orderId||orderId||null;
    emit(stage,'started',{attemptId,fileId:logicalFileId,orderId:order});
    return nativeFetch(input,init).then(async function(response){
      var data=null;
      if(response.ok&&(stage==='presign'||stage==='create')){
        try{data=await response.clone().json();}catch(_){}
      }
      if(stage==='create'&&response.ok&&data?.order?.id)orderId=data.order.id;
      if(stage==='presign'&&response.ok&&data?.fileId){
        logicalFileId=uuid();
        var meta={fileId:logicalFileId,serverFileId:data.fileId,
          orderId:order,bytes:Number.isSafeInteger(body.bytes)?body.bytes:null};
        byServerFile.set(data.fileId,meta);
        if(data.uploadUrl)bySignedUrl.set(data.uploadUrl,meta);
        if(bySignedUrl.size>250)bySignedUrl.delete(bySignedUrl.keys().next().value);
      }
      emit(stage,response.ok?'ok':'failed',{attemptId,fileId:logicalFileId,orderId:order,
        serverFileId:existing?.serverFileId|| (stage==='presign'?data?.fileId:null),
        totalBytes:existing?.bytes||null,
        httpStatus:response.status,durationMs:Math.round(performance.now()-begin),
        errorCode:response.ok?null:'http_'+response.status});
      if(!response.ok&&stage!=='create')show(failText(response.status,online()),NaN,true);
      return response;
    },function(error){
      emit(stage,error?.name==='AbortError'?'aborted':'failed',{attemptId,fileId:logicalFileId,
        orderId:order,httpStatus:0,durationMs:Math.round(performance.now()-begin),
        errorCode:error?.name==='AbortError'?'aborted':'network_error'});
      if(error?.name!=='AbortError')show(failText(0,online()),NaN,true);
      throw error;
    });
  };
  XMLHttpRequest.prototype.open=function(method,url){
    var value=String(url||''),meta=bySignedUrl.get(value);
    if(!meta){try{meta=bySignedUrl.get(new URL(value,location.href).href);}catch(_){}}
    this.__pb1851=String(method).toUpperCase()==='PUT'?meta||null:null;
    return nativeOpen.apply(this,arguments);
  };
  XMLHttpRequest.prototype.send=function(){
    var meta=this.__pb1851;
    if(!meta)return nativeSend.apply(this,arguments);
    var xhr=this,attemptId=uuid(),begin=performance.now(),lastQuarter=0,finished=false;
    active=meta;
    show('در حال انتقال فایل به لابراتوار… ۰٪',0,false);
    emit('transfer','started',{...meta,attemptId,totalBytes:meta.bytes});
    xhr.upload.addEventListener('progress',function(event){
      if(!event.lengthComputable||!event.total)return;
      var percent=Math.floor(100*event.loaded/event.total);
      if(active===meta)show('در حال انتقال فایل به لابراتوار… '+percent+'٪',percent,false);
      var quarter=Math.floor(percent/25);
      if(quarter>lastQuarter){lastQuarter=quarter;emit('transfer','progress',{...meta,attemptId,
        sentBytes:event.loaded,totalBytes:event.total});}
    });
    xhr.addEventListener('loadend',function(){
      if(finished)return;finished=true;
      var ok=xhr.status>=200&&xhr.status<300;
      emit('transfer',ok?'ok':'failed',{...meta,attemptId,httpStatus:xhr.status,
        durationMs:Math.round(performance.now()-begin),totalBytes:meta.bytes,
        sentBytes:ok?meta.bytes:null,errorCode:ok?null:(xhr.status?'http_'+xhr.status:'network_error')});
      if(ok){if(active===meta)show('فایل منتقل شد؛ در حال تأیید دریافت…',100,false);}
      else show(failText(xhr.status,online()),NaN,true);
    });
    return nativeSend.apply(this,arguments);
  };
  window.PB1851={sessionId:session.id,exportDiagnostics:exportDiagnostics};
  addEventListener('online',function(){void flush();});
  addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')void flush();});
  setInterval(function(){if(queue.length)void flush();},15000);
  if(queue.length)schedule();
})();
