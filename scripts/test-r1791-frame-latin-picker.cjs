'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const read=p=>fs.readFileSync(p,'utf8');
test('R1791: original default frame has editable image/palette and retains Latin filename label',async()=>{
 const api=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')).href);
 const png='data:image/png;base64,'+Buffer.from([137,80,78,71,13,10,26,10,1,1]).toString('base64');
 let catalog=api.normalizePrintCatalog();
 catalog=api.setPrintFrameImage(catalog,'frame',png);
 catalog=api.setPrintFrameColors(catalog,'frame',[{id:'gold',name:'طلایی',hex:'#AABBCC',available:true}]);
 catalog=api.renamePrintType(catalog,'frame','قاب پایه','Base Frame 2026');
 catalog=api.renamePrintType(catalog,'chassis','شاسی اصلی','Main Board');
 catalog=api.addPrintType(catalog,{kind:'frame',name:'قاب جدید',latinName:'Luxury Wood'});
 let restored=api.normalizePrintCatalog(catalog);
 const frame=restored.types.find(t=>t.id==='frame'),chassis=restored.types.find(t=>t.id==='chassis');
 assert.equal(frame.imageData,png);
 assert.equal(frame.colors[0].name,'طلایی');
 assert.equal(frame.latinName,'Base Frame 2026');
 assert.equal(chassis.latinName,'Main Board');
 assert.equal(restored.types.find(t=>t.name==='قاب جدید').latinName,'Luxury Wood');
 restored=api.renamePrintType(restored,'frame','نام تازه');
 assert.equal(restored.types.find(t=>t.id==='frame').latinName,'Base Frame 2026','rename without Latin argument preserves override');
 restored=api.renamePrintType(restored,'frame','نام تازه','');
 assert.equal(api.normalizePrintCatalog(restored).types.find(t=>t.id==='frame').latinName,undefined,'empty Latin field restores automatic transliteration');
 assert.throws(()=>api.renamePrintType(restored,'frame','نام تازه','../unsafe/file'),/print_catalog_invalid_latin_name/);
 assert.throws(()=>api.addPrintType(restored,{kind:'chassis',name:'بد',latinName:'فارسی'}),/print_catalog_invalid_latin_name/);
});
test('R1791: uploaded models snapshot lab-trusted Latin names and never trust user labels',async()=>{
 const {normalizePrintCatalog,renamePrintType}=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')).href);
 const {snapshotPrintAddons}=await import(pathToFileURL(path.resolve('dist/api/print-addon-selection.js')).href);
 let catalog=normalizePrintCatalog();
 catalog=renamePrintType(catalog,'chassis','شاسی ۴۰۰۰','Board 4000');
 catalog=renamePrintType(catalog,'frame','قاب کلاسیک','Classic Frame');
 const snap=snapshotPrintAddons(catalog,{chassis:true,frame:true,chassisModelId:'chassis',frameModelId:'frame',latinName:'Client Forgery'},{sizeId:'s1',audience:'colleague'});
 assert.equal(snap.chassis.latinName,'Board 4000');
 assert.equal(snap.frame.latinName,'Classic Frame');
 assert.equal(snap.frame.name,'قاب کلاسیک');
 assert(!JSON.stringify(snap).includes('Client Forgery'));
 catalog=renamePrintType(catalog,'frame','نام بعدی','Changed Frame');
 assert.equal(snap.frame.latinName,'Classic Frame','existing orders keep immutable Latin name');
});
test('R1791: real lab downloaded filenames prefer saved Latin names and keep older fallback',()=>{
 const src=read('scripts/r1450-download-workflow.js');
 const a=src.indexOf('function pb1780Latin('),b=src.indexOf('function pb1450Meta(',a);
 assert(a>=0&&b>a);
 const ctx={Ya:s=>String(s),pb1769OrderFirst:()=>true,Tf:()=>''};
 vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
 const file={original_name:'photo.jpg',chassis:true,frame:true,print_copies:2,addon_selection:{chassis:{name:'شاسی ۴۰۰۰',latinName:'Board 4000'},frame:{name:'قاب کلاسیک',latinName:'Luxury Frame',colorName:'طلایی'}}};
 assert.equal(ctx.pb1769DownloadName(file,'photo.jpg',{}),'photo = 2 = Board 4000 = Luxury Frame Talaei.jpg');
 const old={...file,addon_selection:{chassis:{name:'شاسی ۴۰۰۰'},frame:{name:'قاب کلاسیک',colorName:'طلایی'}}};
 assert(ctx.pb1769DownloadName(old,'photo.jpg',{}).includes('Ghab Classic Talaei'),'without Latin override keep automatic Persian romanization');
 const oldOrder={...file};
 ctx.pb1769OrderFirst=()=>false;
 assert.equal(ctx.pb1769DownloadName(oldOrder,'photo.jpg',{}),'photo.jpg','old local archive files not renamed retroactively');
});
test('R1791: photographer and walk-in model dialogs on both site/native; default frame photo control is accessible',()=>{
 const framePicker=read('scripts/r1777-frame-model-editor.js.txt');
 assert(framePicker.includes('className:"pb1791ColorCircle"'));
 assert(!framePicker.includes('className:"pb1777Swatch"'),'duplicate nonclickable circle removed');
 assert(framePicker.includes('active.slice(page*6,page*6+6)'),'picker is paginated instead of vertically scrolling');
 const css=read('dist/web/photobridge-r1791-model-names-frame-picker.css');
 assert(css.includes('input.pb1791ColorCircle')&&css.includes('::-webkit-color-swatch'));
 assert(css.includes('.pb1777ChoiceModels')&&css.includes('overflow:visible'));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/assets/index-UIRefine-v655-r84.js');
  const a=js.indexOf('function tw({data:t,onSaved:a,labName:s=""}){'),b=js.indexOf('function Na(t)',a);
  const c=js.indexOf('function Qj('),d=js.indexOf('function Zj(',c);
  assert(a>=0&&b>a&&c>=0&&d>c);
  const t=js.slice(a,b),w=js.slice(c,d);
  assert(t.includes('pb1791NameModel')&&t.includes('PB1791ModelNameDialog'));
  assert(w.includes('pb1791NameModel')&&w.includes('PB1791ModelNameDialog'));
  assert(t.includes('k==="frame"?"frame":k.slice(7)'),'default frame opens the same image editor as custom frames');
  assert(w.includes('k==="frame"?"frame":k.slice(7)'),'walk-in default frame editor');
  assert(js.includes('function PB1791ModelNameDialog('));
  assert(js.includes('pb1791ModelPages'));
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1791-model-names-frame-picker.css'));
  assert(html.includes('frameLatin=r1791'));
 }
});
test('R1791: each original and custom stock column directly follows its model price',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/assets/index-UIRefine-v655-r84.js');
  const s=js.slice(js.indexOf('function tw({data:t,onSaved:a,labName:s=""}){'),js.indexOf('function Na(t)'));
  const h=s.slice(s.indexOf('const h='),s.indexOf(',S=async',s.indexOf('const h=')));
  // Original models must have their stock BEFORE any custom model of that kind.
  assert(h.includes('["chassis",pb1539Label("chassis","قیمت شاسی")],["chassis_stock","موجودی شاسی"],'));
  assert(h.includes('["frame",pb1539Label("frame","قیمت قاب")],["frame_stock","موجودی قاب"],'));
  assert(h.includes('["pb1539_"+t.id,t.name],["pb1789_stock_"+t.id,"موجودی "+t.name]'));
  const q=js.slice(js.indexOf('function Qj('),js.indexOf('function Zj('));
  assert(q.includes('["pb1539_"+v.id,v.name],["pb1789_stock_"+v.id,"موجودی "+v.name]'));
 }
});
test('R1791: native Lab UI manifest has correct SHA-256 and content hash',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 assert.equal(manifest.channel,'lab');
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1791-model-names-frame-picker.css']){
  const item=manifest.files.find(i=>i.name===name);
  assert(item,'missing '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
