'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const crypto=require('node:crypto');
const templatePath=path.join(__dirname,'backup-finance-viewer-template.html');
const OUTPUT='مشاهده بکاپ.html';
const text=value=>String(value??'');
const money=value=>{const n=Number(value??0);if(!Number.isSafeInteger(n))throw Error('offline_viewer_invalid_money');return n};
function prepareFinanceData(model,{createdAt,labId,sqliteSha256}){
 if(!model||!Array.isArray(model.tables)||!/^([a-f0-9]{64})$/.test(sqliteSha256))throw Error('offline_viewer_invalid_snapshot');
 const table=name=>model.tables.find(item=>item.name===name)?.rows||[];
 const customerRows=table('CustomerBalances');
 const customers=new Map(customerRows.map(c=>[text(c.CustomerId),text(c.Name).trim()]));
 const invoices=table('Invoices'),invoiceById=new Map(invoices.map(inv=>[text(inv.InvoiceId),inv]));
 const journals=new Map(table('Ledger').map(journal=>[text(journal.TransactionId),journal]));
 const entries=table('LedgerEntries');
 const customerName=(id,fallback)=>customers.get(text(id))||text(fallback).trim()||'';
 // A journal may contain a non-customer debit/credit line. Attribute it to a
 // studio only if a single, unambiguous customer is identified in that journal
 // or the line's linked invoice. Never guess from a different laboratory.
 const journalCustomers=new Map();
 for(const entry of entries){
   const id=text(entry.CustomerId)||(invoiceById.get(text(entry.InvoiceId))?.CustomerId||'');
   if(!id)continue;
   const key=text(entry.TransactionId),ids=journalCustomers.get(key)||new Set();
   ids.add(text(id));journalCustomers.set(key,ids);
 }
 const output={
  format:'photobridge-finance-offline-v1',createdAt:text(createdAt),labId:text(labId),sqliteSha256,
  invoices:invoices.map(inv=>({
   studioId:text(inv.CustomerId),number:text(inv.Number),date:text(inv.IssuedAt),
   customer:customerName(inv.CustomerId,inv.CustomerName),
   total:money(inv.Total),paid:money(inv.Paid),balance:money(inv.Balance),origin:text(inv.Origin),note:text(inv.Note)
  })),
  receipts:table('Payments').map(p=>{
   const invoice=invoiceById.get(text(p.InvoiceId));
   const id=text(p.CustomerId)||text(invoice?.CustomerId);
   return {studioId:id,ref:text(p.PaymentId),date:text(p.PaidAt),
    customer:customerName(id,invoice?.CustomerName),
    invoice:invoice?text(invoice.Number):text(p.InvoiceId),
    amount:money(p.Amount),method:text(p.Method),note:text(p.Note)};
  }),
  ledger:entries.map(entry=>{
   const journal=journals.get(text(entry.TransactionId));
   const ids=journalCustomers.get(text(entry.TransactionId));
   const invoice=invoiceById.get(text(entry.InvoiceId))||invoiceById.get(text(journal?.ReferenceId));
   const id=text(entry.CustomerId)||text(invoice?.CustomerId)||(ids?.size===1?[...ids][0]:'');
   return{
    studioId:id,ref:text(entry.TransactionId),date:text(journal?.Date),
    description:text(journal?.Description),account:text(entry.Account),customer:customerName(id,invoice?.CustomerName),
    debit:money(entry.Debit),credit:money(entry.Credit)
   };
  })
 };
 // List comes from the immutable saved snapshot, never live server calls.
 output.studios=[...new Map(
  [...customerRows.map(c=>({id:text(c.CustomerId),name:text(c.Name).trim()})),
   ...Object.values({invoices:output.invoices,receipts:output.receipts,ledger:output.ledger})
    .flatMap(rows=>rows.filter(row=>row.studioId&&row.customer).map(row=>({id:row.studioId,name:row.customer})))]
  .filter(x=>x.id&&x.name).map(x=>[x.id,x])
 ).values()].sort((a,b)=>a.name.localeCompare(b.name,'fa'));

 return output;
}
async function createFinanceViewer(model,database,{createdAt,labId,output}){
 const db=await fs.open(database,'r');
 let sha;
 try{
  const data=await fs.readFile(database);
  if(data.length<100||data.toString('utf8',0,15)!=='SQLite format 3')throw Error('offline_viewer_not_sqlite');
  sha=crypto.createHash('sha256').update(data).digest('hex');
 }finally{await db.close()}
 const viewer=prepareFinanceData(model,{createdAt,labId,sqliteSha256:sha});
 const b64=Buffer.from(JSON.stringify(viewer),'utf8').toString('base64');
 if(b64.length>35_000_000)throw Error('offline_viewer_exceeds_limit');
 const template=await fs.readFile(templatePath,'utf8');
 const token='__PB_SNAPSHOT_BASE64__';
 if(template.split(token).length!==2)throw Error('offline_viewer_template_invalid');
 const html=template.replace(token,b64);
 const destination=output||path.join(path.dirname(database),OUTPUT);
 await fs.writeFile(destination,html,{flag:'wx',mode:0o600});
 return{filename:path.basename(destination),counts:{invoices:viewer.invoices.length,receipts:viewer.receipts.length,ledger:viewer.ledger.length},sqliteSha256:sha};
}
module.exports={OUTPUT,prepareFinanceData,createFinanceViewer};
