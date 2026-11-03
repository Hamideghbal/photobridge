'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8'),root='dist/web/lab-desktop-ui/';
test('Lab login omits home while browser website retains its original link',()=>{
 const ui=read(root+'assets/index-UIRefine-v655-r84.js'),web=read('dist/web/assets/index-UIRefine-v655-r84.js');
 assert(ui.includes('!E&&e.jsx("a",{href:"/",children:"صفحه اصلی"})'));
 assert(web.includes('e.jsx("a",{href:"/",children:"صفحه اصلی"})'));
 assert(!web.includes('!E&&e.jsx("a",{href:"/",children:"صفحه اصلی"})'));
});
test('native editor uses HTTPS same-window navigation handled by installed Electron shell',()=>{
 const ui=read(root+'assets/index-UIRefine-v655-r84.js');
 assert(ui.includes('href:"https://photobridge.ir/lab/settings/site?openSiteEditor=1",title:"ویرایش سایت در مرورگر"'));
 assert(!ui.includes('href:"/lab/site-editor",children:"ویرایش دیداری سایت"'));
 assert(!ui.includes("href:'/lab/site-editor',children:'ویرایش سایت'"));
 assert(ui.includes("href:'https://photobridge.ir/lab/settings/site?openSiteEditor=1',title:'ویرایش سایت در مرورگر',children:'ویرایش سایت'"));
 assert(!ui.includes('href:"https://photobridge.ir/lab/site-editor",target:"_blank"'));
 const main=read('scripts/r1478-native/main.cjs');
 assert(main.includes("win.webContents.on('will-navigate'"));
 assert(main.includes("if(url.startsWith('https://'))void shell.openExternal(url)"));
});
function harness({storage=new Map(),query='',hostname='photobridge.ir',user=null,ok=true,now=Date.now()}={}){
 const calls=[],destinations=[],intervals=[],cleared=[];
 class Clock extends Date{static now(){return now}}
 const context={URLSearchParams,Date:Clock,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{hostname,search:query,replace:p=>destinations.push(p)},setInterval:fn=>(intervals.push(fn),intervals.length),clearInterval:id=>cleared.push(id),addEventListener(){},fetch:async(p,options)=>{calls.push({p,options});return {ok,json:async()=>({user})}}};
 vm.runInNewContext(read('scripts/r1549-site-editor-handoff.js.txt'),context);
 return {storage,calls,destinations,intervals,cleared};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('browser handoff survives ordinary sign-in without copying native credentials',async()=>{
 const first=harness({query:'?openSiteEditor=1',ok:false});await settle();
 assert.equal(first.destinations.length,0);assert(first.storage.has('pb1549LabSiteEditor'));
 assert.equal(first.calls[0].p,'/api/auth/me');assert.equal(first.calls[0].options.credentials,'same-origin');
 assert.equal(first.calls[0].options.headers,undefined);
 const signedIn=harness({storage:first.storage,user:{labRole:'lab_admin',labId:'lab'}});await settle();
 assert.deepEqual(signedIn.destinations,['/lab/site-editor']);assert.equal(first.storage.size,0);assert.equal(signedIn.cleared.length,1);
 await signedIn.intervals[0]();assert.equal(signedIn.destinations.length,1,'redirect only once');
});
test('unrelated browsing, other roles, stale requests and local native host never open editor',async()=>{
 const ordinary=harness();const native=harness({hostname:'127.0.0.1',query:'?openSiteEditor=1'});
 const other=harness({query:'?openSiteEditor=1',user:{labRole:'customer',labId:'lab'}});
 const expired=harness({storage:new Map([['pb1549LabSiteEditor',String(Date.now()-16*60*1000)]])});await settle();
 assert.equal(ordinary.calls.length,0);assert.equal(native.calls.length,0);assert.equal(expired.calls.length,0);assert.equal(expired.storage.size,0);assert.equal(other.destinations.length,0);
});
test('final hot-update hashes match bytes and website loads the handoff',()=>{
 const manifest=JSON.parse(read(root+'manifest.json')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js'])assert.equal(manifest.files.find(x=>x.name===name).sha256,hash(fs.readFileSync(root+name)));
 assert(read(root+'index.html').includes('&labEntry=r1549'));
 assert(read('dist/web/index.html').includes('/photobridge-r1549-site-editor-handoff.js?v=r1549'));
});
