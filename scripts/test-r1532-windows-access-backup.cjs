'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createRows,writeFinanceBackup}=require('../apps/lab-desktop/finance-backup.cjs');
const {integrate}=require('./integrate-r1532-access-backup.cjs');
const payload={
 '/api/lab/invoices':{invoices:[
  {id:'1',number:'10',lab_id:'A',customer_name:'Studio A',total:300000,document_type:'invoice',issued_at:'2026-11-01T09:00:00Z',external_accounting_recorded:true},
  {id:'bad',number:'99',lab_id:'B',customer_name:'Studio B',total:999999,document_type:'invoice'},
  {id:'2',number:'20',lab_id:'A',customer_name:'Studio A',total:-25000,document_type:'discount',issued_at:'2026-11-01T09:00:00Z'}]},
 '/api/lab/finance/payments':{payments:[{id:'p1',lab_id:'A',customer_name:'Studio A',amount:100000,method:'transfer',paid_at:'2026-11-01T09:30:00Z'}]},
 '/api/lab/finance/ledger':{transactions:[
  {id:'tx1',txn_date:'2026-11-01',description:'invoice',entries:[{account_code:'110',account_name:'Receivable',customer_id:'A',debit:'300000',credit:'0'}]},
  {id:'tx2',txn_date:'2026-11-02',description:'payment',entries:[{account_code:'110',account_name:'Receivable',customer_id:'A',debit:'0',credit:'100000'}]}
 ]}
};
const response=(value)=>({ok:true,headers:{get:()=>null},arrayBuffer:async()=>Buffer.from(JSON.stringify(value))});
test('Access data contains real lab-scoped records and balances, without synthetic demo values',()=>{
 const data=createRows(payload['/api/lab/invoices'],payload['/api/lab/finance/payments'],payload['/api/lab/finance/ledger'],'A');
 assert.equal(data.Invoices.length,1);assert.equal(data.Invoices[0][1],'10');
 assert.equal(data.Receipts.length,2);assert(data.Receipts.some(r=>r[5]==='discount'));
 assert.equal(data.Ledger.length,2);assert.equal(data.Ledger[1][7],'200000');
 assert(!JSON.stringify(data).includes('Studio B'));
});
test('finance Access generation uses live endpoints and preserves a user-independent backup directory',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-access-r1532-'));
 const call=[],file=path.resolve('apps/lab-desktop/BuildFinancialBackup.vbs');
 try{
  const result=await writeFinanceBackup({store:{get:k=>k==='auth'?{ok:true}:k==='labId'?'A':null},
   request:async url=>{call.push(url);return response(payload[url])},
   folder:root,stamp:'2026-11-01T18-00-01-100Z',sourceScript:file,
   runAccess:async(script,dir,target)=>fs.writeFileSync(target,Buffer.alloc(5000,1))});
  assert.equal(result.status,'access_ready');
  assert.deepEqual(call,['/api/lab/invoices','/api/lab/finance/payments','/api/lab/finance/ledger']);
  assert(fs.existsSync(result.accessFile));
  for(const name of ['Invoices.tsv','Receipts.tsv','Ledger.tsv','BuildFinancialBackup.vbs','manifest.json'])
   assert(fs.existsSync(path.join(result.folder,name)));
  const manifest=JSON.parse(fs.readFileSync(path.join(result.folder,'manifest.json'),'utf8'));
  assert.equal(manifest.restorable,false);assert.equal(manifest.tables.Invoices.count,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('missing Access installation retains source data but does not produce a corrupted .accdb',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-access-r1532-'));
 try{
  const result=await writeFinanceBackup({store:{get:k=>k==='auth'?{ok:true}:k==='labId'?'A':null},
   request:async url=>response(payload[url]),
   folder:root,stamp:'2026-11-01T18-00-02-100Z',
   sourceScript:path.resolve('apps/lab-desktop/BuildFinancialBackup.vbs'),
   runAccess:async()=>{throw Error('not_installed')}});
  assert.equal(result.status,'access_requires_microsoft_access');
  assert(fs.existsSync(path.join(result.folder,'Invoices.tsv')));
  assert(!fs.existsSync(path.join(result.folder,'PhotoBridge_Finance.accdb')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('failed or incomplete server responses never create fake finance records',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-access-r1532-'));
 try{
  await assert.rejects(()=>writeFinanceBackup({store:{get:k=>k==='auth'?{}:k==='labId'?'A':null},request:async url=>response(url==='/api/lab/finance/payments'?{}:payload[url]),folder:root,stamp:'2026-11-01T18-00-03-100Z',sourceScript:path.resolve('apps/lab-desktop/BuildFinancialBackup.vbs'),runAccess:async()=>{}}),/finance_snapshot_incomplete/);
  assert.deepEqual(fs.readdirSync(root),[]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Windows native integration preserves SQLite backup and adds a manual tray action',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-native-r1532-'));
 try{
  fs.copyFileSync('scripts/r1478-native/main.cjs',path.join(root,'main.cjs'));
  assert.equal(integrate(root),true);
  assert.equal(integrate(root),false);
  const main=fs.readFileSync(path.join(root,'main.cjs'),'utf8');
  assert(main.includes("await backup(store.db,sqlitePath)"));
  assert(main.includes("makeBackup(true)"));
  assert(main.includes("writeFinanceBackup"));
  assert(main.includes("sqliteFiles.slice(0,-14)"));
  assert(fs.existsSync(path.join(root,'BuildFinancialBackup.vbs')));
  assert(fs.existsSync(path.join(root,'finance-backup.cjs')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Access builder creates three native read-only forms and never overwrites an existing file',()=>{
 const script=fs.readFileSync('apps/lab-desktop/BuildFinancialBackup.vbs','utf8');
 assert(script.includes('If fs.FileExists(outputFile) Then'));
 assert(script.includes('frm.AllowEdits=False:frm.AllowAdditions=False:frm.AllowDeletions=False'));
 for(const name of ['frmPBInvoices','frmPBReceipts','frmPBLedger'])assert(script.includes(name));
 assert(script.includes('ADODB.Stream'));
});
