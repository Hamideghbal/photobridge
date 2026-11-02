'use strict';
const {exempt,checkWriteAccess}=require('./write-access.cjs');
const IDEMPOTENT=[
 ['POST',/^\/api\/lab\/invoices\/manual$/],['POST',/^\/api\/lab\/finance\/payments$/],['PUT',/^\/api\/lab\/finance\/customer-settings$/],['POST',/^\/api\/lab\/finance\/customer-adjustments$/],['POST',/^\/api\/lab\/finance\/expenses$/],['POST',/^\/api\/lab\/finance\/corrections$/],['PUT',/^\/api\/lab\/orders\/[0-9a-f-]{36}\/invoice-pricing$/i]
];
const PULL=[
 '/api/lab/dashboard','/api/lab/orders','/api/lab/archive','/api/lab/invoices','/api/lab/finance/summary','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/delegated-orders/bootstrap','/api/lab/subscription'
];
const isIdempotent=(m,u)=>IDEMPOTENT.some(([mm,re])=>m===mm&&re.test(u));
const SAFE_CONFLICT_RETRY_MS=5*60*1000;
class Sync{
 constructor({store,request,isOnline=()=>true,verifyLocalFiles,repairLocalStorage,renderOfflinePdf}){Object.assign(this,{store,request,isOnline,verifyLocalFiles,repairLocalStorage,renderOfflinePdf});this.running=false;this.online=false;this.paused=false;this.lastError=null;this.flight=null;this.phase='idle';this.revision=0;this.report=null;}

 wake(){clearTimeout(this.wakeTimer);this.wakeTimer=setTimeout(async()=>{if(this.flight)await this.flight;await this.run();},150);this.wakeTimer.unref?.();}
 async live(){if(this.liveFlight||this.paused||this.isOnline()===false||!this.store.get('auth'))return;const lab=this.store.get('labId');this.liveFlight=true;try{const cache=require('./read-cache.cjs');const results=await Promise.all(['/api/lab/orders','/api/lab/invoices'].map(async url=>{const ticket=cache.beginRead(this.store,url);try{const response=await this.request(url);if(!response.ok)return null;const body=Buffer.from(await response.arrayBuffer());if(body.length>=12e6)return null;const data=JSON.parse(body.toString());if(!Array.isArray(data[url.endsWith('/orders')?'orders':'invoices']))return null;return{url,ticket,status:response.status,body:body.toString('base64')};}catch{return null;}}));if(this.store.get('labId')!==lab||!this.store.get('auth'))return;let changed=false;for(const result of results.filter(Boolean)){const different=this.store.cached(result.url)?.body!==result.body;if(cache.commitRead(this.store,result.ticket,result.status,'application/json',result.body)&&different)changed=true;this.online=true;}if(changed)this.revision++;}finally{this.liveFlight=false;}}
 async pause(){this.paused=true;if(this.flight)await this.flight} resume(){this.paused=false}
 run(){if(this.flight)return this.flight;if(this.paused||!this.store.get('labId'))return Promise.resolve({ok:false,error:'login_required',pulled:false,sent:0});this.running=true;this.flight=this.perform().catch(error=>this.failedRun(error)).finally(()=>{this.running=false;this.phase='idle';this.flight=null});return this.flight}
 failedRun(error){this.online=false;this.lastError='sync_internal_error';const now=new Date().toISOString();let state={pending:0,conflicts:[]};try{state=this.store.status()}catch{}this.report={ok:false,pulled:false,pulledCount:0,failedPulls:PULL.length,sent:0,pending:state.pending||0,conflicts:state.conflicts?.length||0,error:this.lastError,startedAt:now,finishedAt:now};try{this.store.set('lastSyncReport',this.report)}catch{}return this.report}
 async perform(){if(this.isOnline()===false){this.online=false;this.lastError='internet_offline';return {ok:false,error:'internet_offline',sent:0,pulled:false};}const startedAt=new Date().toISOString();let sent=0,pulled=0;this.phase='upload';this.lastError=null;const accessForLocal=await checkWriteAccess(this.store,this.request);if(accessForLocal.allowed){if(this.store.get('localBusinessActive:'+this.store.get('labId')))sent+=(await require('./local-business-sync.cjs').syncBusiness(this.store,this.request,this.verifyLocalFiles,this.renderOfflinePdf)).sent;else sent+=await require('./offline-orders.cjs').syncLocalOrders(this.store,this.request,this.verifyLocalFiles);}
  if(this.paused||!this.store.get('auth')||!this.store.get('labId'))return {ok:false,error:'login_required',sent,pulled:false};
  // A 409 from an idempotent write is safe to replay with the same durable
  // operation ID. Retry these automatically after a quiet period; never replay
  // an ambiguous delivery of a non-idempotent action.
  const retryBefore=Date.now()-SAFE_CONFLICT_RETRY_MS;
  for(const row of this.store.rows().filter(x=>x.state==='conflict'&&isIdempotent(x.method,x.url)&&Number(x.error?.httpStatus)===409)){
   const updated=Date.parse(row.updated_at||'');if(Number.isFinite(updated)&&updated<=retryBefore)this.store.retry(row.id);
  }
  for(const row of this.store.rows().filter(x=>x.state==='pending')){
   if(this.store.get('documentPolicy:'+this.store.get('labId'))&&/^\/api\/lab\/(?:orders|order-files|invoices|finance|delegated-orders|delegated-customers|customers)(?:\/|$)/.test(new URL(row.url,'http://localhost').pathname)){this.store.conflict(row.id,{error:'legacy_policy_review'});continue;}
   const invoiceOrder=require('./live-finance.cjs').invoiceOrderId(row.method,row.url,row.body);
   if(invoiceOrder&&this.store.rows().some(x=>x.seq<row.seq&&x.state==='conflict'&&require('./live-finance.cjs').orderMutationTargets(x,invoiceOrder)))continue;
   if(!exempt(row.method,row.url)){const access=await checkWriteAccess(this.store,this.request);if(!access.allowed){this.lastError=access.error;break}}
   let body=row.body||{};const safe=isIdempotent(row.method,row.url);if(safe&&body&&typeof body==='object'&&!Array.isArray(body)&&!body.desktopOperationId)body={...body,desktopOperationId:row.id};let response;
   try{response=await this.request(row.url,{method:row.method,body:JSON.stringify(body),headers:{'x-photobridge-device-id':'pblab-'+this.store.get('deviceId')}})}catch(e){this.online=false;this.lastError=this.isOnline()===false?'internet_offline':'server_unavailable';if(!safe)this.store.conflict(row.id,{error:'delivery_unknown',message:'وضعیت ارسال این عملیات نامشخص است؛ قبل از ارسال دوباره بررسی کن.'});break}
   let data={};try{data=await response.json()}catch{}
   if(response.ok){this.store.done(row.id);sent++;continue}
   if([400,409,422].includes(response.status)){this.store.conflict(row.id,{...data,httpStatus:response.status});break}
   if([401,403].includes(response.status)){this.lastError='login_required';break}
   this.lastError=data.error||'server_error';break;
  }
  if(this.paused||!this.store.get('auth')||!this.store.get('labId'))return {ok:false,error:'login_required',sent,pulled:false};
  if(this.repairLocalStorage)await this.repairLocalStorage();
  this.phase='download';
  if(this.lastError!=='login_required'){
   try{
    const me=await this.request('/api/auth/me');if(!me.ok)throw Object.assign(Error('login_required'),{status:me.status});
    const results=await Promise.all(PULL.map(async url=>{
      try{const ticket=require('./read-cache.cjs').beginRead(this.store,url),r=await this.request(url);if(!r.ok)return false;const bytes=Buffer.from(await r.arrayBuffer()),mime=r.headers.get('content-type')||'application/json';if(!mime.includes('application/json')||bytes.length>=12e6)return false;require('./read-cache.cjs').commitRead(this.store,ticket,r.status,mime,bytes.toString('base64'));return true;}catch{return false}
    }));
    pulled=results.filter(Boolean).length;this.online=true;if(pulled){this.store.set('lastSync',new Date().toISOString());this.revision++;}if(pulled<PULL.length)this.lastError=pulled?'partial_sync':'sync_no_data';
   }catch(e){this.online=false;this.lastError=e.status===401||e.status===403?'login_required':this.isOnline()===false?'internet_offline':'server_unavailable'}
  }
  if(pulled===PULL.length)await require('./prepare-offline-data.cjs').prepareOfflineData(this.store,this.request);
  if(pulled===PULL.length&&this.store.get('localBusinessActive:'+this.store.get('labId')))new (require('./local-business.cjs').LocalBusiness)(this.store).absorbRemote();
  const state=this.store.status(),ok=this.online&&!this.lastError&&!state.pending&&!state.conflicts.length&&!state.localOrders?.length&&!(this.store.get('localBusinessActive:'+this.store.get('labId'))&&this.store.get('localBusiness:v1:'+this.store.get('labId'))?new (require('./local-business.cjs').LocalBusiness)(this.store).status().pending:0);this.report={ok,pulled:!!pulled,pulledCount:pulled,failedPulls:PULL.length-pulled,sent,pending:state.pending+(state.localOrders?.length||0),conflicts:state.conflicts.length,error:this.lastError,startedAt,finishedAt:new Date().toISOString()};this.store.set('lastSyncReport',this.report);return this.report;
 }
 status(){const s=this.store.status(),connected=this.isOnline()!==false;return{...s,online:this.online&&connected&&!this.paused,syncing:this.running,phase:this.phase,revision:this.revision,error:!connected?'internet_offline':this.lastError,report:this.report||this.store.get('lastSyncReport'),signedIn:!!this.store.get('auth')}}
}
module.exports={Sync,isIdempotent,SAFE_CONFLICT_RETRY_MS};
