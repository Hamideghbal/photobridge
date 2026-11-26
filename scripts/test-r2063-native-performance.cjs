'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {pb2063FirstIndex,pb2063TablePage,patchTable,patchIntake}=require('./r2063-native-lists.cjs');
const {pb2063ReadExtra,patchFinance}=require('./r2063-native-finance.cjs');
test('first matching id/hash stays identical to Array.find, including duplicates and missing entries',()=>{
 const rows=[{id:'a',hash:'x'},{id:'a',hash:'y'},{id:'b',hash:'x'}];
 for(const key of ['id','hash'])for(const value of ['a','b','x','y','missing'])assert.equal(pb2063FirstIndex(rows,key).get(value),rows.find(row=>row[key]===value));
});
test('bounded table searches the complete list and all rows remain accessible',()=>{
 const rows=Array.from({length:10001},(_,i)=>({id:i,name:'studio '+i,mobile:String(i)}));
 assert.equal(pb2063TablePage(rows,'',1).rows.length,50);
 assert.equal(pb2063TablePage(rows,'studio 10000',1).rows[0],rows[10000]);
 assert.deepEqual(Array.from({length:201},(_,i)=>pb2063TablePage(rows,'',i+1).rows).flat(),rows);
});
test('finance requests share flights, reuse a fresh result, refresh explicitly and reject old scope',async()=>{
 const store={scope:null,rows:new Map()};let scope='a',calls=0,release,states=[];
 const request=()=>{calls++;return new Promise(r=>{release=r})};
 const read=force=>pb2063ReadExtra(store,scope,'expenses',force,()=>100,request,(status,data)=>states.push([status,data]),()=>scope);
 const a=read(true),b=read(false);assert.equal(a,b);await Promise.resolve();release({expenses:[1]});await a;await read(false);assert.equal(calls,1);
 const c=read(true);await Promise.resolve();assert.equal(calls,2);scope='b';release({expenses:[2]});await c;assert.deepEqual(states.at(-1),['ready',{expenses:[1]}]);
});
test('failed background refresh preserves existing rows; failed first load is retriable',async()=>{
 const store={scope:null,rows:new Map()},states=[],clock=()=>100,scope='lab';
 const read=(force,request)=>pb2063ReadExtra(store,scope,'ledger',force,clock,request,(status,data)=>states.push([status,data]),()=>scope);
 await read(true,()=>Promise.reject(Error('offline')));assert.equal(states.at(-1)[0],'error');
 await read(true,()=>Promise.resolve({transactions:[1]}));assert.equal(states.at(-1)[0],'ready');
 await read(true,()=>Promise.reject(Error('offline')));assert.deepEqual(states.at(-1),['ready',{transactions:[1]}]);
});
test('expense request starts before invoice reconciliation; ledger and balance remain after',async()=>{
 const root='dist/web/lab-desktop-ui/',ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');
 const start=ui.indexOf('const extraPath=w==="expenses"?"/api/lab/finance/expenses"'),end=ui.indexOf('await Promise.all([summary,receipts,extra]);',start);
 assert(start>=0&&end>start);const block=ui.slice(start,end+'await Promise.all([summary,receipts,extra]);'.length);
 for(const view of ['expenses','ledger','invoices']){
  const calls=[],release={};const request=name=>{calls.push(name);return new Promise(r=>release[name]=r)};
  const runner=new Function('w','Me','pb2063LoadExtra','pb2051InvoicesReady','ke','o','pb2051SetInvoicesReady','pb2051LoadReceipts','At','f','C','return (async()=>{'+block+'})()');
  const pending=runner(view,request,request,false,'invoice',()=>{},()=>{},()=>request('receipts'),{toString:()=>''},()=>{},()=>{});
  assert.deepEqual(calls,view==='expenses'?['expenses','invoice']:['invoice']);
  if(view==='expenses')release.expenses({expenses:[]});release.invoice({invoices:[]});await Promise.resolve();
  assert(calls.includes('/api/lab/finance/summary?'));assert(calls.includes('receipts'));if(view==='ledger'){assert(calls.includes('ledger'));release.ledger({transactions:[]})}
  release.receipts({payments:[]});release['/api/lab/finance/summary?']({summary:{},customers:[]});await pending;
 }
});
test('final compiled native assets, original guards, hashes and encoded bytes',()=>{
 const root='dist/web/lab-desktop-ui/',asset='assets/index-UIRefine-v655-r84.js',intake='photobridge-r1137-lab-local-intake.js',manual='photobridge-r1176-lab-finance.js',read=name=>fs.readFileSync(root+name,'utf8');
 const ui=read(asset),local=read(intake),html=read('index.html'),manifest=JSON.parse(read('manifest.json'));
 assert.equal(patchFinance(ui),ui);assert.equal(patchTable(ui),ui);assert.equal(patchIntake(local),local);
 assert(ui.includes('/* PB2063 native focused finance */'));assert(ui.includes('/* PB2063 bounded native photographer rows */'));assert(ui.includes('pb2063Table.rows.map(customer=>'));assert(ui.includes('pb2063Options=x.useMemo'));assert(ui.includes('/* PB1944 server-paged lab queue */'));assert(ui.includes('/* PB1894 invoice-first server stages */'));
 assert(local.includes('/* PB2063 linear native intake matching */'));assert(local.includes('pb2063FilesById.get(item.fileId)'));assert(local.includes('labOutboxSave('));assert(local.includes('pb1884Warmup.showModal()'));assert(local.includes('not_primary_download_device'));
 assert(read(manual).includes("let value='',matches=[],limit=32"));
 assert(!fs.readFileSync('dist/web/'+asset,'utf8').includes('/* PB2063 native focused finance */'));assert(!fs.readFileSync('dist/web/'+intake,'utf8').includes('/* PB2063 linear native intake matching */'));
 assert.equal(html.split('&nativePerf=r2063').length,4);
 for(const name of [asset,intake,manual,'index.html']){const bytes=fs.readFileSync(root+name);assert.equal(manifest.files.find(row=>row.name===name)?.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));for(const [ext,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(root+name+ext))assert(decode(fs.readFileSync(root+name+ext)).equals(bytes));}
});

test('R1501 copy/move metadata and original duplicate payload are not rewritten',()=>{
 const source=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
 const patch=patchIntake(source);
 assert(patch.includes('pb2063ByHash.get(hash)'));
 assert(patch.includes('sourceFile:file,sourceAction'));
 assert(patch.includes('sourceActions:[sourceAction]'));
});
