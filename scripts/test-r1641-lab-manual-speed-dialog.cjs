'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const web='dist/web/',native='dist/web/lab-desktop-ui/';
const helper='photobridge-r1466-intake-move.js',busy='photobridge-r1641-native-invoice-busy.js';

test('copy-only intake avoids hashing when destination is empty, and avoids rehash after successful pre-commit verification',async()=>{
 const sourceText=fs.readFileSync(web+helper,'utf8');
 let fileReads=0,photo=null,savePhoto=null,wasDeleted=false;
 const original={
  name:'a.jpg',size:3,lastModified:42,type:'image/jpeg',
  async arrayBuffer(){fileReads++;return Uint8Array.from([1,2,3]).buffer}
 };
 const document={
  createElement:()=>({files:[original],click(){this.onchange()},remove(){},setAttribute(){}}),
  body:{append(){}}
 };
 const sandbox={window:{pbLabLocalIntakeStorage:{fileName:n=>n}},document,crypto:crypto.webcrypto,WeakMap,WeakSet,Uint8Array,Error,Promise};
 vm.runInNewContext(sourceText,sandbox,{filename:helper});
 const api=sandbox.window.pb1466IntakeMove;
 const picked=await api.pick('copy');
 assert.equal(picked.length,1);
 const dir={
  name:'orders',
  async getFileHandle(){
   if(!savePhoto){const err=new Error('missing');err.name='NotFoundError';throw err;}
   return{async getFile(){return savePhoto},async isSameEntry(){return false}};
  },
  async removeEntry(){wasDeleted=true}
 };
 const targets=[{item:{file:original},file:{original_name:'a.jpg'},target:{dir}}];
 await api.prepare(targets);
 assert.equal(fileReads,0,'new destination should not require an unnecessary full source read');
 savePhoto={size:3,async arrayBuffer(){fileReads++;return Uint8Array.from([1,2,3]).buffer}};
 await api.verify(targets);
 const afterVerify=fileReads;
 assert(afterVerify>=2,'both original and destination must be SHA256 checked');
 const result=await api.finish(targets);
 assert.equal(result.remaining,0);
 assert.equal(result.copied,1);
 assert.equal(result.removed,0);
 assert.equal(wasDeleted,false,'copy must never delete source');
 assert.equal(fileReads,afterVerify,'repeat hashing after successful verification is unnecessary on copy-only orders');
});

test('an unverified copy-only order is still validated before finish reports success',async()=>{
 const src=fs.readFileSync(web+helper,'utf8');
 const original={name:'b.jpg',size:3,lastModified:1,type:'image/jpeg',async arrayBuffer(){return Uint8Array.from([1,2,3]).buffer}};
 const document={createElement:()=>({files:[original],click(){this.onchange()},remove(){}}),body:{append(){}}};
 const w={pbLabLocalIntakeStorage:{fileName:n=>n}};
 vm.runInNewContext(src,{window:w,document,crypto:crypto.webcrypto,WeakMap,WeakSet,Uint8Array,Error,Promise},{filename:helper});
 await w.pb1466IntakeMove.pick('copy');
 const bad={size:3,async arrayBuffer(){return Uint8Array.from([1,2,0]).buffer}};
 const target={item:{file:original},file:{original_name:'b.jpg'},target:{dir:{name:'a',async getFileHandle(){return {getFile:async()=>bad,isSameEntry:async()=>false}}}}};
 const outcome=await w.pb1466IntakeMove.finish([target]);
 assert.equal(outcome.remaining,1);
 assert.match(outcome.error,/تغییر کرده|کامل نیست/);
});

test('native invoice progress actions disappear only during issuance and return on failure',()=>{
 const source=fs.readFileSync(native+busy,'utf8');
 const makeBtn=text=>({textContent:text,parentElement:null,classList:{values:new Set(),add(k){this.values.add(k)},remove(k){this.values.delete(k)},contains(k){return this.values.has(k)}}});
 const retry=makeBtn('تلاش مجدد'),cancel=makeBtn('انصراف');
 const body={};
 const modal={parentElement:body,textContent:'در حال صدور فاکتور  تلاش مجدد  انصراف',querySelectorAll:selector=>selector==='button'?[retry,cancel]:[]};
 retry.parentElement=modal;cancel.parentElement=modal;
 let observer;
 const document={readyState:'complete',head:{append(){}},body,createElement:()=>({}),querySelectorAll:()=>[retry,cancel]};
 const MutationObserver=class{constructor(cb){observer=cb}observe(){}};
 vm.runInNewContext(source,{window:{},document,MutationObserver,requestAnimationFrame:cb=>cb(),Set,RegExp},{filename:busy});
 assert.equal(retry.classList.contains('pb1641HideRecovery'),true);
 assert.equal(cancel.classList.contains('pb1641HideRecovery'),true);
 modal.textContent='صدور فاکتور با خطا مواجه شد. تلاش مجدد انصراف';
 observer();
 assert.equal(retry.classList.contains('pb1641HideRecovery'),false);
 assert.equal(cancel.classList.contains('pb1641HideRecovery'),false);
});

test('web and Windows helper hashes match; installed manifest includes the new busy control script',()=>{
 const a=fs.readFileSync(web+helper),b=fs.readFileSync(native+helper);
 assert(a.equals(b));
 const m=JSON.parse(fs.readFileSync(native+'manifest.json','utf8'));
 for(const name of [helper,busy,'index.html']){
  const entry=m.files.find(row=>row.name===name);
  assert(entry,'missing Windows manifest item '+name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+name)).digest('hex'));
 }
 assert.match(fs.readFileSync(native+'index.html','utf8'),/photobridge-r1641-native-invoice-busy\.js\?v=r1641/);
 assert.match(fs.readFileSync(web+helper,'utf8'),/PB1641 safe manual intake fast-path/);
});
