'use strict';
const {LocalBusiness,canonical}=require('./local-business.cjs');
function localActive(store){return!!store.get('localBusinessActive:'+store.get('labId'));}
async function localBusinessHost({req,res,url,bytes,store,nativeStorage,offline,json,pdfRenderer,request}){
 if(!store.get('auth')||!store.get('labId'))return false;
 const lab=store.get('labId'),same=()=>{if(store.get('labId')!==lab||!store.get('auth'))throw Object.assign(Error('حساب تغییر کرده است؛ دوباره تلاش کنید.'),{code:'account_changed',status:401});};
 const engine=new LocalBusiness(store),raw=url.pathname,p=canonical(req.url);let b={};try{b=bytes?.length?JSON.parse(bytes.toString()):{}}catch{}
 const isPrint=/^\/desktop\/local-invoices\//.test(raw);
 if(!offline&&!localActive(store)&&!isPrint)return false;
 const canRead=['/api/lab/orders','/api/lab/archive','/api/lab/invoices','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/finance/summary','/api/lab/finance/ledger','/api/lab/finance/customer-statement','/api/lab/delegated-orders/bootstrap'].includes(p)||/^\/api\/lab\/(orders\/[^/]+(?:\/invoice-pricing)?|delegated-customers\/[^/]+\/account-summary)$/.test(p);
 const invoiceRoute=raw.match(/^\/api\/lab\/invoices\/([^/]+)\/(download|preview|pdf-upload|pdf-complete)$/),printRoute=raw.match(/^\/desktop\/local-invoices\/([^/]+)\/(pdf|print)$/);
 if(!canRead&&!engine.supports(req.method,p)&&!invoiceRoute&&!printRoute)return false;
 store.set('localBusinessActive:'+store.get('labId'),true);
 if(!store.get(engine.key())&&!offline&&request){const paths=['/api/lab/finance/summary','/api/lab/orders','/api/lab/archive','/api/lab/invoices','/api/lab/finance/payments','/api/lab/finance/expenses','/api/lab/delegated-orders/bootstrap'];await Promise.allSettled(paths.filter(p=>!store.cached(p)).map(async p=>{const r=await request(p,{signal:AbortSignal.timeout(3500)});if(!r.ok)return;const data=Buffer.from(await r.arrayBuffer());same();if(data.length<12e6&&(r.headers.get('content-type')||'').includes('application/json'))store.cache(p,r.status,'application/json',data.toString('base64'));}));same();}
 engine.state();for(const row of store.rows().filter(x=>x.state==='pending'&&(require('./live-finance.cjs').invoiceAction(x.method,x.url,x.body)||require('./live-finance.cjs').orderMutation(x.url)&&engine.supports(x.method,canonical(x.url))))){try{engine.handle(row.method,row.url,row.body,row.id);store.discard(row.id);}catch{}}
 try{
  if(invoiceRoute||printRoute){const invoiceId=(invoiceRoute||printRoute)[1],s=engine.state(),inv=Object.hasOwn(s.invoices,invoiceId)?s.invoices[invoiceId]:null;if(!inv){json(res,404,{error:'invoice_not_found',message:'فاکتور روی این دستگاه موجود نیست.'});return true;}
   if(invoiceRoute&&['download','preview'].includes(invoiceRoute[2])){json(res,200,{url:'/desktop/local-invoices/'+inv.id+'/pdf',localCommitted:true});return true;}
   if(invoiceRoute){if(invoiceRoute[2]==='pdf-upload'){const raw=String(b.pdfBase64||'').replace(/^data:[^,]+,/,''),pdf=Buffer.from(raw,'base64');if(pdf.length<5||pdf.length>10e6||pdf.subarray(0,5).toString()!=='%PDF-')throw Object.assign(Error('فایل PDF معتبر نیست.'),{code:'invalid_invoice_pdf',status:400});store.db.prepare('INSERT OR REPLACE INTO local_invoice_pdf VALUES(?,?,?)').run(store.get('labId'),inv.id,pdf);}json(res,200,{invoice:inv,localCommitted:true});return true;}
   const html=require('./local-invoice.cjs').invoiceHtml(engine.decorateInvoice(s,inv),engine.bootstrap().lab);
   if(printRoute[2]==='print'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return true;}
   let pdf=store.db.prepare('SELECT bytes FROM local_invoice_pdf WHERE lab=? AND id=?').get(store.get('labId'),inv.id)?.bytes;
   if(!pdf){if(!pdfRenderer)throw Object.assign(Error('چاپ PDF در این محیط در دسترس نیست.'),{status:503});pdf=await pdfRenderer(html);same();}
   res.writeHead(200,{'Content-Type':'application/pdf','Cache-Control':'no-store','Content-Disposition':'inline; filename="invoice-'+inv.id+'.pdf"'});res.end(Buffer.from(pdf));return true;
  }
  if(req.method==='POST'&&/^\/api\/lab\/delegated-orders\/[^/]+\/submit$/.test(p)){
   const orderId=p.split('/')[4],order=engine.state().orders[orderId],files=b.desktopLocalFiles;
   if(!nativeStorage||!Array.isArray(files)||!files.length||files.length!==order?.files?.length||new Set(files.map(f=>JSON.stringify([f.rootId,f.parts]))).size!==files.length)throw Object.assign(Error('ذخیرهٔ عکس‌ها باید کامل و بررسی شود.'),{code:'local_files_not_verified',status:409});
   for(const file of files){file.sha256=await require('./local-file-proof.cjs').fileProof(nativeStorage,file);same();}
  }
  same();const result=engine.handle(req.method,req.url,b,String(req.headers['x-photobridge-local-operation']||b.desktopOperationId||''));if(result===null)return false;
  json(res,200,result);return true;
 }catch(error){json(res,error.status||400,{error:error.code||error.message,message:error.message,...(error.missingPricing?{missingPricing:error.missingPricing,pricingRequirements:error.pricingRequirements}:{})});return true;}
}
module.exports={localBusinessHost,localActive};
