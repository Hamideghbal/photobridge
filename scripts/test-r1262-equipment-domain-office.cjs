const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const shopId='00000000-0000-4000-8000-000000000001',itemId='00000000-0000-4000-8000-000000000007';
for(const width of [390,1440])test('branded equipment storefront uses photographer login and current booking API at '+width,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width,height:980}}),errors=[];let signedIn=false,created=0,quoted=0;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://shop.example.com/**',async route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(p==='/api/storefront/catalog')return json({shop:{id:shopId,name:'فروشگاه دوربین',description:'اجاره و فروش تجهیزات عکاسی',production:false,rentalEnabled:true,saleEnabled:true,platformOrigin:'https://photobridge.ir'},items:[{id:'11111111-1111-4111-8111-111111111111',title:'لنز سونی',sale_price:1700000,image_url:'',variant_specs:{}}]});
   if(p==='/api/auth/me')return json(signedIn?{user:{labRole:'customer',name:'عکاس تست'}}:null);
   if(p==='/api/auth/customer-login'){assert.equal(route.request().postDataJSON().mobile,'09121234567');signedIn=true;return json({ok:true});}
   if(p==='/api/customer/equipment-rental/items'){assert.equal(u.searchParams.get('shopId'),shopId);return json({items:[{id:itemId,title:'دوربین A7',brand:'سونی',daily_price:260000,image_url:'',stock_total:7}]});}
   if(p==='/api/customer/equipment-rental/bookings'&&route.request().method()==='GET')return json({bookings:[]});
   if(p==='/api/customer/equipment-rental/availability'){quoted++;const body=route.request().postDataJSON();assert.equal(body.shopId,shopId);assert.equal(body.items[0].itemId,itemId);return json({rentalDays:2,totalAmount:520000,depositAmount:1000000});}
   if(p==='/api/customer/equipment-rental/bookings'&&route.request().method()==='POST'){created++;assert.equal(route.request().postDataJSON().shopId,shopId);return json({id:'22222222-2222-4222-8222-222222222222'},201);}
   const files={'/':'storefront.html','/storefront.js':'storefront.js','/storefront-rental.js':'storefront-rental.js','/storefront.css':'storefront.css','/photobridge-r1207-frame-catalog.js':'photobridge-r1207-frame-catalog.js','/assets/photobridge-handover-vazirmatn.woff2':'assets/photobridge-handover-vazirmatn.woff2'};
   const file=files[p];if(file)return route.fulfill({path:path.resolve('dist/web',file),contentType:p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.woff2')?'font/woff2':'text/html'});
   return route.fulfill({status:404,body:'not found'});
  });
  await page.goto('https://shop.example.com/');
  await page.locator('#rentalSection').waitFor({state:'visible'});
  assert(await page.locator('#catalog').isVisible(),'public retail remains visible when enabled');
  assert.equal(await page.locator('.frameProductCard').count(),1,'website sale prices still render');
  await page.locator('#rentalLogin').waitFor({state:'visible'});
  await page.locator('#rentalLogin [name=photographerMobile]').fill('09121234567');
  await page.locator('#rentalLogin [name=password]').fill('a strong local account password');
  await page.locator('#rentalLogin button[type=submit]').click();
  await page.locator('#rentalBookingForm').waitFor({state:'visible'});
  assert.equal(await page.locator('.rentalProduct').count(),1);
  // Rental availability must be requested for future dates. Fixed 2026-11-02
  // became a past date and caused the confirmation button to stay disabled.
  const dayOffset=days=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);
  await page.locator('#rentalFrom').fill(dayOffset(3));
  await page.locator('#rentalTo').fill(dayOffset(4));
  await page.locator('.rentalProduct input[type=checkbox]').check();
  await page.locator('#rentalCheck').click();
  await page.locator('#rentalConfirm:not([disabled])').waitFor();
  assert((await page.locator('#rentalQuote').textContent()).includes('۵۲۰٬۰۰۰'));
  await page.locator('#rentalConfirm').click();
  await page.getByText('درخواست آفیش ثبت شد',{exact:false}).waitFor();
  assert.equal(quoted,1);assert.equal(created,1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile must not overflow');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});