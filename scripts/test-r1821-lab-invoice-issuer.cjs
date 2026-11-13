
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const name='assets/index-UIRefine-v655-r84.js';
const getMain=(root)=>{
 const code=read(root+'/'+name);
 assert.doesNotThrow(()=>new vm.Script(code),root+' compiled frontend syntax');
 const start=code.indexOf('async function Wu(t){');
 const end=code.indexOf('function Wy(t,a){',start);
 assert(start>0&&end>start,root+' invoice render functions');
 return {code,render:code.slice(start,end)};
};
test('R1821: issuer is the invoice laboratory, never platform brand',()=>{
 const code=getMain('dist/web').code;
 const pattern='function pb1821LabInvoiceIssuer(t){return String((t==null?void 0:t.lab_name)||(t==null?void 0:t.labName)||"").trim()||"لابراتوار";}';
 assert.equal(code.split(pattern).length-1,1);
 const fn=vm.runInNewContext(pattern+';pb1821LabInvoiceIssuer');
 assert.equal(fn({lab_name:'لابراتوار سرو'}),'لابراتوار سرو');
 assert.equal(fn({lab_name:'  چاپ آسمان  '}),'چاپ آسمان');
 assert.equal(fn({labName:'چاپ باران'}),'چاپ باران');
 assert.equal(fn({lab_name:''}),'لابراتوار');
 assert.equal(fn(null),'لابراتوار');
 assert.notEqual(fn({lab_name:''}),'PhotoBridge');
});
test('R1821: invoice preview, print and browser PDF use same issuing lab name',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const {code,render}=getMain(root);
  assert(code.includes('className:"invoicePaperBrand",children:pb1821LabInvoiceIssuer(a)'),
   root+' invoice preview heading');
  assert(render.includes('s.fillText(pb1821LabInvoiceIssuer(t),o,c,720)'),
   root+' canvas invoice PDF title');
  // Older builds use a different sentence, or omit the footer entirely.
  // In either case the invoice PDF / print area must not attribute issuance to PhotoBridge.
  assert(!/s\.fillText\("[^"]*PhotoBridge[^"]*",o,(?:1[0-9]{3}|[2-9][0-9]{3})/.test(render),
   root+' PDF footer has no platform issuer');
  assert(!/<div class="note">[^<]*PhotoBridge/.test(render),
   root+' printed footer has no platform issuer');
  assert(render.includes('<div class="brand">${_n(pb1821LabInvoiceIssuer(t))}</div>'),
   root+' print invoice heading escaped for HTML');
  assert(render.includes('<div class="brand">${esc(pb1821LabInvoiceIssuer(t))}</div>'),
   root+' direct-customer A4 must use lab name');
  assert(render.includes('با سپاس از اعتماد شما · ${esc(pb1821LabInvoiceIssuer(t))}'),
   root+' direct-customer A4 footer must use lab name');
  assert(render.includes('سپاس از اعتماد شما<br>${esc(pb1821LabInvoiceIssuer(t))}'),
   root+' thermal invoice templates must use lab name');
  assert(render.includes('g.fillText(pb1821LabInvoiceIssuer(t),right,90,800)'),
   root+' direct-customer canvas PDF must use lab name');
  assert(render.includes("'این فاکتور خدمات برای مشتری آزاد صادر شده است · '+pb1821LabInvoiceIssuer(t)"),
   root+' direct-customer PDF footer must use lab name');
  assert(!render.includes("g.fillText('PhotoBridge',right,90)"));
  assert(!render.includes('سپاس از اعتماد شما<br>PhotoBridge'));
  assert(!render.includes('مشتری آزاد صادر شده است · PhotoBridge'));
  assert(!render.includes('<div class="brand">PhotoBridge</div>'));
  assert(!render.includes('این فاکتور توسط PhotoBridge صادر شده است.'));
  assert(!render.includes('s.fillText("PhotoBridge",o,c)'));
  assert(code.includes('t.lab_name||"—"'),'source invoice lab metadata retained');
 }
});
test('R1821: preserve lab/photographer invoice detail and pricing, not unrelated platform branding',()=>{
 const code=read('dist/web/'+name);
 assert(code.includes('className:"invoicePaperTable"'));
 assert(code.includes('className:"invoicePaperTotals"'));
 assert(code.includes('className:"invoicePdfFreshBtn"'));
 assert(code.includes('className:"invoicePrintBtn"'));
 assert(code.includes('customerInvoicePreview'));
 assert(code.includes('labInvoicePreview'));
 assert(code.includes('function tj(t,a){'),'existing accounting discount documents retained');
 assert(code.includes('function Gy(t){'),'existing PDF download flow retained');
 assert(code.includes('PhotoBridge —'),'unrelated platform branding still intact');
});
test('R1821: lab Windows update manifest includes byte-exact new frontend and index',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const file of [name,'index.html']){
  const row=manifest.files.find(x=>x.name===file);
  assert(row,'missing '+file);
  assert.equal(row.sha256,hash(fs.readFileSync(root+'/'+file)),file+' hash');
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=read(root+'/index.html');
  assert(html.includes('invoiceIssuer=r1821'),root+' must invalidate frontend cache');
 }
});

test('R1821: changed and missing invoice captions no longer break build',()=>{
 const installer=read('scripts/enable-r1821-lab-invoice-issuer.mjs');
 const begin=installer.indexOf('function pb1821PatchCanvasCaption(');
 const end=installer.indexOf("const asset='assets/index-UIRefine-v655-r84.js';",begin);
 assert(begin>0&&end>begin,'guarded invoice caption helpers in installer');
 const context={};
 vm.runInNewContext(installer.slice(begin,end),context);
 const pdfSource='s.fillText("فاکتور صادرشده در PhotoBridge · مبلغ‌ها ثابت هستند.",o,1640)';
 const pdf=context.pb1821PatchCanvasCaption(pdfSource,'fixture');
 assert(pdf.includes('${pb1821LabInvoiceIssuer(t)}'),'lab name in historical PDF footer');
 assert(!pdf.includes('PhotoBridge'));
 const revised=context.pb1821PatchCanvasCaption('s.fillText("سند صادرشده با PhotoBridge",o,1640)','revised');
 assert(revised.includes('${pb1821LabInvoiceIssuer(t)}'),'later PDF wording accepted');
 const noFooter='s.fillText("مطابق تعرفه",o,1640)';
 assert.equal(context.pb1821PatchCanvasCaption(noFooter,'absent'),noFooter);
 const print='<div class="note">صادرشده با PhotoBridge</div>';
 const changed=context.pb1821PatchHtmlCaption(print,'fixture');
 assert(changed.includes('${_n(pb1821LabInvoiceIssuer(t))}'),'escaped lab name in changed HTML footer');
 assert(!changed.includes('PhotoBridge'));
 assert.equal(context.pb1821PatchHtmlCaption('<div class="note">فاکتور معتبر است</div>','absent'),'<div class="note">فاکتور معتبر است</div>');
});
