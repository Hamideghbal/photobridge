'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{LabStore}=require('../store.cjs'),{LocalBusiness}=require('../local-business.cjs'),{buildBackupModel}=require('../backup-model.cjs');
const fixture=()=>{const store=new LabStore(':memory:');store.set('labId','A');const engine=new LocalBusiness(store),call=(url,body)=>engine.handle('POST',url,body,crypto.randomUUID(),{isolated:true});return{store,engine,call};};
test('report statements use customer receivable movements and keep same-name studios separate',()=>{
 const {store,engine,call}=fixture();try{
 const a=call('/api/lab/customers',{name:'آتلیه هم‌نام'}).customer,b=call('/api/lab/customers',{name:'آتلیه هم‌نام'}).customer,c=call('/api/lab/customers',{name:'آتلیه بستانکار'}).customer;
 const invoice=call('/api/lab/invoices/manual',{customerId:a.id,items:[{description:'چاپ',quantity:2,unitPrice:500}]}).invoice;
 call('/api/lab/finance/payments',{invoiceId:invoice.id,amount:400,method:'cash'});
 call('/api/lab/invoices/manual',{customerId:b.id,items:[{description:'چاپ دوم',unitPrice:200}]});
 const state=engine.state();state.customers[c.id].openingBalance=-50;store.set(engine.key(),state);
 const model=buildBackupModel(store),rows=model.tables.find(t=>t.name==='CustomerStatement').rows,summary=model.tables.find(t=>t.name==='CustomerReportSummary').rows;
 const ar=rows.filter(r=>r.CustomerId===a.id);assert.equal(ar.length,2);assert.equal(ar.reduce((n,r)=>n+r.Debit,0),1000);assert.equal(ar.reduce((n,r)=>n+r.Credit,0),400);assert.equal(ar.at(-1).Balance,600);
 assert.notEqual(summary.find(r=>r.CustomerId===a.id).GroupKey,summary.find(r=>r.CustomerId===b.id).GroupKey);
 assert.equal(summary.reduce((n,r)=>n+r.Debt,0),800);assert.equal(summary.reduce((n,r)=>n+r.CustomerCredit,0),50);assert.equal(summary.reduce((n,r)=>n+r.AccountBalance,0),750);
 assert.equal(rows.find(r=>r.CustomerId===c.id).RowNumber,0);
 for(const customer of summary){const actual=engine.read('/api/lab/finance/customer-statement',new URLSearchParams({customerId:customer.CustomerId}));assert.equal(customer.OpeningBalance,actual.openingBalance);assert.equal(customer.StatementClosing,actual.closingBalance);}
 }finally{store.db.close();}
});
test('cached historic statement and local movements retain the same opening/running/closing balances as the app',()=>{
 const {store,engine,call}=fixture();try{const customer=call('/api/lab/customers',{name:'آتلیه با سابقه'}).customer;
 const state=engine.state();Object.assign(state.customers[customer.id],{openingBalance:300,statement:{opening:100,rows:[{reference_id:'history-1',txn_date:'2020-01-01T00:00:00Z',debit:200,credit:0,description:'سابقهٔ دریافت‌شده'}]}});store.set(engine.key(),state);
 call('/api/lab/invoices/manual',{customerId:customer.id,items:[{description:'خرید جدید',unitPrice:50}]});
 const model=buildBackupModel(store),summary=model.tables.find(t=>t.name==='CustomerReportSummary').rows[0],rows=model.tables.find(t=>t.name==='CustomerStatement').rows;
 assert.equal(rows.length,2);assert.equal(summary.OpeningBalance,100);assert.equal(rows[0].Balance,300);assert.equal(rows[1].Balance,350);assert.equal(summary.AccountBalance,350);assert.equal(summary.StatementClosing,350);
 }finally{store.db.close();}
});
test('real Access tables preserve the report statement amounts and Persian customer grouping fields',async()=>{
 const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),run=require('node:util').promisify(require('node:child_process').execFile),{exportAccess}=require('../access-export.cjs');
 const {store,engine,call}=fixture(),temp=await fs.mkdtemp(path.join(os.tmpdir(),'pb-report-access-'));
 try{const customer=call('/api/lab/customers',{name:'آتلیه گزارش فارسی'}).customer,invoice=call('/api/lab/invoices/manual',{customerId:customer.id,items:[{description:'چاپ',quantity:3,unitPrice:100}]}).invoice;
 call('/api/lab/finance/payments',{invoiceId:invoice.id,amount:50,method:'cash'});
 const file=path.join(temp,'finance.accdb'),java=require('../access-runtime-path.cjs').testJava();await exportAccess(buildBackupModel(store),file,{java});
 const cp=[path.join(__dirname,'../assets/photobridge-access-export.jar'),path.join(__dirname,'../assets/access-libs/*')].join(path.delimiter),read=async table=>JSON.parse((await run(java,['-cp',cp,'PhotoBridgeAccess','--read',file,'b64:'+Buffer.from(table).toString('base64url')])).stdout);
 const summaries=await read('خلاصه حساب آتلیه‌ها'),rows=await read('گردش معین آتلیه‌ها');assert.equal(summaries[0]['نام آتلیه'],'آتلیه گزارش فارسی');assert.equal(summaries[0]['بدهی'],250);assert.equal(summaries[0]['بستانکاری'],0);assert.equal(rows.length,2);assert.equal(rows.at(-1)['مانده گردش'],250);assert(rows[0]['کلید گروه'].includes(customer.id));
 }finally{store.db.close();await fs.rm(temp,{recursive:true,force:true});}
});
