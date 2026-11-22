'use strict';
const {beginRead,commitRead,confirmWrite}=require('./read-cache.cjs');

const customerId='([0-9a-f-]{36})';
const debtPath=new RegExp('^/api/lab/(delegated-customers|finance/customer-initial-debt|intake-live/download/customers)/'+customerId+'/(account-summary|adjust-initial-debt)$','i');
const aliasPath=new RegExp('^/api/lab/photographer-folder-alias/'+customerId+'$','i');
const namePath=new RegExp('^/api/lab/customers/'+customerId+'$','i');
const catalog='/api/lab/print-catalog';
const financeReads=['/api/lab/finance/summary','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/finance/ledger'];
const has=(body,key)=>body!=null&&Object.hasOwn(body,key);

function liveEditRoute(method,path,body){
 const debt=path.match(debtPath);
 if(debt&&((method==='GET'&&debt[3]==='account-summary')||(method==='POST'&&debt[3]==='adjust-initial-debt')))
  return {kind:'debt',customerId:debt[2],action:debt[3],legacy:debt[1]==='delegated-customers'};
 if(method==='PUT'&&aliasPath.test(path))return {kind:'name'};
 if(method==='PATCH'&&namePath.test(path)&&has(body,'temporaryName'))return {kind:'name'};
 if((method==='PATCH'&&path===catalog+'/type'||method==='POST'&&path===catalog)&&(has(body,'name')||has(body,'latinName')))
  return {kind:'catalog'};
 return null;
}

async function forwardLiveEdit({route,req,res,url,bytes,contentType,store,request,isOnline,scope,getScope,json}){
 if(scope!==getScope()){json(res,401,{error:'account_changed'});return true;}
 const writing=req.method!=='GET';
 let upstream=req.url;
 if(route.kind==='debt'){
  const customer=store.get('localBusiness:v1:'+store.get('labId'))?.customers?.[route.customerId];
  if(!writing&&route.legacy&&(isOnline()===false||customer?.origin_offline&&!customer.serverId&&!customer.remote))return false;
  if(customer?.origin_offline&&!customer.serverId&&!customer.remote){
   json(res,409,{error:'customer_requires_sync',message:'ابتدا حساب مشتری باید با سرور همگام شود.'});
   return true;
  }
  upstream='/api/lab/delegated-customers/'+(customer?.serverId||route.customerId)+'/'+route.action+url.search;
 }
 const unconfirmed=()=>json(res,503,{error:'live_edit_connection_required',message:writing
  ?'ذخیره در سرور تأیید نشد. پیش از تلاش دوباره، مقدار فعلی را بازخوانی کنید.'
  :'دریافت وضعیت حساب از سرور انجام نشد. پس از اتصال دوباره تلاش کنید.'});
 if(isOnline()===false){unconfirmed();return true;}
 try{
  const response=await request(upstream,{method:req.method,signal:AbortSignal.timeout(8000),
   ...(writing?{body:bytes,headers:{'Content-Type':contentType||'application/json'}}:{})});
  const mime=response.headers.get('content-type')||'application/json';
  const body=Buffer.from(await response.arrayBuffer());
  if(scope!==getScope()){json(res,401,{error:'account_changed'});return true;}
  if(response.ok){
   if(response.status===202){unconfirmed();return true;}
   const data=JSON.parse(body.toString());
   if(data?.desktopPending||data?.queued||(writing&&data?.ok!==true)){unconfirmed();return true;}
   if(!writing&&route.kind==='debt'&&
      (data?.initialDebt==null||!Number.isFinite(Number(data.initialDebt))||typeof data.canEditInitialDebt!=='boolean')){
    json(res,502,{error:'invalid_customer_account_summary',message:'مبلغ و وضعیت اجازهٔ ویرایش از سرور دریافت نشد.'});
    return true;
   }
   if(writing&&route.kind==='debt')confirmWrite(store,financeReads);
   if(writing&&route.kind==='catalog'&&data?.catalog){
    const ticket=beginRead(store,catalog);
    commitRead(store,ticket,200,'application/json',Buffer.from(JSON.stringify({catalog:data.catalog})).toString('base64'));
   }
  }
  res.writeHead(response.status,{'Content-Type':mime,'Cache-Control':'no-store'});
  res.end(body);
 }catch{
  if(scope!==getScope())json(res,401,{error:'account_changed'});
  else unconfirmed();
 }
 return true;
}

module.exports={liveEditRoute,forwardLiveEdit};
