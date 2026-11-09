'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const source=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');

test('new customer and coworker paths are exact uppercase English labels',()=>{
 const ctx={window:{pbLabLocalIntakeStorage:{}},Map,Promise,Date,pb1450Root:async()=>null};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const fn=ctx.pb1664StorageBucket;
 for(const order of [{source:'walkin'},{source:'WALK_IN'},{source:'manual_invoice'},{walkin_customer_mobile:'09123456789'}])
   assert.equal(fn(order),'MOSHTARI');
 for(const order of [{source:'print'},{source:'web',mode:'album'},{source:'photographer'}])
   assert.equal(fn(order),'HAMKAR');
 const old=ctx.pb1664PreviousStorageBuckets;
 assert.deepEqual(Array.from(old({source:'walkin'})),['moshtari','Moshtari']);
 assert.deepEqual(Array.from(old({source:'web'})),['hamkar','Hamkar']);
 assert.equal(ctx.pb1664LegacyStorageBucket({source:'walkin'}),'مشتریان');
 assert.equal(ctx.pb1664LegacyStorageBucket({source:'print'}),'همکاران');
 assert.match(source,/\[pb1664StorageBucket\(detail\.order\),day,saved\.customer,Uy\(detail,file\)\]/);
 assert.match(source,/if\(old\)return\{root,dir:pb1550Decode\(old\.dir\),day:old\.day\}/);
});

test('actual delivered web and native Lab bundles both have the new folder layout',()=>{
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const dir of ['dist/web','dist/web/lab-desktop-ui']){
   const js=fs.readFileSync(dir+'/assets/index-UIRefine-v655-r84.js','utf8');
   const section=js.slice(js.lastIndexOf('function pb1664StorageBucket(order){'),js.lastIndexOf('async function pb1550Probe(root,detail){'));
   assert(section.includes("?'MOSHTARI':'HAMKAR'"),dir+' must have uppercase labels');
   assert(section.includes('function pb1664PreviousStorageBuckets(order)'),dir+' must preserve legacy labels');
   assert(js.includes('for(const name of [pb1664StorageBucket(detail.order),day,saved.customer,Uy(detail,file)])'));
   assert(fs.readFileSync(dir+'/index.html','utf8').includes('&storageFolders=r1723'));
 }
 const dir='dist/web/lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
   assert.equal(manifest.files.find(entry=>entry.name===name).sha256,hash(fs.readFileSync(dir+name)));
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
});

test('previous R1132 navigation failure stays fixed in the actual build output',()=>{
 const repo=path.resolve(__dirname,'..');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1723-r1132-'));
 const pages=['dist/web/index.html','dist/api/equipment-rental-book.html'];
 try{
   for(const page of pages){
     const dst=path.join(temp,page);fs.mkdirSync(path.dirname(dst),{recursive:true});
     fs.copyFileSync(path.join(repo,page),dst);
   }
   for(const script of ['enable-r1124-photographer-desktop-header.mjs','enable-r1132-final-assets.mjs'])
     execFileSync(process.execPath,[path.join(repo,'scripts',script)],{cwd:temp,timeout:15000,stdio:'pipe'});
   for(const page of pages){
     const html=fs.readFileSync(path.join(temp,page),'utf8');
     const matches=[...html.matchAll(/(photobridge-r1126-desktop-navigation\.(?:css|js)\?v=)[^&"']+/g)];
     assert.equal(matches.length,2,'exactly one nav CSS+JS pair in '+page);
   }
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
