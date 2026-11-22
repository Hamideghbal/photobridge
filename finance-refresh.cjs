'use strict';
const {LocalBusiness}=require('./local-business.cjs');
const {beginRead,commitRead}=require('./read-cache.cjs');
const states=new WeakMap();
const routes=[['/api/lab/invoices','invoices'],['/api/lab/finance/summary','summary'],['/api/lab/finance/payments','payments'],['/api/lab/finance/expenses','expenses'],['/api/lab/finance/ledger','transactions']];

function accountGate(store,lab){
  if(store.get('labId')!==lab||!store.get('auth'))
    throw Object.assign(Error('account_changed'),{status:401,code:'account_changed'});
}
async function refreshFinance(store,request,{force=false,focus=null}={}){
  const lab=store.get('labId');
  let state=states.get(store);
  if(!state||state.lab!==lab||(!state.flight&&(force||Date.now()-state.finishedAt>=1000))){
    state={lab,finishedAt:0,result:null,jobs:new Map(),committed:new Set(),flight:null};
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
        accountGate(store,lab);
        return{url,key,ticket,ok:true,status:response.status,body:bytes.toString('base64')};
      }catch(error){
        if(error?.code==='account_changed')throw error;
        return{url,ok:false};
      }
    };
    for(const[url,key]of routes)current.jobs.set(url,load(url,key));
    current.commit=result=>{
      if(!result?.ok||current.committed.has(result.url))return result;
      accountGate(store,lab);
      current.committed.add(result.url);
      const accepted=commitRead(store,result.ticket,result.status,'application/json',result.body);
      if(accepted&&result.key==='invoices')new LocalBusiness(store).refreshInvoiceSnapshot();
      return result;
    };
    // Every request is started in parallel. Only the selected finance section
    // needs to settle before its own response; the remaining sections finish
    // independently and are reconciled when all have settled.
    current.flight=Promise.all([...current.jobs.values()]).then(results=>{
      accountGate(store,lab);
      for(const item of results)current.commit(item);
      const engine=new LocalBusiness(store);
      engine.refreshInvoiceSnapshot();
      const complete=results.every(item=>item.ok);
      if(complete)engine.absorbRemote({financeOnly:true});
      const result={complete,invoicesFresh:results[0].ok,updatedAt:new Date().toISOString()};
      store.set('financeRefresh:'+lab,result);
      current.result=result;
      current.finishedAt=Date.now();
      return result;
    }).finally(()=>{current.flight=null;});
    // A focused reader may return before another finance endpoint settles.
    // Keep account-change rejections observed until the entire flight ends.
    void current.flight.catch(()=>{});
  }
  if(focus&&state.jobs.has(focus)){
    const selected=state.commit(await state.jobs.get(focus));
    return state.result||{complete:false,invoicesFresh:focus==='/api/lab/invoices'&&selected.ok,updatedAt:new Date().toISOString()};
  }
  return state.flight||state.result;
}
module.exports={refreshFinance,routes};
