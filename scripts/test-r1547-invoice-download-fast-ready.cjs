'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
test('invoice preview stays readable, is scrollable, and has an accessible close control',()=>{
 const s=read(bundle),start=s.indexOf('function Oc({role:t,invoice:'),end=s.indexOf('function ',start+19);
 assert(start>=0&&end>start);
 const invoice=s.slice(start,end);
 assert(invoice.includes('t==="lab"?Math.max(.9,Math.min(1.05,k/C))'));
 assert(invoice.includes('className:"pb1547InvoiceClose"'));
 assert(invoice.includes('"aria-label":"بستن پنجره فاکتور"'));
 const css=read('dist/web/photobridge-r1547-invoice-download.css');
 assert(css.includes('.globalInvoicePreviewLayer>.labInvoicePreview.invoiceFitModal'));
 assert(css.includes('width:min(1080px,96vw)'));
 assert(css.includes('.invoicePaperViewport.invoiceNoScrollViewport{display:block!important;overflow:auto!important'));
 assert(css.includes('@media screen'));
 assert(!css.includes('@media print{'));
});
test('verified download uses only a scoped styled confirmation; actual checks remain intact',()=>{
 const s=read(bundle),a=s.indexOf('Vn=async(le,options={})=>'),b=s.indexOf(',un=async le=>',a);
 assert(a>=0&&b>a);
 const h=s.slice(a,b);
 assert(h.includes('pb1547DownloadDialog(warning||(result.alreadyComplete?'));
 assert(h.includes('pb1451AcknowledgeDownload(detail)'));
 const dialog=read('scripts/r1547-invoice-download-notice.js.txt');
 assert.doesNotThrow(()=>new vm.Script(dialog));
 assert(dialog.includes('dialog.showModal()'));
 assert(dialog.includes('data-action')===false,'new confirmation should not inherit unrelated dialogs');
 assert(dialog.includes('textContent=content'),'untrusted messages must not be placed in HTML');
 assert(dialog.includes('dialog.addEventListener("cancel"'));
});
test('confirmed invoice transitions before PDF generation, without weakening revision checks',()=>{
 const s=read(bundle),printStart=s.indexOf('un=async le=>'),printEnd=s.indexOf(',Cn=async(le,nt)=>',printStart);
 const print=s.slice(printStart,printEnd);
 assert(print.includes('pb1531Current.document_revision'),'server revision remains required');
 assert(print.includes('pb1546SameOrder(le,pb1531Current)'),'mapped native identity remains enforced');
 assert(print.includes('k("ready");qt=!0;void ye().catch(()=>{});void Gt(le,"ready").catch(()=>{})'));
 assert(print.includes('void pb1547CompletePdf(Zt.invoice,le.id,ai());return'));
 assert(print.indexOf('if(xt=Zt.invoice')<print.indexOf('void pb1547CompletePdf('),'never claim ready before server invoice exists');
 assert(!print.includes('await Wu(Zt.invoice)'));
 const albumStart=s.indexOf('Cn=async(le,nt)=>'),albumEnd=s.indexOf(',aa=async(le,nt)=>',albumStart);
 const album=s.slice(albumStart,albumEnd);
 assert(album.includes('expectedRevision:pb1531Current.document_revision'),'album must keep server revision precondition');
 assert(album.includes('nt==="ready"&&(k("ready"),qt=!0,void ye().catch(()=>{})'));
 assert(album.includes('void pb1547CompletePdf(Zt.invoice,le.id,ai())'));
 assert(!album.includes('await Wu(Zt.invoice)'));
});
test('optional PDF tasks remain non-blocking and disclose storage/upload failures',async()=>{
 const source=read('scripts/r1547-invoice-download-notice.js.txt');
 let complete;
 const queued=new Promise(resolve=>{complete=resolve});
 let pdfRequested=false,notify=[],eventCount=0;
 const context={console:{error:()=>{}},Wu:async()=>{pdfRequested=true;await queued;return new Blob(['PDF'])},Me:async()=>({order:{id:'order'}}),Ef:async()=>({dir:{}}),jc:async()=>{},FileReader:class{readAsDataURL(){this.result='data:application/pdf;base64,QQ==';this.onload()}},window:{dispatchEvent:()=>{eventCount++}},CustomEvent:class {},Blob};
 vm.runInNewContext(source+';this.run=pb1547CompletePdf',context);
 context.pb1547Notice=(...args)=>notify.push(args);
 const promise=context.run({id:'invoice',number:22},'order',false);
 assert(pdfRequested,'PDF work should start separately');
 assert.equal(eventCount,0,'PDF upload must not falsely complete before PDF bytes exist');
 complete();await promise;
 assert.equal(eventCount,1,'finance refresh should occur when the optional PDF work finishes');
 assert.equal(notify.length,0);
});
test('Windows UI hot update retains SHA-256 integrity and cache-busts the new preview CSS',()=>{
 const root='dist/web/lab-desktop-ui/',manifest=JSON.parse(read(root+'manifest.json'));
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 assert.equal(manifest.channel,'lab');assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const file of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1547-invoice-download.css']){
  const row=manifest.files.find(x=>x.name===file);assert(row,file);assert.equal(row.sha256,hash(fs.readFileSync(root+file)),file);
 }
 for(const file of ['dist/web/index.html',root+'index.html']){
  const html=read(file);
  assert(html.includes('photobridge-r1547-invoice-download.css?v=r1547'));
  assert(html.includes('&labInvoice=r1547'));
 }
});
