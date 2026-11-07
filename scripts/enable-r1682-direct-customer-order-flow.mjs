import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const one=(s,a,b,label)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('R1682 '+label+' anchor count '+count);
 return s.replace(a,b);
};

// The API handler is prebuilt before the late invoice-policy stages.
// R1575 has already reduced its old eligibility condition to invoice_required.
let api=read('dist/api/lab-auto-processing.js');
if(!api.includes('/* R1682 direct customer invoice eligibility */')){
 const anchor="export const automationKey=labId=>'lab_auto_processing:'+labId;";
 const helper="export function isDirectCustomerInvoiceOrder(order={}){const kind=String(order.customer_kind||'').trim().toLowerCase();if(kind==='customer')return true;if(kind==='coworker')return false;const source=String(order.source||order.order_source||'').trim().toLowerCase();return source==='walkin'||source==='manual_invoice'||Boolean(String(order.walkin_customer_name||'').trim());}";
 api=one(api,anchor,anchor+'\n'+helper,'direct customer predicate');
 const long="if(order.invoice_required===false||String(order.mode||'print')!=='print'\n       ||['walkin','manual_invoice','manual'].includes(String(order.source||'')))";
 const short='if(order.invoice_required===false)';
 const replacement='if(order.invoice_required===false&&!isDirectCustomerInvoiceOrder(order))';
 if(api.split(long).length===2)api=api.replace(long,replacement);
 else if(api.split(short).length===2)api=api.replace(short,replacement);
 else throw Error('R1682 automation invoice eligibility anchor missing');
 api=one(api,"if(order.settlement_mode==='prepaid'&&order.payment_status!=='paid')",
   "if(!isDirectCustomerInvoiceOrder(order)&&order.settlement_mode==='prepaid'&&order.payment_status!=='paid')",
   'direct customer prepaid eligibility');
 api+='\n/* R1682 direct customer invoice eligibility */\n';
 write('dist/api/lab-auto-processing.js',api);
}
execFileSync(process.execPath,['--check','dist/api/lab-auto-processing.js'],{stdio:'inherit'});

// Ensure the late API modules use the same direct-customer exception.
fs.copyFileSync('scripts/r1575-download-invoice.js.txt','dist/api/verified-download-invoice.js');
fs.copyFileSync('scripts/r1613-priced-invoice-policy.js.txt','dist/api/lab-priced-invoice-policy.js');
fs.copyFileSync('scripts/r1613-invoice-stage-guard.js.txt','dist/api/lab-invoice-stage-guard.js');
for(const file of ['dist/api/verified-download-invoice.js','dist/api/lab-priced-invoice-policy.js','dist/api/lab-invoice-stage-guard.js'])
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});

const oldPending="function pb1603InvoicePending(order){return order.invoice_required!==false&&!order.invoice_id&&!order.invoiceId&&!order.local_invoice_id&&(!!order.downloaded_at||['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(order.status||'')))}";
const directHelper="function pb1682DirectCustomer(order){const kind=String(order?.customer_kind||'').trim().toLowerCase(),source=String(order?.source||order?.order_source||'').trim().toLowerCase();return kind==='customer'||kind!=='coworker'&&(source==='walkin'||source==='manual_invoice'||Boolean(String(order?.walkin_customer_name||'').trim()))}";
const newPending="function pb1603InvoicePending(order){return (order.invoice_required!==false||pb1682DirectCustomer(order))&&!order.invoice_id&&!order.invoiceId&&!order.local_invoice_id&&(!!order.downloaded_at||['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(order.status||'')))}";
const oldStage="function pb1603StageInvoicePending(order,stage){return pb1603InvoicePending(order)&&(stage==='completed'||String(order.settlement_mode||'ledger')==='prepaid'&&['print','printing','binding'].includes(stage))}";
const newStage="function pb1603StageInvoicePending(order,stage){return pb1603InvoicePending(order)&&(pb1682DirectCustomer(order)?(['ready','completed'].includes(stage)||String(order.settlement_mode||'ledger')==='prepaid'&&['print','printing','binding'].includes(stage)):stage==='completed'||String(order.settlement_mode||'ledger')==='prepaid'&&['print','printing','binding'].includes(stage))}";

const nextPricingHandler='Nn=async saved=>{const selection=Se,order={...(selection?.order||{}),...(saved?.order||{})};if(!order.id)return;if(saved?.ready===false||saved?.missing?.length){P("قیمت همهٔ ردیف‌ها را تکمیل کنید.");return}Fe(null);C(order.id);if(saved?.order)f(rows=>rows.map(row=>row.id===order.id?{...row,...saved.order}:row));try{if(saved?.invoice?.id){const invoice=saved.invoice;const fresh=await Me("/api/lab/orders/"+encodeURIComponent(order.id));if(fresh?.order)f(rows=>rows.map(row=>row.id===order.id?{...row,...fresh.order}:row));if(typeof pb1568Save==="function")pb1568Save(order.lab_id||t.id,order.id,{phase:"complete",invoiceId:invoice.id,attempts:0});P("فاکتور #"+V(invoice.number)+" پس از قیمت‌گذاری صادر شد.");if(!invoice.pdf_ready)await pb1547CompletePdf(invoice,order.id,ai());await Qn(invoice.id,{...invoice,order_number:order.number,lab_name:t.name});return}if(pb1682DirectCustomer(order)||order.invoice_required!==false)throw Error("invoice_missing_after_pricing");P("قیمت‌گذاری سفارش #"+V(order.number||"")+" ذخیره شد.")}catch(error){P("قیمت ثبت شد، اما صدور فاکتور کامل نشد؛ وضعیت سفارش را بررسی کنید.");pb1547Notice(error?.message||"صدور فاکتور انجام نشد.","warning")}finally{C("");void ye().catch(()=>{});if(h?.id===order.id)void Tt(order,false).catch(()=>{})}}';

function replaceOptional(source,oldValue,newValue,label){
 const count=source.split(oldValue).length-1;
 if(count===1)return source.replace(oldValue,newValue);
 if(count>1)throw Error('R1682 duplicate '+label+' text '+count);
 return source;
}

// If the frozen Windows snapshot already contains an older R1568 worker,
// replace only its scheduler tail; do not duplicate the worker's processing functions.
const nativeAsset='dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js';
let nativeJs=read(nativeAsset);
if(!nativeJs.includes('/* R1682 event-driven order download */')){
 const workerSource=read('scripts/r1568-native-worker.js.txt');
 const marker='/* R1682 event-driven order download:';
 const markerAt=workerSource.indexOf(marker);
 if(markerAt<0)throw Error('R1682 updated native worker tail missing');
 const oldTail="if(typeof window!=='undefined'&&window.pbNativeStorage){\n setTimeout(()=>void pb1568AutoTick(),12000);\n setInterval(()=>void pb1568AutoTick(),45000);\n window.pb1568AutomationStatus=()=>({...pb1568Work});\n}";
 nativeJs=one(nativeJs,oldTail,workerSource.slice(markerAt),'native worker scheduler');
 write(nativeAsset,nativeJs);
 execFileSync(process.execPath,['--check',nativeAsset],{stdio:'inherit'});
}

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';
 let js=read(file);
 if(!js.includes('/* PB1682 direct customer invoice policy */')){
  js=one(js,oldPending,directHelper+'\n'+newPending,'direct customer invoice visibility');
  js=one(js,oldStage,newStage,'direct customer ready-stage guard');
  const start=js.indexOf('Nn=async saved=>');
  const end=start<0?-1:js.indexOf(';x.useEffect(()=>{const lab=t?.id;',start);
  if(start<0||end<start)throw Error('R1682 manual price callback landmark missing '+root);
  js=js.slice(0,start)+nextPricingHandler+js.slice(end);

  js=replaceOptional(js,'این سفارش سایز بدون تعرفه دارد','قیمت‌گذاری اختصاصی این سفارش','pricing modal title');
  const bodyMatch=js.match(/ارسال فایل متوقف (?:نشده|شده) است\. فقط برای همین سفارش قیمت واحد را مشخص کن(?:ید)?؛/);
  if(bodyMatch){
   const bodyAt=js.indexOf(bodyMatch[0]),endText='فاکتور صادر نمی‌شود',bodyEndAt=js.indexOf(endText,bodyAt);
   if(bodyEndAt>=0){
    let end=bodyEndAt+endText.length;if(js[end]==='.')end++;
    js=js.slice(0,bodyAt)+'مبالغ واردشده فقط برای همین سفارش ثبت می‌شوند و تعرفه عمومی لابراتوار را تغییر نمی‌دهند. اگر ردیفی قیمت نداشته باشد، همان ردیف برای تکمیل در فهرست زیر نمایش داده می‌شود.'+js.slice(end);
   }
  }
  js+='\n/* PB1682 direct customer invoice policy */\n';
  write(file,js);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});

 const htmlFile=root+'/index.html';
 let html=read(htmlFile);
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>
  url.includes('&directCustomerFlow=r1682')?url:url+'&directCustomerFlow=r1682');
 write(htmlFile,html);

 if(root.endsWith('lab-desktop-ui')){
  const manifestPath=root+'/manifest.json',manifest=JSON.parse(read(manifestPath));
  if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))
   throw Error('R1682 native manifest contract changed');
  for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
   const item=manifest.files.find(row=>row.name===name);
   if(!item)throw Error('R1682 missing native manifest entry '+name);
   item.sha256=digest(fs.readFileSync(root+'/'+name));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=digest(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  write(manifestPath,JSON.stringify(manifest));
 }
}
console.log('[R1682] Direct-customer pricing issues its invoice; Ready is guarded; order downloads start on order refresh with a 10s fallback.');
