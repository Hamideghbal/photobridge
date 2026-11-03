import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import crypto from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1575 anchor changed: '+a.slice(0,90));return s.replace(a,b)};
write('dist/api/verified-download-invoice.js',read('scripts/r1575-download-invoice.js.txt'));
let p='dist/api/lab-download-receipt.js',s=read(p);
if(!s.includes('R1575 invoice at verified receipt')){
 s=once(s,'orderId,files})','orderId,files,afterVerifiedDownload})');
 s=once(s,"    await c.query('COMMIT');\n    return {order:updated.rows[0],verifiedFiles:rows.length};", "    /* R1575 invoice at verified receipt */\n    const billing=afterVerifiedDownload?await afterVerifiedDownload(c,updated.rows[0]):{};\n    await c.query('COMMIT');\n    return {order:updated.rows[0],verifiedFiles:rows.length,...billing};");write(p,s);
}
p='dist/api/server.js';s=read(p);
if(!s.includes('/* R1575 receipt invoice policy */')){
 s="import {invoiceAfterVerifiedDownload} from './verified-download-invoice.js';\n/* R1575 receipt invoice policy */\n"+s;
 s=once(s,'        i.id IS NOT NULL\n        OR o.status',"        (i.id IS NOT NULL AND (o.printed_at IS NOT NULL OR o.status NOT IN ('sent','received','downloaded','printing','reviewing','needs_fix')))\n        OR o.status");
 s=once(s,'{fileCount:result.verifiedFiles}', '{fileCount:result.verifiedFiles,invoiceId:result.invoice?.id||null,invoiceError:result.invoiceError||null}');
 s=once(s,'orderId:labDownloadReceipt[1],files:body.files}', 'orderId:labDownloadReceipt[1],files:body.files,afterVerifiedDownload:(c,order)=>invoiceAfterVerifiedDownload(c,labId,order,createOrGetInvoice)}');
 // Status changes retrieve an existing invoice but never issue one or inspect disk files.
 for(const [startLabel,endLabel,target] of [["if (labOrder && req.method === 'PATCH')",'const labAlbumStage', 'labOrder[1]'],["const labAlbumStage",'// R', 'order.id']]){
  const start=s.indexOf(startLabel);if(start<0)throw Error('R1575 stage route missing '+startLabel);
  const call='invoice = await createOrGetInvoice(c, labId, '+target+');';const at=s.indexOf(call,start);
  if(at<0||at-start>24000)throw Error('R1575 stage invoice call missing '+target);
  s=s.slice(0,at)+s.slice(at).replace(call,"invoice = (await c.query('SELECT * FROM invoices WHERE lab_id=$1 AND order_id=$2 LIMIT 1',[labId,"+target+"])).rows[0]||null;");
  const after=at+s.slice(at).indexOf('if (invoice.pdf_object_key');if(after>at&&after-at<600)s=s.slice(0,after)+s.slice(after).replace('if (invoice.pdf_object_key','if (invoice?.pdf_object_key');
 }
 s=s.replace(/if \(invoice\?\.pdf_object_key && !invoice.pdf_ready && storageConfigured\)\s+invoiceUploadUrl = await storagePresign\('upload', invoice.pdf_object_key\);/g,'/* PDF is prepared at download; stage changes do not wait for storage. */');
 write(p,s);
}
p='dist/api/lab-auto-processing.js';s=read(p).replace("invoiceTiming:'after_print'","invoiceTiming:'after_verified_download'").replace("invoiceTiming:v.invoiceTiming==='after_verified_download'?'after_verified_download':'after_print'", "invoiceTiming:'after_verified_download'");// Existing invoices are returned without a second manifest/pricing check.
if(!s.includes('R1575 existing invoice reuse')){
 const before='    const fileQ=await c.query(';
 const begin=s.indexOf(before),end=s.indexOf('    invoice=await issueInvoice(c,labId,id);',begin);
 if(begin<0||end<begin)throw Error('R1575 early invoice reuse anchor');
 let block=s.slice(begin,end);block=block.replace(/    wasExisting=Boolean\([^\n]+\n/,'');
 s=s.slice(0,begin)+"    /* R1575 existing invoice reuse */\n    wasExisting=Boolean((await c.query('SELECT id FROM invoices WHERE lab_id=$1 AND order_id=$2 LIMIT 1',[labId,id])).rowCount);\n    if(!wasExisting){\n"+block+'    }\n'+s.slice(end);
 s=s.replace("if(order.invoice_required===false||String(order.mode||'print')!=='print'\n       ||['walkin','manual_invoice','manual'].includes(String(order.source||'')))",'if(order.invoice_required===false)');
}
write(p,s);
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 p=root+'/assets/index-UIRefine-v655-r84.js';s=read(p);
 if(!s.includes('/* R1575 fast stages */')){
  s=once(s,'if(nt==="printing"&&!await pb1450AllowStage(le)){B(value=>value+1);return{blocked:true}}','');
  s=once(s,'if(nt==="printing"&&!await pb1450AllowStage(le)){B(value=>value+1);return}','');
  s=once(s,'return await ye(),Mt},gn=async', 'if(Mt.order)f(rows=>rows.map(row=>row.id===le.id?{...row,...Mt.order}:row));void ye().catch(()=>{});return Mt},gn=async');
  s=once(s,'await It(le,"completed"),await Gt(le,"completed"),','await It(le,"completed");k("completed");void Gt(le,"completed").catch(()=>{});');
  const start=s.indexOf('un=async le=>'),end=s.indexOf(',Cn=async',start);if(start<0||end<start)throw Error('R1575 ready handler anchor');
  s=s.slice(0,start)+`un=async le=>{if(E)return;C(le.id);try{const result=await It(le,"ready");k("ready");void Gt(le,"ready").catch(()=>{});P("سفارش #"+V(le.number)+" آماده تحویل شد"+(le.invoice_required!==false&&!result.invoice&&!le.invoice_id?" · فاکتور مالی این سفارش باید دستی صادر یا اصلاح شود.":""))}catch(error){P(error?.data?.message||"ثبت آماده‌تحویل انجام نشد؛ دوباره تلاش کنید.");void ye().catch(()=>{})}finally{C("")}}`+s.slice(end);
  const albumStart=s.indexOf('Cn=async(le,nt)=>'),albumEnd=s.indexOf(',aa=async',albumStart);if(albumStart<0||albumEnd<albumStart)throw Error('R1575 album stage handler anchor');
  s=s.slice(0,albumStart)+`Cn=async(le,nt)=>{if(E)return;C(le.id);try{const result=await Me('/api/lab/orders/'+le.id+'/album-stage',{method:'PUT',body:JSON.stringify({stage:nt,expectedRevision:le.document_revision,expectedUpdatedAt:le.updated_at})});if(result.order)f(rows=>rows.map(row=>row.id===le.id?{...row,...result.order}:row));void ye().catch(()=>{});if(nt==="ready"||nt==="completed"){k(nt);void Gt(le,nt).catch(()=>{})}else{k("flow");b(le.id)}P("آلبوم #"+V(le.number)+" · "+Mc[nt]+(nt==="ready"&&le.invoice_required!==false&&!result.invoice&&!le.invoice_id?" · فاکتور مالی این سفارش باید دستی صادر یا اصلاح شود.":""))}catch(error){P(error?.data?.message||"تغییر مرحله آلبوم انجام نشد؛ دوباره تلاش کنید.");void ye().catch(()=>{})}finally{C("")}}`+s.slice(albumEnd);
  // Keep accounting at download fixed; retain other automation choices.
  const a=s.indexOf("e.jsxs('label',{className:'pb1568Select'");
  if(a>=0){const b=s.indexOf("e.jsxs('label'",a+10);const block=s.slice(a,b<0?a+1400:b);if(block.includes('invoiceTiming')){
   const optionStart=s.indexOf("e.jsxs('select'",a),optionEnd=s.indexOf(']})',optionStart);
   if(optionStart>=0&&optionEnd>optionStart&&optionEnd-optionStart<900)s=s.slice(0,optionStart)+"e.jsx('span',{children:'پس از دانلود کامل و تطبیق با سرور؛ پیش از چاپ عکس‌ها'})"+s.slice(optionEnd+3);
  }}
  s+='\n/* R1575 fast stages */\n';write(p,s);
 }
 const html=root+'/index.html';write(html,read(html).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&downloadInvoice=r1575')?u:u+'&downloadInvoice=r1575'));
}
const root='dist/web/lab-desktop-ui',manifestPath=root+'/manifest.json',m=JSON.parse(read(manifestPath)),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html'])m.files.find(x=>x.name===name).sha256=sha(fs.readFileSync(root+'/'+name));m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();write(manifestPath,JSON.stringify(m));

for(const file of ['dist/api/server.js','dist/web/assets/index-UIRefine-v655-r84.js','dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
