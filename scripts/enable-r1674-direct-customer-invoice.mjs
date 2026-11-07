/* R1674: standalone direct-customer invoices in thermal, A4, PDF, preview.
 * Preserve coworker invoice paths and their existing debt summary.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {withDirectCustomerIdentityFields} from './r1674-invoice-api-parties.mjs';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function one(s,oldValue,next,label){
 const n=s.split(oldValue).length-1;
 if(n!==1)throw Error('R1674 '+label+' count '+n);
 return s.replace(oldValue,next);
}
let api=fs.readFileSync('dist/api/server.js','utf8');
api=withDirectCustomerIdentityFields(api);
fs.writeFileSync('dist/api/server.js',api);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});

function patchPreview(js,root){
 const anchor='function Oc({role:t,invoice:a,onClose:s})';
 const start=js.indexOf(anchor),end=js.indexOf('function ',start+anchor.length);
 if(start<0||end<0||end-start>18000)throw Error('R1674 preview boundary '+root);
 let p=js.slice(start,end);
 p=one(p,'e.jsx("h2",{children:"فاکتور فروش و خدمات چاپ"})',
   'e.jsx("h2",{children:pb1674DirectCustomer(a)?"فاکتور خدمات مشتری آزاد":"فاکتور فروش و خدمات چاپ"})','preview heading '+root);
 p=one(p,'e.jsx("small",{children:t==="lab"?"مشتری / عکاسی":"صادرکننده / لابراتوار"})',
   'e.jsx("small",{children:pb1674DirectCustomer(a)?"نام مشتری":t==="lab"?"مشتری / عکاسی":"صادرکننده / لابراتوار"})','preview customer label '+root);
 const oldName='e.jsx("b",{children:t==="lab"?a.customer_name||"—":a.lab_name||"—"})]})';
 const newName='e.jsx("b",{children:pb1674DirectCustomer(a)?pb1674CustomerName(a):t==="lab"?a.customer_name||"—":a.lab_name||"—"})]}),pb1674DirectCustomer(a)&&e.jsxs("div",{children:[e.jsx("small",{children:"شماره موبایل مشتری"}),e.jsx("b",{children:pb1674CustomerMobile(a)})]})';
 p=one(p,oldName,newName,'preview customer name and mobile '+root);
 const oldPrint='e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,t),children:"چاپ فاکتور"})';
 const newPrint='e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,t),children:pb1674DirectCustomer(a)&&t==="lab"?"چاپ حرارتی":"چاپ فاکتور"}),pb1674DirectCustomer(a)&&t==="lab"&&e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,"customer-a4"),children:"چاپ A4"})';
 p=one(p,oldPrint,newPrint,'preview thermal and A4 buttons '+root);
 p=one(p,'e.jsxs("div",{className:"invoiceAccountDebt"',
    '!pb1674DirectCustomer(a)&&e.jsxs("div",{className:"invoiceAccountDebt"','preview coworker-only debt '+root);
 return js.slice(0,start)+p+js.slice(end);
}

const renderer=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
if(!renderer.includes('function pb1674CustomerA4(')||
   !renderer.includes('function pb1674CustomerThermal(')||
   !renderer.includes('async function pb1674CustomerPdf('))
 throw Error('R1674 customer invoice renderers unavailable');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';
 let js=fs.readFileSync(file,'utf8');
 if(js.includes('function pb1674DirectCustomer('))throw Error('R1674 duplicate invoice functions '+root);
 js=one(js,'function Vy(t,a){',renderer+'\nfunction Vy(t,a){','customer renderers '+root);
 js=one(js,'function Vy(t,a){','function Vy(t,a){if(pb1674DirectCustomer(t))return pb1674CustomerA4(t);','direct A4 print '+root);
 js=one(js,'async function Wu(t){','async function Wu(t){if(pb1674DirectCustomer(t))return pb1674CustomerPdf(t);','direct PDF '+root);
 js=one(js,"a==='lab'?pb1665Thermal(t,a):Vy(t,a)",
   "a==='lab'?(pb1674DirectCustomer(t)?pb1674CustomerThermal(t):pb1665Thermal(t,a)):Vy(t,a)",
   'direct thermal '+root);
 js=patchPreview(js,root);
 fs.writeFileSync(file,js);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlFile=root+'/index.html';
 let html=fs.readFileSync(htmlFile,'utf8'),count=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,url=>{count++;return url+'&directCustomerInvoice=r1674'});
 if(count!==1)throw Error('R1674 bundle reference '+root+' '+count);
 fs.writeFileSync(htmlFile,html);
 if(root.endsWith('/lab-desktop-ui')){
  const mp=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(mp,'utf8'));
  if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))
   throw Error('R1674 native manifest contract '+root);
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const entry=manifest.files.find(x=>x.name===name);
   if(!entry)throw Error('R1674 native manifest entry '+name);
   entry.sha256=digest(fs.readFileSync(root+'/'+name));
  }
  manifest.build=digest(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(mp,JSON.stringify(manifest));
 }
}
console.log('[R1674] Direct-customer thermal/A4/PDF and preview separated from photographer invoices.');
