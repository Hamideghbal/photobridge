const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');const helpers=bundle.slice(bundle.indexOf('const Iy='),bundle.indexOf('const Ly='));
test('folder persistence recovers transient browser errors and retains the legacy saved folder',async()=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage();await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));await page.goto('https://folder.test');
 await page.addScriptTag({content:helpers+'window.testFolders={Ag,qs,Oy};'});
 const result=await page.evaluate(async()=>{
  const {Ag,qs,Oy}=window.testFolders,root=await navigator.storage.getDirectory();const old=await root.getDirectoryHandle('old',{create:true}),next=await root.getDirectoryHandle('next',{create:true});
  const legacy=await Ag();await new Promise((resolve,reject)=>{const tx=legacy.transaction('settings','readwrite');tx.objectStore('settings').put(old,'download_root');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});legacy.close();
  const before=(await qs()).name;
  const put=IDBObjectStore.prototype.put;let attempts=0;
  IDBObjectStore.prototype.put=function(...args){if(++attempts===1)throw new DOMException('Internal error','UnknownError');return put.apply(this,args)};
  await Oy(next);IDBObjectStore.prototype.put=put;const after=(await qs()).name;
  IDBObjectStore.prototype.put=function(){throw new DOMException('Internal error','UnknownError')};let failed=false;try{await Oy(old)}catch{failed=true}IDBObjectStore.prototype.put=put;
  return {before,after,attempts,failed,preserved:(await qs()).name};
 });assert.deepEqual(result,{before:'old',after:'next',attempts:2,failed:true,preserved:'next'});
 await page.reload();await page.addScriptTag({content:helpers+'window.readRoot=qs;'});assert.equal(await page.evaluate(async()=>(await window.readRoot()).name),'next','saved folder survives a reload');
 }finally{await browser.close()}
});
