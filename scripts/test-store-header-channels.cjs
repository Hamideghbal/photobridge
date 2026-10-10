const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.join(__dirname,'../dist/api/equipment-rental-portal.html'),'utf8');
test('header separators and disabled channels follow shop settings and can be restored',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(x=>'<style>'+x[1]+'</style>').join('');
  await page.setContent('<html><head>'+styles+'</head><body class="rentalAppReady"><header class="top"><nav id="rentalDesktopPrimaryNav">'+['bookings','sales','items','accounting'].map(key=>'<button data-rental-desktop-tab="'+key+'">'+key+'</button>').join('')+'</nav></header></body></html>');
  await page.addScriptTag({content:'window.data={shop:{sale_enabled:true,rental_enabled:true},items:[],saleItems:[]};window.fillShop=()=>42;window.load=async()=>43;'});
  await page.addScriptTag({content:html.match(/<script id="pbR1050HeaderChannels">([\s\S]*?)<\/script>/)[1]});
  assert.equal(await page.locator('.pbR1050ChannelDivider').count(),2);
  for(const [sale,rental,count] of [[false,true,1],[true,false,1],[false,false,0],[true,true,2]]){
   const result=await page.evaluate(([sale,rental])=>{data.shop={sale_enabled:sale,rental_enabled:rental};return fillShop()},[sale,rental]);
   assert.equal(result,42,'original rendering return is preserved');
   assert.equal(await page.locator('[data-rental-desktop-tab="sales"]').isVisible(),sale);
   assert.equal(await page.locator('[data-rental-desktop-tab="items"]').isVisible(),rental);
   assert.equal(await page.locator('.pbR1050ChannelDivider').count(),count);
   assert.equal(await page.locator('[data-rental-desktop-tab="bookings"]').isVisible(),true);
   assert.equal(await page.locator('[data-rental-desktop-tab="accounting"]').isVisible(),true);
  }
  assert.equal(await page.evaluate(()=>load()),43,'async load return is preserved');
  await page.close();
 }finally{await browser.close()}
});
