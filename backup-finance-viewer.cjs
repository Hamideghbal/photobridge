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
 const customers=new Map(table('CustomerBalances').map(c=>[text(c.CustomerId),text(c.Name)]));
 const invoices=table('Invoices'),invoiceById=new Map(invoices.map(inv=>[text(inv.InvoiceId),inv]));
 const customerName=(id,fallback)=>customers.get(text(id))||text(fallback)||text(id);
 const output={
  format:'photobridge-finance-offline-v1',createdAt:text(createdAt),labId:text(labId),sqliteSha256,
  invoices:invoices.map(inv=>({
   number:text(inv.Number),date:text(inv.IssuedAt),customer:customerName(inv.CustomerId,inv.CustomerName),
   total:money(inv.Total),paid:money(inv.Paid),balance:money(inv.Balance),origin:text(inv.Origin),note:text(inv.Note)
  })),
  receipts:table('Payments').map(p=>{
   const invoice=invoiceById.get(text(p.InvoiceId));
   return {ref:text(p.PaymentId),date:text(p.PaidAt),
    customer:customerName(p.CustomerId,invoice?.CustomerName),
    invoice:invoice?text(invoice.Number):text(p.InvoiceId),
    amount:money(p.Amount),method:text(p.Method),note:text(p.Note)};
  }),
  ledger:table('LedgerDetail').map(entry=>({
   ref:text(entry.TransactionId),date:text(entry.Date),description:text(entry.Description),
   account:text(entry.Account),customer:customerName(entry.CustomerId,''),
   debit:money(entry.Debit),credit:money(entry.Credit)
  }))
 };
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
