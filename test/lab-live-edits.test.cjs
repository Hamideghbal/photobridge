'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {LabStore}=require('../store.cjs'),{createHost}=require('../host.cjs'),{Sync}=require('../sync.cjs');

const customer=crypto.randomUUID();
const customers='/api/lab/customers/'+customer;
const alias='/api/lab/photographer-folder-alias/'+customer;
const account='/api/lab/delegated-customers/'+customer;
const debtAlias='/api/lab/finance/customer-initial-debt/'+customer;
const catalog='/api/lab/print-catalog';
const license=(labId='A')=>({labId,allowed:true,serverNow:new Date().toISOString(),activeUntil:'2035-01-01T00:00:00Z'});

async function fixture(request){
 const store=new LabStore(':memory:');
 store.set('labId','A');store.set('auth',{user:{labRole:'lab_admin'}});store.set('localBusinessActive:A',true);
 let online=true;
 const host=createHost({store,request,token:'test',sync:{},isOnline:()=>online});
 await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+host.address().port;
 return {store,setOffline:()=>{online=false;},
  call:async(path,method='GET',body)=>{
   const response=await fetch(origin+path,{method,headers:{
    Cookie:'desktop=test',Connection:'close','Content-Type':'application/json','x-photobridge-local-operation':'local-operation',
   },...(body?{body:JSON.stringify(body)}:{})});
   return {status:response.status,data:await response.json()};
  },
  close:async()=>{await new Promise(resolve=>host.close(resolve));store.db.close();}
 };
}

test('photographer names and both print model names are confirmed with the original API payload despite a pending order',async()=>{
 const label={temporaryName:'عکاسی مینا'},folder={folderLatinName:'Mina Photo'};
 const types=[{id:'chassis',name:'شاسی کلاسیک',latinName:'Classic Chassis'},{id:'frame',name:'قاب چوبی',latinName:'Wood Frame'}];
 const edits=[];
 const f=await fixture(async(path,options={})=>{
  if(path==='/api/lab/write-access')return Response.json(license());
  const body=options.body?JSON.parse(options.body.toString()):null;
  edits.push({path,method:options.method,body});
  if(path===customers&&Object.keys(body).length!==1)return Response.json({error:'invalid_temporary_name_request'},{status:400});
  if(path===customers)return Response.json({ok:true,name:body.temporaryName});
  if(path===alias)return Response.json({ok:true,folderLatinName:body.folderLatinName});
  if(path===catalog+'/type')return Response.json({ok:true,catalog:{types:[body]}});
  throw Error('unexpected route '+path);
 });
 try{
  f.store.enqueue('PATCH','/api/lab/orders/'+crypto.randomUUID(),{status:'ready'});
  assert.deepEqual(await f.call(customers,'PATCH',label),{status:200,data:{ok:true,name:label.temporaryName}});
  assert.deepEqual(await f.call(alias,'PUT',folder),{status:200,data:{ok:true,...folder}});
  for(const model of types){
   const result=await f.call(catalog+'/type','PATCH',model);
   assert.deepEqual(result,{status:200,data:{ok:true,catalog:{types:[model]}}});
  }
  assert.deepEqual(edits.map(e=>e.body),[label,folder,...types]);
  assert.equal(f.store.rows().length,1);
 }finally{await f.close();}
});

test('account summary and initial debt edits use the authoritative server and retain conflict handling',async()=>{
 const calls=[];
 let amount=20000;
 const f=await fixture(async(path,options={})=>{
  if(path==='/api/lab/write-access')return Response.json(license());
  calls.push(path);
  if(path===account+'/account-summary')return Response.json({ok:true,initialDebt:amount,canEditInitialDebt:true,hasInvoice:true,initialDebtHistory:[]});
  if(path===account+'/adjust-initial-debt'){
   const body=JSON.parse(options.body.toString());
   if(body.expectedInitialDebt!==amount)return Response.json({error:'initial_debt_changed',initialDebt:amount},{status:409});
   amount=body.initialDebt;
   return Response.json({ok:true,initialDebt:amount,canEditInitialDebt:true});
  }
  throw Error('unexpected route '+path);
 });
 try{
  for(const base of [account,debtAlias,'/api/lab/intake-live/download/customers/'+customer]){
   const read=await f.call(base+'/account-summary');
   assert.equal(read.status,200);
   assert.equal(read.data.initialDebt,20000);
   assert.equal(read.data.canEditInitialDebt,true);
  }
  const rejected=await f.call(debtAlias+'/adjust-initial-debt','POST',{initialDebt:25000,expectedInitialDebt:19000});
  assert.deepEqual(rejected,{status:409,data:{error:'initial_debt_changed',initialDebt:20000}});
  const saved=await f.call(debtAlias+'/adjust-initial-debt','POST',{initialDebt:25000,expectedInitialDebt:20000});
  assert.equal(saved.status,200);
  assert.equal((await f.call(debtAlias+'/account-summary')).data.initialDebt,25000);
  assert(calls.every(path=>path.startsWith(account+'/')));
  assert.deepEqual(f.store.rows(),[]);
 }finally{await f.close();}
});

test('live edits propagate authorization errors and never put an unconfirmed write in the outbox',async()=>{
 let mode='denied';
 const f=await fixture(async path=>{
  if(path==='/api/lab/write-access')return Response.json(license());
  if(mode==='unavailable')throw Error('disconnected');
  if(mode==='unconfirmed')return Response.json({ok:true,queued:true},{status:202});
  return Response.json({error:'forbidden'},{status:403});
 });
 try{
  assert.deepEqual(await f.call(alias,'PUT',{folderLatinName:'Name'}),{status:403,data:{error:'forbidden'}});
  mode='unconfirmed';
  assert.equal((await f.call(alias,'PUT',{folderLatinName:'Name'})).status,503);
  mode='unavailable';
  assert.equal((await f.call(catalog+'/type','PATCH',{id:'frame',name:'قاب'})).status,503);
  f.setOffline();
  assert.equal((await f.call(debtAlias+'/adjust-initial-debt','POST',{initialDebt:55,expectedInitialDebt:11})).status,503);
  assert.deepEqual(f.store.rows(),[]);
 }finally{await f.close();}
});

test('a legacy queued settings edit stays available for review without overwriting a newly confirmed value',async()=>{
 const store=new LabStore(':memory:');
 store.set('labId','A');store.set('auth',{user:{labRole:'lab_admin'}});
 const change=store.enqueue('PUT',alias,{folderLatinName:'Old Name'});
 const calls=[];
 const sync=new Sync({store,request:async (path,options={})=>{
  calls.push([path,options.method]);
  if(path==='/api/lab/write-access')return Response.json(license());
  if(path==='/api/auth/me')return Response.json(store.get('auth'));
  return Response.json({error:'unavailable'},{status:503});
 }});
 try{
  await sync.run();
  assert(!calls.some(([path])=>path===alias));
  const row=store.rows().find(row=>row.id===change.id);
  assert.equal(row.state,'conflict');
  assert.equal(row.error.code||row.error.error,'legacy_live_edit_review');
 }finally{store.db.close();}
});

test('an older catalog read cannot replace names already confirmed by a rename',async()=>{
 let notifyRead,releaseRead;
 const started=new Promise(resolve=>{notifyRead=resolve;});
 const slow=new Promise(resolve=>{releaseRead=resolve;});
 const before={id:'frame',name:'قاب معمولی',latinName:'Classic Frame'};
 const after={id:'frame',name:'قاب بهار',latinName:'Bahar Frame'};
 const f=await fixture(async(path,options={})=>{
  if(path==='/api/lab/write-access')return Response.json(license());
  if(path===catalog){notifyRead();await slow;return Response.json({catalog:{types:[before]}});}
  if(path===catalog+'/type'&&options.method==='PATCH')return Response.json({ok:true,catalog:{types:[after]}});
  throw Error('unexpected route '+path);
 });
 try{
  const oldRead=f.call(catalog);
  await started;
  assert.equal((await f.call(catalog+'/type','PATCH',after)).status,200);
  releaseRead();
  await oldRead;
  const retained=JSON.parse(Buffer.from(f.store.cached(catalog).body,'base64').toString());
  assert.deepEqual(retained.catalog.types,[after]);
 }finally{releaseRead();await f.close();}
});
