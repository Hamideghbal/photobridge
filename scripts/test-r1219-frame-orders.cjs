const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
async function openPortal(page,category){
const root=process.cwd(),shop={id:'10000000-0000-4000-8000-000000000001',name:'تولید قاب',business_category:category,active:true,rental_enabled:category==='equipment_rental_sale',sale_enabled:true,activation_status:'approved',activation_ever_approved:true};const overview={shop,items:[],assets:[],saleItems:[],saleOrders:[{id:'order-test',buyer_name:'مشتری آزمایشی',item_title:'قاب مدرن',quantity:1,total_amount:250,production_stage:'in_production',production_confirmed_at:'2026-10-14',status:'approved',payment_status:'ledger'}],bookings:[],photographers:[],collaborationRequests:[],shortages:[],returnShortages:[],catalog:{categories:[],brands:[],models:[],globalCategories:[],globalBrands:[],globalProducts:[]},subscription:{active:true,plans:[],renewals:[]},salesWallet:{balance:0,transactions:[]}};await page.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname!=='photobridge.test')return r.fulfill({body:'',contentType:'text/css'});if(u.pathname.startsWith('/api/')){const d=u.pathname==='/api/rental/overview'?overview:u.pathname==='/api/auth/me'?{user:{name:'مدیر',rentalRole:'shop_admin',rentalShopId:shop.id},rentalShop:shop}:u.pathname==='/api/rental/production-options'?{options:{types:['چوب'],models:['مدرن'],thicknesses:['20'],sizes:['30×40'],colors:['مشکی']}}:u.pathname==='/api/rental/accounting'?{summary:{},balances:[],entries:[],invoices:[]}:{};return r.fulfill({contentType:'application/json',body:JSON.stringify(d)});}const file=u.pathname.startsWith('/rental')?path.join(root,'dist/api/equipment-rental-portal.html'):path.join(root,'dist/web',u.pathname);if(fs.existsSync(file)&&fs.statSync(file).isFile())return r.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});return r.fulfill({status:404,body:''});});await page.goto('http://photobridge.test/rental');await page.locator('body.rentalAppReady').waitFor();}


for(const width of [1440,390])for(const category of ['frame_chassis','equipment_rental_sale'])test('orders stay scoped and compact '+category+' '+width,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await openPortal(page,category);
 await page.evaluate(()=>selectRentalTab('bookings'));
 if(category==='frame_chassis'){
 await page.locator('[data-production-tab="in_production"]').click();
 assert(await page.locator('#saleOrdersList').isVisible());
 assert.equal(await page.locator('#pb1013SaleCalendar').count(),0);
 assert.equal(await page.locator('#pb848BookingHeaderTabs').isVisible(),false);
 assert.equal(await page.locator('#bookings .pb843BookingCalendarBox').first().isVisible(),false);
 const card=page.locator('[data-production-order="order-test"]');
 assert.equal(await card.evaluate(el=>getComputedStyle(el).paddingTop),'10px');
 const next=card.locator('button.productionStepCircle');assert.equal(await next.getAttribute('data-production-action'),'ready');
 const request=page.waitForRequest(r=>r.method()==='PATCH'&&r.url().includes('/production-orders/order-test'));
 await page.screenshot({path:'/tmp/r1219-orders-'+width+'.png'});
 await next.click();assert.equal(JSON.parse((await request).postData()).action,'ready');

 }else{
 assert.equal(await page.locator('body.frameProductionShop').count(),0);
 assert(await page.locator('#pb848BookingHeaderTabs').isVisible());
 assert.equal(await page.locator('.productionStepper').count(),0);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
