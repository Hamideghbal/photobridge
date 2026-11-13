// Browser regression against the disposable local database only.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {Pool}=require('pg');
const crypto=require('node:crypto');
const baseUrl=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
(async()=>{
 if(!process.env.DATABASE_URL?.includes('host=/workspace/photobridge-env/run'))throw Error('Disposable local database required');
 const db=new Pool({connectionString:process.env.DATABASE_URL});
 const uid='11111111-1111-4111-8111-111111111138';
 const token=crypto.randomBytes(32).toString('base64url'),hash=crypto.createHash('sha256').update(token).digest('hex');
 await db.query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '1 hour')",[uid,hash]);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [1366,390]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<821,hasTouch:width<821});
   await context.addCookies([{name:'photobridge_photographer_session',value:token,url:baseUrl}]);
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack)});
   const getStore=()=>page.frames().find(f=>f.url().includes('/equipment-rental/book'));
   await page.goto(baseUrl+(width>820?'/photographer/gallery?pbDesktopPanel=store':'/equipment-rental/book'));
   console.log('OPEN',width,page.url());await page.waitForFunction(()=>document.querySelector('[data-pb1126-kind="store"]')||document.querySelector('#pb1106StorePanel'));
   await page.waitForTimeout(1500);
   let store=getStore();assert.ok(store,'store frame mounted');
   await store.locator('[data-enter-store-r96]').first().click();
   await store.waitForFunction(()=>!document.body.classList.contains('pbR96ChoosingStore'));
   const activeId=await store.evaluate(()=>new URL(location.href).searchParams.get('pbDirectShop'));
   assert.ok(activeId,'selected shop is in the URL');
   const controls=()=>width>820?page.locator('.pb1126Secondary .pb1126FrameStoreTabs'):store.locator('#storeSectionNavV673');
   if(width>820){
    await page.waitForTimeout(250);
    const text=await page.locator('.pb1126Secondary').innerText();
    console.log('STORE_HEADER',text);assert.ok(!/تعرفه|دعوت همکار/.test(text));
    assert.match(text,/فروش تجهیزات/);
   }
   for(const panel of ['equipmentPanel','salesPanel','bookingsPanel','financePanel']){
    await controls().locator('[data-store-panel="'+panel+'"]').click();
    await store.waitForFunction(id=>document.querySelector('.rentalPanel.mobileActive')?.id===id,panel);
    assert.equal(await store.locator('.rentalPanel.mobileActive').count(),1);
    await page.reload();await page.waitForTimeout(1200);store=getStore();
    await store.waitForFunction(id=>document.querySelector('.rentalPanel.mobileActive')?.id===id&&!document.body.classList.contains('pbR96ChoosingStore'),panel);
    assert.equal(await store.evaluate(()=>new URL(location.href).searchParams.get('pbDirectShop')),activeId);
   }
   if(width>820){
    await controls().locator('[data-store-panel="salesPanel"]').click();
    await store.locator('#saleCartBtn').click();
    await store.waitForFunction(()=>document.querySelector('#saleCartDrawer')?.classList.contains('open'));
    await store.evaluate(()=>closeSaleCart());
    await store.locator('#saleCategoryBtnR68').click();
    await store.waitForFunction(()=>document.querySelector('.rentalPanel.mobileActive')?.id==='salesPanel');
    await store.evaluate(()=>closeFilterSheetR68());
    await page.locator('[data-pb1126-kind="store"]').click();
   }else {
    await controls().locator('[data-store-panel="salesPanel"]').click();
    await store.locator('#saleCategoryBtnR68').click();
    await store.evaluate(()=>closeFilterSheetR68());
    await store.locator('#saleCartBtn').click();
    await store.waitForFunction(()=>document.querySelector('#saleCartDrawer')?.classList.contains('open'));
    await store.evaluate(()=>closeSaleCart());
    await page.locator('.photographerBottomAppNav button').filter({hasText:/^فروشگاه$/}).click();
   }
   await store.waitForFunction(()=>document.body.classList.contains('pbR96ChoosingStore'));
   assert.equal(await store.evaluate(()=>new URL(location.href).searchParams.get('pbDirectShop')),null);
   assert.deepEqual(errors,[]);
   console.log('PASS',width,'header tabs, cart/category, reload in all four sections, explicit Store chooser');
   await context.close();
  }
 }finally{await browser.close();await db.query('DELETE FROM sessions WHERE token_hash=$1',[hash]);await db.end()}
})().catch(e=>{console.error(e);process.exit(1)});
