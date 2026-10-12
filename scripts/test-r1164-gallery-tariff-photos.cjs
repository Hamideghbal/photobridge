const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1153-gallery-manager.css','utf8');
const headerCss=fs.readFileSync('dist/web/photobridge-r1124-photographer-desktop-header.css','utf8');
const headerJs=fs.readFileSync('dist/web/photobridge-r1163-desktop-gallery-header.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const modal=ui.slice(ui.indexOf('function V0({'),ui.indexOf('function W0(){'));
const manager=ui.slice(ui.indexOf('function G0({'),ui.indexOf('function q0({'));
test('gallery tariff overlay sits above the desktop photographer fixed header',()=>{
 assert.match(css,/html body>\.globalModalLayer\.modalBack:has\(\.clientGalleryTariffTableModal\)/);
 assert.match(css,/z-index:2147483600!important/);
 assert.match(css,/z-index:2147483601!important/);
 assert.match(css,/height:min\(800px,calc\(100dvh - 40px\)\)!important/);
 assert.match(css,/align-items:center!important;justify-content:center!important/);
 assert.match(html,/photobridge-r1153-gallery-manager\.css\?v=r1164/);
});
test('digital file price is inside print tariff modal and persisted through its save flow',()=>{
 assert(modal.startsWith('function V0('));
 assert.match(modal,/digitalPrice:PBdigitalPrice,onDigitalPriceChange:PBsetDigitalPrice/);
 assert.match(modal,/className:"pb1164TariffDigitalPrice"/);
 assert(modal.indexOf('pb1164TariffDigitalPrice')<modal.indexOf('clientGalleryTariffTableScroller'));
 assert.match(modal,/value:Bn\(PBdigitalPrice\)/);
 assert.match(modal,/onChange:C=>PBsetDigitalPrice\(String\(Mn\(C.target.value\)\|\|""\)\)/);
 assert.match(manager,/digitalPrice:c.digitalPrice,onDigitalPriceChange:price=>m\(\{\.\.\.c,digitalPrice:price\}\)/);
 const save=manager.indexOf('Se=async()=>');
 const put=manager.indexOf('/print-tariffs',save);
 const patch=manager.indexOf('method:"PATCH",body:JSON.stringify({digitalPrice:Number(c.digitalPrice||0)})',put);
 const close=manager.indexOf('h(!1),await o()',patch);
 assert(save>=0&&put>save&&patch>put&&close>patch,'price updates before closing modal');
 const settings=manager.slice(manager.indexOf('className:"card clientGallerySettings"'),manager.indexOf('className:"card clientGalleryOrderWorkflow"'));
 assert(!settings.includes('children:["قیمت فایل دیجیتال "'),'standalone digital price field is removed');
 assert(modal.includes('قیمت فایل دیجیتال'),'tariff editor owns the digital price field');
});
test('invoice display checkbox sits immediately ahead of customer print tariff launcher',()=>{
 const settings=manager.slice(manager.indexOf('className:"card clientGallerySettings"'),manager.indexOf('className:"card clientGalleryOrderWorkflow"'));
 const toggle=settings.indexOf('className:"clientGalleryOrderingToggle ');
 const launcher=settings.indexOf('className:"clientGalleryTariffLauncher"');
 const message=settings.indexOf('children:["پیام مشتری"');
 assert(message>=0&&toggle>message&&launcher>toggle);
 assert(launcher-toggle<950,'no unrelated fields between invoice and tariff controls');
});
test('both gallery entry points accept only photos and show photo-only wording',()=>{
 const create=ui.slice(ui.indexOf('className:"pb1112CreateMedia"'),ui.indexOf('className:"pb1112CreateMedia"')+950);
 const managerMedia=manager.slice(manager.indexOf('className:"card clientGalleryMediaPanel"'),manager.indexOf('className:"card clientGalleryMediaPanel"')+1500);
 for(const part of [create,managerMedia]){
   assert(part.includes('＋ افزودن عکس'));
   assert(part.includes('accept:"image/jpeg,image/png,image/webp"'));
   assert(!part.includes('video/mp4'));
 }
 assert(managerMedia.includes('children:"عکس‌ها"'));
 assert(!managerMedia.includes('عکس‌ها و ویدیوها'));
 assert(!ui.includes('＋ افزودن عکس / ویدیو'));
 assert(!ui.includes('＋ افزودن ویدیو'));
 assert(manager.includes('گالری فقط برای عکس است'));
});
test('desktop gallery photo totals render circular badges and store-style transition',()=>{
 assert(headerJs.includes("className='pb1164TabLabel'"));
 assert(headerJs.includes("className='pb1164TabCount'"));
 assert(headerJs.includes("className='pb1164MovingIndicator'"));
 assert(headerJs.includes("const position='translateX('+offset+')'"));
 assert(headerJs.includes("duration:260,easing:'cubic-bezier(.2,.8,.2,1)'"));
 assert(headerJs.includes("duration:240,easing:'cubic-bezier(.2,.8,.2,1)'"));
 assert(headerJs.includes("prefers-reduced-motion: reduce"));
 assert.match(headerCss,/\.pb1164TabCount\{/);
 assert.match(headerCss,/border-radius:50%!important/);
 assert.match(headerCss,/\.pb1164MovingIndicator\{/);
 assert.match(headerCss,/transition:transform \.28s cubic-bezier/);
 assert.match(html,/photobridge-r1124-photographer-desktop-header\.css\?v=r1164/);
 assert.match(html,/photobridge-r1163-desktop-gallery-header\.js\?v=r1164/);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1159&cards=r1164/);
});
