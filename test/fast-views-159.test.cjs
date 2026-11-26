'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{LabStore}=require('../store.cjs'),{refreshFinance}=require('../finance-refresh.cjs'),{LocalBusiness}=require('../local-business.cjs'),{applyPolicy}=require('../document-policy.cjs'),{createHost}=require('../host.cjs');
const crypto=require('node:crypto');
function fixture(){const store=new LabStore(':memory:');store.set('labId','A');store.set('auth',{user:{id:'first'}});applyPolicy(store);return store}
function payload(url,payment){return url.endsWith('/invoices')?{invoices:[]}:url.endsWith('/summary')?{summary:{paid:payment.amount},customers:[]}:url.endsWith('/payments')?{payments:[payment]}:url.endsWith('/expenses')?{expenses:[]}:{transactions:[]}}
test('payments and financial overview reconcile without waiting for a blocked ledger',async()=>{
 const store=fixture(),payment={id:crypto.randomUUID(),amount:125};let release;
 const blocked=new Promise(resolve=>release=()=>resolve(Response.json({transactions:[]})));
 const request=async url=>url.endsWith('/ledger')?blocked:Response.json(payload(url,payment));
 try{const result=await Promise.race([refreshFinance(store,request,{focus:'/api/lab/finance/payments'}),new Promise((_,reject)=>setTimeout(()=>reject(Error('ledger blocked payments')),800))]);assert(result);assert.equal(new LocalBusiness(store).read('/api/lab/finance/payments').payments[0].amount,125);release();await refreshFinance(store,request)}finally{release();store.db.close()}
});
test('server generation change rejects old financial responses even within the same account',async()=>{
 const store=fixture();let release,generation='0';const blocked=new Promise(resolve=>release=resolve);
 const payment={id:crypto.randomUUID(),amount:50};
 try{const old=refreshFinance(store,async url=>{await blocked;return Response.json(payload(url,payment))},{scope:generation,getScope:()=>generation});
 generation='1';release();await assert.rejects(old,{code:'finance_view_changed'});assert.equal(store.cached('/api/lab/invoices'),null);
 await refreshFinance(store,async url=>Response.json(payload(url,payment)),{scope:generation,getScope:()=>generation});assert.equal(new LocalBusiness(store).read('/api/lab/finance/payments').payments[0].amount,50);
 }finally{release();store.db.close()}
});
test('external change invalidates prepared order pages without using the other mode or account',async()=>{
 const store=fixture();let calls=0;const server=createHost({store,token:'test',sync:{},request:async url=>{const q=new URL(url,'http://localhost').searchParams;return Response.json({orders:[{id:q.get('mode')+'-'+(++calls)}],total:1,pages:1,counts:{flow:1,ready:0,completed:0}})}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port,headers={Cookie:'desktop=test',Connection:'close'};
 const open=mode=>fetch(origin+'/api/lab/orders?paged=1&mode='+mode+'&stage=flow&page=1&q=&pbNativeOpen=1',{headers}).then(r=>r.json());
 try{await fetch(origin+'/desktop/warm-view?view=print',{headers});assert.equal((await open('print')).orders[0].id,'print-1');server.invalidateViews();assert.equal((await open('print')).orders[0].id,'print-2');assert.equal((await open('album')).orders[0].id,'album-3');}finally{server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));store.db.close()}
});
