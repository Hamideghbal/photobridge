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
  page.on('pageerror',e=>{throw e});
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
  await page.locator('#officeReached').waitFor();
 }finally{await browser.close()}
});
