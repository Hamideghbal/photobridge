'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const LAB='11111111-1111-4111-8111-111111111111',ORDER='22222222-2222-4222-8222-222222222222',FILE='33333333-3333-4333-8333-333333333333',DEVICE='pblab-test';
async function fixture(){
 const {PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite'),db=new PGlite();
 await db.exec(`CREATE TABLE labs(id uuid PRIMARY KEY,ui_preferences jsonb,primary_download_device_id text);CREATE TABLE orders(id uuid PRIMARY KEY,lab_id uuid,status text,downloaded_at timestamptz,updated_at timestamptz DEFAULT now(),invoice_required boolean DEFAULT true,settlement_mode text DEFAULT 'ledger',payment_status text DEFAULT 'unpaid',document_revision integer DEFAULT 1);CREATE TABLE order_files(id uuid PRIMARY KEY,lab_id uuid,order_id uuid,original_name text,print_name text,bytes bigint,print_bytes bigint,original_state text DEFAULT 'active');CREATE TABLE platform_settings(key text PRIMARY KEY,value jsonb,updated_at timestamptz);CREATE TABLE invoices(id serial PRIMARY KEY,order_id uuid UNIQUE);CREATE TABLE journal(invoice_id integer);`);
 await db.query('INSERT INTO labs VALUES($1,NULL,$2)',[LAB,DEVICE]);await db.query("INSERT INTO orders(id,lab_id,status) VALUES($1,$2,'received')",[ORDER,LAB]);await db.query("INSERT INTO order_files(id,lab_id,order_id,original_name,bytes) VALUES($1,$2,$3,'one.jpg',123)",[FILE,LAB,ORDER]);
 const c={query:(...args)=>db.query(...args),release(){}},pool={connect:async()=>c};
 const {acknowledgeLabDownload}=await import('../dist/api/lab-download-receipt.js'),{invoiceAfterVerifiedDownload}=await import('../dist/api/verified-download-invoice.js');
 const issue=async connection=>{const old=await connection.query('SELECT * FROM invoices WHERE order_id=$1',[ORDER]);if(old.rows.length)return old.rows[0];const invoice=(await connection.query('INSERT INTO invoices(order_id) VALUES($1) RETURNING *',[ORDER])).rows[0];await connection.query('INSERT INTO journal VALUES($1)',[invoice.id]);await connection.query('UPDATE orders SET document_revision=document_revision+1 WHERE id=$1',[ORDER]);return invoice};
 const ack=(files,make=issue)=>acknowledgeLabDownload({pool,labId:LAB,orderId:ORDER,deviceId:DEVICE,files,afterVerifiedDownload:(connection,order)=>invoiceAfterVerifiedDownload(connection,LAB,order,make)});
 return{db,ack,issue,files:[{id:FILE,name:'one.jpg',bytes:123}]};
}
test('invoice is created exactly once in the verified download transaction, never for incomplete files',async()=>{const f=await fixture();try{
 await assert.rejects(f.ack([]),/download_files_incomplete/);assert.equal((await f.db.query('SELECT * FROM invoices')).rows.length,0);
 const result=await f.ack(f.files);assert(result.invoice.id);assert(result.order.downloaded_at);assert.equal(result.order.status,'received');assert.equal(result.order.document_revision,2);
 await f.ack(f.files);assert.equal((await f.db.query('SELECT * FROM invoices')).rows.length,1);assert.equal((await f.db.query('SELECT * FROM journal')).rows.length,1);
}finally{await f.db.close()}});
test('missing prices roll back all attempted financial writes while retaining verified download and manual-pricing warning',async()=>{const f=await fixture();try{
 const result=await f.ack(f.files,async c=>{await f.issue(c);throw Object.assign(Error('invoice_pricing_required'),{missingPricing:[{size:'20x30'}]})});
 assert(result.order.downloaded_at);assert.equal(result.invoice,null);assert.equal(result.invoiceError,'invoice_pricing_required');assert.equal(result.missingPricing[0].size,'20x30');assert.equal((await f.db.query('SELECT * FROM invoices')).rows.length,0);assert.equal((await f.db.query('SELECT * FROM journal')).rows.length,0);
}finally{await f.db.close()}});
for(const root of ['dist/web','dist/web/lab-desktop-ui'])test(root+': print, ready and delivery each use one status write without waiting for disk, list refresh or navigation',async()=>{
 const source=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8'),writes=[],never=new Promise(()=>{});let rows=[{id:ORDER,status:'downloaded',document_revision:8,updated_at:'now',number:12}];
 const context={E:'',C(){},k(){},b(){},Mc:{printing:'چاپ',ready:'آماده',completed:'تحویل'},P(){},V:String,f:fn=>rows=fn(rows),ye:()=>never,Gt:()=>never,pb1450AllowStage:()=>{throw Error('disk check must not run')},alert:()=>assert.fail('unexpected alert'),Me:async(url,options)=>{assert.equal(options.method,'PATCH');const body=JSON.parse(options.body);assert.equal(body.expectedRevision,rows[0].document_revision);writes.push(body);return{order:{...rows[0],status:body.status,document_revision:rows[0].document_revision+1}}}};
 for(const [begin,end,name]of [['It=async(le,nt,xt)=>',',gn=async le=>','It'],['un=async le=>',',Cn=async','ready'],['gn=async le=>',',Vn=async','done']]){const a=source.indexOf(begin),b=source.indexOf(end,a);assert(a>=0&&b>a);vm.runInNewContext('globalThis.'+name+'='+source.slice(a+begin.indexOf('=')+1,b),context)}
 await Promise.race([(async()=>{await context.It(rows[0],'printing');await context.ready(rows[0]);await context.done(rows[0])})(),new Promise((_,reject)=>setTimeout(()=>reject(Error('stage waited for background work')),500))]);
 assert.deepEqual(writes.map(x=>x.status),['printing','ready','completed']);assert.equal(rows[0].status,'completed');
 writes.length=0;rows=[{id:ORDER,status:'downloaded',document_revision:20}];context.Me=async(url,options)=>{assert(url.endsWith('/album-stage'));assert.equal(options.method,'PUT');const body=JSON.parse(options.body);assert.equal(body.expectedRevision,rows[0].document_revision);writes.push(body);return{order:{...rows[0],status:body.stage,document_revision:rows[0].document_revision+1}}};
 const a=source.indexOf('Cn=async(le,nt)=>'),b=source.indexOf(',aa=async',a);vm.runInNewContext('globalThis.album='+source.slice(a+3,b),context);
 await Promise.race([(async()=>{for(const stage of ['printing','ready','completed'])await context.album(rows[0],stage)})(),new Promise((_,reject)=>setTimeout(()=>reject(Error('album stage waited for background work')),500))]);assert.deepEqual(writes.map(x=>x.stage),['printing','ready','completed']);

});
test('stored legacy timing cannot postpone invoicing, and existing invoices are reused without rechecking files or prices',async()=>{
 const m=await import('../dist/api/lab-auto-processing.js');assert.equal(m.normalizeAutomation({invoiceTiming:'after_print'}).invoiceTiming,'after_verified_download');let reply;
 const invoice={id:'existing-invoice'},c={release(){},query:async sql=>{
  if(sql.includes('FROM orders'))return{rows:[{id:ORDER,status:'downloaded',downloaded_at:new Date().toISOString()}]};
  if(sql.includes('FROM labs'))return{rows:[{primary_download_device_id:DEVICE}]};
  if(sql.includes('FROM invoices'))return{rowCount:1,rows:[invoice]};
  if(sql.includes('FROM order_files'))assert.fail('existing invoice must not recheck manifest');return{rows:[]};
 }};
 await m.handleLabAutomation({req:{method:'POST'},res:{setHeader(){}},url:{pathname:'/api/lab/orders/'+ORDER+'/automation-invoice'},labId:LAB,deviceId:DEVICE,pool:{query:async()=>({rows:[]}),connect:async()=>c},sendJson:(_,status,body)=>reply={status,body},issueInvoice:async()=>invoice,invoiceRequirements:()=>assert.fail('existing invoice must not be repriced'),storageConfigured:false});
 assert.equal(reply.status,200);assert.equal(reply.body.invoice.id,invoice.id);assert.equal(reply.body.existing,true);
});
