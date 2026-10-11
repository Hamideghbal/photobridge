const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function serve(page,html,api){const target=html.endsWith('-book.html')?'/equipment-rental/book':'/test';await page.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.startsWith('/api/'))return route.fulfill({json:await api(url,route.request())});
 if(url.pathname===target)return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,html),'utf8')});
 const file=path.join(root,'dist/web',url.pathname.slice(1));
 if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
 return route.fulfill({status:404,body:''});
});await page.goto('https://layout.test'+target);}
test('Office list scrolls independently with many cards, without shrinking or overlapping cards',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const height of [768,600]){
 const page=await browser.newPage({viewport:{width:1366,height},serviceWorkers:'block'});let signed=false;
 const shop={id:'shop',name:'Seven',active:true,activation_status:'approved',rental_enabled:true,sale_enabled:true};
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const bookings=Array.from({length:30},(_,i)=>({id:'booking-'+i,status:'reserved',customer_name:'عکاسی '+i,rental_start:day,rental_end:day,item_titles:'دوربین Sony Alpha 7R VI ×1، لنز Canon RF 85mm ×2',items:[],has_invoice:false}));
 await serve(page,'dist/api/equipment-rental-portal.html',async(u)=>{
 if(u.pathname==='/api/auth/rental-login'){signed=true;return {ok:true}}
 if(u.pathname==='/api/auth/me')return signed?{user:{id:'manager',name:'Manager'},rentalShop:shop}:{};
 if(u.pathname==='/api/rental/overview')return {shop,bookings,items:[],photographers:[],plans:[],renewals:[],saleItems:[],collaborationRequests:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
 return {};
 });
 await page.locator('#loginForm input[name=mobile]').fill('09123456789');await page.locator('#loginForm input[name=password]').fill('test');await page.locator('#loginForm').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 await page.waitForFunction(()=>document.body.classList.contains('rentalAppReady'));
 await page.evaluate(day=>{selectRentalTab('bookings',{reloadExtra:false});pb843SetOfficeTab('calendar');pb904r2RenderDayPanel(day)},day);
 await page.waitForSelector('#pb904r2DayPanelBody .pbR1052DayGroup',{timeout:8000});await page.waitForTimeout(300);
 const geometry=await page.locator('#pb904r2DayPanelBody').evaluate(list=>{
 const rows=[...list.children].map(x=>x.getBoundingClientRect().toJSON());
 return {height:list.clientHeight,scroll:list.scrollHeight,overflow:getComputedStyle(list).overflowY,rows,viewport:innerHeight,panel:list.getBoundingClientRect().toJSON()};
 });
 assert.equal(geometry.rows.length,30);assert(geometry.height>80,JSON.stringify(geometry));assert(geometry.scroll>geometry.height+200,JSON.stringify(geometry));assert.equal(geometry.overflow,'auto');
 geometry.rows.forEach((row,i)=>{assert(row.height>=55,JSON.stringify(row));if(i)assert(row.top>=geometry.rows[i-1].bottom+4,'cards must not overlap')});
 await page.locator('#pb904r2DayPanelBody').evaluate(el=>el.scrollTop=el.scrollHeight);
 assert(await page.locator('#pb904r2DayPanelBody').evaluate(el=>el.scrollTop>0));
 const last=await page.locator('#pb904r2DayPanelBody').evaluate(el=>({card:el.lastElementChild.getBoundingClientRect().bottom,list:el.getBoundingClientRect().bottom}));assert(last.card<=last.list+1,JSON.stringify(last));
 await page.evaluate(()=>data.shop.customer_rental_stock_mode='strict');
 await page.waitForFunction(()=>document.body.classList.contains('pbR1097StrictStock'));
 assert(!await page.locator('[data-pb843-office-tab=shortages]').isVisible(),await page.locator('[data-pb843-office-tab=shortages]').evaluate(el=>JSON.stringify({html:el.outerHTML,parents:[el.parentElement.id,el.parentElement.parentElement.id],display:getComputedStyle(el).display,body:document.body.className})));
 await page.evaluate(()=>data.shop.customer_rental_stock_mode='flexible');
 await page.waitForFunction(()=>!document.body.classList.contains('pbR1097StrictStock'));
 assert(await page.locator('[data-pb843-office-tab=shortages]').isVisible());
 await page.close();
 }
 }finally{await browser.close()}
});
test('customer inventory is private: strict blocks unavailable items, flexible permits requests, both await approval',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const viewport of [{width:390,height:844},{width:1366,height:768}])for(const mode of ['flexible','strict']){
 const page=await browser.newPage({viewport,serviceWorkers:'block'});let free=0;
 await serve(page,'dist/api/equipment-rental-book.html',async(u,req)=>{
 if(u.pathname==='/api/auth/me')return {user:{name:'Studio'}};
 if(u.pathname==='/api/photographer/navigation-tabs')return {tabs:{ai:false,album:false,instagram:false},adminBypass:false};
 if(u.pathname==='/api/customer/equipment-rental/availability')return {available:free>0,rentalDays:1,totalAmount:100,depositAmount:0,items:[{itemId:'camera',title:'Camera',requested:1,dailyPrice:100,subtotal:100,available:free,shortage:free>0?0:1,valid:true,dailyAvailability:[{date:'2030-10-13',available:free,shortage:free>0?0:1}]}]};
 return {};
 });
 await page.waitForFunction(()=>window.__PB_R1096_SHOPPER_CHANNELS__);
 await page.waitForFunction(()=>document.querySelectorAll('#photographerStoreBottomNav [data-pb1099-hidden]').length===3);
 assert.equal(await page.locator('#photographerStoreBottomNav .photographerBottomAppNavGrid').evaluate(el=>el.style.getPropertyValue('--pb1099-tabs')),'3');
 await page.evaluate(mode=>{shopId='shop';shops=[{id:'shop',name:'Seven',customer_rental_stock_mode:mode,rental_enabled:true,sale_enabled:false}];items=[{id:'camera',title:'Camera',brand:'Sony',category:'camera',stock_total:2,daily_price:100}];document.querySelector('#start').value=isoToJalaliInput('2030-10-13');document.querySelector('#end').value=isoToJalaliInput('2030-10-13');leaveStoreChooserR96();document.querySelector('#equipmentFlow').style.display='';renderItems();openStoreSection('equipmentPanel');},mode);
 if(mode==='strict')await page.waitForFunction(()=>document.querySelector('#items .item')?.classList.contains('pbRentalItemUnavailable'));
 else await page.waitForSelector('#pbR1095CustomerNote',{state:'attached'});
 const card=page.locator('#items .item');if(mode==='strict'){assert.match(await card.textContent(),/موجود نمی‌باشد/);assert.equal(await card.locator('.itemInfo>b').evaluate(el=>getComputedStyle(el).color),'rgb(180, 35, 24)')}else{assert(!await card.evaluate(el=>el.classList.contains('pbRentalItemUnavailable')));assert(!/موجود نمی‌باشد/.test(await card.textContent()))}
 assert(!/موجودی|باقی‌مانده|کسری/.test(await card.textContent()));
 assert.match(await page.locator('#pbR1095CustomerNote').textContent(),/موقت.*نهایی نیست.*تأیید یا رد/);
 assert.equal(await card.locator('input.pick').isDisabled(),mode==='strict','flexible mode still permits a shortage request');
 await page.evaluate(()=>document.querySelector('#equipmentPanel').classList.add('pbR63OfficeOpen'));
 const control=page.locator('#equipmentPanel .pbR68SubmitBtn');assert(await control.isVisible());
 assert(await control.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=14),await control.evaluate(el=>JSON.stringify({html:el.outerHTML,font:getComputedStyle(el).fontSize,css:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].filter(r=>r.selectorText&&el.matches(r.selectorText)&&r.style.fontSize).map(r=>r.cssText)}catch{return []}})})));
 assert(await page.locator('#equipmentPanel .pbR68FilterBtn b').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=14));
 if(viewport.width<851)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page must not overflow horizontally');
 free=2;await page.evaluate(()=>{document.querySelector('#end').value=isoToJalaliInput('2030-10-14');document.querySelector('#end').dispatchEvent(new Event('change',{bubbles:true}))});
 await page.waitForFunction(()=>!document.querySelector('#items .item').classList.contains('pbRentalItemUnavailable')&&!document.querySelector('#items .pick').disabled);
 assert(!await card.locator('input.pick').isDisabled());
 assert(!/موجودی|باقی‌مانده|کسری/.test(await card.textContent()));
 await card.locator('input.pick').check();await page.evaluate(()=>openRentalRequestV809());
 await page.waitForTimeout(200);assert(!/موجودی|باقی‌مانده|کسری/.test(await page.locator('#rentalRequestLinesV809').textContent()));
 await page.evaluate(()=>{saleItems=[{id:'sale-camera',title:'Camera',category:'camera',stock_total:15,sale_price:100}];renderSales()});
 assert(!/موجودی/.test(await page.locator('#saleItems').textContent()));
 assert.match(await page.locator('#rentalRequestModalV809').textContent(),/قطعی نیست|نهایی|تأیید فروشگاه/);
 await page.close();
 }
 }finally{await browser.close()}
});
