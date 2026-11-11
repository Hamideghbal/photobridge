'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8'),site='dist/web',native=site+'/lab-desktop-ui';
function section(text,from,to){const a=text.indexOf(from),b=text.indexOf(to,a+from.length);assert(a>=0&&b>a,from+' bounds');return text.slice(a,b)}
test('R1788: native Lab receives active chassis and frame model catalogs, not a frozen old tariff',()=>{
 const web=read(site+'/assets/index-UIRefine-v655-r84.js'),app=read(native+'/assets/index-UIRefine-v655-r84.js');
 for(const src of [web,app]){
  const lab=section(src,'function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)');
  const walkin=section(src,'function Qj(','function Zj(');
  assert(lab.includes('pb1539Create("chassis")')&&lab.includes('pb1539Create("frame")'));
  assert(lab.includes('pb1539Label("chassis","قیمت شاسی")'));
  assert(lab.includes('pb1539Label("frame","قیمت قاب")'));
  assert(lab.includes('k==="chassis"||k==="frame"'),'legacy edit actions remain available');
  assert(lab.includes('pb1788PaletteIcon'),'single frame header palette icon');
  assert(!lab.includes('children:"عکس و رنگ"'),'no full-text palette button above every price');
  assert(!lab.includes('className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1539Types.find'),'no per-size palette actions');
  assert(walkin.includes('pb1777Fields'));
  assert(walkin.includes('pb1777Catalog.types'),'walk-in catalog must include lab-scoped names');
  assert(walkin.includes('pb1788Rename')&&walkin.includes('pb1788Delete'),'walk-in models have rename and delete controls');
  assert(walkin.includes('pb1788WalkinHeader')&&walkin.includes('pb1788PaletteIcon'));
  assert(walkin.includes('pb1540SetError'),'native walk-in API recovery must remain');
  assert(src.includes('function PB1777FrameModelEditor('),'frame model editor must ship on both platforms');
 }
 assert(app.includes('pb1777Create("chassis")')&&app.includes('pb1777Create("frame")'));
});
test('R1788: desktop third header preserves the meaning of each creation action',()=>{
 for(const folder of [site,native]){
  const js=read(folder+'/photobridge-r1372-third-header.js');
  assert(js.includes("raw.includes('قاب')?'قاب جدید'"));
  assert(js.includes("raw.includes('شاسی')?'شاسی جدید'"));
  assert(js.includes("raw.includes('جدید')?'سایز جدید'"));
  assert(js.includes("raw.includes('صحافی')?'صحافی جدید'"));
  const html=read(folder+'/index.html');
  assert(html.includes('frameTariff=r1788'));
  assert(html.includes('photobridge-r1788-frame-tariff.css'));
 }
});
test('R1788: existing default chassis/frame names can change without replacing price IDs',async()=>{
 const api=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')).href);
 const old=api.normalizePrintCatalog();
 const next=api.renamePrintType(api.renamePrintType(old,'chassis','شاسی MDF'),'frame','قاب ساده');
 assert.equal(next.types.find(x=>x.id==='chassis').name,'شاسی MDF');
 assert.equal(next.types.find(x=>x.id==='frame').name,'قاب ساده');
 assert.equal(next.types.find(x=>x.id==='chassis').legacy,true);
 assert.equal(next.types.find(x=>x.id==='frame').legacy,true);
 const again=api.normalizePrintCatalog(next);
 assert.equal(again.types.find(x=>x.id==='chassis').name,'شاسی MDF');
 assert.equal(again.types.find(x=>x.id==='frame').name,'قاب ساده');
 const model=api.addPrintType(again,{kind:'frame',name:'قاب استیل'});
 assert.equal(model.types.find(x=>x.id==='frame').name,'قاب ساده','original rate column survives adding a new model');
});
test('R1788: exact native byte hashes include both new model UI and color styles',()=>{
 const manifest=JSON.parse(read(native+'/manifest.json'));
 assert.equal(manifest.channel,'lab');
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1372-third-header.js','photobridge-r1777-frame-color-picker.css','photobridge-r1788-frame-tariff.css','index.html']){
  const e=manifest.files.find(x=>x.name===name);
  assert(e,'missing native asset '+name);
  assert.equal(e.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex'),'stale hash '+name);
 }
 assert(read(site+'/photobridge-r1788-frame-tariff.css').includes('.pb1788PaletteIcon'));
});
