'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {LabStore}=require('../store.cjs'),{LocalBusiness}=require('../local-business.cjs');
const {DataBackups,verifyBackup}=require('../data-backups.cjs');
const {prepareFinanceData,OUTPUT}=require('../backup-finance-viewer.cjs');
const readPayload=async html=>{
 const text=await fs.readFile(html,'utf8');
 const match=text.match(/<script type="application\/octet-stream" id="pb-snapshot">([A-Za-z0-9+/=]+)<\/script>/);
 assert(match,'embedded snapshot payload must be present');
 return{html:text,data:JSON.parse(Buffer.from(match[1],'base64').toString('utf8'))};
};
test('offline viewer displays only three financial tables from the same SQLite backup, without any network',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pb-offline-viewer-')),store=new LabStore(path.join(root,'live.sqlite'));
 try{
  store.set('labId','test-lab');store.set('auth',{user:{labRole:'lab_admin'}});store.set('cookie','secret-live-session-do-not-export');
  const business=new LocalBusiness(store);
  const customer=business.handle('POST','/api/lab/customers',{name:'آتلیه یاس'},crypto.randomUUID(),{isolated:true}).customer;
  const invoice=business.handle('POST','/api/lab/invoices/manual',{customerId:customer.id,items:[{description:'چاپ عکس',quantity:2,unitPrice:3000}]},crypto.randomUUID(),{isolated:true}).invoice;
  business.handle('POST','/api/lab/finance/payments',{invoiceId:invoice.id,amount:1500,method:'card'},crypto.randomUUID(),{isolated:true});
  const backup=new DataBackups({store,userData:root,exportAccess:async()=>{throw Error('access-not-needed-for-db-only')}});
  const result=await backup.run({format:'database'});
  assert.equal(result.ok,true);assert.equal(result.viewerSaved,true);assert.equal(result.databaseSaved,true);
  assert.equal(result.accessSaved,false);
  const manifest=await verifyBackup(result.folder);
  const file=path.join(result.folder,OUTPUT),{html,data}=await readPayload(file);
  assert.deepEqual(Object.keys(data).sort(),['createdAt','format','invoices','labId','ledger','receipts','sqliteSha256'].sort());
  assert.equal(data.invoices.length,1);assert.equal(data.receipts.length,1);
  assert.equal(data.invoices[0].customer,'آتلیه یاس');
  assert.equal(data.invoices[0].total,6000);assert.equal(data.invoices[0].paid,1500);
  assert.equal(data.receipts[0].amount,1500);
  assert(data.ledger.length>=2);
  assert.equal(data.format,'photobridge-finance-offline-v1');
  const sha=crypto.createHash('sha256').update(await fs.readFile(path.join(result.folder,'data.sqlite'))).digest('hex');
  assert.equal(data.sqliteSha256,sha);
  assert(html.includes('data-tab="invoices"')&&html.includes('data-tab="receipts"')&&html.includes('data-tab="ledger"'));
  assert(html.includes("connect-src 'none'"));assert(!html.includes('src="https://'));assert(!html.includes('script src='));
  assert(!html.includes('secret-live-session-do-not-export'));
  assert.equal(manifest.viewerSaved,true);
  assert(manifest.files.some(f=>f.name===OUTPUT));
  // View is self-contained even when copied away from SQLite:
  const copied=path.join(root,'copied-viewer.html');await fs.copyFile(file,copied);
  assert.deepEqual((await readPayload(copied)).data,data);
  // Attacker editing the snapshot HTML is caught by the signed-size/SHA manifest.
  await fs.appendFile(file,'tampered');
  await assert.rejects(verifyBackup(result.folder),/checksum/);
 }finally{store.db.close();await fs.rm(root,{recursive:true,force:true})}
});
test('viewer accepts empty backup data and prevents executable HTML data injection',()=>{
 const model={tables:[
  {name:'Invoices',rows:[{InvoiceId:'a',Number:'<img src=x onerror=alert(1)>',CustomerName:'<script>alert(1)</script>',Total:0,Paid:0,Balance:0}]},
  {name:'Payments',rows:[]},{name:'LedgerDetail',rows:[]}
 ]};
 const report=prepareFinanceData(model,{createdAt:'2026-11-02T00:00:00.000Z',labId:'A',sqliteSha256:'a'.repeat(64)});
 assert.equal(report.invoices[0].customer,'<script>alert(1)</script>');
 assert.equal(report.receipts.length,0);assert.equal(report.ledger.length,0);
});
test('HTML viewer does not require Microsoft Access, and backup fails without touching data if viewer model invalid',()=>{
 assert.throws(()=>prepareFinanceData({tables:[]},{createdAt:'',labId:'A',sqliteSha256:'bad'}),/invalid_snapshot/);
});
