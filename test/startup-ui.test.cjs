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
