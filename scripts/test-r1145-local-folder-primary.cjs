const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const start=bundle.indexOf('function Ag(){'),end=bundle.indexOf('async function Vs(',start);
assert(start>0&&end>start,'storage implementation found');
const storage=bundle.slice(start,end);
function openHarness({blocked=false}={}){
 let saved=null,opened=0,closed=0;
 const handle=name=>({name,kind:'directory',queryPermission:async()=> 'granted',isSameEntry:async other=>other.name===name});
 const db={
  objectStoreNames:{contains:()=>true},createObjectStore(){},
  close(){closed++},
  transaction(_name,type){
   let tr={oncomplete:null,onerror:null,onabort:null};
   tr.objectStore=()=>({
    get(){let r={result:null,onsuccess:null,onerror:null};queueMicrotask(()=>{r.result=saved;r.onsuccess?.()});return r},
    put(value){let r={onerror:null};queueMicrotask(()=>{saved=value;tr.oncomplete?.()});return r}
   });
   return tr;
  }
 };
 const indexedDB={open(){opened++;const request={result:db,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null,error:null};queueMicrotask(()=>blocked?request.onblocked?.():request.onsuccess?.());return request}};
 const ctx={indexedDB,console,window:{showDirectoryPicker:async()=>handle('Photos')},Iy:'photos-db',Zr:'settings',kg:'download_root',ai:()=>true,queueMicrotask};
 vm.runInNewContext(storage+'globalThis.testPicker=no;globalThis.testRead=qs;',ctx);
 return {ctx,stats:()=>({saved,opened,closed})};
}
test('chosen folder is written and immediately reread from IndexedDB',async()=>{
 const h=openHarness();
 const root=await h.ctx.testPicker();
 assert.equal(root.name,'Photos');
 assert.equal((await h.ctx.testRead()).name,'Photos');
 assert.equal(h.stats().opened,h.stats().closed,'all IndexedDB connections are closed');
});
test('blocked local folder storage produces a distinct failure',async()=>{
 const h=openHarness({blocked:true});
 await assert.rejects(()=>h.ctx.testPicker(),/folder_storage_blocked/);
});
test('choosing a folder automatically registers or transfers the main workstation',()=>{
 assert.match(bundle,/const T=async\(\)=>\{let M;try\{M=await no\(\)/);
 assert.match(bundle,/a\(M\);const H=await Vs\(M\);r\(H\?"granted":"denied"\)/);
 assert.match(bundle,/if\(!H\)\{alert\("پوشه انتخاب و ذخیره شد/);
 assert.match(bundle,/try\{const B=await vc\(!0\);p\(B\)\}catch/);
 assert.match(bundle,/تلاش مجدد برای فعال‌سازی خودکار/);
 assert.doesNotMatch(bundle,/ثبت این سیستم به عنوان اصلی":"ثبت سیستم اصلی"/);
 assert.match(bundle,/پوشه روی این سیستم ذخیره شد، اما ثبت خودکار آن به‌عنوان سیستم اصلی انجام نشد/);
});
test('direct-download workstation ID remains required by server, and client updates bust caches',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const start=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/lab/download-device')");
 const section=server.slice(start,start+3000);
 assert.match(section,/requestDeviceId\.length < 20/);
 assert.match(section,/primary_device_exists/);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1145/);
});
