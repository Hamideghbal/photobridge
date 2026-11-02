'use strict';
// Only a read-only report from the immutable SQLite snapshot used by data-backups.cjs.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const OUTPUT='مشاهده بکاپ.html';
const fixed=val=>String(val??'');
const amount=val=>{const x=Number(val||0);if(!Number.isSafeInteger(x))throw Error('backup_finance_invalid_amount');return x};
const pick=(model,name)=>model.tables.find(t=>t.name===name)?.rows||[];
function buildViewerData(model,{createdAt,labId,sqliteSha256}){
 if(!model||!Array.isArray(model.tables)||!/^[a-f0-9]{64}$/.test(fixed(sqliteSha256)))throw Error('backup_viewer_invalid_model');
 const customers=pick(model,'CustomerBalances'),byCustomer=new Map(customers.map(c=>[fixed(c.CustomerId),c]));
 const reportSummary=pick(model,'CustomerReportSummary'),reportMap=new Map(reportSummary.map(c=>[fixed(c.CustomerId),c]));
 const inv=pick(model,'Invoices'),byInvoice=new Map(inv.map(i=>[fixed(i.InvoiceId),i]));
 const customer=(id,fall='')=>fixed(byCustomer.get(fixed(id))?.Name||fall||id||'');
 const linesByInvoice=new Map();
 for(const l of pick(model,'InvoiceLines')){
   const id=fixed(l.InvoiceId),group=linesByInvoice.get(id)||[];
   group.push({description:fixed(l.Description),quantity:Number(l.Quantity||0),unitPrice:amount(l.UnitPrice),total:amount(l.LineTotal)});
   linesByInvoice.set(id,group);
 }
 const financeDocs=pick(model,'FinancialDocuments');
 const documents=inv.map(i=>({
  id:fixed(i.InvoiceId),customerId:fixed(i.CustomerId),customer:customer(i.CustomerId,i.CustomerName),
  number:fixed(i.Number),date:fixed(i.IssuedAt),persianDate:fixed(i.ReportDate),
  type:'invoice',total:amount(i.Total),paid:amount(i.Paid),balance:amount(i.Balance),
  origin:fixed(i.Origin),orderId:fixed(i.OrderId),note:fixed(i.Note),lines:linesByInvoice.get(fixed(i.InvoiceId))||[]
 }));
 for(const d of financeDocs){
  if(fixed(d.Type)==='invoice'||!d.Type)continue;
  documents.push({id:fixed(d.DocumentId),customerId:fixed(d.CustomerId),customer:customer(d.CustomerId),
   number:fixed(d.Number),date:fixed(d.IssuedAt),persianDate:'',type:fixed(d.Type),
   total:amount(d.Total),paid:0,balance:0,origin:'',orderId:'',note:'',lines:[]});
 }
 const receipts=pick(model,'Payments').map(p=>{
  const invoice=byInvoice.get(fixed(p.InvoiceId)),customerId=fixed(p.CustomerId||invoice?.CustomerId);
  return {id:fixed(p.PaymentId),customerId,customer:customer(customerId,invoice?.CustomerName),
   number:fixed(invoice?.Number),date:fixed(p.PaidAt),kind:'payment',method:fixed(p.Method),amount:amount(p.Amount),note:fixed(p.Note)};
 });
 // Same document stream the web labels as account discounts/corrections.
 for(const d of financeDocs){
  if(fixed(d.Type)!=='discount')continue;
  receipts.push({id:fixed(d.DocumentId),customerId:fixed(d.CustomerId),customer:customer(d.CustomerId),
   number:fixed(d.Number),date:fixed(d.IssuedAt),kind:'discount',method:'discount',amount:Math.abs(amount(d.Total)),note:'سند تخفیف'});
 }
 // IMPORTANT: use the app's computed per-customer statement, NOT raw double-entry
 // ledger rows; otherwise balances and customer debt would be incorrect.
 const ledger=pick(model,'CustomerStatement').filter(row=>Number(row.RowNumber)>0).map(row=>({
  id:fixed(row.CustomerId)+':'+fixed(row.RowNumber),customerId:fixed(row.CustomerId),
  customer:customer(row.CustomerId,row.CustomerName),date:fixed(row.Date),persianDate:fixed(row.ReportDate),
  ref:fixed(row.InvoiceNumber),description:fixed(row.Description),
  debit:amount(row.Debit),credit:amount(row.Credit),balance:amount(row.Balance),
  rowNumber:Number(row.RowNumber||0),opening:amount(row.OpeningBalance),closing:amount(row.StatementClosing)
 }));
 const studios=customers.map(c=>{
  const summary=reportMap.get(fixed(c.CustomerId));
  return {id:fixed(c.CustomerId),name:fixed(c.Name),mobile:fixed(c.Mobile),
   invoiced:amount(c.Invoiced),paid:amount(c.Paid),balance:amount(c.Balance),
   opening:amount(summary?.OpeningBalance||0),statementClosing:amount(summary?.StatementClosing||0),
   totalDebit:amount(summary?.TotalDebit||0),totalCredit:amount(summary?.TotalCredit||0)};
 }).sort((a,b)=>a.name.localeCompare(b.name,'fa'));
 return{format:'photobridge-finance-offline-v2',createdAt:fixed(createdAt),labId:fixed(labId),sqliteSha256,unit:'تومان',
  studios,documents,receipts,ledger};
}
async function createFinanceViewer(model,database,{createdAt,labId,output}){
 const db=await fs.readFile(database);
 if(db.length<100||db.toString('ascii',0,15)!=='SQLite format 3')throw Error('backup_viewer_not_sqlite');
 const data=buildViewerData(model,{createdAt,labId,sqliteSha256:crypto.createHash('sha256').update(db).digest('hex')});
 const b64=Buffer.from(JSON.stringify(data),'utf8').toString('base64');
 if(b64.length>45_000_000)throw Error('backup_viewer_too_large');
 const template=await fs.readFile(path.join(__dirname,'backup-finance-viewer-template.html'),'utf8');
 const font=await fs.readFile(path.join(__dirname,'assets','photobridge-vazirmatn.woff2'));
 if(font.toString('ascii',0,4)!=='wOF2')throw Error('backup_viewer_font_invalid');
 for(const token of ['__PB_SNAPSHOT_BASE64__','__PB_FONT_BASE64__'])
  if(template.split(token).length!==2)throw Error('backup_viewer_template_invalid');
 const html=template.replace('__PB_SNAPSHOT_BASE64__',b64).replace('__PB_FONT_BASE64__',font.toString('base64'));
 const filename=output||path.join(path.dirname(database),OUTPUT);
 await fs.writeFile(filename,html,{flag:'wx',mode:0o600});
 return{file:filename,counts:{documents:data.documents.length,receipts:data.receipts.length,ledger:data.ledger.length},checksum:data.sqliteSha256};
}
module.exports={OUTPUT,buildViewerData,createFinanceViewer};
