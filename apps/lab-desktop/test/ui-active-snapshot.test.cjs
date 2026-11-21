'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {updateUi}=require('../ui-update.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'pb1952-native-active-'));
 const directory=path.join(base,'snapshots'),bundled=path.join(base,'bundled');
 const files=[{name:'index.html',body:Buffer.from('<html>R1952 updated lab</html>')},{name:'desktop-overlay.js',body:Buffer.from('/* current overlay */')}];
 const records=files.map(f=>({name:f.name,url:'/lab-desktop-ui/'+f.name,sha256:hash(f.body)}));
 const manifest={protocol:1,channel:'lab',files:records,build:hash(JSON.stringify(records))};
 const target=path.join(directory,manifest.build);
 const values=new Map(),changes=[];
 const store={get:key=>values.get(key),set:(key,value)=>{values.set(key,value);changes.push(key)},transaction:fn=>fn()};
 let requests=0;
 const request=async url=>{
  requests++;
  if(url==='/api/desktop-ui/lab-manifest')return{ok:true,json:async()=>manifest};
  const file=files.find(x=>'/lab-desktop-ui/'+x.name===url);
  if(!file)throw Error('unexpected '+url);
  return {ok:true,headers:{get:()=>null},arrayBuffer:async()=>file.body};
 };
 function writeTarget(){
  fs.mkdirSync(target,{recursive:true});
  for(const f of files)fs.writeFileSync(path.join(target,f.name),f.body);
 }
 return {base,directory,bundled,files,manifest,target,store,values,changes,writeTarget,request,requests:()=>requests,close:()=>fs.rmSync(base,{recursive:true,force:true})};
}
test('R1952: verified downloaded native UI must not report current while active path is stale',async()=>{
 const f=fixture();
 try{
  f.writeTarget();
  const prior=path.join(f.base,'old-ui');fs.mkdirSync(prior);fs.writeFileSync(path.join(prior,'index.html'),'old lab UI');
  f.store.set('uiRoot',prior);f.store.set('uiBuild',f.manifest.build);
  const applied=await updateUi({store:f.store,request:f.request,bundled:f.bundled,directory:f.directory});
  assert.equal(applied,true,'must signal a pending UI activation');
  assert.equal(f.store.get('uiRoot'),f.target);
  assert.equal(f.store.get('uiPreviousRoot'),prior);
  assert(f.store.get('uiLastCheckedAt'));
  assert.equal(f.requests(),1,'all assets already verified; only manifest should be requested');
 }finally{f.close()}
});
test('R1952: missing active root re-points to the verified existing snapshot',async()=>{
 const f=fixture();
 try{
  f.writeTarget();
  f.store.set('uiRoot',path.join(f.base,'deleted-ui'));f.store.set('uiBuild',f.manifest.build);
  assert.equal(await updateUi({store:f.store,request:f.request,bundled:f.bundled,directory:f.directory}),true);
  assert.equal(f.store.get('uiPreviousRoot'),null);
  assert.equal(f.store.get('uiRoot'),f.target);
 }finally{f.close()}
});
test('R1952: truly active verified version is current without unnecessary download',async()=>{
 const f=fixture();
 try{
  f.writeTarget();f.store.set('uiRoot',f.target);f.store.set('uiBuild',f.manifest.build);
  const result=await updateUi({store:f.store,request:f.request,bundled:f.bundled,directory:f.directory});
  assert.equal(result,false);assert.equal(f.requests(),1);
  assert.equal(f.store.get('uiRoot'),f.target);
 }finally{f.close()}
});
test('R1952: a new server build is downloaded atomically and activated through pending state',async()=>{
 const f=fixture();
 try{
  const prior=path.join(f.base,'old-ui');fs.mkdirSync(prior);fs.writeFileSync(path.join(prior,'index.html'),'old');
  f.store.set('uiRoot',prior);f.store.set('uiBuild','older-build');
  assert.equal(await updateUi({store:f.store,request:f.request,bundled:f.bundled,directory:f.directory}),true);
  assert.equal(f.store.get('uiRoot'),f.target);assert.equal(f.store.get('uiPreviousRoot'),prior);
  assert.equal(fs.readFileSync(path.join(f.target,'index.html'),'utf8'),'<html>R1952 updated lab</html>');
  assert.equal(fs.existsSync(f.target+'.partial'),false);
 }finally{f.close()}
});
