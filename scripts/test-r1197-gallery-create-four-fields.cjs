const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
const server=read('dist/api/server.js');
const css=read('dist/web/photobridge-r1197-gallery-create-four-fields.css');
const html=read('dist/web/index.html');
let playwright=null;
try{playwright=require('playwright')}catch{}
const chromiumPath=playwright&&(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':playwright.chromium.executablePath());
const chromiumAvailable=!!chromiumPath&&fs.existsSync(chromiumPath);
const a=ui.indexOf('c&&e.jsx(On,{title:"گالری خصوصی جدید"'),b=ui.indexOf('function PBClientGalleryCompare(',a);
const modal=ui.slice(a,b);
test('new gallery top row has four real inputs, four inline required/optional captions, no duplicate price',()=>{
 assert(a>0&&b>a);
 for(const [name,badge,key] of [
   ['عنوان پروژه','اجباری','h.title'],
   ['نام مشتری','اجباری','h.customerName'],
   ['موبایل مشتری','اختیاری','h.customerMobile'],
   ['رمز ورود خصوصی','اجباری','h.accessCode']
 ]){
  const label='e.jsxs("span",{className:"pb1196FieldCaption",children:["'+name+'",e.jsx("small",{"aria-hidden":!0,children:"'+badge+'"})]}),e.jsx("input",{';
  const n=modal.indexOf(label);
  assert(n>=0,name+' must have one caption and adjacent badge before its own input');
  assert(modal.slice(n,n+500).includes('value:'+key),name+' must retain correct state');
  assert.equal(modal.split('"'+name+'"').length-1,1,'duplicate label should not remain: '+name);
 }
 assert.equal((modal.match(/className:"pb1196FieldCaption"/g)||[]).length,4);
 assert(!modal.includes('قیمت فایل دیجیتال (اختیاری · تومان)'));
 assert(!modal.includes('digitalPrice:Number(h.digitalPrice||0)'));
});
test('invoice switch active independently of digital price and uses real price management',()=>{
 assert(modal.includes('"سفارش و فاکتور"'));
 assert(!modal.includes('سفارش چاپ و فاکتور (انتخاب عکس فعال است)'));
 assert(modal.includes('disabled:g||!!PB1112draft.current,checked:!!h.orderingEnabled'));
 assert(!modal.includes('disabled:g||!!PB1112draft.current||!Number(h.digitalPrice)'));
 assert(modal.includes('if(event.target.checked)PB1344openPrices()')||modal.includes('onChange:event=>S({...h,orderingEnabled:event.target.checked,selectionEnabled:true})'),'invoice switch retains its real state handler before or after R1344');
 assert(ui.includes('digitalPrice:0'));
 assert(ui.includes('className:"pb1164TariffDigitalPrice"'),'digital price editor remains in tariff settings');
 assert(ui.includes('galleryPrintTariffStates'),'management uses actual gallery tariff states');
});
test('server validates priced active photographer tariffs BEFORE charging for new gallery',()=>{
 const i=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/customer/client-galleries')");
 const e=server.indexOf('const customerGalleryRenew',i);
 assert(i>=0&&e>i);
 const code=server.slice(i,e);
 assert(code.includes('if (orderingEnabled && moneyAmount(b.digitalPrice) <= 0)'));
 assert(code.includes("FROM photographer_gallery_print_tariffs t"));
 assert(code.includes("COALESCE(t.luster_price,0)>0"));
 assert(code.includes("COALESCE(t.silk_price,0)>0"));
 assert(code.includes("COALESCE(t.metallic_price,0)>0"));
 assert(code.includes("error: 'gallery_ordering_tariff_required'"));
 assert(code.indexOf("error: 'gallery_ordering_tariff_required'")<code.indexOf('photographerWalletEnsure('),'do not charge for unpriced invoice');
 assert(code.includes('INSERT INTO photographer_gallery_print_tariff_states'),'new gallery gets existing tariffs');
 assert(ui.includes('برای فعال‌کردن سفارش و فاکتور، ابتدا قیمت چاپ'));
});
test('four equal columns remain level and legacy lower duplicate captions are hidden',()=>{
 assert(css.includes('width:min(850px,calc(100vw - 24px))!important'));
 assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))!important'));
 assert(css.includes('grid-column:2/4!important'));
 assert(css.includes('grid-column:4!important'));
 assert(css.includes('grid-row:1!important'));
 assert(css.includes('> :is(small,em,.required,.optional'));
 assert(css.includes('content:none!important'));
 assert(css.includes('@media(max-width:820px)'));
 assert(css.includes('.pb1196FieldCaption small'));
 assert(!css.includes('.clientGalleryTariffTableModal'));
});
test('browser version and overlay retain layering over desktop header',()=>{
 assert.equal(html.split('/photobridge-r1197-gallery-create-four-fields.css?v=r1197').length-1,1);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=[^"]*&form=r1197(?:&[^"]*)?"/);
 assert(read('dist/web/photobridge-r1194-gallery-create-dialog.css').includes('z-index:2147483600!important'));
});
test('real Chromium: on phone and desktop all four field inputs form one top row',{skip:!playwright?'Browser harness not installed':!chromiumAvailable?'Chromium executable not installed in this build environment':false},async()=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:chromiumPath,args:['--no-sandbox','--disable-gpu']});
 try{
  for(const width of [320,390,1366]){
   const page=await browser.newPage({viewport:{width,height:740}});
   await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
   await page.setContent('<div class="modalBack globalModalLayer"><section class="modal pb1112CreateDialog"><div class="modalHead"><h2>گالری خصوصی جدید</h2></div><div class="modalContent"><div class="clientGalleryCreateForm"><label><span class="pb1196FieldCaption">عنوان پروژه<small>اجباری</small></span><input><small>اجباری</small></label><div class="grid2"><label><span class="pb1196FieldCaption">نام مشتری<small>اجباری</small></span><input><small>اجباری</small></label><label><span class="pb1196FieldCaption">موبایل مشتری<small>اختیاری</small></span><input><small>اختیاری</small></label></div><label><span class="pb1196FieldCaption">رمز ورود خصوصی<small>اجباری</small></span><input><small>اجباری</small></label><label>یادداشت<input></label></div></div></section></div>');
   for(const f of ['dist/web/assets/index-UIRefine-v586.css','dist/web/photobridge-r1112-gallery-form.css','dist/web/photobridge-r1194-gallery-create-dialog.css','dist/web/photobridge-r1195-gallery-create-compact.css','dist/web/photobridge-r1196-gallery-field-align.css','dist/web/photobridge-r1197-gallery-create-four-fields.css'])await page.addStyleTag({path:f});
   const state=await page.evaluate(()=>{
    const labels=[document.querySelector('.clientGalleryCreateForm > label:first-child'),...document.querySelectorAll('.clientGalleryCreateForm > .grid2 > label'),document.querySelector('.clientGalleryCreateForm > label:nth-child(3)')];
    return labels.map(l=>{
      const input=l.querySelector('input').getBoundingClientRect(),cap=l.querySelector('.pb1196FieldCaption').getBoundingClientRect(),lower=l.querySelector(':scope > small');
      return {y:input.y,w:input.width,capBottom:cap.bottom,lower:getComputedStyle(lower).display};
    });
   });
   assert(state.every(x=>Math.abs(x.y-state[0].y)<2),JSON.stringify({width,state}));
   assert(state.every(x=>x.w>48&&x.capBottom<=x.y+1),'inputs must follow captions');
   assert(state.every(x=>x.lower==='none'),'old bottom badges must be hidden');
   await page.close();
  }
 }finally{await browser.close();}
});
