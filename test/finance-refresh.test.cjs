const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{LabStore}=require('../store.cjs'),{LocalBusiness}=require('../local-business.cjs'),{applyPolicy}=require('../document-policy.cjs'),{refreshFinance}=require('../finance-refresh.cjs');
function fixture(){const store=new LabStore(':memory:');store.set('labId','A');store.set('auth',{user:{}});applyPolicy(store);return{store,engine:new LocalBusiness(store)};}
function source(state){return async url=>Response.json(url==='/api/lab/invoices'?{invoices:state.invoices}:url==='/api/lab/finance/summary'?{summary:{invoiced:state.invoices.reduce((s,i)=>s+i.total,0)},customers:state.customers}:url.endsWith('/payments')?{payments:[]}:url.endsWith('/expenses')?{expenses:[]}:{transactions:[]});}
test('fresh invoices for a new customer render without requiring a previous customer snapshot',async()=>{const f=fixture(),customer=crypto.randomUUID(),id=crypto.randomUUID(),remote={invoices:[{id,number:900,customer_id:customer,customer_name:'مشتری جدید',items:[{description:'چاپ',quantity:1,unitPrice:100,lineTotal:100}],total:100,paid_total:0,issued_at:new Date().toISOString()}],customers:[]};try{await refreshFinance(f.store,source(remote),{force:true});const row=f.engine.read('/api/lab/invoices').invoices.find(i=>i.id===id);assert.equal(row.customer_name,'مشتری جدید');assert.equal(row.balance,100);assert.equal(row.customer_total_debt,100);remote.invoices[0]={...remote.invoices[0],total:150,paid_total:50,items:[{description:'جدید',quantity:1,unitPrice:150,lineTotal:150}]};await refreshFinance(f.store,source(remote),{force:true});const changed=f.engine.read('/api/lab/invoices').invoices.find(i=>i.id===id);assert.equal(changed.total,150);assert.equal(changed.paid_total,50);assert.equal(changed.items[0].description,'جدید');}finally{f.store.db.close()}});
test('opening finance preserves independent OFF invoices and a confirmed order stage',async()=>{const f=fixture();try{const customer=f.engine.handle('POST','/api/lab/customers',{name:'آفلاین'},crypto.randomUUID(),{isolated:true}).customer,invoice=f.engine.handle('POST','/api/lab/invoices/manual',{customerId:customer.id,items:[{description:'سند مستقل',unitPrice:100}]},crypto.randomUUID(),{isolated:true}).invoice;const state=f.engine.state(),order=crypto.randomUUID();state.orders[order]={id:order,remote:true,status:'printing'};f.store.set(f.engine.key(),state);f.store.cache('/api/lab/orders',200,'application/json',Buffer.from(JSON.stringify({orders:[{id:order,status:'downloaded'}]})).toString('base64'));await refreshFinance(f.store,source({invoices:[],customers:[]}),{force:true});assert.equal(f.engine.state().orders[order].status,'printing');assert.equal(f.engine.read('/api/lab/invoices').invoices.find(i=>i.id===invoice.id).number,invoice.number);assert(!f.engine.state().invoices[invoice.id].inBaseline);}finally{f.store.db.close()}});
test('partial refresh adds invoices without clearing cached data or failing on a missing customer',async()=>{const f=fixture(),id=crypto.randomUUID();try{await refreshFinance(f.store,async url=>{if(url!=='/api/lab/invoices')throw Error('unavailable');return Response.json({invoices:[{id,number:901,customer_id:crypto.randomUUID(),customer_name:'جدید',total:200,paid_total:0,issued_at:new Date().toISOString()}]});},{force:true});assert.equal(f.engine.read('/api/lab/invoices').invoices[0].number,901);assert.equal(f.store.get('financeRefresh:A').complete,false);}finally{f.store.db.close()}});
test('fresh invoices lead the local invoice list even after many older documents were stored first',async()=>{const f=fixture(),customer=crypto.randomUUID(),make=(number)=>({id:crypto.randomUUID(),number,customer_id:customer,total:100,paid_total:0,issued_at:new Date(1700000000000+number*1000).toISOString()});try{const invoices=Array.from({length:80},(_,i)=>make(i+1));await refreshFinance(f.store,source({invoices,customers:[]}),{force:true});invoices.push(make(901));await refreshFinance(f.store,source({invoices,customers:[]}),{force:true});const rows=f.engine.read('/api/lab/invoices').invoices;assert.equal(rows.length,81);assert.equal(rows[0].number,901);assert.equal(rows[1].number,80);}finally{f.store.db.close()}});

test('selected invoices do not wait for a deliberately blocked ledger',async()=>{
 const f=fixture();
 let releaseLedger=()=>{};
 const delayedLedger=new Promise(resolve=>{releaseLedger=()=>resolve(Response.json({transactions:[]}));});
 const invoiceId=crypto.randomUUID();
 const request=async url=>{
  if(url==='/api/lab/finance/ledger')return delayedLedger;
  if(url==='/api/lab/invoices')return Response.json({invoices:[{
   id:invoiceId,number:1962,customer_id:crypto.randomUUID(),customer_name:'مشتری',total:100,paid_total:0,issued_at:new Date().toISOString()
  }]});
  if(url==='/api/lab/finance/summary')return Response.json({summary:{invoiced:100},customers:[]});
  if(url.endsWith('/payments'))return Response.json({payments:[]});
  if(url.endsWith('/expenses'))return Response.json({expenses:[]});
  throw Error('unexpected_route');
 };
 try{
  const focused=await Promise.race([
   refreshFinance(f.store,request,{force:true,focus:'/api/lab/invoices'}),
   new Promise((_,reject)=>setTimeout(()=>reject(Error('invoices_blocked_by_ledger')),2500))
  ]);
  assert.equal(focused.invoicesFresh,true);
  assert(f.engine.read('/api/lab/invoices').invoices.some(inv=>inv.id===invoiceId));
  releaseLedger();
  const completed=await refreshFinance(f.store,request);
  assert.equal(completed.complete,true);
 }finally{releaseLedger();f.store.db.close()}
});

test('a prepared finance dashboard reuses its verified invoice and summary reads within the same account and generation',async()=>{
 const f=fixture(),calls=[];
 const data={invoices:[],customers:[]};
 const request=async url=>{calls.push(url);return source(data)(url);};
 let scope='lab-A:0',account='user-1';
 const getAccount=()=>account;
 const options=()=>({scope,getAccount});
 try{
  await refreshFinance(f.store,request,{...options(),warm:true});
  assert.equal(calls.length,5);
  const invoices=await refreshFinance(f.store,request,{...options(),focus:'/api/lab/invoices',force:true});
  const summary=await refreshFinance(f.store,request,{...options(),focus:'/api/lab/finance/summary'});
  assert.equal(invoices.complete,true);
  assert.equal(summary.complete,true);
  assert.equal(calls.length,5);
  data.invoices.push({id:crypto.randomUUID(),number:146,customer_id:crypto.randomUUID(),total:125,issued_at:new Date().toISOString()});
  scope='lab-A:1';
  await refreshFinance(f.store,request,{...options(),focus:'/api/lab/invoices',force:true});
  assert.equal(f.engine.read('/api/lab/invoices').invoices[0].number,146);
  await refreshFinance(f.store,request,options());
  assert.equal(calls.length,10);
 }finally{f.store.db.close();}
});

test('preloading finance discards responses when the account changes during a request',async()=>{
 const f=fixture();
 let account='first',release;
 const delayed=new Promise(resolve=>{release=resolve;});
 try{
  const warming=refreshFinance(f.store,async url=>{await delayed;return source({invoices:[],customers:[]})(url);},{
   warm:true,scope:account,getAccount:()=>account
  });
  account='second';
  release();
  await assert.rejects(warming,{code:'account_changed'});
  assert.equal(f.store.cached('/api/lab/invoices'),null);
 }finally{release();f.store.db.close();}
});

test('the finance overview reconciles the current totals without waiting for the ledger',async()=>{
 const f=fixture();
 let release;
 const waiting=new Promise(resolve=>{release=()=>resolve(Response.json({transactions:[]}));});
 const request=async url=>url.endsWith('/ledger')?waiting:source({
  invoices:[{id:crypto.randomUUID(),number:147,total:147,issued_at:new Date().toISOString()}],customers:[]
 })(url);
 try{
  const overview=refreshFinance(f.store,request,{focus:'overview'});
  await Promise.race([overview,new Promise((_,reject)=>setTimeout(()=>reject(Error('ledger blocked dashboard')),1000))]);
  assert.equal(f.engine.read('/api/lab/finance/summary').summary.invoiced,147);
  release();
  assert.equal((await refreshFinance(f.store,request)).complete,true);
 }finally{release();f.store.db.close();}
});
