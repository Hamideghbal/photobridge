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
  assert.deepEqual(Object.keys(data).sort(),['createdAt','format','invoices','labId','ledger','receipts','sqliteSha256','studios'].sort());
  assert.equal(data.invoices.length,1);assert.equal(data.receipts.length,1);
  assert.equal(data.invoices[0].customer,'آتلیه یاس');
  assert.equal(data.studios.find(x=>x.name==='آتلیه یاس')?.id,customer.id);
  assert.equal(data.invoices[0].studioId,customer.id);
  assert.equal(data.receipts[0].studioId,customer.id);
  assert.equal(data.invoices[0].total,6000);assert.equal(data.invoices[0].paid,1500);
  assert.equal(data.receipts[0].amount,1500);
  assert(data.ledger.length>=2);
  assert.equal(data.format,'photobridge-finance-offline-v1');
  const sha=crypto.createHash('sha256').update(await fs.readFile(path.join(result.folder,'data.sqlite'))).digest('hex');
  assert.equal(data.sqliteSha256,sha);
  assert(html.includes('data-tab="invoices"')&&html.includes('data-tab="receipts"')&&html.includes('data-tab="ledger"'));
  assert(html.includes("connect-src 'none'"));
  assert(html.includes('font-family:"PhotoBridgeVazir"'));
  assert(/data:font\/woff2;base64,d09GMg/.test(html),'real project woff2 font must be embedded');
  assert(html.includes('id="studio-query"')&&html.includes('id="studio-select"'));
  assert(html.includes('normalizeFa')&&html.includes('matchesStudio(row)'));assert(!html.includes('src="https://'));assert(!html.includes('script src='));
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
  {name:'Payments',rows:[]},{name:'Ledger',rows:[]},{name:'LedgerEntries',rows:[]}
 ]};
 const report=prepareFinanceData(model,{createdAt:'2026-11-02T00:00:00.000Z',labId:'A',sqliteSha256:'a'.repeat(64)});
 assert.equal(report.invoices[0].customer,'<script>alert(1)</script>');
 assert.equal(report.receipts.length,0);assert.equal(report.ledger.length,0);
});
test('version 1.0.70 ledger data joins reference and entry tables without Access queries',()=>{
 const model={tables:[
  {name:'Invoices',rows:[]},{name:'Payments',rows:[]},
  {name:'Ledger',rows:[{TransactionId:'t1',Date:'2026-11-01',Description:'Invoice'}]},
  {name:'LedgerEntries',rows:[{TransactionId:'t1',Account:'1201',CustomerId:'C1',Debit:480000,Credit:0}]},
  {name:'CustomerBalances',rows:[{CustomerId:'C1',Name:'استودیو بهار'}]}
 ]};
 const data=prepareFinanceData(model,{createdAt:'2026-11-02',labId:'A',sqliteSha256:'a'.repeat(64)});
 assert.equal(data.ledger.length,1);
 assert.equal(data.ledger[0].date,'2026-11-01');
 assert.equal(data.ledger[0].description,'Invoice');
 assert.equal(data.ledger[0].customer,'استودیو بهار');
 assert.equal(data.ledger[0].studioId,'C1');
 assert.equal(data.studios[0].name,'استودیو بهار');
 assert.equal(data.ledger[0].debit,480000);
});
test('HTML viewer does not require Microsoft Access, and backup fails without touching data if viewer model invalid',()=>{
 assert.throws(()=>prepareFinanceData({tables:[]},{createdAt:'',labId:'A',sqliteSha256:'bad'}),/invalid_snapshot/);
});

test('studio filters can distinguish two photographers with invoice, receipt and ledger IDs saved in 1.0.70 format',()=>{
 const model={tables:[
  {name:'CustomerBalances',rows:[{CustomerId:'A1',Name:'آتلیه سپید'},{CustomerId:'B1',Name:'آتلیه نیلی'}]},
  {name:'Invoices',rows:[
   {InvoiceId:'inv-a',Number:'100',CustomerId:'A1',Total:1000,Paid:500,Balance:500},
   {InvoiceId:'inv-b',Number:'200',CustomerId:'B1',Total:3000,Paid:1000,Balance:2000}]},
  {name:'Payments',rows:[
   {PaymentId:'pay-a',InvoiceId:'inv-a',Amount:500},
   {PaymentId:'pay-b',InvoiceId:'inv-b',Amount:1000}]},
  {name:'Ledger',rows:[{TransactionId:'ja',Date:'2026-11-01',Description:'A'},{TransactionId:'jb',Date:'2026-11-02',Description:'B'}]},
  {name:'LedgerEntries',rows:[
   {TransactionId:'ja',InvoiceId:'inv-a',Account:'1201',Debit:1000,Credit:0},
   {TransactionId:'jb',InvoiceId:'inv-b',Account:'1201',Debit:3000,Credit:0}
  ]}
 ]};
 const data=prepareFinanceData(model,{createdAt:'2026-11-02',labId:'one-lab',sqliteSha256:'b'.repeat(64)});
 assert.deepEqual(data.studios.map(x=>x.id).sort(),['A1','B1']);
 for(const key of ['invoices','receipts','ledger']){
  assert.equal(data[key].length,2);
  assert.equal(data[key].filter(x=>x.studioId==='A1').length,1);
  assert.equal(data[key].filter(x=>x.studioId==='B1').length,1);
  assert.equal(data[key].find(x=>x.studioId==='B1').customer,'آتلیه نیلی');
 }
});

test('interactive offline viewer searches Persian studio names consistently across all three tabs',async()=>{
 const vm=require('node:vm');
 const source=await fs.readFile(path.join(__dirname,'../backup-finance-viewer-template.html'),'utf8');
 const script=source.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert(script,'viewer JavaScript exists');
 new vm.Script(script[1]);
 const rows={
  invoices:[{studioId:'A',customer:'آتلیه یاس',number:'1',total:1000},{studioId:'B',customer:'آتلیه نيلی',number:'2',total:2000}],
  receipts:[{studioId:'A',customer:'آتلیه یاس',ref:'P1',amount:500},{studioId:'B',customer:'آتلیه نيلی',ref:'P2',amount:1000}],
  ledger:[{studioId:'A',customer:'آتلیه یاس',ref:'T1',debit:1000,credit:0},{studioId:'B',customer:'آتلیه نيلی',ref:'T2',debit:2000,credit:0}]
 };
 const encoded=Buffer.from(JSON.stringify({format:'photobridge-finance-offline-v1',createdAt:'2026-11-02T00:00:00Z',labId:'lab',sqliteSha256:'a'.repeat(64),studios:[{id:'A',name:'آتلیه یاس'},{id:'B',name:'آتلیه نيلی'}],...rows})).toString('base64');
 class Element{
  constructor(tag='div'){this.tag=tag;this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.children=[];this.listeners={};this.dataset={};this.attrs={};}
  replaceChildren(...children){this.children=children}
  appendChild(child){this.children.push(child);return child}
  addEventListener(name,callback){this.listeners[name]=callback}
  setAttribute(name,value){this.attrs[name]=String(value)}
  fire(name){assert(this.listeners[name],name+' handler exists');this.listeners[name].call(this)}
 }
 const all=new Map(),get=id=>{if(!all.has(id))all.set(id,new Element);return all.get(id)};
 get('pb-snapshot').textContent=encoded;
 const tabs=['invoices','receipts','ledger'].map(tab=>{const el=new Element('button');el.dataset.tab=tab;return el});
 const scroll=new Element,content=new Element;
 const document={
  getElementById:get,createElement:name=>new Element(name),
  querySelectorAll:selector=>selector==='[data-tab]'?tabs:[],
  querySelector:selector=>selector==='.scroll'?scroll:selector==='.content'?content:null
 };
 vm.runInNewContext(script[1],{
  document,Uint8Array,TextDecoder,Intl,Set,Map,Object,Array,String,Number,
  atob:b64=>Buffer.from(b64,'base64').toString('binary'),
  window:{print(){}},Blob:class {},URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){}},{timeout:2500});
 assert.equal(get('tbody').children.length,2,'all studios shown by default');
 get('studio-query').value='اتليه ياس';
 get('studio-query').fire('input');
 assert.equal(get('tbody').children.length,1,'Persian/Arabic spelling normalized');
 assert(get('tbody').children[0].children.some(e=>e.textContent==='آتلیه یاس'));
 assert.equal(get('count-invoices').textContent,'۱');
 assert.equal(get('count-receipts').textContent,'۱');
 assert.equal(get('count-ledger').textContent,'۱');
 tabs[1].fire('click');assert.equal(get('tbody').children.length,1,'same studio filter on receipts');
 tabs[2].fire('click');assert.equal(get('tbody').children.length,1,'same studio filter on ledger');
 get('studio-select').value='B';get('studio-select').fire('change');
 assert.equal(get('tbody').children.length,1);
 assert(get('tbody').children[0].children.some(e=>e.textContent==='آتلیه نيلی'));
 get('studio-clear').fire('click');
 assert.equal(get('tbody').children.length,2,'all studios restored after clearing');
});
