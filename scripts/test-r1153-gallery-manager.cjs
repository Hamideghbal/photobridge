const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1153-gallery-manager.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
function segment(start,end){const a=ui.indexOf(start),b=ui.indexOf(end,a+start.length);assert(a>=0&&b>a,`Cannot find gallery section: ${start}`);return ui.slice(a,b)}
const tariff=segment('function V0({rows:', 'function W0(){');
test('tariff save stays tappable; invalid active print sizes explain how to fix',()=>{
 assert.match(tariff,/disabled:r,onClick:\(\)=>\{if\(k\)/);
 assert.match(tariff,/قیمت چاپ لاستر، سیلک یا متالیک بیشتر از صفر/);
 assert.match(tariff,/children:r\?"در حال ذخیره…":"ذخیره جدول تعرفه"/);
});
test('gallery manager moves delete action to red overlay while keeping confirmation',()=>{
 assert.match(ui,/className:"pb1153PhotoDelete"/);
 assert.match(ui,/aria-label":`حذف عکس/);
 assert.match(ui,/این عکس از گالری حذف شود؟/);
 assert.match(css,/\.clientGalleryMediaVisual \.pb1153PhotoDelete/);
 assert.match(css,/background:#d92d20/);
});
test('brand asks for only photographer name, logo and Save',()=>{
 assert.match(ui,/className:"card clientGalleryBrandSettings pb1153Brand"/);
 assert.match(ui,/className:"pb1153BrandFields"/);
 assert.match(ui,/J.logoUrl\?"تغییر لوگو":"انتخاب لوگو"/);
 assert.match(ui,/className:"primary pb1153BrandSave"/);
 assert.doesNotMatch(ui,/در گالری مشتری جای لوگوی PhotoBridge نمایش داده می‌شود/);
});
test('selection-only mode always remains available when settings are saved',()=>{
 assert.match(ui,/selectionEnabled:!0,orderingEnabled/);
 assert.match(ui,/JSON\.stringify\(\{\.\.\.c,selectionEnabled:true,orderingEnabled/);
});
test('mobile sticky manager header and scrolling editor footer remain visible',()=>{
 assert.match(css,/clientGalleryManagerTop\{[\s\S]*?position:sticky!important/);
 assert.match(css,/clientGalleryTariffTableScroller\{[\s\S]*?overflow-y:auto!important/);
 assert.match(css,/clientGalleryTariffTableFoot\{[\s\S]*?flex:0 0 auto!important/);
 assert.match(css,/clientGalleryTariffPriceGrid:not\(\.head\)/);
 assert.match(html,/photobridge-r1153-gallery-manager\.css\?v=r1162/);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1159/);
});

test('desktop gallery manager uses explicit back, identity and photo tab regions',()=>{
 assert.match(ui,/className:"clientGalleryManagerTop pb1155ManagerTop"/);
 assert.match(ui,/className:"clientGalleryManagerViewTabs"/);
 assert.match(ui,/className:"backBtn",onClick:r,children:"→ بازگشت"/);
 assert.match(css,/\/\* R1162:/);
 assert.match(css,/grid-template-areas:"back identity tabs"!important/);
 assert.match(css,/grid-area:back!important/);
 assert.match(css,/grid-area:identity!important/);
 assert.match(css,/grid-area:tabs!important/);
 assert.match(css,/grid-template-areas:"back identity" "tabs tabs"!important/);
 assert.match(css,/\.pb1155ManagerTop>\.clientGalleryManagerActions\{\s*display:none!important/);
 assert.match(html,/photobridge-r1153-gallery-manager\.css\?v=r1162/);
});
test('duplicate text delete control is hidden while trash SVG is preserved',()=>{
 const vm=require('node:vm');
 const source=fs.readFileSync('dist/web/photobridge-r1162-gallery-card-cleanup.js','utf8');
 let removed=0,hiddenButton=false;
 const textButton={
  textContent:'حذف گالری',hidden:false,tabIndex:0,
  style:{setProperty:(key,value,priority)=>{assert.equal(key,'display');assert.equal(value,'none');assert.equal(priority,'important');hiddenButton=true}},
  setAttribute:(key,value)=>{assert.equal(key,'aria-hidden');assert.equal(value,'true')}
 };
 const trash={textContent:'',hidden:false};
 const card={
  querySelector:selector=>selector==='.pb1160GalleryDelete:has(svg)'?trash:null,
  querySelectorAll:selector=>selector==='button'?[trash,textButton]:[],
 };
 let observed=false;
 class Observer{observe(root,options){observed=!!root&&options.subtree===true&&options.childList===true}}
 const document={
  readyState:'complete',
  getElementById:id=>id==='root'?{}:null,
  querySelectorAll:selector=>selector==='.clientGalleryCard'?[card]:[]
 };
 vm.runInNewContext(source,{document,window:{addEventListener:()=>{}},MutationObserver:Observer});
 assert.ok(observed,'React gallery changes are watched');
 assert.equal(trash.hidden,false,'valid icon-only trash button remains visible');
 assert.equal(textButton.hidden,true,'duplicate text delete button is hidden');
 assert.equal(textButton.tabIndex,-1,'duplicate delete button leaves keyboard focus order');
 assert.ok(hiddenButton);
 assert.match(html,/photobridge-r1162-gallery-card-cleanup\.js\?v=r1162/);
});
