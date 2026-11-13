
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
  assert(render.includes('فاکتور صادرشده توسط \${pb1821LabInvoiceIssuer(t)}'),
   root+' invoice PDF issuer caption');
  assert(render.includes('<div class="brand">\${_n(pb1821LabInvoiceIssuer(t))}</div>'),
   root+' print invoice heading escaped for HTML');
  assert(render.includes('این فاکتور توسط \${_n(pb1821LabInvoiceIssuer(t))} صادر شده است.'),
   root+' invoice print footer attribution');
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
