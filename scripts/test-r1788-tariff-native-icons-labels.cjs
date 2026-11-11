'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const src=p=>fs.readFileSync(p,'utf8');
const roots=['dist/web','dist/web/lab-desktop-ui'];
const uiFile='assets/index-UIRefine-v655-r84.js';
const tar=(ui,start,end)=>{const a=ui.indexOf(start),b=ui.indexOf(end,a+start.length);assert(a>=0&&b>a,start+' region exists');return ui.slice(a,b)};

for(const root of roots){
 test('R1788 '+root+': chassis/frame native tariffs and correct buttons',()=>{
  const ui=src(root+'/'+uiFile);
  const prices=tar(ui,'function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)');
  const walkin=tar(ui,'function Qj(','function Zj(');
  const nav=src(root+'/photobridge-r1372-third-header.js');
  assert(prices.includes('pb1539Create("chassis")'));
  assert(prices.includes('pb1539Create("frame")'));
  assert(prices.includes('["chassis",pb1539Label("chassis","قیمت شاسی")]'));
  assert(prices.includes('["frame",pb1539Label("frame","قیمت قاب")]'));
  assert(prices.includes('k==="chassis"||k==="frame"'));
  assert(prices.includes('C==="chassis"||C==="frame"'));
  assert(walkin.includes('pb1777Fields')&&walkin.includes('pb1777Rename')===false);
  assert(walkin.includes('pb1788Rename')&&walkin.includes('pb1788Delete'));
  assert(walkin.includes('pb1777Catalog.types?.find(t=>t.id===field[0])?.name'));
  assert(walkin.includes('pb1777FrameEditLaunch'));
  assert(ui.includes('function PB1777FrameModelEditor('));
  assert(!prices.includes('C.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===C.slice(7))?.kind==="frame"'),'image settings must not repeat in every size row');
  assert(nav.includes("raw.includes('شاسی')&&raw.includes('جدید')?'شاسی جدید'"));
  assert(nav.includes("raw.includes('قاب')&&raw.includes('جدید')?'قاب جدید'"));
  assert(nav.includes("raw.includes('جدید')?'سایز جدید'"));
  const html=src(root+'/index.html');
  assert(html.includes('photobridge-r1788-tariff-actions.css'));
  assert(html.includes('tariffPolish=r1788'));
 });
}
test('R1788: Windows updater includes integrity hashes for complete tariff UI',()=>{
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(src(root+'/manifest.json'));
 assert.equal(manifest.channel,'lab');
 for(const name of [uiFile,'photobridge-r1372-third-header.js','photobridge-r1788-tariff-actions.css','index.html']){
  const item=manifest.files.find(f=>f.name===name);
  assert(item,'native manifest missing '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert(src(root+'/photobridge-r1777-frame-color-picker.css').includes('pb1777FrameEditLaunch'));
});
test('R1788: model action icons are grouped and accessible',()=>{
 const css=src('dist/web/photobridge-r1788-tariff-actions.css');
 assert(css.includes('.pb1541TariffActions'));
 assert(css.includes('.pb1777FrameEditLaunch svg'));
 for(const root of roots){
  const s=src(root+'/'+uiFile);
  assert(s.includes('"aria-label":"ویرایش عکس و رنگ قاب"'));
  assert(s.includes('className:"pb1541TariffActions"'));
  assert(s.includes('className:"pb1540BindingDelete"'));
 }
});
