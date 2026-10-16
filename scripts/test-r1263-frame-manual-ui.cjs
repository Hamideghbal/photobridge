const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
for(const width of [390,1366])test('native frame operator can invoice two items offline at '+width,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];let posted=0,body=null,category='frame_chassis';
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('http://127.0.0.1:30412/**',async route=>{
   const p=new URL(route.request().url()).pathname;
   const json=(obj,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(obj)});
   if(p==='/desktop/frame-manual-status')return json({supported:true,enabled:true,signedIn:true,shopId:a});
   if(p==='/api/rental/manual-sale-orders'){posted++;body=route.request().postDataJSON();return json({ok:true,queued:true,invoiceRef:'OFF-12345ABC6789',totalAmount:460000,buyerName:body.buyerName,buyerMobile:body.buyerMobile,lines:[{title:'قاب سفید',quantity:2,unitPrice:150000,total:300000},{title:'شاسی',quantity:1,unitPrice:160000,total:160000}]});}
   return json({});
  });
  await page.goto('http://127.0.0.1:30412/',{waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.setContent('<html lang="fa" dir="rtl"><head><style>#rentalDesktopPrimaryNav{display:flex}</style></head><body><nav id="rentalDesktopPrimaryNav"><button id="rentalDesktopAddItemAction">افزودن</button></nav></body></html>');
  await page.evaluate(({a,b})=>{
   window.data={shop:{id:a,name:'قاب سازی',business_category:'frame_chassis',sale_enabled:true},saleItems:[{id:a,title:'قاب سفید',active:true,sale_price:150000},{id:b,title:'شاسی',active:true,sale_price:160000}],saleOrders:[]};
   window.__PB_DESKTOP_FETCH__=window.fetch.bind(window);
  },{a,b});
  await page.addScriptTag({path:path.resolve('apps/store-desktop/frame-orders-ui.js')});
  await page.locator('#pb1263FrameOpen').waitFor({state:'visible'});
  await page.locator('#pb1263FrameOpen').click();
  await page.locator('#pb1263FrameBuyer').fill('خریدار حضوری');
  await page.locator('#pb1263FrameMobile').fill('09121234567');
  await page.locator('.pb1263FrameLine [data-qty]').first().fill('2');
  await page.locator('#pb1263FrameAdd').click();
  await page.locator('.pb1263FrameLine [data-sale]').last().selectOption(b);
  await page.locator('#pb1263FrameSubmit').click();
  await page.getByText('فاکتور محلی OFF-12345ABC6789',{exact:false}).waitFor();
  assert.equal(posted,1);assert.equal(body.items.length,2);assert.equal(body.items[0].quantity,2);
  assert.equal(body.items[1].saleItemId,b);
  assert(await page.locator('#pb1263Invoice').isVisible());
  assert(await page.locator('#pb1263FramePrint').isVisible());
  await page.evaluate(()=>{data.shop.id='33333333-3333-4333-8333-333333333333';data.shop.business_category='equipment_rental_sale'});
  await page.locator('#pb1263FrameOpen').waitFor({state:'hidden',timeout:7000});
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
