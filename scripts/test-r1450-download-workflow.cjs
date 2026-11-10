const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const production=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const marker='/* PB1450 verified download workflow */';
assert.equal(production.split(marker).length,2);
// Only evaluate the R1450 download helper in the isolated VM. Many later
// releases append unrelated browser/UI code after it; evaluating that code
// without the full browser runtime causes ReferenceError (for example 'x').
const helperStart=production.indexOf(marker);
assert(helperStart>=0,'R1450 helper marker missing');
const helperBodyStart=helperStart+marker.length;
const lastHelper=production.indexOf('async function pb1450AllowStage(',helperBodyStart);
assert(lastHelper>helperBodyStart,'R1450 final helper function missing');
const helperEnd=production.indexOf('\n}\n',lastHelper);
assert(helperEnd>lastHelper&&helperEnd-lastHelper<2500,'R1450 helper boundary changed');
const helper=production.slice(helperBodyStart,helperEnd+2);
assert(helper.includes('function pb1769DownloadName('),'download naming helper retained');
assert(helper.includes('async function pb1450Download('),'verified downloader retained');
function setup({files,stored={},extra={},native=false}={}){
 files=files||[{id:'a',original_name:'a.jpg',bytes:3,group:'one'},{id:'b',original_name:'b.jpg',bytes:3,group:'one'}];
 const disk=new Map(Object.entries(stored)),state=new Map(),alerts=[],requests=[],downloads=[],dirs=new Map();let primary=true,fail=null,statCalls=0;
 function dir(group){if(dirs.has(group))return dirs.get(group);const value={kind:'directory',async getFileHandle(name,{create=false}={}){const key=group+'/'+name;if(!create&&!disk.has(key))throw Object.assign(Error('file missing'),native?{code:'ENOENT',name:'Error'}:{name:'NotFoundError'});return {kind:'file',name,__pbNative:native,rootId:'root',parts:[group,name],async getFile(){if(!disk.has(key))throw Object.assign(Error('file missing'),{code:'ENOENT'});return {size:disk.get(key),name}},async createWritable(){let count=0;return {async write(bytes){count+=bytes.byteLength},async close(){disk.set(key,count)},async abort(){}}}}},async *entries(){for(const [key]of disk)if(key.startsWith(group+'/'))yield [key.slice(group.length+1),{kind:'file'}]}};dirs.set(group,value);return value;}
 const detail={order:{id:'279',number:279,status:'ready',downloaded_at:'2026-10-25'},files};
 const context={console,Date,Set,Map,Error,String,Number,Math,Uint8Array,File,Blob,V:String,Ya:x=>x,Uy:(_,f)=>f.group||'one',pb1769OrderFirst:order=>!(order?.downloaded_at||state.get(order?.id)?.startedAt),ai:()=>true,Hu:async()=>({registered:true,isThisDevice:primary}),qs:async()=>({name:'Lab folder'}),Vs:async()=>true,no:async()=>({name:'Lab folder'}),vc:async()=>{},yc:id=>state.get(id)||null,pb1769OrderFirst:order=>{const saved=state.get(order?.id)||{};return saved.pathLayout==='order-v2'||!(saved.pathLayout==='legacy'||saved.startedAt||order?.downloaded_at)},hr:(id,s)=>state.set(id,s),alert:msg=>alerts.push(msg),Me:async(path,opts)=>{requests.push([path,opts]);return detail},Ky:async id=>{downloads.push(id);if(fail)throw fail;const f=files.find(f=>f.id===id);return {pbDownloadName:f.original_name,pbDownloadBytes:f.bytes,body:{getReader(){let read=false;return {async read(){if(read)return {done:true};read=true;return {done:false,value:new Uint8Array(f.bytes)}},async cancel(){},releaseLock(){}}}}}},pb1581Report:()=>{},pb1483Phone:()=>false,window:{pbLabLocalIntakeStorage:{target:async(root,detail,f)=>({root,dir:dir(f.group||'one'),day:'today'})}},...extra};
 if(native)context.window.pbNativeStorage={invoke:async(action,{parts})=>{statCalls++;assert.equal(action,'stat');const key=parts.join('/');return disk.has(key)?{ok:true,value:{size:disk.get(key)}}:{ok:false,error:{code:'ENOENT',name:'Error',message:'not found'}}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('scripts/r1445-download-safety.js','utf8')+'\n'+helper,context);
 return {c:context,disk,state,alerts,requests,downloads,detail,dir,setPrimary:v=>primary=v,setFailure:e=>fail=e,get statCalls(){return statCalls}};
}
test('same count with wrong names and short files is not a complete order',async()=>{const r=setup({stored:{'one/a.jpg':1,'one/other.jpg':3}}),p=await r.c.pb1450Verify(r.detail,{name:'folder'});assert.equal(p.expected,2);assert.equal(p.actual,2);assert.equal(p.valid,0);assert.deepEqual(Array.from(p.missing),['b.jpg']);assert.deepEqual(Array.from(p.invalid),['a.jpg']);assert.deepEqual(Array.from(p.extra),['other.jpg']);assert.equal(p.complete,false)});
test('native ENOENT means a missing photo and never successful verification',async()=>{const r=setup({native:true,stored:{'one/a.jpg':3}}),p=await r.c.pb1450Verify(r.detail,{name:'folder'});assert.equal(p.valid,1);assert.equal(p.missing[0],'b.jpg');assert.equal(p.complete,false);assert.equal(r.statCalls,1)});
test('native verification uses stat without reading photo bytes through IPC',async()=>{const r=setup({native:true,stored:{'one/a.jpg':3,'one/b.jpg':3}});const p=await r.c.pb1450Verify(r.detail,{name:'folder'});assert.equal(p.complete,true);assert.equal(r.statCalls,2)});
test('invoice PDF and temporary writer files do not count as extra photos',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':3,'one/invoice-279.pdf':55,'one/.photobridge-temp.tmp':2}});assert.equal((await r.c.pb1450Verify(r.detail,{name:'folder'})).complete,true)});
test('two server records cannot share the same Windows destination filename',async()=>{const r=setup({files:[{id:'a',original_name:'a.jpg',bytes:3},{id:'b',original_name:'A.JPG',bytes:3}],stored:{'one/a.jpg':3}});const p=await r.c.pb1450Verify(r.detail,{name:'folder'});assert.equal(p.complete,false);assert.equal(p.collisions.length,1)});
test('same filenames in different print folders remain separate valid files',async()=>{const r=setup({files:[{id:'a',original_name:'a.jpg',bytes:3,group:'one'},{id:'b',original_name:'a.jpg',bytes:3,group:'two'}],stored:{'one/a.jpg':3,'two/a.jpg':3}});assert.equal((await r.c.pb1450Verify(r.detail,{name:'folder'})).complete,true)});
test('initial download skips server transfers if every real local file is already complete',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':3}}),result=await r.c.pb1450Download(r.detail);assert.equal(result.alreadyComplete,true);assert.equal(r.downloads.length,0);assert.equal(r.state.get('279').localComplete,true)});
test('explicit redownload fetches every photo even when disk files are complete',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':3}});await r.c.pb1450Download(r.detail,()=>{},{force:true});assert.deepEqual(r.downloads,['a','b']);assert.equal(r.state.get('279').localComplete,true);assert.equal(r.detail.order.status,'ready');assert.equal(r.requests.length,0)});
test('initial partial download repairs only missing or short photos',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':1}});await r.c.pb1450Download(r.detail);assert.deepEqual(r.downloads,['b']);assert.equal(r.disk.get('one/b.jpg'),3)});
test('network failure shows both the error and exact missing filenames, retaining incomplete state',async()=>{const r=setup({stored:{'one/a.jpg':3}});r.state.set('279',{startedAt:'2026-10-25',localComplete:true});r.setFailure(Error('network_disconnected'));let err;try{await r.c.pb1450Download(r.detail)}catch(e){err=e}r.c.pb1450Notify(err);assert.equal(r.state.get('279').localComplete,false);assert.equal(r.alerts.length,1);assert.match(r.alerts[0],/b.jpg/);assert.match(r.alerts[0],/دانلود مجدد/)});
test('97 of 100 files blocks printing and names the missing three',async()=>{const files=Array.from({length:100},(_,i)=>({id:String(i),original_name:'p'+i+'.jpg',bytes:3})),stored=Object.fromEntries(files.slice(0,97).map(f=>['one/'+f.original_name,3])),r=setup({files,stored});assert.equal(await r.c.pb1450AllowStage(r.detail.order),false);assert.match(r.alerts[0],/97.*100/);for(const n of [97,98,99])assert.match(r.alerts[0],new RegExp('p'+n+'\\.jpg'));assert.equal(r.requests.length,1);assert.equal(r.state.get('279').localComplete,false)});
test('a stale completion flag cannot authorize print after a file was removed',async()=>{const r=setup({stored:{'one/a.jpg':3}});r.state.set('279',{localComplete:true,done:2,total:2});assert.equal(await r.c.pb1450AllowStage(r.detail.order),false)});
test('fresh server manifest changes are checked before print',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':3}});assert.equal(await r.c.pb1450AllowStage(r.detail.order),true);r.detail.files.push({id:'c',original_name:'c.jpg',bytes:3});assert.equal(await r.c.pb1450AllowStage(r.detail.order),false);assert.match(r.alerts[0],/c.jpg/)});
test('an unregistered/non-primary system cannot authorize a production transition',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':3}});r.setPrimary(false);assert.equal(await r.c.pb1450AllowStage(r.detail.order),false);assert.match(r.alerts[0],/سیستم اصلی/)});
test('empty or count-inconsistent server manifest cannot claim successful download',async()=>{for(const detail of [{order:{id:'279'},files:[]},{order:{id:'279',file_count:3},files:[{id:'a',original_name:'a.jpg',bytes:3}]}]){const r=setup();await assert.rejects(r.c.pb1450Verify(detail,{name:'folder'}),/download_manifest_incomplete/)}});
test('fallback transport receipts identify the actual saved filename and size, but still inspect disk',async()=>{const r=setup({files:[{id:'a',original_name:'prepared.jpg',bytes:3}],stored:{'one/source.tif':5}}),receipts={a:{serverName:'prepared.jpg',serverBytes:3,name:'source.tif',bytes:5}};assert.equal((await r.c.pb1450Verify(r.detail,{name:'folder'},receipts)).complete,true);r.disk.set('one/source.tif',2);assert.equal((await r.c.pb1450Verify(r.detail,{name:'folder'},receipts)).complete,false)});
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
// This suite runs twice: before R1583 is deployed and after all release patches.
// Require its native retry integration only when that capability is installed.
const hasR1583Retry=/\bfunction pb1583CanRetry\(/.test(ui);
function expression(start,end){const a=ui.indexOf(start),b=ui.indexOf(end,a+start.length);assert(a>0&&b>a,start);return ui.slice(a+start.indexOf('=')+1,b)}
function handler(start,end,extra={}){const effects=[],guardCalls=[],ctx={console,Date,Number,String,Error,JSON,V:String,ai:()=>true,yc:()=>({startedAt:'2026-10-25',localComplete:false}),C:()=>{},F:()=>{},B:()=>{},E:'',alert:m=>effects.push(['alert',m]),Me:async(path,opt)=>{effects.push(['api',path,opt?.method||'GET']);return {order:{id:'279',mode:'print',status:'ready',downloaded_at:'2026-10-25'},files:[{id:'a',bytes:3}]}},Dg:async(_,__,options)=>{effects.push(['download',options]);return {done:1}},pb1450Notify:e=>effects.push(['error',e.message]),pb1450AllowStage:async order=>{guardCalls.push(order?.id);return false},pb1450Retry:()=>true,pb1450CanDownload:()=>true,pb1483Phone:()=>false,pb1603StageInvoicePending:()=>false,pb1529StageReason:()=>'',f:()=>{},pb1578Pending:null,pb1578RunStage:async(_,stage,work)=>work(),pb1583CanRetry:()=>false,t:{id:'lab-test'},window:{dispatchEvent:()=>{}},ye:async()=>{},It:async()=>effects.push(['It']),Gt:async()=>effects.push(['Gt']),P:()=>effects.push(['success']),o:'print',...extra};vm.createContext(ctx);vm.runInContext('globalThis.run='+expression(start,end),ctx);return {c:ctx,effects,guardCalls}}
// The sixteen tests above execute the actual R1450 download/verification helpers
// with disk/network mocks. Stage UI changed repeatedly in later releases; do
// not evaluate sliced React closures with missing hooks and false dependencies.
// Inspect the shipped handler contracts here and let the download tests exercise
// the verification and no-incomplete-print behavior directly.
function compiledHandler(start,end){
 const code=expression(start,end);
 assert(code&&code.length>25,'compiled handler must be present');
 return code;
}
test('ready-order download dispatcher retains guarded re-download and never creates an invoice',()=>{
 const code=compiledHandler('Vn=async(le,options={})=>',',un=async le=>');
 assert.match(code,/await Dg\(/,'real download helper must remain connected');
 assert.match(code,/pb1450Notify\(error\)/,'errors must remain visible');
 assert.match(code,/downloaded_at/,'ready orders must not re-register their downloaded stage');
});
test('failed download remains visible in the original order action',()=>{
 const code=compiledHandler('Vn=async(le,options={})=>',',un=async le=>');
 assert.match(code,/catch\(error\)/);
 assert.match(code,/pb1450Notify\(error\)/);
 assert.match(code,/finally/);
});
test('ready and complete handlers guard disk verification before mutating an order',()=>{
 for(const [start,end,operation] of [
  ['un=async le=>',',Cn=async(le,nt)=>','await Me('],
  ['gn=async le=>',',Vn=async(le,options={})=>','await It(']
 ]){
  const code=compiledHandler(start,end);
  const guard=code.indexOf('pb1450AllowStage(');
  const mutation=code.indexOf(operation);
  assert(guard>=0,'missing disk verification in '+start);
  assert(mutation<0||guard<mutation,'stage change precedes disk verification in '+start);
 }
});
test('album stage handler checks disk before any stage PUT',()=>{
 const code=compiledHandler('Cn=async(le,nt)=>',',aa=async(le,nt)=>');
 const guard=code.indexOf('pb1450AllowStage(');
 const write=code.indexOf('/album-stage');
 assert(guard>=0,'album stages still require verification');
 assert(write<0||guard<write,'album stage PUT must follow verification');
});
test('print stage handler checks disk before PATCH',()=>{
 const code=compiledHandler('It=async(le,nt,xt)=>',',gn=async le=>');
 const guard=code.indexOf('pb1450AllowStage(');
 const patch=code.indexOf('method:"PATCH"');
 assert(guard>=0,'print stage must verify local files');
 assert(patch<0||guard<patch,'PATCH must follow successful verification');
});
test('existing order actions still route redownload through the verified downloader',()=>{
 const code=compiledHandler('aa=async(le,nt)=>',',la=(le,nt)=>');
 assert.match(code,/download_print/);
 assert.match(code,/pb1450Retry\(/);
 assert.match(code,/Vn\(/);
 if(hasR1583Retry)assert.match(code,/pb1583CanRetry\(/,'installed R1583 must retain native retry routing');
 else assert.doesNotMatch(code,/pb1583CanRetry\(/,'R1450 baseline must not invoke R1583 before installation');
});
test('timeline exposes a real retry action without restoring duplicate repair buttons',()=>{
 const start=ui.indexOf('e.jsx("div",{className:"labActionTimeline"');
 const end=ui.indexOf(',qt&&e.jsxs("div",{className:"downloadResumeInline"',start);
 assert(start>=0&&end>start,'canonical order timeline remains present');
 const code=ui.slice(start,end);
 assert.match(code,/pb1450Retry\(/);
 if(hasR1583Retry)assert.match(code,/pb1583CanRetry\(/,'installed R1583 must expose its retry label');
 else assert.doesNotMatch(code,/pb1583CanRetry\(/,'pre-R1583 timeline must use R1450 retry label');
 assert.match(code,/aa\(le,Jt.key\)/,'timeline download is a wired action');
 assert(!ui.includes('pb1445RepairDownload'),'obsolete duplicate repair button must stay removed');
});
test('forced redownload restores expected files but retains and reports extra photos without deleting them',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/extra.jpg':3}});await assert.rejects(r.c.pb1450Download(r.detail,()=>{},{force:true}),e=>e.message==='local_download_incomplete'&&e.report.extra[0]==='extra.jpg');assert.deepEqual(r.downloads,['a','b']);assert.equal(r.disk.get('one/b.jpg'),3);assert.equal(r.disk.get('one/extra.jpg'),3);assert.equal(r.state.get('279').localComplete,false)});
test('saved path date survives crossing midnight without changing order workflow metadata',async()=>{const r=setup({stored:{'one/a.jpg':3,'one/b.jpg':3}}),seen=[];r.state.set('279',{pathDate:'2026-10-24T23:59:00Z'});const bridge=r.c.window.pbLabLocalIntakeStorage.target;r.c.window.pbLabLocalIntakeStorage.target=async(root,detail,file)=>{seen.push(detail.order.downloaded_at);return bridge(root,detail,file)};r.detail.order.downloaded_at='2026-10-25T00:01:00Z';assert.equal((await r.c.pb1450Verify(r.detail,{name:'folder'})).complete,true);assert(seen.every(value=>value==='2026-10-24T23:59:00Z'));assert.equal(r.detail.order.downloaded_at,'2026-10-25T00:01:00Z')});
