'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const native='dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js';
function slice(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'cannot locate real native pipeline section: '+start);
 return source.slice(a,b);
}
function target(){return fs.readFileSync(native,'utf8')}

test('R1910: the final downloaded Windows bundle MUST bind the exact order to its original disk root before writing startedAt',()=>{
 const s=target(),f=slice(s,'async function pb1450Download(','async function pb1450AllowStage(');
 assert.match(f,/root\s*=\s*await\s+pb1450Root\(options\.silent!==true,detail\)/,'silent and explicit download MUST pass detail; removing it caused #896 previous-folder failure');
 assert(!f.includes('root = await pb1450Root(options.silent===true?false:true);'),'old R1909 code bypassed per-order root and must never ship');
 assert(f.indexOf('await pb1450Root(options.silent!==true,detail)')<f.indexOf('detail.order._local_download_started_at ='),'disk identity must be pinned BEFORE startedAt checkpoint');
 assert(s.includes('/* PB1550 per-order storage capabilities */'));
 assert(s.includes('pb1550Target('));
 assert(s.includes('const newUnboundOrder=state.pathLayout===\'order-v2\''));
});
test('R1910: fresh 896 failed-root checkpoint is recoverable; existing historical disk never silently rebinds',async()=>{
 const source=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
 const values=new Map(),records=new Map(),ops=[],local={id:'order-896',number:896,status:'sent',customer_name:'Studio',mode:'print'},files=[{id:'photo-1',original_name:'896.jpg',bytes:3}];
 values.set('order-896',{startedAt:'2026-11-19T08:10:00Z',pathLayout:'order-v2',pathDate:'2026-11-19T08:10:00Z',localFiles:{},localComplete:false});
 function root(id='current'){return {__pbNative:true,native:true,rootId:id,parts:[],kind:'directory',name:id,queryPermission:async()=> 'granted'}};
 const ctx={Map,Promise,Date,ArrayBuffer,Uint8Array,TextEncoder,Error,JSON,
  window:{pbLabLocalIntakeStorage:{},pbNativeStorage:{invoke:async(action,payload)=>{ops.push({action,...payload});return {ok:true,value:action==='permission'?'granted':{rootId:payload.rootId,parts:payload.parts,kind:'directory'}}}}},
  ai:()=>true,Hu:async()=>({registered:true,isThisDevice:true}),Vs:async()=>true,
  uh:x=>x,Iy:'native',Zr:'paths',Ag:async()=>{throw Error('DB shim should be injected')},
  yc:id=>values.get(id)||null,Tg:o=>o.customer_name,Ic:d=>d.toISOString().slice(0,10),
  Uy:(d,f)=>String(d.order.number)+'-'+String(f.id),Ya:x=>String(x),pb1450Meta:f=>f,
  pb1450FileInfo:async()=>({size:3}),pb1450Missing:e=>e?.code==='ENOENT',
  pb1450Root:async()=>root('current'),fetch:async()=>({ok:false}),Me:async()=>({order:{}})};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 ctx.pb1550Db=async(detail,value)=>{if(value===undefined)return records.get(detail.order.id);records.set(detail.order.id,value);return value};
 const d={order:local,files};
 const resolved=await ctx.pb1550Root(d,false);
 assert.equal(resolved.rootId,'current','fresh order with old startedAt must use selected current folder');
 assert.equal(records.get('order-896').root.rootId,'current','persist binding for future attempts');
 // A genuinely downloaded historical order without a pinned descriptor must NOT
 // be redirected to a new empty folder (data-loss / false success).
 const historical={order:{...local,id:'historical',downloaded_at:'2026-10-10T12:00:00Z'},files};
 await assert.rejects(ctx.pb1550Root(historical,false),/پوشهٔ قبلی این سفارش پیدا نشد/);
 const partial={order:{...local,id:'partial'},files};
 values.set('partial',{startedAt:'2026-11-19T08:10:00Z',pathLayout:'order-v2',localFiles:{'photo-1':{serverName:'896.jpg',bytes:3}},localComplete:false});
 await assert.rejects(ctx.pb1550Root(partial,false),/پوشهٔ قبلی این سفارش پیدا نشد/);
 assert.equal(records.has('historical'),false);
 assert.equal(records.has('partial'),false);
});
test('R1910: a REAL generated downloader function begins a file request with exact root binding and verifies afterward',async()=>{
 const source=target(),fn=slice(source,'async function pb1450Download(','async function pb1450AllowStage(');
 const state=new Map(),phases=[],rootCalls=[],fileCalls=[],verified=[],file={id:'f1',original_name:'896.jpg',bytes:3},order={id:'order-896',number:896,lab_id:'lab-A',status:'sent',file_count:1};
 let downloaded=false;
 const localRoot={name:'C:',displayPath:'C:\\orders'};
 const ctx={Promise,Map,Set,Date,Number,String,Error,Math,JSON,
  window:{pbNativeStorage:{}},pb1450Flights:new Set(),
  pb1581Report:(_order,p)=>phases.push(p.phase),
  yc:id=>state.get(id)||null,hr:(id,value)=>state.set(id,value),
  pb1450Root:async(choose,detail)=>{rootCalls.push({choose,detail});if(!detail?.order?.id)throw Error('پوشهٔ قبلی این سفارش پیدا نشد');return localRoot},
  pb1908EmptyPreflight:async()=>null,
  pb1450Verify:async()=>{verified.push(downloaded?'post':'pre');return downloaded?
   {expected:1,valid:1,actual:1,missing:[],invalid:[],extra:[],collisions:[],complete:true,loadedBytes:3,completedIds:['f1'],rootName:'C:',day:'2026-11-19'}:
   {expected:1,valid:0,actual:0,missing:['896.jpg'],invalid:[],extra:[],collisions:[],complete:false,loadedBytes:0,completedIds:[],rootName:'C:',day:'2026-11-19'}},
  pb1450Target:async()=>({dir:{getFileHandle:async()=>({__pbNative:true,rootId:'current',parts:['896.jpg'],name:'896.jpg'})}}),
  Ky:async id=>{fileCalls.push(id);return {pbDownloadName:'896.jpg',pbDownloadBytes:3}},
  pb1769DownloadName:(_file,name)=>name,pb1769OrderFirst:()=>true,Ya:x=>x,
  pb1445WriteDownload:async(_dir,_name,_response,onChunk)=>{onChunk(3);downloaded=true},
  pb1450FileInfo:async()=>({size:3}),pb1450Save:()=>{},pb1450Code:e=>e.message};
 vm.createContext(ctx);vm.runInContext(fn+'\nthis.download=pb1450Download;',ctx);
 const detail={order,files:[file]};
 const result=await ctx.download(detail,()=>{},{silent:true});
 assert.equal(rootCalls.length,1,'no second unnecessary root/device handshake');
 assert.equal(rootCalls[0].choose,false,'background download must NEVER show folder picker');
 assert.equal(rootCalls[0].detail,detail,'must pin the exact order before creating a startedAt checkpoint');
 assert.deepEqual(fileCalls,['f1'],'first network file request must actually happen');
 assert.deepEqual(verified,['pre','post'],'mandatory full post-transfer verification preserved');
 assert.equal(result.done,1);
 assert(phases.includes('downloading')&&phases.includes('complete'));
});
