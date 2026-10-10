const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..'),shared=fs.readFileSync(path.join(root,'dist/web/photobridge-r1057-daily-rental-availability.js'),'utf8');
const portal=fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8');
const days=[{date:'2030-10-12',available:0,shortage:1},{date:'2030-10-13',available:2,shortage:0},{date:'2030-10-14',available:1,shortage:0}];
test('full shipped manager portal preserves day labels through later card decorators',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/api/')){
    let body={};
    if(url.pathname==='/api/auth/me')body={user:{id:'manager',name:'Manager'},rentalShop:{id:'shop',name:'Seven'}};
    if(url.pathname==='/api/rental/overview')body={shop:{id:'shop',name:'Seven',active:true,activation_status:'approved'},items:[{id:'camera',title:'Camera',active:true,stock_total:2}],bookings:[],photographers:[],saleItems:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
    if(url.pathname==='/api/rental/availability')body={items:[{itemId:'camera',valid:true,available:0,dailyAvailability:days}]};
    return route.fulfill({json:body});
   }
   const file=url.pathname.startsWith('/rental')?path.join(root,'dist/api/equipment-rental-portal.html'):path.join(root,'dist/web',url.pathname);
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});
  });
  await page.goto('http://localhost/rental/bookings',{waitUntil:'domcontentloaded'});await page.waitForSelector('body.rentalAppReady');
  await page.evaluate(days=>{renderBookingItemsLite();pb857ApplyManualAvailability({items:[{itemId:'camera',valid:true,available:0,dailyAvailability:days}]})},days);
  await page.waitForTimeout(400);
  const actual=await page.locator('#bookingItems [data-booking-availability]').textContent();assert.match(actual,/ناموجود \/ کسری:/);assert.match(actual,/موجود:/);
  await page.evaluate(()=>{const input=document.querySelector('#bookingItems .bookingQty');input.value='2';input.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.waitForTimeout(100);assert.match(await page.locator('#bookingItems [data-booking-availability]').textContent(),/کسری ۲ عدد/);
  await page.close();
 }finally{await browser.close()}
});
test('mobile and desktop: staff and photographer cards show exact available/missing Persian days',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
   const page=await browser.newPage({viewport});
   await page.setContent('<div id="bookingItems"><label data-booking-item-id="camera"><input class="bookingItem" type="checkbox"><input class="bookingQty" value="1"><button data-booking-qty-delta="-1"></button><button data-booking-qty-delta="1"></button><small data-booking-availability></small></label></div>');
   await page.addScriptTag({content:`window.data={};window.pb837MountHeaderFilters=()=>{};window.pb837ActiveDesktopTab=()=>'';window.normalizeDigits=String;window.fa=String;`});
   await page.addScriptTag({content:shared});
   await page.addScriptTag({content:portal.match(/<script id="pb904r27Runtime">([\s\S]*?)<\/script>/)[1]});
   await page.evaluate(days=>pb857ApplyManualAvailability({items:[{itemId:'camera',available:0,valid:true,dailyAvailability:days}]}),days);
   const label=page.locator('[data-booking-availability]');
   const text=await label.textContent();assert.match(text,/ناموجود \/ کسری:/);assert.match(text,/موجود:/);
   const first=await page.evaluate(date=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'}).format(new Date(date+'T12:00:00Z')),days[0].date);
   assert(text.split('\n')[0].includes(first));assert(!text.split('\n')[1].includes(first));
   assert.equal(await page.locator('.bookingItem').isDisabled(),false);
   await page.locator('.bookingQty').fill('2');assert.match(await label.textContent(),/کسری ۲ عدد/);
   const shortage=await page.evaluate(()=>pbRentalShortageDatesText({shortage_days:[{date:'2030-10-12',quantity:2},{date:'2030-10-14',quantity:1}]}));
   assert.match(shortage,/روزهای نیاز به تأمین/);assert(shortage.includes(first));assert(!shortage.includes('۱۳'));
   // Photographer catalog and request summary use the same day data.
   await page.setContent('<section id="equipmentPanel"><input id="start" value="2030-10-12"><input id="end" value="2030-10-14"><div id="items"><label class="item"><input class="pick" value="camera"><span class="itemInfo"></span><input class="qty" value="1"></label></div></section>');
   await page.addScriptTag({content:`window.shopId='shop';window.items=[{id:'camera'}];window.jalaliInputToIso=String;window.renderItems=()=>{};window.onRentalDateChangedV811=()=>{};window.requests=[];window.api=async(url,options)=>{requests.push(JSON.parse(options.body));return {items:[{itemId:'camera',valid:true,dailyAvailability:${JSON.stringify(days)}}]}};`});
   await page.addScriptTag({content:shared});await page.waitForTimeout(260);
   const customer=page.locator('#items .pbRentalDailyDates');assert.equal(await customer.textContent(),text);
   await page.locator('.qty').fill('2');assert.match(await customer.textContent(),/کسری ۲ عدد/);
   await page.evaluate(()=>{document.getElementById('start').value='2030-10-13';onRentalDateChangedV811('start')});
   await page.waitForTimeout(260);assert.equal(await page.evaluate(()=>requests.at(-1).startDate),'2030-10-13');
   await page.close();
  }
 }finally{await browser.close()}
});
