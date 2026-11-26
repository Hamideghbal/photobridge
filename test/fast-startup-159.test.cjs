'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),fsp=fs.promises,os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {createStartupUpdateSchedule}=require('../startup-update-schedule.cjs'),{updateUi}=require('../ui-update.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function clock(){
 let t=0,id=0;const timers=new Map();return {now:()=>t,setTimer(fn,delay){timers.set(++id,{fn,at:t+delay});return id},clearTimer:key=>timers.delete(key),advance(ms){t+=ms;for(const [key,item] of timers)if(item.at<=t){timers.delete(key);item.fn()}},count:()=>timers.size};
}
test('automatic update waits for visible ready UI, coalesces focus bursts, and can retry after busy or background state',async()=>{
 const c=clock();let ready=false,foreground=true,busy=false,calls=0;
 const s=createStartupUpdateSchedule({...c,ready:()=>ready,foreground:()=>foreground,busy:()=>busy,run:()=>calls++});
 assert.equal(s.schedule(),false);ready=true;assert(s.schedule());assert.equal(s.schedule(),false);c.advance(2499);await Promise.resolve();assert.equal(calls,0);
 busy=true;c.advance(1);await Promise.resolve();assert.equal(calls,0);busy=false;assert(s.schedule());c.advance(2500);await Promise.resolve();assert.equal(calls,1);
 assert.equal(s.schedule(),false);c.advance(60000);foreground=false;assert.equal(s.schedule(),false);foreground=true;assert(s.schedule());s.stop();c.advance(2500);await Promise.resolve();assert.equal(calls,1);
});
async function fixture(){
 const root=await fsp.mkdtemp(path.join(os.tmpdir(),'pb159-ui-')),directory=path.join(root,'ui'),bundled=path.join(root,'bundle');
 await fsp.mkdir(directory);await fsp.mkdir(bundled);
 const map=new Map(),store={get:k=>map.get(k),set:(k,v)=>map.set(k,v),transaction:fn=>fn()};
 function manifest(contents){const files=Object.entries(contents).map(([name,bytes])=>({name,url:'/lab-desktop-ui/'+name,sha256:hash(bytes)}));return {protocol:1,build:hash(JSON.stringify(files)),files}}
 async function install(contents){const m=manifest(contents),dir=path.join(directory,m.build);await fsp.mkdir(dir);for(const [name,bytes] of Object.entries(contents))await fsp.writeFile(path.join(dir,name),bytes);return {m,dir}}
 function requestFor(m,contents){return async url=>url.includes('manifest')?{ok:true,json:async()=>m}:new Response(contents[url.slice('/lab-desktop-ui/'.length)]??'bad')}
 return {root,directory,bundled,store,manifest,install,requestFor,close:()=>fsp.rm(root,{recursive:true,force:true})};
}
test('unchanged UI is fully verified asynchronously; a corrupt file is repaired without skipping SHA checks',async()=>{
 const f=await fixture();try{const contents={'index.html':'valid','other.js':'script'},a=await f.install(contents);f.store.set('uiRoot',a.dir);f.store.set('uiBuild',a.m.build);
 let releases=0;const config={...f,request:f.requestFor(a.m,contents),acceptRoot:()=>releases++};
 assert.equal(await updateUi(config),false);assert.equal(releases,1);
 await fsp.writeFile(path.join(a.dir,'other.js'),'tampered');assert.equal(await updateUi(config),true);assert.equal(await fsp.readFile(path.join(a.dir,'other.js'),'utf8'),'script');assert.equal(f.store.get('uiRoot'),a.dir);
 }finally{await f.close()}
});
test('bad update preserves active UI; successful pending update never removes the still-rendered root',async()=>{
 const f=await fixture();try{const active=await f.install({'index.html':'active'}),pending=await f.install({'index.html':'pending'}),next={'index.html':'next','other.js':'verified'},m=f.manifest(next);
 f.store.set('uiRoot',pending.dir);f.store.set('uiBuild',pending.m.build);f.store.set('uiKnownGoodRoot',active.dir);
 await assert.rejects(updateUi({...f,request:f.requestFor(m,{'index.html':'next','other.js':'tampered'}),getActiveRoot:()=>active.dir}),/update_hash_mismatch/);
 assert.equal(f.store.get('uiRoot'),pending.dir);assert.equal(await fsp.readFile(path.join(active.dir,'index.html'),'utf8'),'active');
 assert.equal(await updateUi({...f,request:f.requestFor(m,next),getActiveRoot:()=>active.dir}),true);
 assert.equal(await fsp.readFile(path.join(active.dir,'index.html'),'utf8'),'active');assert.equal(await fsp.readFile(path.join(pending.dir,'index.html'),'utf8'),'pending');
 assert.equal(f.store.get('uiBuild'),m.build);
 }finally{await f.close()}
});
test('native main still starts from local UI and retains manual update/install gate',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../main.cjs'),'utf8');
 assert(s.includes('try{await applyUi(true)}'));assert(!s.includes('await updateUi(true);await applyUi(true)'));
 assert(s.includes('checkUi:onProgress=>updateUi(false,true,onProgress)'));assert(s.includes('canInstall:()=>updateInstallGate.canInstall()'));
 assert(s.includes('acceptRoot:validateNativeUi,retryFailedBuild,onProgress'));
 assert(s.includes('getActiveRoot:()=>activeUiRoot'));
});
