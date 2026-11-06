const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');const {LabStore}=require('../store.cjs'),{createHost}=require('../host.cjs'),{LocalBusiness}=require('../local-business.cjs');
async function fixture(physicalOnline=false,upstream){const store=new LabStore(':memory:');store.set('labId','A');store.set('auth',{user:{labRole:'lab_admin'}});const customer=crypto.randomUUID(),order=crypto.randomUUID(),size=crypto.randomUUID(),cache=(url,data)=>store.cache(url,200,'application/json',Buffer.from(JSON.stringify(data)).toString('base64'));cache('/api/lab/finance/summary',{summary:{invoiced:0,paid:0,receivable:0,cash:0,bank:0},customers:[{id:customer,name:'مشتری',balance:0}]});cache('/api/lab/delegated-orders/bootstrap',{customers:[{id:customer,name:'مشتری'}],printSizes:[{id:size,label:'۱۳×۱۸',luster:100}]});cache('/api/lab/orders',{orders:[{id:order,number:12,customer_id:customer,mode:'print',status:'printing'}]});cache('/api/lab/orders/'+order,{order:{id:order,number:12,customer_id:customer,mode:'print',status:'printing'},files:[{id:crypto.randomUUID(),print_size_id:size,print_type:'luster',print_copies:2}]});const now=Date.now();store.set('writeAccess:A',{labId:'A',allowed:true,serverTime:now,receivedAt:now,highWater:now,activeUntil:new Date(now+86400000).toISOString()});let calls=0;const server=createHost({store,sync:{run:async()=>{},status:()=>store.status()},request:async(...args)=>{calls++;if(upstream)return upstream(...args);throw Error('offline')},roots:()=>[],token:'test',isOnline:()=>physicalOnline,nativeStorage:{operation:async action=>action==='read'?new Uint8Array(12):({size:12})}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;return{store,server,customer,order,size,get calls(){return calls},call:async(url,body,method=body?'POST':'GET')=>{const r=await fetch(base+url,{method,headers:{Cookie:'desktop=test','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json()}},close:async()=>{await new Promise(r=>server.close(r));store.db.close()}};}
test('shared cached order cannot be invoiced, advanced or paid while offline',async()=>{const f=await fixture();try{for(const status of ['printing','ready','completed']){const r=await f.call('/api/lab/orders/'+f.order,{status},'PATCH');assert.equal(r.status,409);assert.equal(r.data.error,'shared_document_requires_online');}const r=await f.call('/api/lab/finance/payments',{customerId:f.customer,amount:60});assert.equal(r.status,409);assert.equal(Object.keys(new LocalBusiness(f.store).state().invoices).length,0);assert.equal(f.calls,0);}finally{await f.close()}});
test('offline local intake requires disk verification and then becomes a usable downloaded order',async()=>{const f=await fixture();try{const id=crypto.randomUUID(),file=crypto.randomUUID();let r=await f.call('/api/lab/delegated-orders/download',{clientOrderId:id,localOnly:true,customerId:f.customer,mode:'print'});assert.equal(r.data.localCommitted,true);r=await f.call(`/api/lab/delegated-orders/${id}/files/presign/download`,{clientFileId:file,localOnly:true,name:'photo.jpg',bytes:12,printSizeId:f.size,printType:'luster'});assert.equal(r.data.storageMode,'device-local');r=await f.call(`/api/lab/orders/${id}/download`);assert.equal(r.data.files[0].id,file);r=await f.call(`/api/lab/delegated-orders/${id}/submit/download`,{});assert.equal(r.status,409);r=await f.call(`/api/lab/delegated-orders/${id}/submit/download`,{desktopLocalFiles:[{rootId:'root',parts:['photo.jpg'],bytes:12}]});assert.equal(r.data.order.status,'downloaded');r=await f.call(`/api/lab/orders/${id}`,{status:'ready'},'PATCH');assert.equal(r.data.invoice.total,100);assert.equal(f.calls,0);}finally{await f.close()}});
test('LAN without a working server cannot fall back to editing a shared order',async()=>{const f=await fixture(true);try{const r=await f.call('/api/lab/orders/'+f.order,{status:'ready'},'PATCH');assert.equal(r.status,409);assert.equal(r.data.error,'shared_document_requires_online');assert.equal(Object.keys(new LocalBusiness(f.store).state().invoices).length,0);assert.equal(f.calls,1);}finally{await f.close()}});
test('expired license is not bypassed by local business processing',async()=>{const f=await fixture();try{const saved=f.store.get('writeAccess:A');f.store.set('writeAccess:A',{...saved,activeUntil:new Date(Date.now()-1000).toISOString()});const r=await f.call('/api/lab/orders/'+f.order,{status:'ready'},'PATCH');assert.equal(r.status,403);assert(!f.store.get('localBusinessActive:A'));}finally{await f.close()}});

test('independent offline invoice receives OFF namespace and can accept its own receipt',async()=>{const f=await fixture();try{const created=await f.call('/api/lab/invoices/manual',{customerId:f.customer,items:[{description:'چاپ مستقل آفلاین',quantity:2,unitPrice:100}]});assert.equal(created.status,200);assert.equal(created.data.invoice.number,'OFF-1');assert.match(created.data.invoice.offline_reference,/^OFF-[A-F0-9]{32}-INV-00000001$/);assert.equal(new LocalBusiness(f.store).state().invoices[created.data.invoice.id].number,created.data.invoice.offline_reference);assert.equal(created.data.invoice.document_authority,'offline');const paid=await f.call('/api/lab/finance/payments',{invoiceId:created.data.invoice.id,amount:50});assert.equal(paid.status,200);assert.equal(paid.data.payment.amount,50);assert.equal(f.calls,0);}finally{await f.close()}});
test('shared online changes require a server acknowledgement and are never placed in the offline ledger/outbox',async()=>{let failWrite=false;const f=await fixture(true,async(url,options={})=>{if(url==='/api/lab/write-access')return Response.json({labId:'A',allowed:true,serverNow:new Date().toISOString(),activeUntil:new Date(Date.now()+86400000).toISOString()});if(options.method==='PATCH'){if(failWrite)throw Error('reply_unknown');const body=JSON.parse(options.body);return Response.json({order:{id:url.split('/').at(-1),status:body.status,updated_at:new Date().toISOString()}});}throw Error('unexpected URL '+url);});try{let result=await f.call('/api/lab/orders/'+f.order,{status:'printed'},'PATCH');assert.equal(result.status,200);assert(!result.data.localCommitted);assert.equal(new LocalBusiness(f.store).state().orders[f.order].status,'printed');failWrite=true;result=await f.call('/api/lab/orders/'+f.order,{status:'ready'},'PATCH');assert.equal(result.status,503);assert.equal(result.data.error,'shared_online_unconfirmed');assert.equal(f.store.rows().length,0);assert.equal(new LocalBusiness(f.store).state().events.length,0);}finally{await f.close()}});


test('native /download aliases are local-only route markers and never go upstream',()=>{
 const {remoteRequest}=require('../document-policy.cjs');
 const store=new LabStore(':memory:');store.set('labId','A');store.set('deviceId',crypto.randomUUID());
 try{
  const order=crypto.randomUUID(),file=crypto.randomUUID();
  const pairs=[
   ['/api/lab/delegated-orders/download','/api/lab/delegated-orders'],
   ['/api/lab/delegated-orders/'+order+'/files/presign/download','/api/lab/delegated-orders/'+order+'/files/presign'],
   ['/api/lab/delegated-orders/'+order+'/submit/download','/api/lab/delegated-orders/'+order+'/submit'],
   ['/api/lab/orders/'+order+'/download','/api/lab/orders/'+order],
   ['/api/lab/delegated-orders/bootstrap?mode=print','/api/lab/delegated-orders/bootstrap?mode=print'],
   // This is a REAL server download endpoint and must not be modified.
   ['/api/lab/order-files/'+file+'/download','/api/lab/order-files/'+file+'/download'],
   ['/api/lab/invoices/'+order+'/download','/api/lab/invoices/'+order+'/download']
  ];
  for(const [client,server] of pairs)assert.equal(remoteRequest(store,client,{}).url,server,client);
 }finally{store.db.close()}
});

test('online local-device intake forwards creation, chosen size and details without /download suffix',async()=>{
 const orderId=crypto.randomUUID(),fileId=crypto.randomUUID(),urls=[];
 const f=await fixture(true,async (url,options={})=>{
  urls.push(url);
  if(url==='/api/lab/write-access')return Response.json({labId:'A',allowed:true,serverNow:new Date().toISOString(),activeUntil:new Date(Date.now()+86400000).toISOString()});
  if(url==='/api/lab/delegated-orders'){
   assert.equal(options.method,'POST');
   const data=JSON.parse(options.body);assert.equal(data.mode,'print');assert.equal(data.localOnly,true);
   return Response.json({ok:true,orderId,orderNumber:521,customerId:data.customerId});
  }
  if(url==='/api/lab/delegated-orders/'+orderId+'/files/presign'){
   const data=JSON.parse(options.body);
   assert.equal(data.clientFileId,fileId);assert.equal(data.printSizeId,f.size);
   assert.equal(data.printType,'luster');assert.equal(data.localOnly,true);
   return Response.json({fileId,storageMode:'device-local',state:'active'});
  }
  if(url==='/api/lab/orders/'+orderId)return Response.json({order:{id:orderId,number:521,customer_id:f.customer,status:'uploading',mode:'print',source:'lab_delegated'},files:[{id:fileId,original_name:'test.jpg',bytes:12,print_size_id:f.size,print_type:'luster'}]});
  // Fixture has some cached reads but may request additional optional snapshots.
  if(['GET',undefined].includes(options.method))return Response.json({});
  return Response.json({error:'unexpected_upstream_path',url},{status:404});
 });
 try{
  const clientOrderId=crypto.randomUUID();
  let response=await f.call('/api/lab/delegated-orders/download',{clientOrderId,localOnly:true,customerId:f.customer,mode:'print'});
  assert.equal(response.status,200);assert.equal(response.data.orderId,orderId);
  response=await f.call('/api/lab/delegated-orders/'+orderId+'/files/presign/download',{clientFileId:fileId,localOnly:true,name:'test.jpg',bytes:12,printSizeId:f.size,printType:'luster'});
  assert.equal(response.status,200);assert.equal(response.data.storageMode,'device-local');
  response=await f.call('/api/lab/orders/'+orderId+'/download');
  assert.equal(response.status,200);assert.equal(response.data.files[0].print_size_id,f.size);
  assert(urls.includes('/api/lab/delegated-orders'));
  assert(urls.includes('/api/lab/delegated-orders/'+orderId+'/files/presign'));
  assert(urls.includes('/api/lab/orders/'+orderId));
  assert.equal(urls.some(x=>x.endsWith('/download')),false,'native alias escaped to remote API');
  assert.equal(f.store.rows().length,0,'online registration must not silently create a legacy offline outbox event');
 }finally{await f.close()}
});
