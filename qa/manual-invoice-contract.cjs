'use strict';
// Runs the actual native HTTP host and DOM invoice dialog against the current
// server route expression + receipt/automation handlers. SQL adapter is isolated
// in-memory; no account, production database or physical printer is used.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom'),{LabStore}=require('../store.cjs'),{createHost}=require('../host.cjs'),{createManualInvoiceFlow,patchManualInvoiceUI}=require('../manual-invoice-ui.cjs'),{createManualInvoiceDialog}=require('../manual-invoice-dialog.cjs');
const serverRoot=process.argv[2];if(!serverRoot)throw Error('Pass the built deployment repository root.');
const source=fs.readFileSync(path.join(serverRoot,'dist/api/server.js'),'utf8'),routeText=source.match(/const labDownloadReceipt=url\.pathname\.match\((.*)\);/)[1],receiptRoute=vm.runInNewContext(routeText);
const mod=name=>import(pathToFileURL(path.join(serverRoot,'dist/api',name)).href);
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+s.address().port))),close=s=>new Promise(r=>s.close(r));
const tick=()=>new Promise(r=>setTimeout(r,15));
(async()=>{const {acknowledgeLabDownload}=await mod('lab-download-receipt.js'),{handleLabAutomation}=await mod('lab-auto-processing.js'),{invoiceAfterVerifiedDownload}=await mod('verified-download-invoice.js');
for(const missing of [false,true]){
 const lab=crypto.randomUUID(),customer=crypto.randomUUID(),id=crypto.randomUUID(),device='pblab-contract',file={id:crypto.randomUUID(),original_name:'photo.jpg',print_name:null,bytes:12,print_bytes:null,print_size_id:'13x18',print_type:'metallic'},order={id,lab_id:lab,customer_id:customer,source:'lab_delegated',number:531,mode:'print',status:'downloaded',invoice_required:true,settlement_mode:'ledger',downloaded_at:new Date().toISOString()},values=new Map();let unit=missing?null:100,invoice=null,invoices=0,patches=0,prints=0;
 const requirements=()=>unit==null?[{key:'13x18|metallic',sizeId:'13x18',sizeLabel:'۱۳×۱۸',printType:'metallic',printTypeLabel:'متالیک',quantity:1,unitPrice:null,resolved:false}]:[];
 const query=async(sql,args=[])=>{if(sql.includes('FROM labs'))return{rows:[{ui_preferences:null,primary_download_device_id:device}],rowCount:1};if(sql.includes('FROM order_files'))return{rows:[file],rowCount:1};if(sql.includes('SELECT * FROM orders'))return{rows:[order],rowCount:1};if(sql.includes('FROM invoices'))return{rows:invoice?[invoice]:[],rowCount:invoice?1:0};if(sql.includes('INSERT INTO platform_settings')){values.set(args[0],JSON.parse(args[1]));return{rows:[],rowCount:1};}if(sql.includes('FROM platform_settings'))return{rows:values.has(args[0])?[{value:values.get(args[0])}]:[],rowCount:values.has(args[0])?1:0};if(sql.startsWith('UPDATE orders SET downloaded_at'))return{rows:[order],rowCount:1};return{rows:[],rowCount:0};};
 const client={query,release(){}},pool={query,connect:async()=>client};
 const issueInvoice=async()=>{if(unit==null)throw Object.assign(Error('invoice_pricing_required'),{code:'invoice_pricing_required',missingPricing:requirements()});if(!invoice){invoice={id:crypto.randomUUID(),number:99,pdf_ready:true,total:unit,order_id:id,customer_id:customer};invoices++;order.invoice_id=invoice.id;}return invoice;};
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const backend=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');let cached;const bodyJson=async()=>{if(cached)return cached;let text='';for await(const chunk of req)text+=chunk;return cached=JSON.parse(text||'{}');};
  if(url.pathname==='/api/lab/write-access')return json(res,200,{labId:lab,allowed:true,serverNow:new Date().toISOString(),activeUntil:new Date(Date.now()+86400000).toISOString()});
  const receipt=url.pathname.match(receiptRoute);if(receipt&&req.method==='POST'){const body=await bodyJson(req);return json(res,200,await acknowledgeLabDownload({pool,labId:lab,deviceId:device,orderId:id,files:body.files,afterVerifiedDownload:(c,o)=>invoiceAfterVerifiedDownload(c,lab,o,issueInvoice)}));}
  if(await handleLabAutomation({req,res,url,labId:lab,deviceId:device,pool,bodyJson,sendJson:json,issueInvoice,invoiceRequirements:async()=>requirements(),storageConfigured:false,audit:async()=>{}}))return;
  if(url.pathname==='/api/lab/orders/'+id+'/invoice-pricing'){if(req.method==='PUT'){const body=await bodyJson();unit=body.prices[0].unitPrice;}return json(res,200,{order,requirements:requirements(),missing:requirements(),ready:unit!=null});}
  if(url.pathname==='/api/lab/orders/'+id){if(req.method==='PATCH'){patches++;order.status=(await bodyJson()).status;}return json(res,200,{order,files:[file],invoice});}
  if(url.pathname==='/api/lab/orders')return json(res,200,{orders:[order]});
  if(url.pathname.endsWith('/download-receipt'))return json(res,404,{error:'not_found'});
  return json(res,200,{});
 }catch(error){json(res,error.status||500,{error:error.message});}});
 const backendUrl=await listen(backend),store=new LabStore(':memory:');store.set('labId',lab);store.set('auth',{user:{labRole:'lab_admin'},lab:{id:lab}});store.cache('/api/lab/orders',200,'application/json',Buffer.from(JSON.stringify({orders:[order]})).toString('base64'));
 const host=createHost({store,token:'test',sync:{run:async()=>{},status:()=>({})},roots:()=>[],isOnline:()=>true,request:(url,options)=>fetch(backendUrl+url,options)}),origin=await listen(host);
 const request=async(url,options={})=>{const r=await fetch(origin+url,{...options,headers:{Cookie:'desktop=test','Content-Type':'application/json',...options.headers}}),data=await r.json();if(!r.ok)throw Object.assign(Error(data.message||data.error),{data,status:r.status});return data;};
 const dom=new JSDOM('<body></body>',{url:origin+'/lab/orders'}),doc=dom.window.document;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 try{
  await assert.rejects(request('/api/lab/orders/'+id+'/download-receipt',{method:'POST',body:JSON.stringify({files:[{id:file.id,name:file.original_name,bytes:12}]})}),e=>e.status===404,'the 1.0.92 canonical route really is unregistered by the server');
  for(const stage of ['printing','reviewing','ready_print','printed','binding','ready','completed'])await assert.rejects(request('/api/lab/orders/'+id,{method:'PATCH',body:JSON.stringify({status:stage,invoice_id:'forged'})}),e=>e.data.error==='order_invoice_required');assert.equal(patches,0);
  const flow=createManualInvoiceFlow({request,pdf:async()=>{},print:async()=>{prints++},queuePrice:()=>{},changed:()=>{}}),open=createManualInvoiceDialog({document:doc,request,complete:flow.complete});flow.open=open;const ui={window:{pbManualInvoiceFlow:flow},t:{id:lab},ye:async()=>request('/api/lab/orders'),P:()=>{},aa:async()=>{}};vm.runInNewContext(patchManualInvoiceUI('let on;const Fe=()=>{};on=(le,nt="none")=>{Fe({order:le,resume:nt})};globalThis.openInvoiceButton=on;'),ui);const fromActualButton=()=>ui.openInvoiceButton(order);
  if(missing){const cancelled=fromActualButton();for(let i=0;i<100&&!doc.querySelector('input');i++)await tick();assert(doc.querySelector('input'),'real DOM shows missing size price');doc.querySelector('input').value='999';[...doc.querySelectorAll('button')].find(b=>b.textContent==='انصراف').click();assert.equal((await cancelled).cancelled,true);assert.equal(invoices,0);await assert.rejects(request('/api/lab/orders/'+id,{method:'PATCH',body:JSON.stringify({status:'ready'})}),e=>e.data.error==='order_invoice_required');}
  const resultPromise=fromActualButton();if(missing){for(let i=0;i<100&&!doc.querySelector('input');i++)await tick();doc.querySelector('input').value='۱۲٬۰۰۰';doc.querySelector('button.primary').click();}
  const result=await resultPromise;assert.equal(result.completed,true);const queueRows=(await request('/api/lab/orders')).orders;assert.equal(queueRows.find(row=>row.id===id).invoice_id,invoice.id);assert.equal(invoices,1);assert.equal(prints,1);assert.equal(invoice.total,missing?12000:100);
  await request('/api/lab/orders/'+id,{method:'PATCH',body:JSON.stringify({status:'printing'})});assert.equal(patches,1);assert.equal(order.status,'printing');
  console.log('PASS actual server route and receipt/automation handlers + native HTTP gate + real DOM:',missing?'price input, cancel, retry, invoice, print':'ready tariff, invoice, print');
 }finally{dom.window.close();await close(host);store.db.close();await close(backend);}
}
})().catch(e=>{console.error(e);process.exitCode=1});
