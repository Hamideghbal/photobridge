// R1894 — The server owns status transitions once an invoice is recorded.
// Run after all existing Liara HTML/bundle writers. Never probe the local disk
// or regenerate an already-issued invoice PDF just to advance workflow.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

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
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const uiPath=root+'/assets/index-UIRefine-v655-r84.js';
 const htmlPath=root+'/index.html';
 let ui=fs.readFileSync(uiPath,'utf8');
 if(!ui.includes(marker)){
  // The backend requires a current document revision. Any mobile/browser PATCH
  // must preserve the optimistic concurrency contract; do not bypass it.
  ui=scoped(ui,'It=async(le,nt,xt)=>',',gn=async',part=>{
    part=replaceOne(part,'nt==="printing"&&!await pb1450AllowStage(le)',
      'nt==="printing"&&!await pb1894HasIssuedInvoice(le)&&!await pb1450AllowStage(le)',
      'printing stage: issued invoice bypasses local disk');
    if(part.includes('expectedRevision:'))return part;
    return replaceOne(part,'body:JSON.stringify({status:nt,note:xt||null})',
      'body:JSON.stringify({status:nt,note:xt||null,expectedRevision:le.document_revision})',
      'server document revision in status PATCH');
  },'status PATCH contract');

  ui=scoped(ui,'rn=(le,nt)=>',',en=(le,nt)=>',part=>
    replaceOne(part,'rn=(le,nt)=>{',
      'rn=(le,nt)=>{if(le&&le.invoice_id&&!pb1798NoPrintOrder(le)&&(nt==="download"||nt==="print"||o==="album"&&(nt==="download_print"||nt==="binding")))return!0;',
      'issued-invoice stage eligibility'),'stage predicate');

  ui=scoped(ui,'un=async le=>',',Cn=async',part=>{
    const opening=part.indexOf('try{');
    if(opening<0||opening>260)throw Error('R1894 expected beginning of Ready handler');
    // Ready only changes the server-owned stage; no local folder is required.
    // Status PATCH retains existing invoice, payment and document revision gates.
    const fast='const pb1894ReadyResult=await It(le,"ready");'+
      'if(pb1894ReadyResult?.blocked)return;void Gt(le,"ready").catch(()=>{});'+
      'P("سفارش #"+V(le.number)+" آماده تحویل شد؛ بدون نیاز به پوشه محلی");return;';
    return part.slice(0,opening+4)+fast+part.slice(opening+4);
  },'print ready handler');

  // R1450 protects first-time physical downloads. For already-issued
  // invoices, Ready/Delivered must not depend on a local directory.
  ui=scoped(ui,'un=async le=>',',Cn=async',part=>
    replaceOne(part,'!await pb1450AllowStage(le)',
      'false',
      'Ready is server-only'),'R1450 print Ready guard');

  ui=scoped(ui,'gn=async le=>',',Vn=async',part=>
    replaceOne(part,'!await pb1450AllowStage(le)',
      'false',
      'Delivered is server-only'),'R1450 delivery guard');

  ui=scoped(ui,'Cn=async(le,nt)=>',',aa=async',part=> {
    // Preserve file checks for album printing/binding, never for Ready/Delivered.
    part=replaceOne(part,'["printing","binding","ready","completed"].includes(nt)',
      '["printing","binding"].includes(nt)',
      'album file-dependent stages');
    return replaceOne(part,'!await pb1450AllowStage(le)',
      '!await pb1894HasIssuedInvoice(le)&&!await pb1450AllowStage(le)',
      'album file-dependent stages with issued invoices');
  },'R1450 album stage guard');

  ui+='\nasync function pb1894HasIssuedInvoice(le){if(le?.invoice_id)return true;try{const detail=await Me("/api/lab/orders/"+le.id);if(detail?.invoice?.id){le.invoice_id=detail.invoice.id;return true}return false}catch{return false}}\n'+marker+'\n';
  fs.writeFileSync(uiPath,ui);
}

let html=fs.readFileSync(htmlPath,'utf8');
// Upgrade the actual browser module URL, even when the old R1894 suffix exists.
// The R1896 code was previously deployed with an unchanged R1894 URL, allowing
// browser caches to keep running the obsolete folder-checking bundle.
{
  const search=/index-UIRefine-v655-r84\.js\?[^"'\s]*/g;
  const hits=[...html.matchAll(search)];
  if(hits.length!==1)throw Error('R1897 UI script revision anchor '+hits.length);
  const oldUrl=hits[0][0];
  const newUrl=/[?&]labStage=r\d+/.test(oldUrl)
    ?oldUrl.replace(/([?&])labStage=r\d+/,'$1labStage=r1897')
    :oldUrl+'&labStage=r1897';
  if(newUrl===oldUrl&&!oldUrl.includes('labStage=r1897'))throw Error('R1897 cache revision unchanged');
  if(newUrl!==oldUrl) {
    html=html.replace(oldUrl,newUrl);
    fs.writeFileSync(htmlPath,html);
  }
}
execFileSync(process.execPath,['--check',uiPath],{stdio:'inherit'});
 if(root.endsWith('/lab-desktop-ui')){
  const manifestPath=root+'/manifest.json';
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const sha=content=>crypto.createHash('sha256').update(content).digest('hex');
  for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
   const record=manifest.files.find(row=>row.name===name);
   if(!record)throw Error('R1894 missing native manifest entry '+name);
   record.sha256=sha(fs.readFileSync(root+'/'+name));
  }
  manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestPath,JSON.stringify(manifest));
 }
 console.log('[R1894] issued Lab invoices are folder-independent in '+root);
}
// Existing createOrGetInvoice already reuses issued invoices; backend is unchanged.
