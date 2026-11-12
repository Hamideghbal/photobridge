import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('[R1799] missing/ambiguous anchor '+a.slice(0,100));return s.replace(a,b)};
let server=read('dist/api/server.js');
const helper=`async function pb1799ProductInvoice(c,labId,order){
 if(!productInvoiceRequired(order)||!await isNoPrintOrder(c,labId,order.id))return null;
 const requirements=await orderInvoicePriceRequirements(c,labId,order.id);
 if(requirements.some(row=>!row.resolved))return null;
 return createOrGetInvoice(c,labId,order.id);
}
`;
server=one(server,'async function financeDocumentsForCustomer(',helper+'async function financeDocumentsForCustomer(');
server=one(server,"submitted._invoice = await createOrGetInvoice(c, labId, submitCustomerOrder[1]);","submitted._invoice = await createOrGetInvoice(c, labId, submitCustomerOrder[1]);\n                else submitted._invoice=await pb1799ProductInvoice(c,labId,submitted);");
server=one(server,"const localIntake = fq.rows.every(","const localIntake = !await isNoPrintOrder(c,labId,orderId)&&fq.rows.every(");
server=one(server,'submitted._invoice = null;','submitted._invoice = await pb1799ProductInvoice(c,labId,submitted);');
server=one(server,"await statusEvent(c, uq.rows[0], 'sent', undefined, null);","await statusEvent(c, uq.rows[0], 'sent', undefined, null);\n            uq.rows[0]._invoice=await pb1799ProductInvoice(c,order.lab_id,uq.rows[0]);");
fs.writeFileSync('dist/api/server.js',server);
let api=read('dist/api/lab-auto-processing.js');
api="import {isNoPrintOrder,productInvoiceRequired} from './no-print-workflow.js';\n"+api;
// Keep the same authenticated primary-device endpoint; only goods do not require a photo download proof.
api=one(api,"  if(settings.invoiceTiming!=='after_verified_download')return reply(409,{error:'invoice_timing_after_print'});",'');
api=one(api,"    if(order.invoice_required===false&&!isDirectCustomerInvoiceOrder(order))","    const product=await isNoPrintOrder(c,labId,id);\n    if(!product&&settings.invoiceTiming!=='after_verified_download')throw Object.assign(Error('invoice_timing_after_print'),{status:409});\n    if(product?!productInvoiceRequired(order):order.invoice_required===false&&!isDirectCustomerInvoiceOrder(order))");
api=one(api,"    if(!order.downloaded_at)","    if(!product&&!order.downloaded_at)");
api=one(api,'    const fileQ=await c.query(', '    if(!product){\n    const fileQ=await c.query(');
api=one(api,'    const requirements=await invoiceRequirements(c,labId,id);','    }\n    const requirements=await invoiceRequirements(c,labId,id);');
fs.writeFileSync('dist/api/lab-auto-processing.js',api);
const root='dist/web/lab-desktop-ui',path=root+'/assets/index-UIRefine-v655-r84.js';let ui=read(path);
ui=one(ui,' if(pb1798NoPrintOrder(order))return;',' if(pb1798NoPrintOrder(order))return pb1799ProcessProduct(lab,order,settings);');
ui=one(ui,"     if(previous&&previous.phase!=='complete'||settings.autoDownloadEnabled", "     if(pb1798NoPrintOrder(order)&&settings.autoPrintInvoice&&['sent','received'].includes(String(order.status||''))||previous&&previous.phase!=='complete'||settings.autoDownloadEnabled");
ui+='\n'+read('scripts/r1799-product-worker.js.txt');fs.writeFileSync(path,ui);
const html=root+'/index.html';fs.writeFileSync(html,read(html).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&productAuto=r1799'));
const mp=root+'/manifest.json',m=JSON.parse(read(mp)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html'])m.files.find(f=>f.name===name).sha256=hash(fs.readFileSync(root+'/'+name));
m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(mp,JSON.stringify(m));
for(const path of ['dist/api/server.js','dist/api/lab-auto-processing.js',root+'/assets/index-UIRefine-v655-r84.js'])execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1799] invoice goods on submit; native invoice/thermal processing without photo download');
