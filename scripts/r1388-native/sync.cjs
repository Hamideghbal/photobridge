'use strict';
const {exempt,checkWriteAccess}=require('./write-access.cjs');
const IDEMPOTENT=[
 ['POST',/^\/api\/lab\/invoices\/manual$/],['POST',/^\/api\/lab\/finance\/payments$/],['PUT',/^\/api\/lab\/finance\/customer-settings$/],['POST',/^\/api\/lab\/finance\/customer-adjustments$/],['POST',/^\/api\/lab\/finance\/expenses$/],['POST',/^\/api\/lab\/finance\/corrections$/],['PUT',/^\/api\/lab\/orders\/[0-9a-f-]{36}\/invoice-pricing$/i]
];
const PULL=[
 '/api/lab/dashboard','/api/lab/orders','/api/lab/archive','/api/lab/invoices','/api/lab/finance/summary','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/delegated-orders/bootstrap','/api/lab/subscription'
];
const isIdempotent=(m,u)=>IDEMPOTENT.some(([mm,re])=>m===mm&&re.test(u));
class Sync{
 constructor({store,request,isOnline=()=>true}){Object.assign(this,{store,request,isOnline});this.running=false;this.online=false;this.paused=false;this.lastError=null;this.flight=null;this.phase='idle';this.revision=0;this.report=null;}
 async pause(){this.paused=true;if(this.flight)await this.flight} resume(){this.paused=false}
 run(){if(this.flight)return this.flight;if(this.paused||!this.store.get('labId'))return Promise.resolve({ok:false,error:'login_required',pulled:false,sent:0});this.running=true;this.flight=this.perform().finally(()=>{this.running=false;this.phase='idle';this.flight=null});return this.flight}
 async perform(){const startedAt=new Date().toISOString();let sent=0,pulled=0;this.phase='upload';this.lastError=null;
  await checkWriteAccess(this.store,this.request);
  for(const row of this.store.rows().filter(x=>x.state==='pending')){
   if(!exempt(row.method,row.url)){const access=await checkWriteAccess(this.store,this.request);if(!access.allowed){this.lastError=access.error;break}}
   let body=row.body||{};const safe=isIdempotent(row.method,row.url);if(safe&&body&&typeof body==='object'&&!Array.isArray(body)&&!body.desktopOperationId)body={...body,desktopOperationId:row.id};let response;
   try{response=await this.request(row.url,{method:row.method,body:JSON.stringify(body),headers:{'x-photobridge-device-id':'pblab-'+this.store.get('deviceId')}})}catch(e){this.online=false;this.lastError=this.isOnline()===false?'internet_offline':'server_unavailable';if(!safe)this.store.conflict(row.id,{error:'delivery_unknown',message:'وضعیت ارسال این عملیات نامشخص است؛ قبل از ارسال دوباره بررسی کن.'});break}
   let data={};try{data=await response.json()}catch{}
   if(response.ok){this.store.done(row.id);sent++;continue}
   if([400,409,422].includes(response.status)){this.store.conflict(row.id,data);break}
   if([401,403].includes(response.status)){this.lastError='login_required';break}
   this.lastError=data.error||'server_error';break;
  }
  this.phase='download';
  if(this.lastError!=='login_required'){
   try{
    const me=await this.request('/api/auth/me');if(!me.ok)throw Object.assign(Error('login_required'),{status:me.status});
    for(const url of PULL){
      try{const r=await this.request(url);if(!r.ok)continue;const bytes=Buffer.from(await r.arrayBuffer()),mime=r.headers.get('content-type')||'application/json';if(mime.includes('application/json')&&bytes.length<12e6){this.store.cache(url,r.status,mime,bytes.toString('base64'));pulled++;}}catch{}
    }
    this.online=true;this.store.set('lastSync',new Date().toISOString());if(pulled)this.revision++;
   }catch(e){this.online=false;this.lastError=e.status===401||e.status===403?'login_required':this.isOnline()===false?'internet_offline':'server_unavailable'}
  }
  const state=this.store.status(),ok=this.online&&!this.lastError&&!state.pending&&!state.conflicts.length;this.report={ok,pulled:!!pulled,pulledCount:pulled,sent,pending:state.pending,conflicts:state.conflicts.length,error:this.lastError,startedAt,finishedAt:new Date().toISOString()};this.store.set('lastSyncReport',this.report);return this.report;
 }
 status(){const s=this.store.status(),connected=this.isOnline()!==false;return{...s,online:this.online&&connected&&!this.paused,syncing:this.running,phase:this.phase,revision:this.revision,error:!connected?'internet_offline':this.lastError,report:this.report||this.store.get('lastSyncReport'),signedIn:!!this.store.get('auth')}}
}
module.exports={Sync,isIdempotent};
