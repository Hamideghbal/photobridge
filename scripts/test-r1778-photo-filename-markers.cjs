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
 const context={
  ii:raw=>String(raw||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))),
  pb1769OrderFirst:o=>o?.fresh!==false
 };
 vm.createContext(context);
 // Test against the actual legacy PhotoBridge Persian->Latin romanizer.
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
 const ly=ui.indexOf('const Ly='),end=ui.indexOf('function Ic(',ly);
 assert(ly>=0&&end>ly&&end-ly<3000,'bundled romanizer is available');
 vm.runInContext(ui.slice(ly,end),context);
 vm.runInContext(source.slice(a,b),context);
 return context;
}
test('R1780: actual selected model names, colors and original photo names become Latin',()=>{
 const ctx=exported(),fn=ctx.pb1769DownloadName,order={fresh:true};
 const result=(file)=>fn(file,file.original_name,order);
 assert.equal(result({original_name:'photo.jpg',print_copies:1}),'photo.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,chassis:true}),'photo = Shasi.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,frame:true}),'photo = Ghab.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,chassis:true,chassis_model_name:'شاسی 4000'}),'photo = Shasi 4000.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,chassis:true,chassis_model_name:'شاسی 8000'}),'photo = Shasi 8000.jpg');
 assert.equal(result({original_name:'photo.jpg',print_copies:1,frame:true,frame_model_name:'قاب کلاسیک',frame_color_name:'طلایی'}),'photo = Ghab Classic Talaei.jpg');
 const both={original_name:'photo.jpg',print_copies:3,chassis:true,frame:true,chassis_model_name:'شاسی 4000',frame_model_name:'قاب چوبی',frame_color_name:'گردویی'};
 assert.equal(result(both),'photo = 3 = Shasi 4000 = Ghab Choobi Gerdooyi.jpg');
 assert.equal(result({...both,original_name:result(both)}),result(both));
 const snapshot={original_name:'example.jpg',print_copies:2,chassis:true,frame:true,addon_selection:{chassis:{modelId:'chassis-1',name:'شاسی 8000'},frame:{modelId:'frame-2',name:'قاب کلاسیک',colorId:'brown',colorName:'گردویی'}}};
 assert.equal(result(snapshot),'example = 2 = Shasi 8000 = Ghab Classic Gerdooyi.jpg');
 assert.equal(result({...snapshot,original_name:result(snapshot)}),result(snapshot));
 assert.equal(result({...both,original_name:'photo.png',print_copies:2}),'photo = 2 = Shasi 4000 = Ghab Choobi Gerdooyi.png');
 assert.equal(result({...both,frame_model_name:'قاب/مشکی:مدل'}),'photo = 3 = Shasi 4000 = Ghab Meshki Model Gerdooyi.jpg');
 const persianOriginal=result({...both,original_name:'عکس شماره ۱.jpg'});
 assert.match(persianOriginal,/\.jpg$/);
 assert.match(persianOriginal,/Shasi 4000 = Ghab Choobi Gerdooyi/);
 assert.doesNotMatch(persianOriginal,/[^\x20-\x7e]/,'downloaded filename must be ASCII');
 assert.equal(ctx.pb1780Latin('شاسی ۴۰۰۰'), 'Shasi 4000');
 assert.equal(ctx.pb1780Latin('قاب کلاسیک طلایی'), 'Ghab Classic Talaei');
});
test('R1780: name preview for photographer and lab is Latin too',()=>{
 const ctx=exported();
 const code=read('scripts/enable-r1778-photo-addon-filename-markers.mjs');
 const a=code.indexOf('function pb1778SelectedName('),b=code.indexOf('const helper=',a);
 assert(a>0&&b>a);
 vm.runInContext(code.slice(a,b),ctx);
 const result=ctx.pb1778SelectedName('عکس.jpg',2,true,true,'شاسی 4000','قاب کلاسیک','طلایی');
 assert.doesNotMatch(result,/[^\x20-\x7e]/);
 assert.match(result,/ = 2 = Shasi 4000 = Ghab Classic Talaei\.jpg$/);
 assert.equal(ctx.pb1778SelectedName('photo.jpg',1,false,false),'photo.jpg');
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
  assert(code.includes('file?.addon_selection?.frame?.name'),'Lab should use immutable order model snapshot');
  assert(code.includes("pb1778Latin(stem,'photo')"),'all displayed filenames must be Latin');
  assert(code.includes('function pb1778Latin('),'preview must not override the verified download romanizer');
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
