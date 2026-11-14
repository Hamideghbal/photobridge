const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const helper=()=>import(pathToFileURL(path.resolve('dist/api/customer-orders-page.js')).href);
test('legacy requests are untouched and malformed optional pagination cannot issue a query',async()=>{
 const {customerOrdersPage}=await helper(),pool={query(){throw Error('unexpected query')}};
 assert.equal(await customerOrdersPage(pool,'lab','user',new URLSearchParams()),null);
 for(const query of ['pageSize=0','pageSize=101','pageSize=7&offset=-1','pageSize=7&view=all','pageSize=7&mode=other'])assert.equal((await customerOrdersPage(pool,'lab','user',new URLSearchParams(query))).status,400);
});
test('real PostgreSQL paging preserves legacy 300-order scope, user/lab isolation, counts, ordering and payment shape',{skip:!process.env.PB_ORDERS_TEST_DATABASE_URL},async()=>{
 const {Client}=require('pg'),client=new Client({connectionString:process.env.PB_ORDERS_TEST_DATABASE_URL,ssl:false});await client.connect();
 try{
  await client.query('BEGIN');
  await client.query('CREATE TEMP TABLE orders(id text,lab_id text,customer_id text,status text,mode text,source text,created_at timestamptz,number integer) ON COMMIT DROP');
  const {customerOrdersProjection:details}=await helper();
  await client.query('CREATE TEMP TABLE order_files(id text,order_id text,lab_id text,original_state text,print_type text,chassis boolean,frame boolean,bytes bigint) ON COMMIT DROP');
  await client.query('CREATE TEMP TABLE order_status_events(order_id text,status text,note text,created_at timestamptz) ON COMMIT DROP');
  for(const [alias,table] of [['i','invoices'],['r','order_payment_receipts'],['cs','order_courier_shipments']]){
   const columns=new Set(['order_id',...Array.from(details.matchAll(new RegExp('\\b'+alias+'\\.([a-z_]+)','g')),m=>m[1])]);if(alias==='cs')columns.add('provider');
   await client.query('CREATE TEMP TABLE '+table+'('+[...columns].map(col=>col+(col==='raw_response'?' jsonb':' text')).join(',')+') ON COMMIT DROP');
  }
  await client.query('CREATE TEMP TABLE labs(id text,payment_card_number text,payment_iban text,payment_account_holder text) ON COMMIT DROP');
  await client.query("INSERT INTO labs VALUES('lab','card','iban','holder')");
  const rows=[];for(let i=0;i<640;i++)rows.push({id:'o'+i,lab_id:i===1?'other':'lab',customer_id:i===2?'other':'user',status:['sent','ready','needs_fix','completed','uploading','cancelled'][i%6],mode:i===628?null:i===630?'':i%5===0?'album':'print',source:i%17===0?'manual_invoice':'web',created_at:new Date(Date.UTC(2026,0,1,0,0,i)),number:i});
  for(const row of rows)await client.query('INSERT INTO orders VALUES($1,$2,$3,$4,$5,$6,$7,$8)',Object.values(row));
  const scope=rows.filter(row=>row.lab_id==='lab'&&row.customer_id==='user'&&!['uploading','cancelled'].includes(row.status)&&row.source!=='manual_invoice').sort((a,b)=>b.created_at-a.created_at).slice(0,300);
  const view=row=>['ready','needs_fix','completed'].includes(row.status)?row.status:'flow';
  const priced=scope.find(row=>row.mode==='print'&&view(row)==='flow');
  await client.query("INSERT INTO invoices(order_id,id,offline_reference,number,total,issued_at,pdf_ready) VALUES($1,'invoice','OFF-1','42','125000','2026-01-01','true')",[priced.id]);
  await client.query("INSERT INTO order_status_events VALUES($1,'sent','accepted','2026-01-01')",[priced.id]);
  await client.query("INSERT INTO order_files VALUES('photo',$1,'lab','stored','none',true,false,1000)",[priced.id]);
  const legacy=await client.query(details+" WHERE o.lab_id=$1 AND o.customer_id=$2 AND o.status NOT IN ('uploading','cancelled') AND COALESCE(o.source,'')<>'manual_invoice' ORDER BY o.created_at DESC LIMIT 300",['lab','user']);
  const {customerOrdersPage}=await helper();
  for(const mode of ['print','album'])for(const status of ['flow','ready','needs_fix','completed']){
   const expected=scope.filter(row=>(row.mode||'print')===mode&&view(row)===status),counts=Object.fromEntries(['flow','ready','needs_fix','completed'].map(key=>[key,scope.filter(row=>(row.mode||'print')===mode&&view(row)===key).length]));
   for(const offset of [0,7]){
    const result=await customerOrdersPage(client,'lab','user',new URLSearchParams({pageSize:'7',offset:String(offset),view:status,mode}));
    assert.equal(result.status,200);assert.deepEqual(result.body.orders.map(row=>row.id),expected.slice(offset,offset+7).map(row=>row.id));assert.deepEqual(result.body.orders,legacy.rows.filter(row=>(row.mode||'print')===mode&&view(row)===status).slice(offset,offset+7),'projection including invoice values and status/file metadata is identical');assert.deepEqual(result.body.pagination.counts,counts);assert.equal(result.body.pagination.hasMore,offset+7<expected.length);assert.equal(result.body.pagination.total,expected.length);assert.deepEqual(result.body.paymentSettings,{payment_card_number:'card',payment_iban:'iban',payment_account_holder:'holder'});
   }
  }
  assert.deepEqual((await customerOrdersPage(client,'other','user',new URLSearchParams('pageSize=30&view=ready'))).body.orders.map(row=>row.id),['o1']);
 }finally{await client.query('ROLLBACK');await client.end()}
});
test('compiled entry cache only supplies the matching first page and leaves legacy/status/impersonation calls on the original API',async()=>{
 const vm=require('node:vm'),source=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),start=source.indexOf('async function Me('),end=source.indexOf('async function PB1847OriginalApi(',start),native=[],flow={labId:'lab',orders:['prefetched']};
 let token='';const context={window:{__PB1847EntryUI:{ordersReady(){},remove(){}}},location:{origin:'https://entry.test'},URL,Sr:()=>token,yg:()=>null,PB1847OriginalApi:async url=>{native.push(url);return {labId:'lab',orders:['native']}}};vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.api=Me',context);
 context.window.__PB1847EntryEarly={labId:'lab',orders:Promise.resolve(flow)};
 for(const url of ['/api/customer/orders?_lab=lab','/api/customer/orders?_lab=lab&pageSize=30&view=ready','/api/customer/orders?_lab=lab&pageSize=30&offset=30'])assert.deepEqual((await context.api(url)).orders,['native']);
 token='impersonation';assert.deepEqual((await context.api('/api/customer/orders?_lab=lab&pageSize=30')).orders,['native']);token='';assert.equal(native.length,4);
 assert.equal(await context.api('/api/customer/orders?_lab=lab&pageSize=30&offset=0&view=flow&mode=print'),flow);assert.equal(context.window.__PB1847EntryEarly,undefined);assert.equal(native.length,4);
 await context.api('/api/customer/orders?_lab=lab&pageSize=30');assert.equal(native.length,5);
 context.window.__PB1848AuthUserId='other';context.window.__PB1847EntryEarly={labId:'lab',ordersUserId:'owner',orders:Promise.resolve(flow)};assert.deepEqual((await context.api('/api/customer/orders?_lab=lab&pageSize=30')).orders,['native'],'private select page cannot cross users');assert.equal(native.length,6);context.window.__PB1848AuthUserId='owner';assert.equal(await context.api('/api/customer/orders?_lab=lab&pageSize=30'),flow);
});
