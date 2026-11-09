'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const code=fs.readFileSync('scripts/r1395-storage-panel.js','utf8');
const marker='.photobridge-folder-id.json';
function context(){
 const c={crypto};vm.createContext(c);vm.runInContext(code,c);return c;
}
test('native ENOENT lstat of deleted JSON: status does not create but explicit reselect does',async()=>{
 const c=context();let content=null,created=0;
 const root={name:'Photos',displayPath:'E:\\Photos',async getFileHandle(name,options={}){
  assert.equal(name,marker);
  if(content===null&&!options.create)throw Error("ENOENT: no such file or directory, lstat 'E:\\Photos\\"+marker+"'");
  if(options.create)created++;
  return {async createWritable(){return {async write(value){content=String(value)},async close(){},async abort(){}}},async getFile(){return {size:Buffer.byteLength(content||''),text:async()=>content}}};
 }};
 await assert.rejects(c.pb1395FolderId(root),/ENOENT/);
 assert.equal(created,0,'read-only refresh must not create identity files');
 const id=await c.pb1395FolderId(root,true);
 assert.match(id,/^[0-9a-f-]{36}$/i);
 assert.equal(created,1);
 assert.equal(await c.pb1395FolderId(root,true),id);
 assert.equal(created,1,'existing identity must not change on another selection');
 let saved=false;
 c.window={pbNativeFolder:{announce:async()=>({pairSupport:true}),choose:async()=>root}};
 c.Vs=async()=>true;c.Uc=()=>{};
 c.Me=async(_url,options)=>{const p=JSON.parse(options.body);assert.equal(p.pairFolderId,id);assert.equal(p.kind,'native');return {paired:true,isThisDevice:true,folderId:id}};
 c.Oy=async selected=>{assert.equal(selected,root);saved=true};
 assert.equal((await c.pb1395Choose()).state.folderId,id);
 assert(saved,'new selected root persisted only after confirmed server identity');
});
test('a missing old marker never silently changes the old folder or erases an order',async()=>{
 const c=context();
 const error=Error("ENOENT: no such file or directory, lstat 'E:\\Photos\\"+marker+"'");
 assert(c.pb1395MissingMarker(error));
 let changed=false;
 const root={getFileHandle:async(_name,opts)=>{if(opts?.create)changed=true;throw error}};
 await assert.rejects(c.pb1395FolderId(root,false),/ENOENT/);
 assert.equal(changed,false);
 for(const bad of [
  Object.assign(Error('permission denied'),{code:'EACCES'}),
  Error("ENOENT: no such file or directory, lstat 'E:\\Photos\\photo.jpg'")
 ]){changed=false;const handle={getFileHandle:async(_name,opts)=>{if(opts?.create)changed=true;throw bad}};
  await assert.rejects(c.pb1395FolderId(handle,true));assert.equal(changed,false);
 }
 let written=false;
 const malformed={async getFileHandle(){return {async getFile(){return {size:2,text:async()=>'{}'}},async createWritable(){written=true;throw Error('unexpected overwrite')}}}};
 await assert.rejects(c.pb1395FolderId(malformed,true),/شناسه پوشه معتبر نیست/);
 assert.equal(written,false,'invalid existing identity is never replaced without confirmation');
});
test('web + Windows final UI has deleted-marker recovery and current cache key',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(ui.includes('function pb1395MissingMarker(err){'));
  assert(ui.includes("if(!create||!pb1395MissingMarker(err))throw err"));
  assert(ui.includes("read:async()=>{const current=await qs().catch(err=>{if(pb1395MissingMarker(err))return null;throw err})"));
  assert(fs.readFileSync(root+'/index.html','utf8').includes('storageMarker=r1725'));
 }
 const m=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const root='dist/web/lab-desktop-ui/';
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js'])
  assert.equal(m.files.find(row=>row.name===name).sha256,hash(fs.readFileSync(root+name)));
 assert.equal(m.build,hash(JSON.stringify(m.files)));
});
