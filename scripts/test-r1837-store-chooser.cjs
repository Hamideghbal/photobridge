const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const shop={id:'33333333-3333-4333-8333-333333333338',name:'هنر هفتم',business_category:'equipment_rental_sale',connected:true,rental_enabled:true,sale_enabled:true,city:'تهران'};
async function setup(browser,{width=390,category=shop.business_category,reject=false,holdList=false,cached=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width<821,hasTouch:width<821,serviceWorkers:'block'}),page=await context.newPage();
 const target={...shop,business_category:category},errors=[];let identityResolved=false,selects=0,release;
 const listReady=new Promise(r=>release=r);
 if(cached)await page.addInitScript(s=>sessionStorage.setItem('photobridge:r100f14:store-chooser',JSON.stringify({shops:[{...s,city:'شیراز'}],scoped:false})),target);
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith('/api/')){
   if(url.pathname==='/api/auth/me'){await new Promise(r=>setTimeout(r,1800));identityResolved=true;return route.fulfill({json:{user:{userId:'admin-photographer',name:'مدیر',photographerName:'عکاسی آزمایشی',labRole:'customer',platformRole:'platform_admin'}}})}
   if(url.pathname==='/api/customer/equipment-rental/shops'){if(holdList)await listReady;return route.fulfill({json:{shops:[target],scoped:false}})}
   if(/\/shops\/[^/]+\/select$/.test(url.pathname)){
    selects++;await new Promise(r=>setTimeout(r,200));return route.fulfill({status:reject?403:200,json:reject?{error:'shop_reach_forbidden'}:{ok:true,shop:target,connected:true}});
   }
   if(url.pathname==='/api/customer/equipment-rental/sale-items')return route.fulfill({json:{items:[],shop:{production:category==='frame_chassis'}}});
   return route.fulfill({json:{items:[],bookings:[],orders:[],entries:[],invoices:[],payments:[],notifications:[],balance:0,summary:{},tabs:{ai:false,album:false,instagram:false}}});
  }
  const file=url.pathname==='/equipment-rental/book'?path.resolve('dist/api/equipment-rental-book.html'):path.join(process.cwd(),'dist/web',url.pathname.slice(1));
  return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 await page.goto('https://chooser.test/equipment-rental/book?pbEmbeddedStore=1&pbDesktopContent=1');
 await page.locator('[data-enter-store-r96]').waitFor();
 return {page,context,errors,release,identityResolved:()=>identityResolved,selects:()=>selects};
}
test('fresh camera and frame choosers become usable before slow identity loading, at mobile and desktop widths',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1366])for(const category of ['equipment_rental_sale','frame_chassis']){
  const h=await setup(browser,{width,category});assert.equal(h.identityResolved(),false,'shop list does not wait for identity');
  await h.page.locator('[data-enter-store-r96]').click();
  await h.page.locator('#storeChooserStatusR1837[data-kind="pending"]').waitFor();
  assert.equal(await h.page.locator('[data-enter-store-r96]').isDisabled(),true);
  await h.page.waitForFunction(()=>!document.body.classList.contains('pbR96ChoosingStore'));
  assert.equal(h.selects(),1);assert.equal(await h.page.locator('#photographerStoreHeaderName').textContent(),'هنر هفتم');assert.deepEqual(h.errors,[]);
  await h.context.close();
 }}finally{await browser.close()}
});
test('refreshing cached cards during a press retains the intended shop and sends one selection request',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const h=await setup(browser,{cached:true,holdList:true});
  const button=h.page.locator('[data-enter-store-r96]'),old=await button.elementHandle(),r=await button.boundingBox();
  await h.page.mouse.move(r.x+r.width/2,r.y+r.height/2);await h.page.mouse.down();h.release();
  await h.page.waitForFunction(()=>document.querySelector('#storeChooserListR96').textContent.includes('تهران'));
  assert.equal(await old.evaluate(el=>el.isConnected),true,'unchanged entry button survives fresh card data');
  await h.page.mouse.up();
  await h.page.waitForFunction(()=>!document.body.classList.contains('pbR96ChoosingStore'));
  assert.equal(h.selects(),1);assert.deepEqual(h.errors,[]);await h.context.close();
 }finally{await browser.close()}
});
test('denied selection is visible in the chooser and releases its button instead of appearing unresponsive',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const h=await setup(browser,{reject:true});await h.page.locator('[data-enter-store-r96]').click();
  const status=h.page.locator('#storeChooserStatusR1837[data-kind="error"]');await status.waitFor();
  assert.match(await status.textContent(),/دسترسی/);assert.equal(await status.isVisible(),true);
  await h.page.waitForFunction(()=>!document.querySelector('[data-enter-store-r96]').disabled);
  assert.equal(await h.page.locator('body').evaluate(e=>e.classList.contains('pbR96ChoosingStore')),true);assert.equal(h.selects(),1);assert.deepEqual(h.errors,[]);
  await h.context.close();
 }finally{await browser.close()}
});
