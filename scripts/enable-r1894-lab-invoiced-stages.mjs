// R1894 — The server owns status transitions once an invoice is recorded.
// Run after all existing Liara HTML/bundle writers. Never probe the local disk
// or regenerate an already-issued invoice PDF just to advance workflow.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const uiPath='dist/web/assets/index-UIRefine-v655-r84.js';
const apiPath='dist/api/server.js';
const htmlPath='dist/web/index.html';
let ui=fs.readFileSync(uiPath,'utf8');
let api=fs.readFileSync(apiPath,'utf8');
const marker='/* PB1894 invoice-first server stages */';

function replaceOne(text,oldText,newText,label){
  const matches=text.split(oldText).length-1;
  if(matches!==1)throw Error('R1894 '+label+' anchor mismatch: '+matches);
  return text.replace(oldText,newText);
}
function scoped(text,from,to,edit,label){
  const start=text.indexOf(from);
  const end=start<0?-1:text.indexOf(to,start);
  if(start<0||end<=start)throw Error('R1894 '+label+' section missing');
  return text.slice(0,start)+edit(text.slice(start,end))+text.slice(end);
}
if(!ui.includes(marker)){
  ui=scoped(ui,'rn=(le,nt)=>',',en=(le,nt)=>',part=>
    replaceOne(part,'rn=(le,nt)=>{',
      'rn=(le,nt)=>{if(le&&le.invoice_id&&(nt==="download"||nt==="print"||o==="album"&&(nt==="download_print"||nt==="binding")))return!0;',
      'issued-invoice stage eligibility'),'stage predicate');

  ui=scoped(ui,'un=async le=>',',Cn=async',part=>{
    const opening=part.indexOf('try{');
    if(opening<0||opening>260)throw Error('R1894 expected beginning of Ready handler');
    const fast='const pb1894ExistingInvoice=le.invoice_id||(await Me("/api/lab/orders/"+le.id).then(v=>v.invoice&&v.invoice.id).catch(()=>null));'+
      'if(pb1894ExistingInvoice){if(le.status!=="ready")await It(le,"ready");await Gt(le,"ready").catch(()=>{});'+
      'P("سفارش #"+V(le.number)+" آماده تحویل شد؛ بدون نیاز به پوشه یا صدور دوباره فاکتور");return}';
    return part.slice(0,opening+4)+fast+part.slice(opening+4);
  },'print ready handler');

  // R1450 protects first-time physical downloads. For already-issued
  // invoices, Ready/Delivered must not depend on a local directory.
  ui=scoped(ui,'un=async le=>',',Cn=async',part=>
    replaceOne(part,'!await pb1450AllowStage(le)',
      '!await pb1894HasIssuedInvoice(le)&&!await pb1450AllowStage(le)',
      'Ready guard for issued invoices'),'R1450 print Ready guard');

  ui=scoped(ui,'gn=async le=>',',Vn=async',part=>
    replaceOne(part,'!await pb1450AllowStage(le)',
      '!await pb1894HasIssuedInvoice(le)&&!await pb1450AllowStage(le)',
      'Delivered guard for issued invoices'),'R1450 delivery guard');

  ui=scoped(ui,'Cn=async(le,nt)=>',',aa=async',part=>
    replaceOne(part,'!await pb1450AllowStage(le)',
      '!(nt!=="printing"&&await pb1894HasIssuedInvoice(le))&&!await pb1450AllowStage(le)',
      'album Ready and Delivered guard'),'R1450 album stage guard');

  ui+='\nasync function pb1894HasIssuedInvoice(le){if(le?.invoice_id)return true;try{const detail=await Me("/api/lab/orders/"+le.id);if(detail?.invoice?.id){le.invoice_id=detail.invoice.id;return true}return false}catch{return false}}\n'+marker+'\n';
  fs.writeFileSync(uiPath,ui);
}

if(!api.includes(marker)){
  api=scoped(api,"if (labOrder && req.method === 'PATCH')","// v0.17.565-pdf-upload",part=>{
    part=replaceOne(part,'invoice = await createOrGetInvoice(c, labId, labOrder[1]);',
      'const priorInvoice = await c.query("SELECT * FROM invoices WHERE order_id=$1 AND lab_id=$2 ORDER BY issued_at ASC LIMIT 1", [labOrder[1], labId]);\n'+
      '                        invoice = priorInvoice.rows[0] || await createOrGetInvoice(c, labId, labOrder[1]);',
      'print invoice reuse');
    return replaceOne(part,
      'if (invoice.pdf_object_key && !invoice.pdf_ready && storageConfigured)',
      'if (!priorInvoice.rowCount && invoice.pdf_object_key && !invoice.pdf_ready && storageConfigured)',
      'do not presign previously issued print invoice');
  },'print PATCH');

  api=scoped(api,"if (labAlbumStage && req.method === 'PUT')","if (req.method === 'GET' && url.pathname === '/api/lab/walkin')",part=>{
    part=replaceOne(part,
      'let order = null, invoice = null, invoiceUploadUrl = null, statusChanged = false;',
      'let order = null, invoice = null, invoiceUploadUrl = null, statusChanged = false, invoiceReused = false;',
      'album existing marker');
    part=replaceOne(part,'invoice = await createOrGetInvoice(c, labId, order.id);',
      'const priorInvoice = await c.query("SELECT * FROM invoices WHERE order_id=$1 AND lab_id=$2 ORDER BY issued_at ASC LIMIT 1", [order.id, labId]);\n'+
      '                        invoiceReused = Boolean(priorInvoice.rowCount);\n'+
      '                        invoice = priorInvoice.rows[0] || await createOrGetInvoice(c, labId, order.id);',
      'album invoice reuse');
    part=replaceOne(part,
      'if (invoice.pdf_object_key && !invoice.pdf_ready && storageConfigured)',
      'if (!invoiceReused && invoice.pdf_object_key && !invoice.pdf_ready && storageConfigured)',
      'do not presign previously issued album invoice');
    return replaceOne(part,
      'return sendJson(res, 200, { order, invoice, invoiceUploadUrl });',
      'return sendJson(res, 200, { order, invoice, invoiceUploadUrl, invoiceReused });',
      'album response reuse marker');
  },'album PUT');
  api+='\n'+marker+'\n';
  fs.writeFileSync(apiPath,api);
}
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('labStage=r1894')){
  const search=/index-UIRefine-v655-r84\.js\?[^"'\s]*/g;
  const hits=[...html.matchAll(search)];
  if(hits.length!==1)throw Error('R1894 UI script revision anchor '+hits.length);
  html=html.replace(search,m=>m+'&labStage=r1894');
  fs.writeFileSync(htmlPath,html);
}
execFileSync(process.execPath,['--check',uiPath],{stdio:'inherit'});
execFileSync(process.execPath,['--check',apiPath],{stdio:'inherit'});
console.log('[R1894] Server-only changes for previously issued lab invoices (print and album), no disk dependency');
