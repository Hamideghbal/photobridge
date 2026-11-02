'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const {LabStore}=require('../store.cjs'),{LocalBusiness}=require('../local-business.cjs');
const {DataBackups,verifyBackup}=require('../data-backups.cjs');
const {buildViewerData,OUTPUT}=require('../backup-finance-viewer.cjs');
const unpack=async file=>{
 const html=await fs.readFile(file,'utf8'),match=html.match(/<script type="application\/octet-stream" id="snapshot">([A-Za-z0-9+/=]+)<\/script>/);
 assert(match,'HTML must contain its own fixed-data payload');
 return{html,data:JSON.parse(Buffer.from(match[1],'base64').toString('utf8'))};
};
test('offline financial viewer is generated from exact 1.0.79 backup and integrity-verified',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pb79-viewer-'));
 const store=new LabStore(path.join(dir,'lab.sqlite'));
 try{
  store.set('labId','lab-test');store.set('auth',{name:'Test'});store.set('cookie','PRIVATE_COOKIE_DO_NOT_EXPORT');
  const engine=new LocalBusiness(store);
  const customer=engine.handle('POST','/api/lab/customers',{name:'آتلیه باران'},crypto.randomUUID(),{isolated:true}).customer;
  const invoice=engine.handle('POST','/api/lab/invoices/manual',{customerId:customer.id,items:[{description:'چاپ عکس ۲ عدد',quantity:2,unitPrice:15000}]},crypto.randomUUID(),{isolated:true}).invoice;
  engine.handle('POST','/api/lab/finance/payments',{invoiceId:invoice.id,amount:10000,method:'card'},crypto.randomUUID(),{isolated:true});
  const backups=new DataBackups({store,userData:dir,exportAccess:async()=>{throw Error('Access not required for database backup')}});
  const result=await backups.run({format:'database'});
  assert(result.ok);assert(result.databaseSaved);assert(result.viewerSaved);assert(!result.accessSaved);
  const viewer=path.join(result.folder,OUTPUT),{html,data}=await unpack(viewer);
  assert.equal(data.format,'photobridge-finance-offline-v2');
  assert.equal(data.documents.filter(x=>x.type==='invoice').length,1);
  assert.equal(data.receipts.filter(x=>x.kind==='payment').length,1);
  assert.equal(data.documents[0].customer,'آتلیه باران');
  assert.equal(data.documents[0].total,30000);
  assert.equal(data.receipts[0].amount,10000);
  assert(data.ledger.length>=1);
  assert.equal(data.studios.find(x=>x.id===customer.id)?.name,'آتلیه باران');
  assert.equal(data.ledger[0].customerId,customer.id);
  assert.equal(data.sqliteSha256,crypto.createHash('sha256').update(await fs.readFile(path.join(result.folder,'data.sqlite'))).digest('hex'));
  assert(html.includes('font/woff2;base64,'));
  assert(!html.includes('__PB_FONT_BASE64__'));
  assert(html.includes('financeSectionTabs')&&html.includes('invoiceRows accountingInvoiceRows')&&html.includes('statementTable')&&html.includes('pb1420PaymentColumns'));
  assert(html.includes('نمایش با جزئیات')&&html.includes('نمایش خلاصه')&&html.includes('ثبت در حسابداری'));
  assert(html.includes("connect-src 'none'"));
  assert(!html.includes('PRIVATE_COOKIE_DO_NOT_EXPORT'));
  const manifest=await verifyBackup(result.folder);assert(manifest.files.some(x=>x.name===OUTPUT));
  const copy=path.join(dir,'copied.html');await fs.copyFile(viewer,copy);
  assert.deepEqual((await unpack(copy)).data,data);
  await fs.appendFile(viewer,'changed');
  await assert.rejects(verifyBackup(result.folder),/checksum/);
 }finally{store.db.close();await fs.rm(dir,{recursive:true,force:true})}
});
test('customer statement is based on precomputed per-studio rows, not raw double-entry journal',()=>{
 const model={tables:[
  {name:'CustomerBalances',rows:[{CustomerId:'A',Name:'آتلیه الف',Balance:2500,Invoiced:5000,Paid:2500},{CustomerId:'B',Name:'آتلیه ب',Balance:1000,Invoiced:3000,Paid:2000}]},
  {name:'CustomerReportSummary',rows:[{CustomerId:'A',OpeningBalance:100,StatementClosing:2500,TotalDebit:5000,TotalCredit:2600},{CustomerId:'B',OpeningBalance:0,StatementClosing:1000}]},
  {name:'Invoices',rows:[{InvoiceId:'i1',CustomerId:'A',CustomerName:'آتلیه الف',Number:'4',Total:5000,Paid:2500,Balance:2500}]},
  {name:'InvoiceLines',rows:[{InvoiceId:'i1',Description:'چاپ',Quantity:2,UnitPrice:2500,LineTotal:5000}]},
  {name:'Payments',rows:[{PaymentId:'p1',InvoiceId:'i1',CustomerId:'A',Amount:2500,Method:'cash'}]},
  {name:'CustomerStatement',rows:[
   {CustomerId:'A',CustomerName:'آتلیه الف',RowNumber:1,Date:'2026-11-01',Description:'سند',InvoiceNumber:'4',Debit:5000,Credit:0,Balance:5100,OpeningBalance:100},
   {CustomerId:'A',CustomerName:'آتلیه الف',RowNumber:2,Date:'2026-11-02',Description:'دریافت',Debit:0,Credit:2600,Balance:2500,OpeningBalance:100},
   {CustomerId:'B',CustomerName:'آتلیه ب',RowNumber:0,Description:'گردش در سیستم نیست',Balance:1000}]},
  {name:'Ledger',rows:[{TransactionId:'t1'}]},
  {name:'LedgerEntries',rows:[{TransactionId:'t1',Debit:5000,Credit:5000}]}
 ]};
 const output=buildViewerData(model,{createdAt:'2026-11-02',labId:'lab',sqliteSha256:'a'.repeat(64)});
 assert.equal(output.ledger.length,2);assert.equal(output.ledger[1].balance,2500);
 assert.equal(output.ledger[0].customerId,'A');
 assert.equal(output.documents[0].lines[0].total,5000);
 assert.equal(output.studios.length,2);
 assert.equal(output.studios[0].balance,2500);
 assert(!JSON.stringify(output).includes('PRIVATE_COOKIE'));
});
test('offline HTML JavaScript compiles, and all changing-site actions are disabled',async()=>{
 const file=await fs.readFile(path.join(__dirname,'../backup-finance-viewer-template.html'),'utf8');
 const code=file.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert(code);new vm.Script(code[1],{filename:'offline-finance.js'});
 for(const token of ['data-tab="invoices"','data-tab="payments"','data-tab="statement"','class="fromDate"','class="toDate"','نمایش همه','امروز','نمایش بازه','چاپ','فاکتورها و اسناد مالی','حساب معین'])assert(file.includes(token),token);
 assert(file.includes('disabled title="بکاپ فقط قابل مشاهده است"'));
 assert(file.includes('disabled title="در نسخه بکاپ امکان ثبت وجود ندارد"'));
 assert(file.includes('class="customerSelect"'));
});
test('local source remains version 1.0.79; new viewer cannot change print/order modules',async()=>{
 const pkg=JSON.parse(await fs.readFile(path.join(__dirname,'../package.json'),'utf8'));
 assert.equal(pkg.version,'1.0.79');
 const source=await fs.readFile(path.join(__dirname,'../data-backups.cjs'),'utf8');
 assert(source.includes('createDataSnapshot(this.store,database)'));
 assert(source.includes('verifyBackup(pending)'));
 assert(source.includes('accessReportsIncluded:result.reportsIncluded===true'));
 assert(source.includes('viewerSaved:result.viewerSaved'));
});
