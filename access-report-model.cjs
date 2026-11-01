'use strict';
// Use the same customer-statement engine as the app, not all double-entry
// journal lines: summing both sides would erase the actual customer debt.
function reportDate(value){const parsed=new Date(value);return value&&Number.isFinite(parsed.getTime())?new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(parsed):String(value||'');}
function reportTables(engine,finance){
 const summaries=[],rows=[];
 for(const customer of finance.customers||[]){
  const statement=engine.read('/api/lab/finance/customer-statement',new URLSearchParams({customerId:customer.id}));
  const group=String(customer.name||'بدون نام').slice(0,180)+'|'+customer.id;
  const common={CustomerId:customer.id,CustomerName:customer.name||'بدون نام',Mobile:customer.mobile||'',GroupKey:group,OpeningBalance:Number(statement.openingBalance||0),AccountBalance:Number(customer.balance||0),StatementClosing:Number(statement.closingBalance||0)};
  summaries.push({...common,Mobile:customer.mobile||'',Invoiced:Number(customer.invoiced||0),Paid:Number(customer.paid||0),Debt:Math.max(0,common.AccountBalance),CustomerCredit:Math.max(0,-common.AccountBalance),TotalDebit:Number(statement.summary?.debit||0),TotalCredit:Number(statement.summary?.credit||0)});
  const transactions=statement.rows||[];
  if(!transactions.length)rows.push({...common,RowNumber:0,Date:'',ReportDate:'',Description:'گردشی روی این رایانه موجود نیست؛ ماندهٔ حساب در خلاصه آمده است.',InvoiceNumber:'',Debit:0,Credit:0,Balance:common.StatementClosing});
  for(const [index,row]of transactions.entries())rows.push({...common,RowNumber:index+1,Date:row.txn_date||row.created_at||'',ReportDate:reportDate(row.txn_date||row.created_at),Description:row.description||row.title||'',InvoiceNumber:String(require('./document-ui-patch.cjs').invoiceNumber({number:row.invoice_number||''})),Debit:Number(row.debit||0),Credit:Number(row.credit||0),Balance:Number(row.balance||0)});
 }
 const titles={CustomerId:'شناسه مشتری',CustomerName:'نام آتلیه',GroupKey:'کلید گروه',OpeningBalance:'مانده آغازین',AccountBalance:'مانده فعلی حساب',StatementClosing:'مانده پایان گردش',Mobile:'تلفن همراه',Invoiced:'جمع فاکتورها',Paid:'جمع دریافت',Debt:'بدهی',CustomerCredit:'بستانکاری',TotalDebit:'جمع بدهکار',TotalCredit:'جمع بستانکار',RowNumber:'ردیف',Date:'تاریخ',ReportDate:'تاریخ نمایشی',Description:'شرح',InvoiceNumber:'شماره فاکتور',Debit:'بدهکار',Credit:'بستانکار',Balance:'مانده گردش'};
 const common={CustomerId:'text',CustomerName:'text',Mobile:'text',GroupKey:'text',OpeningBalance:'decimal',AccountBalance:'decimal',StatementClosing:'decimal'};
 const table=(name,title,fields,data)=>({name,title,columns:Object.entries(fields).map(([name,type])=>({name,title:titles[name],type})),rows:data});
 return[table('CustomerReportSummary','خلاصه حساب آتلیه‌ها',{...common,Mobile:'text',Invoiced:'decimal',Paid:'decimal',Debt:'decimal',CustomerCredit:'decimal',TotalDebit:'decimal',TotalCredit:'decimal'},summaries),table('CustomerStatement','گردش معین آتلیه‌ها',{...common,RowNumber:'integer',Date:'text',ReportDate:'text',Description:'memo',InvoiceNumber:'text',Debit:'decimal',Credit:'decimal',Balance:'decimal'},rows)];
}
module.exports={reportTables,reportDate};
