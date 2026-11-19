'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os'),crypto=require('node:crypto');
const {adoptEmbeddedUi}=require('../startup-ui.cjs');
const memory=entries=>{const values=new Map(entries);return{get:key=>values.get(key),set:(key,value)=>values.set(key,value),transaction:fn=>fn()};};
test('new native version starts with the verified full installer UI, preserving older UI and business data',()=>{
 const bundled=path.join(__dirname,'../verified-ui'),store=memory([['uiRoot','older-ui'],['uiBuild','older-build'],['business-sentinel',{balance:600}]]);
 assert(adoptEmbeddedUi({store,bundled,version:'1.0.73'}));assert.equal(store.get('uiRoot'),bundled);assert.equal(store.get('uiPreviousRoot'),'older-ui');assert.equal(store.get('uiPreviousBuild'),'older-build');assert.deepEqual(store.get('business-sentinel'),{balance:600});
 store.set('uiRoot','newer-downloaded-ui');store.set('uiBuild','newer-build');
 assert.equal(adoptEmbeddedUi({store,bundled,version:'1.0.73',validate:()=>{throw Error('must not reset on restart')}}),false);assert.equal(store.get('uiRoot'),'newer-downloaded-ui');
 const source=fs.readFileSync(path.join(__dirname,'../main.cjs'),'utf8');assert(source.indexOf('await applyUi(true);')<source.indexOf('void updateUi(false);'));assert(!source.includes('await updateUi(true);await applyUi(true)'));
});
test('tampered embedded UI cannot be activated or alter the stored UI selection',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-embedded-')),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),files=['index.html','desktop-overlay.js'].map(name=>({name,url:'/lab-desktop-ui/'+name,sha256:hash('original')}));
 try{for(const file of files)fs.writeFileSync(path.join(root,file.name),'tampered');fs.writeFileSync(path.join(root,'.pb-lab-bundle-manifest.json'),JSON.stringify({protocol:1,channel:'lab',files,build:hash(JSON.stringify(files))}));const store=memory([['uiRoot','keep-current']]);assert.throws(()=>adoptEmbeddedUi({store,bundled:root,version:'1.0.73',validate:()=>{}}),/embedded_ui_integrity_failed/);assert.equal(store.get('uiRoot'),'keep-current');assert.equal(store.get('uiEmbeddedForNativeVersion'),undefined);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('LAB104 same-version reinstall activates a NEW bundle build instead of keeping the old 45s UI worker',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-lab104-reinstall-'));
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 const writeBundle=rev=>{
  const files=['index.html','desktop-overlay.js'].map(name=>{
   const contents=name==='index.html'?'<html>'+rev+'</html>':'window.rev="'+rev+'"';
   fs.writeFileSync(path.join(root,name),contents);
   return {name,url:'/lab-desktop-ui/'+name,sha256:hash(contents)};
  });
  const build=hash(JSON.stringify(files));
  fs.writeFileSync(path.join(root,'.pb-lab-bundle-manifest.json'),JSON.stringify({protocol:1,channel:'lab',files,build}));
  return build;
 };
 try{
  const first=writeBundle('old-45-second-worker'),store=memory([['uiRoot','stale-per-user-ui'],['uiBuild','stale']]);
  assert(adoptEmbeddedUi({store,bundled:root,version:'1.0.104',validate:()=>{}}));
  assert.equal(store.get('uiBuild'),first);
  assert.equal(store.get('uiEmbeddedForNativeBuild'),first);
  assert.equal(adoptEmbeddedUi({store,bundled:root,version:'1.0.104',validate:()=>{throw Error('same build should not repeat validation')}}),false);
  const next=writeBundle('new-notification-immediate-worker');
  assert.notEqual(first,next);
  assert.equal(store.get('uiEmbeddedForNativeVersion'),'1.0.104','version stays unchanged across test installers');
  assert(adoptEmbeddedUi({store,bundled:root,version:'1.0.104',validate:()=>{}}));
  assert.equal(store.get('uiBuild'),next,'changed build must be activated even though native version is identical');
  assert.equal(store.get('uiRoot'),root);
  assert.equal(store.get('uiEmbeddedForNativeBuild'),next);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
