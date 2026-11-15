const {test}=require('node:test'),assert=require('node:assert/strict');
const {createManager,digest}=require('./r1854-print-recovery.cjs');
const copy=v=>structuredClone(v);
function fixture(){
 let record=null,offline=false,fail=null,lostCreate=false,lostPresign=false,lostSubmit=false;
 const blobs=new Map(),rows=new Map(),puts=new Map(),orders=new Map();let submitCount=0;
 const store={load:async()=>copy(record),save:async s=>{record=copy(s)},putFile:async(id,b)=>blobs.set(id,b),getFile:async id=>blobs.get(id),deleteFile:async id=>blobs.delete(id)};
 const request=async(path,options={})=>{
  const body=options.body?JSON.parse(options.body):{};
  if(path==='/api/customer/recovery-orders'){if(!orders.has(body.recoveryId))orders.set(body.recoveryId,{id:body.recoveryId,status:'uploading'});if(lostCreate){lostCreate=false;throw Object.assign(Error('lost'),{status:504})}return {order:copy(orders.get(body.recoveryId))}}
  if(path.endsWith('/submit')){const order=orders.get(path.split('/')[4]);assert([...rows.values()].filter(row=>row.state!=='deleted').every(row=>row.state==='active'));if(order.status==='uploading'){order.status='sent';submitCount++}if(lostSubmit){lostSubmit=false;throw Object.assign(Error('lost'),{status:504})}return{order:copy(order)}}
  if(path.startsWith('/api/customer/orders/'))return {order:copy(orders.get(path.split('/')[4])),files:[...rows.values()].map(row=>({id:row.id,original_state:row.state}))};
  if(path==='/api/customer/uploads/recovery-presign'){if(!rows.has(body.clientFileId))rows.set(body.clientFileId,{id:body.clientFileId,name:body.name,body,state:'pending',stored:false});if(lostPresign){lostPresign=false;throw Object.assign(Error('lost'),{status:504})}return{fileId:body.clientFileId}}
  if(path.endsWith('/exclude')){const row=rows.get(path.split('/')[4]);if(row?.state==='active')throw Object.assign(Error('verified'),{status:409,data:{error:'upload_already_verified'}});if(row)row.state='deleted';return{excluded:true}}
  if(path.endsWith('/retry')){const row=rows.get(path.split('/')[4]);return{fileId:row.id,uploaded:row.stored,uploadUrl:row.id}}
  throw Error('Unexpected API '+path);
 };
 const manager=()=>createManager({store,request,hash:digest,online:()=>!offline,sleep:async()=>{},locks:null,transfer:async(id,file)=>{const row=rows.get(id);puts.set(row.name,(puts.get(row.name)||0)+1);if(fail===row.name)throw Object.assign(Error('temporary'),{status:503});row.stored=true;if(fail==='ack:'+row.name)throw Object.assign(Error('lost_put_ack'),{status:504})},verify:async id=>{assert(rows.get(id).stored);rows.get(id).state='active';return{ok:true}}});
 const groups=n=>[{id:'group',label:'۱۰×۱۵',paperType:'luster',sizeId:'size',files:Array.from({length:n},(_,i)=>({id:'local-'+i,file:new File(['original-photo-'+i],'photo-'+i+'.jpg',{type:'image/jpeg',lastModified:1}),width:100,height:150,printCopies:2}))}];
 const payload=(g,f)=>({name:f.name,bytes:f.size,printCopies:f.printCopies,printSizeId:g.sizeId,printType:g.paperType});
 return {manager,groups,payload,store,blobs,rows,puts,orders,get record(){return record},get submits(){return submitCount},fail:v=>fail=v,offline:v=>offline=v,lostCreate:()=>lostCreate=true,lostPresign:()=>lostPresign=true,lostSubmit:()=>lostSubmit=true};
}
for(const count of [1,5,9])test(`failed file after ${count} successful photos is retried without reuploading the others`,async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(10),{delivery:'pickup',priority:'normal'});f.fail('photo-'+count+'.jpg');assert.equal(await m.run(f.payload),null);assert.equal(m.snapshot().groups[0].files.filter(x=>x.state==='done').length,9);assert.equal(f.submits,0);f.fail(null);await m.run(f.payload);assert.equal(f.submits,1);assert.equal(f.rows.size,10);for(const [name,n]of f.puts)assert.equal(n,name===`photo-${count}.jpg`?4:1);
});
test('refresh/browser closure/restart restores original bytes and keeps completed file identities',async()=>{
 const f=fixture();let m=f.manager();await m.selection(f.groups(5),{});f.fail('photo-2.jpg');await m.run(f.payload);const ids=[...f.rows.keys()];m=f.manager();await m.restore();assert.equal((await m.restoredGroups())[0].files.length,5);f.fail(null);await m.run(f.payload);assert.deepEqual([...f.rows.keys()],ids);assert.equal(f.orders.size,1);assert.equal(f.submits,1);for(const [name,n]of f.puts)assert.equal(n,name==='photo-2.jpg'?4:1);
});
test('ambiguous successful PUT is probed and verified without sending its bytes again',async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(1),{});f.fail('ack:photo-0.jpg');await m.run(f.payload);assert.equal(f.puts.get('photo-0.jpg'),1);assert.equal(f.submits,1);
});
for(const stage of ['lostCreate','lostPresign','lostSubmit'])test(stage+' retains stable IDs and reconciles the same order',async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(2),{});f[stage]();try{await m.run(f.payload)}catch{}const restored=f.manager();await restored.restore();await restored.run(f.payload);assert.equal(f.orders.size,1);assert.equal(f.rows.size,2);assert.equal(f.submits,1);assert([...f.puts.values()].every(n=>n===1));
});
test('unavailable/evicted file bytes require the SAME checksum; completed files are untouched',async()=>{
 const f=fixture();let m=f.manager();const groups=f.groups(3);await m.selection(groups,{});f.fail('photo-1.jpg');await m.run(f.payload);f.blobs.clear();m=f.manager();await m.restore();let rows=m.snapshot().groups[0].files;assert.equal(rows.filter(x=>x.state==='done').length,2);assert(rows.find(x=>x.name==='photo-1.jpg').missing);await m.reselect([new File(['wrong-photo-data'],'photo-1.jpg',{type:'image/jpeg'})]);assert(m.snapshot().groups[0].files.find(x=>x.name==='photo-1.jpg').missing);await m.reselect([groups[0].files[1].file]);f.fail(null);await m.run(f.payload);assert.equal(f.submits,1);assert.equal(f.puts.get('photo-0.jpg'),1);assert.equal(f.puts.get('photo-2.jpg'),1);
});
test('quota exhaustion keeps in-memory originals, persisted metadata, and a visible restart warning',async()=>{
 const f=fixture();f.store.putFile=async()=>{throw Object.assign(Error('quota'),{name:'QuotaExceededError'})};const m=f.manager();await m.selection(f.groups(2),{});assert(m.snapshot().warning);await m.run(f.payload);assert.equal(f.submits,1);
});
test('metadata persistence failure prevents any new order or upload side effects',async()=>{
 const f=fixture();f.store.save=async()=>{throw Error('local_checkpoint_failed')};const m=f.manager();await assert.rejects(m.selection(f.groups(2),{}));await assert.rejects(m.run(f.payload));assert.equal(f.orders.size,0);assert.equal(f.rows.size,0);
});
test('offline pause preserves every queue item and resumes after connectivity returns',async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(4),{});f.offline(true);await m.run(f.payload);assert.equal(f.puts.size,0);assert.equal(m.snapshot().groups[0].files.length,4);f.offline(false);await m.run(f.payload);assert.equal(f.submits,1);
});
test('double click shares one execution; all file states survive per-file retry',async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(20),{});f.fail('photo-9.jpg');await Promise.all([m.run(f.payload),m.run(f.payload)]);f.fail(null);await m.run(f.payload,{fileIds:['local-9']});assert.equal(f.rows.size,20);assert.equal(f.orders.size,1);assert.equal(f.submits,1);assert.equal(m.snapshot().groups[0].files.filter(x=>x.state==='done').length,20);
});
test('100 MiB original remains byte-identical; hashing does not change or shrink the upload',async()=>{
 const crypto=require('node:crypto'),f=fixture(),chunk=Buffer.alloc(1024*1024,73),photo=new File(Array(100).fill(chunk),'large-original.tif',{type:'image/tiff'}),groups=f.groups(1);groups[0].files[0].file=photo;const expected=crypto.createHash('sha256');for(let i=0;i<100;i++)expected.update(chunk);const m=f.manager();await m.selection(groups,{});assert.equal(m.snapshot().groups[0].files[0].checksum,expected.digest('hex'));await m.run(f.payload);const row=[...f.rows.values()][0];assert.equal(row.body.bytes,100*1024*1024);assert.equal(f.submits,1);
});
test('expired/rejected upload URL can refresh; denied storage access and unreadable bytes require attention',()=>{
 const {failure}=require('./r1854-print-recovery.cjs');assert.equal(failure({status:403,data:{error:'upload_url_rejected',retryable:true}}).retryable,true);assert.equal(failure({status:503,data:{error:'storage_access_denied',retryable:false}}).retryable,false);assert.equal(failure(Error('needs_reselection')).retryable,false);assert.equal(failure(Error('file_read_failed')).retryable,false);
});
test('stalled whole-file transfer times out, clears its timer, and aborts only that request',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');let last,timer,sequence=0;const timers=new Map();
 class XHR{constructor(){this.upload={};last=this}open(){}setRequestHeader(){}send(file){this.file=file}abort(){this.aborted=true;this.onabort?.()}}
 const context={module:{exports:{}},XMLHttpRequest:XHR,crypto:globalThis.crypto,Blob,File,setTimeout:(fn,ms)=>{assert.equal(ms,120000);timer=++sequence;timers.set(timer,fn);return timer},clearTimeout:id=>timers.delete(id)};vm.runInNewContext(fs.readFileSync('scripts/r1854-print-recovery.cjs','utf8'),context);const original=new File(['unaltered-original'],'photo.jpg',{type:'image/jpeg'}),task=context.module.exports.transferFile('/upload',original,()=>{},undefined,'test-token');assert.equal(last.file,original);const first=timer;last.upload.onprogress({lengthComputable:true,loaded:1,total:18});assert(!timers.has(first));timers.get(timer)();await assert.rejects(task,error=>error.status===408);assert.equal(last.aborted,true);assert.equal(timers.size,0);
});
test('provider capacity error is distinct from browser quota and is not blindly retried',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');let last;class XHR{constructor(){this.upload={};last=this}open(){}setRequestHeader(){}send(){}abort(){this.onabort?.()}}
 const context={module:{exports:{}},XMLHttpRequest:XHR,crypto:globalThis.crypto,Blob,File,setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync('scripts/r1854-print-recovery.cjs','utf8'),context);const lib=context.module.exports,task=lib.transferFile('https://objects.invalid/photo',new File(['original'],'photo.jpg'),()=>{});last.status=503;last.responseText='<Error><Code>InsufficientStorage</Code><RequestId>test-only</RequestId></Error>';last.onload();await assert.rejects(task,error=>{assert.equal(error.data.error,'storage_capacity_exceeded');assert.equal(lib.failure(error).retryable,false);assert.match(lib.failure(error).reason,/ظرفیت سرویس/);return true});
});
test('editing copies and paper before submission preserves the latest photographer selections',async()=>{
 const f=fixture(),m=f.manager(),groups=f.groups(2);await m.selection(groups,{});const checksum=m.snapshot().groups[0].files[0].checksum;groups[0].files[0].printCopies=7;groups[0].paperType='silk';await m.selection(groups,{});assert.equal(m.snapshot().groups[0].files[0].checksum,checksum);await m.run(f.payload);const row=[...f.rows.values()].find(row=>row.name==='photo-0.jpg');assert.equal(row.body.printCopies,7);assert.equal(row.body.printType,'silk');assert.equal(f.submits,1);
});
test('replacing a selected file before draft creation refreshes its content identity',async()=>{
 const f=fixture(),m=f.manager(),groups=f.groups(1);await m.selection(groups,{});const before=m.snapshot().groups[0].files[0];groups[0].files[0].file=new File(['replacement-same-photo-name'],'photo-0.jpg',{type:'image/jpeg',lastModified:1});await m.selection(groups,{});const after=m.snapshot().groups[0].files[0];assert.notEqual(after.checksum,before.checksum);assert.notEqual(after.serverId,before.serverId);assert.equal(after.checksum,await digest(groups[0].files[0].file));await m.run(f.payload);assert.equal(f.submits,1);
});
test('older server cannot silently ignore recovery IDs or create a duplicate draft during rollout',async()=>{
 let saved=null;const calls=[],store={load:async()=>saved,save:async value=>{saved=structuredClone(value)},putFile:async()=>{},getFile:async()=>null,deleteFile:async()=>{}};
 const manager=createManager({store,locks:null,hash:digest,request:async(path,options)=>{calls.push([path,options.method]);throw Object.assign(Error('not_found'),{status:404})},transfer:async()=>{throw Error('Unexpected PUT')},verify:async()=>{throw Error('Unexpected completion')}});await manager.selection([{id:'group',files:[{id:'photo',file:new File(['unchanged'],'photo.jpg')}]}],{});await assert.rejects(manager.run(()=>({name:'photo.jpg'})));assert.deepEqual(calls,[['/api/customer/recovery-orders','POST']]);assert.equal(manager.snapshot().groups[0].files.length,1);assert.equal(manager.snapshot().orderCreated,undefined);
});
test('a failed replacement cache write cannot upload an older cached original with the same local photo ID',async()=>{
 const f=fixture(),groups=f.groups(1);let m=f.manager();await m.selection(groups,{});const replacement=new File(['replacement-customer-original'],'photo-0.jpg',{type:'image/jpeg',lastModified:1});f.store.putFile=async()=>{throw Error('quota')};groups[0].files[0].file=replacement;await m.selection(groups,{});m=f.manager();await m.restore();await m.run(f.payload);assert.equal(f.puts.size,0);assert(m.snapshot().groups[0].files[0].missing);await m.reselect([replacement]);await m.run(f.payload);assert.equal(f.puts.get('photo-0.jpg'),1);assert.equal(f.orders.size,1);assert.equal(f.submits,1);
});
test('failed photo can be explicitly removed; completed originals and their PUT counts remain untouched',async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(5),{});f.fail('photo-2.jpg');await m.run(f.payload);const failed=m.snapshot().groups[0].files.find(file=>file.name==='photo-2.jpg');const groups=await m.exclude(failed.id);assert.equal(groups[0].files.length,4);assert.equal(m.snapshot().excluded.length,1);assert.equal(f.rows.get(failed.serverId).state,'deleted');assert.equal(m.snapshot().groups[0].files.filter(file=>file.state==='done').length,4);await m.run(f.payload);assert.equal(f.submits,1);for(const [name,n]of f.puts)if(name!=='photo-2.jpg')assert.equal(n,1);
});
test('verified photo cannot be removed as failed and excluding the last queued photo permits a fresh selection',async()=>{
 const f=fixture(),m=f.manager();await m.selection(f.groups(2),{});f.fail('photo-1.jpg');await m.run(f.payload);await assert.rejects(m.exclude('local-0'),error=>error.message==='upload_already_verified');assert.equal(m.snapshot().groups[0].files.length,2);
 const fresh=f.manager();const emptyStore=fixture(),only=emptyStore.manager();await only.selection(emptyStore.groups(1),{});await only.exclude('local-0');assert.equal(only.snapshot().state,'empty');only.reset();await only.selection(emptyStore.groups(1),{});assert.equal(only.snapshot().groups[0].files.length,1);
});
test('pause aborts a stalled request and releases the queue for a new attempt',async()=>{
 let saved=null,started;const ready=new Promise(resolve=>started=resolve),store={save:async value=>{saved=structuredClone(value)},load:async()=>saved,putFile:async()=>{},getFile:async()=>null,deleteFile:async()=>{}};const m=createManager({store,locks:null,request:(path,options)=>new Promise((resolve,reject)=>{started();options.signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'})),{once:true})}),transfer:async()=>{},verify:async()=>{}});await m.selection([{id:'group',files:[{id:'photo',file:new File(['original'],'photo.jpg')}]}],{});const running=m.run(()=>({}));await ready;await m.pause();await running.catch(()=>{});assert.equal(m.isBusy(),false);assert.equal(m.snapshot().groups[0].files.length,1);assert.equal(m.snapshot().state,'paused');
});
test('preview never returns a stale replacement blob after a cache quota failure',async()=>{
 const f=fixture(),groups=f.groups(1);let m=f.manager();await m.selection(groups,{});f.store.putFile=async()=>{throw Error('quota')};groups[0].files[0].file=new File(['new original bytes'],'photo-0.jpg',{type:'image/jpeg'});await m.selection(groups,{});m=f.manager();await m.restore();await assert.rejects(m.getOriginal('local-0'),error=>error.message==='needs_reselection');assert.equal(m.snapshot().groups[0].files[0].missing,true);assert.equal(f.puts.size,0);
});
