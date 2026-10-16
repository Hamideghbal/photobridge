const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const shopId='10000000-0000-4000-8000-000000000001';
const token='A'.repeat(43);
for(const width of [390,1440])test('local storefront login POST handoff reaches exact shop without repeating password at '+width,async()=>{
 const {renderEquipmentPage}=await import('../dist/api/equipment-site-content.js');
 const shop={id:shopId,name:'فروشگاه دوربین تست',sale_enabled:true,rental_enabled:true,city:'تهران'};
 const html=renderEquipmentPage(shop,{},'https://photobridge.ir',{hostname:'studio.example.test',pathname:'/'}).html;
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 let checkedPassword=false,receivedHandoff=false;
 try{
  const page=await browser.newPage({viewport:{width,height:900}});
  // Navigation may cancel auxiliary scripts from the old page; assert the actual login exchange and destination instead.
  await page.route('https://studio.example.test/**',route=>{
   const url=new URL(route.request().url()),p=url.pathname;
   if(p==='/')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',headers:{'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self' https://photobridge.ir; img-src 'self' data:"},body:html});
   if(p==='/equipment-site.js')return route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:readFileSync('dist/web/equipment-site.js','utf8')});
   if(p==='/equipment-site.css'||p==='/lab-storefront.css')return route.fulfill({status:200,contentType:'text/css',body:'body{font-family:Arial} .photographer-panel{display:block}'});
   if(p==='/api/auth/customer-login'){
    const submitted=route.request().postDataJSON();
    assert.equal(submitted.mobile,'09121234567');assert.equal(submitted.password,'correct-password');
    checkedPassword=true;return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
   }
   if(p==='/api/storefront/office-handoff'){
    assert.equal(checkedPassword,true);
    assert.equal(route.request().postData(),'{}');
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ticket:token,origin:'https://studio.example.test',destination:'https://photobridge.ir/api/auth/equipment-site-handoff'})});
   }
   return route.fulfill({status:200,contentType:'text/plain',body:''});
  });
  await page.route('https://photobridge.ir/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/auth/equipment-site-handoff'){
    const data=new URLSearchParams(route.request().postData());
    assert.equal(data.get('ticket'),token);
    assert.equal(data.get('origin'),'https://studio.example.test');
    assert.equal(data.has('password'),false);
    receivedHandoff=true;
    return route.fulfill({status:303,headers:{location:'https://photobridge.ir/equipment-rental/book?panel=rental&pbDirectShop='+shopId,'cache-control':'no-store'},body:''});
   }
   return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"></head><body><main id="officeReached">PhotoBridge rental</main></body></html>'});
  });
  await page.goto('https://studio.example.test/');
  await page.locator('.photographer-dropdown summary').click();
  await page.locator('#equipmentHeaderLogin [name=mobile]').fill('09121234567');
  await page.locator('#equipmentHeaderLogin [name=password]').fill('correct-password');
  await page.locator('#equipmentHeaderLogin [type=submit]').click();
  await page.waitForURL(url=>url.hostname==='photobridge.ir'&&url.searchParams.get('pbDirectShop')===shopId,{timeout:15000});
  assert(checkedPassword);assert(receivedHandoff);
  assert.equal(new URL(page.url()).searchParams.get('pbDirectShop'),shopId,'the exact originating shop must be in destination URL');
 }finally{await browser.close()}
});

for(const width of [390,1440])test('centered office form signs in from original shop, stays readable at '+width,async()=>{
 const {renderEquipmentPage}=await import('../dist/api/equipment-site-content.js');
 const shop={id:shopId,name:'فروشگاه دوربین تست',sale_enabled:true,rental_enabled:true,city:'تهران'};
 const pageHtml=renderEquipmentPage(shop,{},'https://photobridge.ir',{hostname:'studio.example.test',pathname:'/rental-equipment'}).html;
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 let authenticated=false,exchanged=false;
 try{
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('https://studio.example.test/**',route=>{
   const p=new URL(route.request().url()).pathname;
   if(p==='/rental-equipment')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',headers:{'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self' https://photobridge.ir; img-src 'self' data:"},body:pageHtml});
   if(p==='/equipment-site.js')return route.fulfill({status:200,contentType:'application/javascript',body:readFileSync('dist/web/equipment-site.js','utf8')});
   if(p==='/equipment-site.css')return route.fulfill({status:200,contentType:'text/css',body:readFileSync('dist/web/equipment-site.css','utf8')});
   if(p==='/lab-storefront.css')return route.fulfill({status:200,contentType:'text/css',body:readFileSync('dist/web/lab-storefront.css','utf8')});
   if(p==='/api/auth/customer-login'){
    const body=route.request().postDataJSON();
    assert.equal(body.mobile,'09121234567');assert.equal(body.password,'correct-password');
    authenticated=true;return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
   }
   if(p==='/api/storefront/office-handoff'){
    assert(authenticated);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ticket:token,origin:'https://studio.example.test',destination:'https://photobridge.ir/api/auth/equipment-site-handoff'})});
   }
   return route.fulfill({status:200,contentType:'text/plain',body:''});
  });
  await page.route('https://photobridge.ir/**',route=>{
   if(new URL(route.request().url()).pathname==='/api/auth/equipment-site-handoff'){
    const data=new URLSearchParams(route.request().postData());
    assert.equal(data.get('ticket'),token);assert.equal(data.get('origin'),'https://studio.example.test');
    assert(!data.has('password'));exchanged=true;
    return route.fulfill({status:303,headers:{location:'https://photobridge.ir/equipment-rental/book?panel=rental&pbDirectShop='+shopId},body:''});
   }
   return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"></head><body>Office</body></html>'});
  });
  await page.goto('https://studio.example.test/rental-equipment');
  await page.locator('#equipmentOfficePageLogin').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-open-equipment-login],.equipment-office-cta').count(),0);
  const rect=await page.locator('.equipment-office-login-card').boundingBox();
  assert(rect&&Math.abs(rect.x+rect.width/2-width/2)<70,'office form stays centered');
  assert.equal(await page.locator('#equipmentOfficePageLogin button[type=submit]').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  assert((await page.locator('.equipment-page-scroll').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('linear-gradient'));
  await page.locator('#equipmentOfficePageLogin input[name=mobile]').fill('09121234567');
  await page.locator('#equipmentOfficePageLogin input[name=password]').fill('correct-password');
  await page.locator('#equipmentOfficePageLogin button[type=submit]').click();
  await page.waitForURL(u=>u.hostname==='photobridge.ir'&&u.searchParams.get('pbDirectShop')===shopId,{timeout:15000});
  assert(authenticated&&exchanged);
 }finally{await browser.close();}
});
