'use strict';
const {LocalBusiness}=require('./local-business.cjs');
const {beginRead,commitRead}=require('./read-cache.cjs');
const states=new WeakMap();
const routes=[['/api/lab/invoices','invoices'],['/api/lab/finance/summary','summary'],['/api/lab/finance/payments','payments'],['/api/lab/finance/expenses','expenses'],['/api/lab/finance/ledger','transactions']];

function accountGate(store,lab,account,getAccount){
  if(store.get('labId')!==lab||!store.get('auth')||getAccount?.()!==account)
    throw Object.assign(Error('account_changed'),{status:401,code:'account_changed'});
}
async function refreshFinance(store,request,{force=false,focus=null,scope,getAccount,getScope,warm=false}={}){
  const lab=store.get('labId'),account=getAccount?.(),now=Date.now();
  function currentGate(){accountGate(store,lab,account,getAccount);if(getScope&&getScope()!==scope)throw Object.assign(Error('finance_view_changed'),{status:409,code:'finance_view_changed'});}
  currentGate();
  let state=states.get(store);
  if(!state||state.lab!==lab||state.scope!==scope||(!state.flight&&now>=state.warmUntil&&(force||now-state.finishedAt>=1000))){
    state={lab,scope,finishedAt:0,warmUntil:0,warm,result:null,jobs:new Map(),committed:new Set(),flight:null};
    states.set(store,state);
    const current=state;
    const load=async(url,key)=>{
      const ticket=beginRead(store,url);
      try{
        const response=await request(url,{signal:AbortSignal.timeout(3500)});
        if(!response.ok)return{url,ok:false,status:response.status};
        const bytes=Buffer.from(await response.arrayBuffer());
        if(bytes.length>=12e6)return{url,ok:false};
        const data=JSON.parse(bytes.toString());
        if(key==='summary'?!data.summary||typeof data.summary!=='object':!Array.isArray(data[key]))return{url,ok:false};
        currentGate();
        return{url,key,ticket,ok:true,status:response.status,body:bytes.toString('base64')};
      }catch(error){
        if(error?.code==='account_changed'||error?.code==='finance_view_changed')throw error;
        return{url,ok:false};
      }
    };
    for(const[url,key]of routes)current.jobs.set(url,load(url,key));
    current.commit=result=>{
      if(!result?.ok||current.committed.has(result.url))return result;
      currentGate();
      current.committed.add(result.url);
      const accepted=commitRead(store,result.ticket,result.status,'application/json',result.body);
      if(accepted&&result.key==='invoices')new LocalBusiness(store).refreshInvoiceSnapshot();
      return result;
    };
    // Every request is started in parallel. Only the selected finance section
    // needs to settle before its own response; the remaining sections finish
    // independently and are reconciled when all have settled.
    // Reconcile accounting inputs without waiting for the journal.
    current.overview=Promise.all(routes.slice(0,-1).map(([url])=>current.jobs.get(url))).then(results=>{
      currentGate();
      for(const item of results)current.commit(item);
      if(results.every(item=>item.ok))new LocalBusiness(store).absorbRemote({financeOnly:true});
      return {complete:results.every(item=>item.ok),invoicesFresh:results[0].ok,updatedAt:new Date().toISOString()};
    });
    void current.overview.catch(()=>{});
    current.flight=Promise.all([...current.jobs.values()]).then(async results=>{
      await current.overview;
      currentGate();
      for(const item of results)current.commit(item);
      const engine=new LocalBusiness(store);
      engine.refreshInvoiceSnapshot();
      const complete=results.every(item=>item.ok);
      if(complete)engine.absorbRemote({financeOnly:true});
      const result={complete,invoicesFresh:results[0].ok,updatedAt:new Date().toISOString()};
      store.set('financeRefresh:'+lab,result);
      current.result=result;
      current.finishedAt=Date.now();
      if(current.warm&&complete)current.warmUntil=current.finishedAt+5000;
      return result;
    }).finally(()=>{current.flight=null;});
    // A focused reader may return before another finance endpoint settles.
    // Keep account-change rejections observed until the entire flight ends.
    void current.flight.catch(()=>{});
  }
  if(warm)state.warm=true;
  if(focus==='overview'||focus==='/api/lab/finance/summary'||focus==='/api/lab/finance/payments'||focus==='/api/lab/finance/expenses'){
    const result=await state.overview;currentGate();return state.result||result;
  }
  if(focus==='/api/lab/finance/ledger'){const result=await (state.flight||state.result);currentGate();return result;}
  if(focus&&state.jobs.has(focus)){
    const selected=state.commit(await state.jobs.get(focus));currentGate();
    return state.result||{complete:false,invoicesFresh:focus==='/api/lab/invoices'&&selected.ok,updatedAt:new Date().toISOString()};
  }
  const result=await (state.flight||state.result);currentGate();return result;
}
module.exports={refreshFinance,routes};
