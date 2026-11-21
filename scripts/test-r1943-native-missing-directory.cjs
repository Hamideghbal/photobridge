'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
const a=source.indexOf('function pb1936SafePart(part) {'),b=source.indexOf('async function pb1936CanonicalDir(',a);
if(a<0||b<=a)throw Error('R1943 folder repair source changed');
const context={pb1550Encode:handle=>({native:true,rootId:handle.rootId,parts:[...handle.parts]})};
vm.createContext(context);
vm.runInContext(source.slice(a,b)+'\nthis.repair=pb1936RecreateNativeDir;',context);
function fixture(){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'pb1943-native-'));
 const root=path.join(parent,'verified'),outside=path.join(parent,'outside');
 fs.mkdirSync(root);fs.mkdirSync(outside);
 const calls=[];
 function nativeHandle(parts=[]){
   return{__pbNative:true,rootId:'pinned-device-root',parts,
     async getDirectoryHandle(name,{create=false}={}){
       const parentDir=path.join(root,...parts);
       // Emulate an installed native resolver: an absent *parent* cannot be
       // recovered by asking it to create the entire nested target at once.
       const st=fs.lstatSync(parentDir);
       if(st.isSymbolicLink()||!st.isDirectory())throw Error('unsafe_parent');
       const dest=path.join(parentDir,name);
       if(!fs.existsSync(dest)){
         if(!create)throw Object.assign(Error('ENOENT'),{code:'ENOENT'});
         fs.mkdirSync(dest,{recursive:false});
         calls.push([...parts,name].join('/'));
       }
       if(fs.lstatSync(dest).isSymbolicLink()||!fs.statSync(dest).isDirectory())throw Error('unsafe_child');
       return nativeHandle([...parts,name]);
     }
   };
 }
 return {parent,root,outside,handle:nativeHandle,calls,cleanup:()=>fs.rmSync(parent,{recursive:true,force:true})};
}
test('R1943: recover several removed nested directories with strict one-level-at-a-time native resolver',async()=>{
 const f=fixture();try{
  const saved={native:true,rootId:'pinned-device-root',parts:['hmkaran','1405-08-30','platform-admin','10-15-luster-order-955']};
  const result=await context.repair(f.handle(),saved);
  assert.equal(result.parts.join('/'),saved.parts.join('/'));
  assert.deepEqual(f.calls,[
    'hmkaran',
    'hmkaran/1405-08-30',
    'hmkaran/1405-08-30/platform-admin',
    'hmkaran/1405-08-30/platform-admin/10-15-luster-order-955'
  ]);
  assert(fs.statSync(path.join(f.root,...saved.parts)).isDirectory());
  assert.deepEqual(fs.readdirSync(f.outside),[]);
 }finally{f.cleanup()}
});
test('R1943: existing child files are untouched during explicit folder recovery',async()=>{
 const f=fixture();try{
  fs.mkdirSync(path.join(f.root,'Hamkar'));
  fs.mkdirSync(path.join(f.root,'Hamkar','1405-08-30'));
  const photo=path.join(f.root,'Hamkar','1405-08-30','proof.jpg');
  fs.writeFileSync(photo,Buffer.from('original-bytes'));
  const saved={native:true,rootId:'pinned-device-root',parts:['Hamkar','1405-08-30','studio','order-955']};
  await context.repair(f.handle(),saved);
  assert.equal(fs.readFileSync(photo,'utf8'),'original-bytes');
  assert.deepEqual(f.calls,['Hamkar/1405-08-30/studio','Hamkar/1405-08-30/studio/order-955']);
 }finally{f.cleanup()}
});
test('R1943: mismatched root or unsafe directory components never create files',async()=>{
 const f=fixture();try{
  for(const bad of [
   {native:true,rootId:'different-root',parts:['Hamkar','date']},
   {native:true,rootId:'pinned-device-root',parts:['..','outside']},
   {native:true,rootId:'pinned-device-root',parts:['Hamkar','..','outside']},
   {native:true,rootId:'pinned-device-root',parts:['Hamkar','NUL']}
  ])await assert.rejects(context.repair(f.handle(),bad));
  assert.deepEqual(fs.readdirSync(f.root),[]);
  assert.deepEqual(fs.readdirSync(f.outside),[]);
 }finally{f.cleanup()}
});
