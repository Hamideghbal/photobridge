'use strict';
const crypto=require('node:crypto');
const maxCacheBytes=2*1024*1024;
const initialized=new WeakSet();
function table(db){
 if(initialized.has(db))return;
 db.exec('CREATE TABLE IF NOT EXISTS local_invoice_render_cache(lab TEXT NOT NULL,invoice TEXT NOT NULL,html_hash TEXT NOT NULL,pdf BLOB NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(lab,invoice))');
 initialized.add(db);
}
async function cachedInvoicePdf({store,lab,invoice,html,render,checkAccount=()=>{}}){
 if(typeof html!=='string'||!html.startsWith('<')||typeof render!=='function')throw Error('invalid_invoice_renderer');
 if(!lab||!invoice)throw Error('invalid_invoice_cache_scope');
 const db=store?.db,sha=crypto.createHash('sha256').update(html).digest('hex');
 if(db){
  table(db);
  const previous=db.prepare('SELECT html_hash,pdf FROM local_invoice_render_cache WHERE lab=? AND invoice=?').get(lab,invoice);
  checkAccount();
  if(previous?.html_hash===sha&&Buffer.from(previous.pdf).subarray(0,5).toString()==='%PDF-')return Buffer.from(previous.pdf);
 }
 const pdf=Buffer.from(await render(html));
 checkAccount();
 if(pdf.length<5||pdf.subarray(0,5).toString()!=='%PDF-')throw Error('invalid_invoice_pdf');
 if(db&&pdf.length<=maxCacheBytes){
  db.prepare('INSERT INTO local_invoice_render_cache(lab,invoice,html_hash,pdf,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(lab,invoice) DO UPDATE SET html_hash=excluded.html_hash,pdf=excluded.pdf,updated_at=excluded.updated_at').run(lab,invoice,sha,pdf,Date.now());
  db.prepare('DELETE FROM local_invoice_render_cache WHERE lab=? AND invoice NOT IN (SELECT invoice FROM local_invoice_render_cache WHERE lab=? ORDER BY updated_at DESC LIMIT 80)').run(lab,lab);
 }
 return pdf;
}
module.exports={cachedInvoicePdf};
