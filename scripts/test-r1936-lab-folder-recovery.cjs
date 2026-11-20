'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
function section(from,to){
 const a=src.indexOf(from),b=src.indexOf(to,a+from.length);
 assert(a>=0&&b>a,'source section '+from);
 return src.slice(a,b);
}
const bucketFns=section('function pb1664StorageBucket(order){','async function pb1550Probe(');
const repairFns=section('/* PB1936 explicit redownload recovery','async function pb1550Target(');
const targetFn=section('async function pb1550Target(','// Preserve the existing device registration');
const rootFn=section('async function pb1550Root(','async function pb1550ArchiveRoot(');
function harness({active=true,hasSaved=true,allowed=true,legacy=false}={}){
 const order={id:'order-953',number:953,source:'photographer',status:'downloaded',downloaded_at:'2026-11-20T10:00:00Z'};
 const detail={order,files:[{id:'photo-1',original_name:'one.jpg',bytes:139000}]};
 const calls=[],rootId='verified-root';
 function handle(parts=[]){return {
   __pbNative:true,rootId,parts,kind:'directory',
   getDirectoryHandle:async(name,options={})=>{
     if(!options.create)throw Object.assign(Error('ENOENT'),{code:'ENOENT'});
     calls.push(parts.concat(name).join('/'));
     return handle(parts.concat(name));
   }
 }}
 const root=handle();
 let saved=hasSaved?{
   root:{native:true,rootId,parts:[]},version:1,
   customer:'platform-admin',pathDate:order.downloaded_at,
   targets:{'photo-1':{day:'1405-08-30',dir:{native:true,rootId,
      parts:['HAMKAR','1405-08-30','platform-admin','10-15-luster-order-953']}}}
 }:null;
 const ctx={window:{pbNativeStorage:false},pb1450Flights:new Set(active?[order.id]:[]),
   pb1550Encode:x=>x?.__pbNative?{native:true,rootId:x.rootId,parts:x.parts}:x,
   pb1550Decode:x=>x?.native&&x.parts.length===0?root:x,
   pb1550Serial:async(_detail,fn)=>fn(),
   pb1550Db:async(_detail,value)=>value===undefined?saved:(saved=value,value),
   pb1550LocalFile:()=>null,pb1550NativeLegacy:async()=>{},
   pb1550DefaultRoot:async()=>root,pb1550Probe:async()=>null,
   Vs:async()=>allowed,ai:()=>true,Hu:async()=>({registered:true,isThisDevice:true}),
   yc:()=>({}),Tg:()=> 'platform-admin',Uy:()=> '10-15-luster-order-953',
   Ic:()=> '1405-08-30',Ya:String,pb1450Missing:e=>e.code==='ENOENT',
 };
 vm.createContext(ctx);
 vm.runInContext(bucketFns+'\n'+repairFns+'\n'+rootFn+'\n'+targetFn+
    '\nthis.runTarget=pb1550Target;this.runRoot=pb1550Root;'+
    'this.bucket=pb1664StorageBucket;this.oldBuckets=pb1664PreviousStorageBuckets;',ctx);
 return {detail,root,calls,ctx,saved:()=>saved};
}
test('R1936: explicit redownload recreates exact missing native legacy children without changing root',async()=>{
 const x=harness();const target=await x.ctx.runTarget(x.root,x.detail,x.detail.files[0]);
 assert.equal(target.root,x.root);
 assert.equal(target.dir.parts.join('/'),'HAMKAR/1405-08-30/platform-admin/10-15-luster-order-953');
 assert.deepEqual(x.calls,[
   'HAMKAR','HAMKAR/1405-08-30',
   'HAMKAR/1405-08-30/platform-admin',
   'HAMKAR/1405-08-30/platform-admin/10-15-luster-order-953'
 ]);
});
test('R1936: browsing an old order does not create or repair disk directories',async()=>{
 const x=harness({active:false});
 const target=await x.ctx.runTarget(x.root,x.detail,x.detail.files[0]);
 assert.equal(target.day,'1405-08-30');
 assert.equal(x.calls.length,0);
});
test('R1936: a deleted entire legacy order folder may be created at a verified root on redownload',async()=>{
 const x=harness({hasSaved:false,legacy:true});
 x.ctx.window.pbNativeStorage={}; // The reported ENOENT is from the native Windows app.
 const root=await x.ctx.runRoot(x.detail,true);
 assert.equal(root,x.root);
 assert.equal(x.saved().targets['photo-1'],undefined);
 const target=await x.ctx.runTarget(root,x.detail,x.detail.files[0]);
 assert.equal(target.dir.parts.join('/'),'Hamkar/1405-08-30/platform-admin/10-15-luster-order-953');
 assert.equal(x.saved().targets['photo-1'].dir.native,true);
});
test('R1936: never create a legacy folder from an archive/read-only probe',async()=>{
 const x=harness({hasSaved:false,active:false});
 await assert.rejects(x.ctx.runRoot(x.detail,false),/پوشهٔ قبلی/);
 assert.equal(x.saved(),null);
 assert.equal(x.calls.length,0);
});
test('R1936: disconnected/unauthorized root is never silently replaced or written into',async()=>{
 const x=harness({allowed:false});
 await assert.rejects(x.ctx.runTarget(x.root,x.detail,x.detail.files[0]),/پوشهٔ ثبت‌شده/);
 assert.equal(x.calls.length,0);
});
test('R1936: new category labels are exact-case Hamkar/Moshtari, old buckets remain recognized',()=>{
 const x=harness({active:false});
 assert.equal(x.ctx.bucket({source:'photographer'}),'Hamkar');
 assert.equal(x.ctx.bucket({source:'walkin'}),'Moshtari');
 assert(x.ctx.oldBuckets({source:'photographer'}).includes('HAMKAR'));
 assert(x.ctx.oldBuckets({source:'walkin'}).includes('MOSHTARI'));
});
test('R1936: native queue requests fresh online states; server remains source of truth',()=>{
 const patch=fs.readFileSync('scripts/enable-r1936-native-live-order-status.mjs','utf8');
 assert(patch.includes('pbNativeLiveStatus'));
 const path='dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js';
 const built=fs.readFileSync(path,'utf8');
 assert.match(built,/pbNativeLiveStatus=\x27\+Date\.now\(\)/);
 assert.match(built,/setInterval\(refresh,3000\)/);
 assert.match(built,/pb1753VisibleLabOrders\(data\.orders\|\|\[\],o\)/);
 assert.doesNotMatch(fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),/pbNativeLiveStatus=/);
});
