'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const code=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
async function boot(page,rootName){
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Order storage</title>'}));await page.goto('http://localhost:49001/');
 await page.evaluate(async name=>{
  const disk=await navigator.storage.getDirectory();window.currentRoot=await disk.getDirectoryHandle(name,{create:true});
  Object.assign(window,{Iy:'pb1550-browser',Zr:'paths',ai:()=>true,Hu:async()=>({registered:true,isThisDevice:true}),Vs:async h=>await h.queryPermission({mode:'readwrite'})==='granted',uh:id=>'device:'+id,yc:()=>null,Ic:d=>d.toISOString().slice(0,10),Tg:o=>o.customer_name,Uy:(d,f)=>d.order.number+'-'+f.id,Ya:String,pb1450Missing:e=>e.name==='NotFoundError',pb1450Meta:f=>f,pb1450FileInfo:h=>h.getFile(),pb1450Root:async()=>window.currentRoot,pbLabLocalIntakeStorage:{}});
  window.Ag=name=>new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>req.result.createObjectStore('paths');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 },rootName);
 await page.evaluate(code=>{(0,eval)(code)},code);
}
test('browser retains actual directory handles in IndexedDB across default change and page restart',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext();let page=await context.newPage();await boot(page,'A');
  await page.evaluate(async()=>{
   const d={order:{id:'customer-order',number:1,customer_name:'studio'},files:[{id:'photo',original_name:'photo.jpg',bytes:3}]};
   const target=await pbLabLocalIntakeStorage.target(currentRoot,d,d.files[0]),file=await target.dir.getFileHandle('photo.jpg',{create:true}),writer=await file.createWritable();await writer.write(new Blob(['abc']));await writer.close();
  });await page.close();page=await context.newPage();await boot(page,'B');
  const result=await page.evaluate(async()=>{
   const d={order:{id:'customer-order',number:99,customer_name:'renamed'},files:[{id:'photo',original_name:'photo.jpg',bytes:3}]};
   const target=await pbLabLocalIntakeStorage.target(currentRoot,d,d.files[0]);
   const old=await (await target.dir.getFileHandle('photo.jpg')).getFile();
   const manual={order:{id:'manual-order',number:2,customer_name:'manual',mode:'album'},files:[{id:'new',original_name:'new.jpg',bytes:3}]};
   const next=await pbLabLocalIntakeStorage.target(currentRoot,manual,manual.files[0]);
   return{oldRoot:target.root.name,content:await old.text(),newRoot:next.root.name,oldIsNew:await target.root.isSameEntry(currentRoot)};
  });assert.deepEqual(result,{oldRoot:'A',content:'abc',newRoot:'B',oldIsNew:false});
  const recovered=await page.evaluate(async()=>{
   const d={order:{id:'customer-order',number:1,customer_name:'studio'},files:[{id:'photo',original_name:'photo.jpg',bytes:3}]},saved=await pb1550Db(d);d.order.downloaded_at=saved.pathDate;
   const db=await Ag(Iy+'_order_paths_v1');await new Promise((resolve,reject)=>{const tx=db.transaction(Zr,'readwrite');tx.objectStore(Zr).delete(pb1550Key(d));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
   let selections=0;window.showDirectoryPicker=async()=>{selections++;return(await navigator.storage.getDirectory()).getDirectoryHandle('A')};
   const old=await pb1550Root(d,true);return{root:old.name,defaultRoot:currentRoot.name,selections};
  });assert.deepEqual(recovered,{root:'A',defaultRoot:'B',selections:1});await context.close();
 }finally{await browser.close()}
});
