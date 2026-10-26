const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const dirs=new Map(),deletions=[];let permission='granted',failure='';
 const dir=name=>{if(dirs.has(name))return dirs.get(name);const entries=new Map(),d={name,entries,kind:'directory',async queryPermission(){return permission},async getFileHandle(name){const h=entries.get(name);if(!h)throw Object.assign(Error('missing'),{name:'NotFoundError'});return h;},async removeEntry(name,options){assert.equal(options.recursive,false);if(name===failure)throw Error('file is locked');deletions.push(this.name+'/'+name);entries.delete(name);}};dirs.set(name,d);return d;};
 const add=(d,name,text,id=d.name+'/'+name)=>{const h={name,kind:'file',id,text,mtime:10,async isSameEntry(other){return this.id===other.id},async getFile(){return new File([this.text],name,{lastModified:this.mtime})}};d.entries.set(name,h);return h;};
 const context={window:{pbLabLocalIntakeStorage:{fileName:x=>x}},crypto:crypto.webcrypto,Uint8Array,WeakMap,Map,Error,document:{}};
 const code=fs.readFileSync('scripts/r1466-intake-move.js','utf8').replace('window.pb1466IntakeMove={pick,track,prepare,verify,finish,report};','window.pb1466IntakeMove={pick,track,prepare,verify,finish,report,register:(file,meta)=>sources.set(file,meta)};');vm.runInNewContext(code,context);const move=context.window.pb1466IntakeMove;
 const selected=async(name='a.jpg',text='original')=>{const parent=dir('source'),handle=add(parent,name,text),file=await handle.getFile();move.register(file,{dir:parent,handle,name,key:'source/'+name,size:file.size,lastModified:file.lastModified,deleted:false});return {file,handle,parent};};
 const target=(source,name=source.file.name,text=source.handle.text)=>{const dest=dir('order');add(dest,name,text);return{item:{file:source.file},file:{original_name:name},target:{dir:dest}};};
 return{move,selected,target,dir,add,deletions,deny:()=>permission='denied',lock:name=>failure=name};
}
test('only selected source files are removed after full hash verification; unrelated files and folders remain',async()=>{
 const s=setup(),a=await s.selected(),t=s.target(a);s.add(a.parent,'untouched.jpg','other');await s.move.prepare([t]);assert.equal(s.deletions.length,0);await s.move.verify([t]);assert.equal(s.deletions.length,0);const r=await s.move.finish([t]);assert.equal(r.removed,1);assert.equal(r.remaining,0);assert.deepEqual(s.deletions,['source/a.jpg']);assert(a.parent.entries.has('untouched.jpg'));assert(s.dir('order').entries.has('a.jpg'));
});
test('equal byte length is insufficient: a corrupt destination preserves every source in the batch',async()=>{
 const s=setup(),a=await s.selected('a.jpg','abc'),b=await s.selected('b.jpg','def'),targets=[s.target(a),s.target(b,'b.jpg','xyz')];const r=await s.move.finish(targets);assert(r.remaining>0);assert.equal(s.deletions.length,0);assert.equal(s.dir('source').entries.size,2);
});
test('a modified or replaced source is retained even when its size and modification time match',async()=>{
 const s=setup(),a=await s.selected('a.jpg','abc'),t=s.target(a);a.handle.text='xyz';assert.equal((await s.move.finish([t])).removed,0);assert.equal(s.deletions.length,0);
 const q=setup(),b=await q.selected(),u=q.target(b);q.add(b.parent,b.file.name,b.handle.text,'replacement-id');assert.equal((await q.move.finish([u])).removed,0);assert.equal(q.deletions.length,0);
});
test('same source/destination and existing different destination are rejected before writes',async()=>{
 const s=setup(),a=await s.selected(),t=s.target(a);t.target.dir=a.parent;await assert.rejects(s.move.prepare([t]),/یک فایل/);assert.equal(s.deletions.length,0);
 const q=setup(),b=await q.selected(),u=q.target(b,b.file.name,'something else');await assert.rejects(q.move.prepare([u]),/محتوای متفاوت/);assert.equal(q.deletions.length,0);
});
test('a source reused across print groups is removed once only after both copies verify',async()=>{
 const s=setup(),a=await s.selected(),targets=[s.target(a),s.target(a,'a-second-size.jpg')];assert.equal((await s.move.finish(targets)).removed,1);assert.equal(s.deletions.length,1);
});
test('failed deletion remains retryable without touching newly created files at already removed paths',async()=>{
 const s=setup(),a=await s.selected('a.jpg'),b=await s.selected('b.jpg'),targets=[s.target(a),s.target(b)];s.lock('b.jpg');const first=await s.move.finish(targets);assert.equal(first.removed,1);assert.equal(first.remaining,1);s.add(a.parent,'a.jpg','new unrelated download');s.lock('');const second=await s.move.finish(targets);assert.equal(second.remaining,0);assert.equal(a.parent.entries.get('a.jpg').text,'new unrelated download');assert.deepEqual(s.deletions,['source/a.jpg','source/b.jpg']);
});
test('revoked permission or missing destination never deletes a source',async()=>{
 const s=setup(),a=await s.selected(),t=s.target(a);s.deny();assert.equal((await s.move.finish([t])).removed,0);assert.equal(s.deletions.length,0);
 const q=setup(),b=await q.selected(),u=q.target(b);q.dir('order').entries.clear();assert.equal((await q.move.finish([u])).removed,0);assert.equal(q.deletions.length,0);
});
test('actual intake verifies before submit and deletes only after the successful submit response',()=>{
 const s=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');assert(s.includes('/* PB1466 verified move intake */'));const prep=s.indexOf('await window.pb1466IntakeMove.prepare(targets)'),write=s.indexOf('await provider.write(target.dir',prep),verify=s.indexOf('await window.pb1466IntakeMove.verify(targets)',write),submit=s.indexOf("const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit'",verify),finish=s.indexOf('await window.pb1466IntakeMove.finish(targets)',submit);assert(prep>0&&prep<write&&write<verify&&verify<submit&&submit<finish);assert(s.includes('window.pb1466IntakeMove.track(item.existing,item.sourceFile)'));assert(fs.readFileSync('dist/web/index.html','utf8').includes('sourceMove=r1466'));
});
