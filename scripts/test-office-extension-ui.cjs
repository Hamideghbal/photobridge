// Full shipped portal, isolated API responses: no production data or writes.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
test('mobile/desktop extension calendar selects a chain and blocks unavailable equipment',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'}),writes=[],errors=[];
   page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname.startsWith('/api/')){
     let body={};
     if(u.pathname==='/api/auth/me')body={user:{id:'manager',name:'Manager'},rentalShop:{id:'shop',name:'Seven'}};
     if(u.pathname==='/api/rental/overview')body={shop:{id:'shop',name:'Seven',rental_enabled:true,sale_enabled:true,active:true,activation_status:'approved'},items:[],saleItems:[],bookings:[],photographers:[],plans:[],renewals:[],collaborationRequests:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
     if(u.pathname.endsWith('/extension')){
      if(route.request().method()==='POST'){writes.push(JSON.parse(route.request().postData()));body={ok:true,id:'new-booking'}}
      else {const days=Math.round((Date.parse(u.searchParams.get('endDate'))-Date.parse('2030-10-13'))/86400000)+1;body={items:[{itemId:'camera',title:'Camera',requested:1,subtotal:100*days,extendable:true},{itemId:'lens',title:'Lens',requested:1,subtotal:200*days,extendable:days===1,extensionReason:days===1?null:'equipment_unavailable'}]}}
     }
     if(u.pathname.endsWith('/edit')){
      if(route.request().method()==='PUT'){writes.push(JSON.parse(route.request().postData()));body={ok:true}}
      else body={revision:'draft-revision',startDate:'2030-10-13',endDate:'2030-10-13',items:[{itemId:'lens',quantity:1}],catalog:[{id:'camera',title:'Camera'},{id:'lens',title:'Lens'}]};
     }
     return route.fulfill({json:body});
    }
    if(u.pathname==='/rental/test')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8')});
    const file=path.join(root,'dist/web',u.pathname.slice(1));
    if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
    return route.fulfill({status:404,body:''});
   });
   await page.goto('https://extension.test/rental/test');await page.waitForFunction(()=>typeof pbRentalOpenExtension==='function');
   await page.evaluate(()=>{data.bookings=[{id:'booking',customer_name:'Customer',status:'picked_up',rental_end:'2030-10-12',handover_serials:[{itemId:'camera'},{itemId:'lens'}]}];window.pb100rPrintInvoice=id=>window.lastExtensionInvoice=id;const card=document.createElement('div');card.dataset.officeBookingId='booking';card.id='extensionFixture';document.body.append(card)});
   await page.locator('#extensionFixture .pbOfficeExtendButton').click();
   await page.waitForTimeout(500);assert.equal(await page.locator('[data-ext-item="camera"]').count(),1,JSON.stringify({errors,html:await page.locator('#pbOfficeExtension').innerHTML().catch(()=> 'missing')}));assert.equal(await page.locator('[data-ext-day="2030-10-12"]').isDisabled(),true);
   await page.locator('[data-ext-day="2030-10-15"]').click();await page.waitForFunction(()=>document.querySelector('[data-ext-item="lens"]')?.disabled===true);
   for(const day of ['2030-10-13','2030-10-14','2030-10-15'])assert.equal(await page.locator(`[data-ext-day="${day}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('.extItem.blocked').count(),1);assert.equal(await page.locator('.extSubmit').isDisabled(),true);
   const box=await page.locator('.extDialog').boundingBox();assert(box.x>=0&&box.x+box.width<=viewport.width);
   if(viewport.width>850){const cal=await page.locator('.extCalendar').boundingBox(),items=await page.locator('.extItems').boundingBox();assert(cal.x>items.x)}
   await page.locator('[data-ext-item="camera"]').check();await page.locator('.extSubmit').click();await page.waitForFunction(()=>window.lastExtensionInvoice==='new-booking');
   assert.equal(writes.length,1);assert.deepEqual(writes[0].itemIds,['camera']);assert.equal(writes[0].endDate,'2030-10-15');assert.match(writes[0].requestId,/^[0-9a-f-]{36}$/);
   assert.equal(await page.locator('#pbOfficeExtension').count(),0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   await page.evaluate(()=>{
    data.bookings=['reserved','picked_up','returned','cancelled'].map((status,i)=>({id:'state-'+i,customer_name:'Customer',status,rental_start:'2030-10-13',rental_end:'2030-10-13',handover_serials:[{itemId:'camera'}]}));
    for(const b of data.bookings){const card=document.createElement('article');card.id=b.id;if(b.status==='picked_up'){card.className='pbR1052DayGroup';card.innerHTML='<div data-pb904r5-booking-id="'+b.id+'"></div><div class="pbR1052DayActions" data-office-booking-id="'+b.id+'"></div>'}else{card.dataset.pb915BookingId=b.id;card.innerHTML='<div data-pb904r5-booking-id="'+b.id+'"><div class="actions" data-office-booking-id="'+b.id+'"></div></div>'}document.body.append(card)}
   });
   await page.waitForFunction(()=>document.querySelector('#state-0 .pbOfficeExtendButton'));
   assert.equal(await page.locator('#state-0 .pbOfficeExtendButton').count(),1);assert.equal(await page.locator('#state-0 .pbOfficeExtendButton').textContent(),'ویرایش آفیش');
   assert.equal(await page.locator('#state-1 .pbOfficeExtendButton').count(),1);assert.equal(await page.locator('#state-1 .pbOfficeExtendButton').textContent(),'تمدید آفیش');
   assert.equal(await page.locator('#state-2 .pbOfficeExtendButton,#state-3 .pbOfficeExtendButton').count(),0);
   await page.locator('#state-0 .pbOfficeExtendButton').click();await page.locator('[data-edit-item="camera"]').waitFor();
   await page.locator('#pbOfficeExtension input[name=startDate]').click();await page.locator('#jalaliCalendarPopover.open [data-jalali-day="24"]').click();
   const chosenStart=await page.evaluate(()=>jalaliInputToIso(document.querySelector('#pbOfficeExtension input[name=startDate]').value));
   await page.evaluate(start=>{document.querySelector('#pbOfficeExtension input[name=endDate]').value=isoToJalaliInput(start)},chosenStart);
   await page.locator('[data-edit-item="lens"]').fill('0');await page.locator('[data-edit-item="camera"]').fill('2');await page.locator('#pbOfficeExtension [type=submit]').click();
   await page.waitForFunction(()=>!document.getElementById('pbOfficeExtension'));assert.equal(writes.length,2);assert.equal(writes[1].revision,'draft-revision');assert.deepEqual(writes[1].items,[{itemId:'camera',quantity:2}]);assert.equal(writes[1].startDate,chosenStart);assert.equal(writes[1].endDate,chosenStart);
   assert.deepEqual(errors,[]);await page.close();
  }
 }finally{await browser.close()}
});
