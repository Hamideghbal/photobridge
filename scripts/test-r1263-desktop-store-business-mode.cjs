const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const idA='11111111-1111-4111-8111-111111111111',idB='22222222-2222-4222-8222-222222222222';
test('one Windows store UI follows the authenticated shop category and clears stale account on shop switch',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:900}}),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.setContent(`<!doctype html><html lang="fa" dir="rtl"><head></head><body class="rentalAppReady">
  <header class="top"></header>
  <div id="rentalShopIdentityBar"><div class="pb829ShopIdentityName"><span>فروشگاه تجهیزات</span></div></div>
  <div id="pb836TopShopName"></div><div id="pb851MobileShopName"></div>
  <nav id="rentalDesktopPrimaryNav">
   <button data-rental-desktop-tab="items">اجاره تجهیزات</button>
   <button data-rental-desktop-tab="sales">فروش تجهیزات</button>
   <button data-rental-desktop-tab="bookings">آفیش</button>
   <button data-rental-desktop-tab="photographers">عکاس‌ها</button>
   <button data-rental-desktop-tab="accounting">مالی</button>
   <button data-rental-desktop-tab="settings">تنظیمات</button>
   <button id="rentalDesktopAddItemAction">＋ افزودن کالای اجاره</button>
  </nav>
  <nav id="rentalMobileBottomNav">
   <button data-rental-bottom-tab="items"><span>اجاره</span></button>
   <button data-rental-bottom-tab="sales"><span>فروش تجهیزات</span></button>
   <button data-rental-bottom-tab="bookings"><span>آفیش</span></button>
   <button data-rental-bottom-tab="photographers"><span>عکاس‌ها</span></button>
  </nav>
  <nav id="rentalMobileDrawer"><button data-rental-tab="photographers">عکاس‌ها</button></nav>
  <div class="dashboardCards"><div class="stat"><b id="statItems">2</b></div><div class="stat"><b id="statPhotographers">3</b></div><div class="stat"><b id="statSalesItems">4</b></div></div>
  <section id="app"><div class="panel active" id="items"></div><div class="panel" id="sales"></div><div class="panel" id="bookings"></div><div class="panel" id="settings"></div></section>
  </body></html>`);
  await page.evaluate(({idA,idB})=>{
   window.mockStatus={signedIn:true,shopId:idA,revision:1,online:true};
   window.mockOverview={shop:{id:idA,name:'میرکامران',business_category:'frame_chassis',sale_enabled:true,rental_enabled:false}};
   window.data=window.mockOverview;
   window.rentalTabFromPath=()=>'/rental/equipment';
   window.mockTabClicks=[];
   window.selectRentalTab=tab=>{window.mockTabClicks.push(tab);document.querySelectorAll('#app .panel').forEach(x=>x.classList.toggle('active',x.id===tab))};
   window.render=()=>{document.getElementById('pb836TopShopName').textContent='فروشگاه تجهیزات عکاسی و فیلم‌برداری · '+data.shop.name};
   window.__PB_DESKTOP_FETCH__=async url=>({ok:true,json:async()=>url==='/desktop/status'?structuredClone(window.mockStatus):structuredClone(window.mockOverview)});
  },{idA,idB});
  await page.addScriptTag({path:path.resolve('apps/store-desktop/desktop-overlay.js')});
  await page.waitForFunction(()=>document.body.classList.contains('pbStoreFrameOwner'));
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=items]').isVisible(),false);
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=bookings]').isVisible(),false);
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=photographers]').isVisible(),false);
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=sales]').isVisible(),true);
  assert.equal(await page.locator('#app .panel.active').getAttribute('id'),'sales');
  assert.equal(await page.locator('#pb836TopShopName').textContent(),'فروش و تولید قاب و شاسی · میرکامران');
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=sales]').textContent(),'قاب و شاسی');
  await page.evaluate(idB=>{
   window.mockStatus={signedIn:true,shopId:idB,revision:2,online:true};
   window.mockOverview={shop:{id:idB,name:'فروشگاه دوربین تست',business_category:'equipment_rental_sale',rental_enabled:true,sale_enabled:true}};
  },idB);
  await page.waitForFunction(()=>!document.body.classList.contains('pbStoreFrameOwner')&&window.data.shop.id===window.mockStatus.shopId,{timeout:7500});
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=items]').isVisible(),true);
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=bookings]').isVisible(),true);
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=photographers]').isVisible(),true);
  assert.equal(await page.locator('#rentalDesktopPrimaryNav [data-rental-desktop-tab=sales]').textContent(),'فروش تجهیزات');
  assert.equal(await page.locator('#pb836TopShopName').textContent(),'فروشگاه تجهیزات عکاسی و فیلم‌برداری · فروشگاه دوربین تست');
  assert.deepEqual(errors,[]);
  await page.close();
 }finally{await browser.close();}
});
