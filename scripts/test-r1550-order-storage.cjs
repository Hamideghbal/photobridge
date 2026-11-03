'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const code=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
function fixture({records=new Map(),native=false}={}){
 let current='A',available=true,primary=true,failSave=false;const calls=[];
 const root=id=>({native:true,__pbNative:true,rootId:id,parts:[],kind:'directory',name:id,queryPermission:async()=>available?'granted':'denied'});
 const context={Map,Promise,Date,ArrayBuffer,Uint8Array,TextEncoder,File,Error,JSON,window:{pbLabLocalIntakeStorage:{},...(native?{pbNativeStorage:{invoke:async(action,p)=>{calls.push({action,...p});if(!available)return{ok:false,error:{code:'ENOENT',message:'disk disconnected'}};if(action==='permission')return{ok:true,value:'granted'};if(p.create&&p.rootId!==current)return{ok:false,error:{code:'historical_root_readonly'}};return{ok:true,value:{rootId:p.rootId,parts:p.parts,kind:action==='file'?'file':'directory',name:p.parts.at(-1)}}}}}:{})},ai:()=>true,Hu:async()=>({registered:true,isThisDevice:primary}),Vs:r=>r.queryPermission().then(v=>v==='granted'),uh:id=>'device:'+id,Iy:'test',Zr:'paths',Ag(){throw Error('inject persistence')},yc:()=>null,Ic:d=>d.toISOString().slice(0,10),Tg:o=>o.customer_name,Uy:(d,f)=>d.order.number+'-'+f.id,Ya:String,pb1450Meta:f=>f,pb1450Missing:e=>e.code==='ENOENT',pb1450Root:async()=>root(current)};
 vm.createContext(context);vm.runInContext(code,context);
 context.pb1550Db=async(d,value)=>{const k=d.order.id;if(value===undefined)return records.has(k)?structuredClone(records.get(k)):undefined;if(failSave)throw Error('disk full');records.set(k,structuredClone(value));return value;};
 return{context,records,calls,choose:id=>{current=id},disconnect:()=>{available=false},foreign:()=>{primary=false},failSave:()=>{failSave=true},root};
}
const detail=(id='one',mode='print')=>({order:{id,number:1,customer_name:'studio',mode},files:[{id:'photo',original_name:'photo.jpg',bytes:3}]});
test('download pins A; new orders use B; restart and number/name changes retain original target',async()=>{
 const f=fixture({native:true}),d=detail();await f.context.pb1550Root(d,true);const a=await f.context.pb1550Target(f.root('A'),d,d.files[0]);
 f.choose('B');assert.equal((await f.context.pb1550Root(detail('two','album'),true)).rootId,'B');
 const reboot=fixture({records:f.records,native:true});reboot.choose('B');d.order.number=99;d.order.customer_name='renamed';
 const target=await reboot.context.pb1550Target(reboot.root('B'),d,d.files[0]);assert.equal(target.root.rootId,'A');assert.deepEqual(Array.from(target.dir.parts),Array.from(a.dir.parts));assert(!reboot.calls.some(c=>c.create));
});
test('existing native manual file descriptors select historical A instead of default B',async()=>{
 const f=fixture({native:true}),d=detail('manual');f.choose('B');d.order.localFiles=[{rootId:'A',bytes:3,parts:['2026-01-01','studio','old-number','photo.jpg']}];
 const target=await f.context.pb1550Target(f.root('B'),d,d.files[0]);assert.equal(target.root.rootId,'A');assert.deepEqual(Array.from(target.dir.parts),['2026-01-01','studio','old-number']);assert(!f.calls.some(c=>c.create));
});
test('legacy native customer order resolves original descriptors through local HEAD without cloud download',async()=>{
 const f=fixture({native:true}),d=detail('legacy');d.order.downloaded_at='2026-01-01';f.choose('B');let method;
 f.context.fetch=async(url,options)=>{method=options.method;assert(url.startsWith('/desktop/local-files/'));return{ok:true,headers:{get:k=>k==='content-length'?'3':'image/jpeg'}}};
 f.context.Me=async()=>({order:{localFiles:[{rootId:'A',bytes:3,parts:['2026-01-01','studio','original','photo.jpg']}]}});
 const target=await f.context.pb1550Target(f.root('B'),d,d.files[0]);assert.equal(method,'HEAD');assert.equal(target.root.rootId,'A');assert(!f.calls.some(c=>c.create));
});
test('disconnected pinned disk never falls back to the new default',async()=>{
 const f=fixture({native:true}),d=detail();await f.context.pb1550Root(d,true);f.choose('B');f.disconnect();await assert.rejects(f.context.pb1550Root(d),/پوشهٔ ثبت‌شده/);assert.equal(f.records.get('one').root.rootId,'A');
});
test('persistence failure and foreign primary device stop before binding or file creation',async()=>{
 let f=fixture({native:true});f.failSave();await assert.rejects(f.context.pb1550Root(detail(),true),/disk full/);assert.equal(f.records.size,0);assert(!f.calls.some(c=>c.create));
 f=fixture({native:true});f.foreign();await assert.rejects(f.context.pb1550Root(detail(),true),/not_primary_download_device/);assert.equal(f.records.size,0);
});
test('final web/native routes use per-order roots and hot-update hashes match bytes',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('/* PB1550 per-order storage capabilities */'));assert(ui.includes('root = await pb1450Root(true,detail);'));assert(ui.includes('root = await pb1450Root(false,detail);'));assert(ui.includes('async function el(t,a){return pb1550Target(await pb1550Root(t,false),t,a)}'));assert(ui.includes('const root=await pb1450Root(false,prepared)'));assert.equal(ui.split('const root=await pb1550Root(detail,false);').length-1,2);assert(fs.readFileSync(root+'/index.html','utf8').includes('&orderStorage=r1550'));}
 const root='dist/web/lab-desktop-ui/',m=JSON.parse(fs.readFileSync(root+'manifest.json')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');assert.equal(m.build,hash(JSON.stringify(m.files)));for(const n of ['index.html','assets/index-UIRefine-v655-r84.js'])assert.equal(m.files.find(f=>f.name===n).sha256,hash(fs.readFileSync(root+n)));
});
