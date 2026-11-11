'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
function exported(){
 const source=read('scripts/r1450-download-workflow.js'),a=source.indexOf('function pb1778IsSelected('),b=source.indexOf('function pb1450Meta(',a);
 assert(a>=0&&b>a,'the active download filename function must carry exact model labels');
 const context={Ya:(input)=>String(input).replace(/[^A-Za-z0-9._ -]/g,'-').replace(/\s*=\s*/g,'-'),pb1769OrderFirst:o=>o?.fresh!==false};
 vm.createContext(context);vm.runInContext(source.slice(a,b),context);return context;
}
test('R1778: actual selected model names and frame color appear before extension',()=>{
 const fn=exported().pb1769DownloadName,order={fresh:true};
 const result=(file)=>fn(file,file.original_name,order);
 assert.equal(result({original_name:'photo.jpg',print_copies:1}),'photo.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,chassis:true}),'photo = شاسی.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,frame:true}),'photo = قاب.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,chassis:true,chassis_model_name:'شاسی 4000'}),'photo = شاسی 4000.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,chassis:true,chassis_model_name:'شاسی 8000'}),'photo = شاسی 8000.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,frame:true,frame_model_name:'قاب کلاسیک',frame_color_name:'طلایی'}),'photo = قاب کلاسیک طلایی.jpg');
 const both={original_name:'photo.jpg',print_copies:3,chassis:true,frame:true,chassis_model_name:'شاسی 4000',frame_model_name:'قاب چوبی',frame_color_name:'گردویی'};
 assert.equal(result(both),'photo = 3 = شاسی 4000 = قاب چوبی گردویی.jpg');
 assert.equal(result({...both,original_name:result(both)}),result(both));
 assert.equal(result({...both,original_name:'photo.png',print_copies:2}),'photo = 2 = شاسی 4000 = قاب چوبی گردویی.png');
 assert.equal(result({...both,frame_model_name:'قاب/مشکی:مدل'}),'photo = 3 = شاسی 4000 = قاب مشکی مدل گردویی.jpg');
});
test('R1778: downloaded older orders preserve original paths',()=>{
 const fn=exported().pb1769DownloadName,old={fresh:false};
 assert.equal(fn({original_name:'photo.jpg',print_copies:1,chassis:true},'photo.jpg',old),'photo.jpg');
 assert.equal(fn({original_name:'photo = 3.jpg',print_copies:3,chassis:true,frame:true},'photo = 3.jpg',old),'photo - 3.jpg');
});
test('R1778: Lab web and Windows display selected model labels in detail and upload views',()=>{
 const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const path=root+'/assets/index-UIRefine-v655-r84.js',code=read(path);
  assert.doesNotThrow(()=>new vm.Script(code),root);
  assert(code.includes('/* PB1778 CHASSIS FRAME FILE MARKERS */'),root+' marker');
  assert.equal(code.split('title:le.original_name,children:pb1778DisplayName(le)').length-1,2,root+' Lab names');
  assert.equal(code.split('pb1778SelectedName(Be.file.name,pbPrintCopies(Be),Wr(ue,Be,"chassis"),Wr(ue,Be,"frame"),Be.chassisModelName||ue.chassisModelName,Be.frameModelName||ue.frameModelName,Be.frameColorName||ue.frameColorName)').length-1,3,root+' photographer names');
  assert(read(root+'/index.html').includes('&addonNames=r1778'));
  if(root.includes('desktop-ui')){
   const m=JSON.parse(read(root+'/manifest.json'));
   assert.equal(m.build,hash(Buffer.from(JSON.stringify(m.files))));
   for(const name of ['index.html','assets/index-UIRefine-v655-r84.js'])
    assert.equal(m.files.find(v=>v.name===name)?.sha256,hash(read(root+'/'+name)));
  }
 }
});
test('R1778: build keeps filename markers after catalog and Windows UI changes',()=>{
 const src=read('scripts/liara-fast-build.mjs');
 assert(src.indexOf("enable-r1778-photo-addon-filename-markers.mjs")>src.indexOf("enable-r1777-chassis-frame-model-pricing.mjs"));
 assert(src.includes('scripts/test-r1778-photo-filename-markers.cjs'));
});
