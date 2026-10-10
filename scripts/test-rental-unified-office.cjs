const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.join(__dirname,'../dist/api/equipment-rental-portal.html'),'utf8');
const styles=[...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(x=>x[0]).join('');
const staff=html.match(/<script id="pbR100F9StaffScript">([\s\S]*?)<\/script>/)[1];
const initialCalendar=html.split('\n').find(x=>x.includes("calendar.innerHTML='<div class=\"box pb843BookingCalendarBox"));
test('one Office tab, explicit pickup/return actions and compact mobile calendar',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
  const page=await browser.newPage({viewport});
  await page.setContent(`<head>${styles}</head><body class="rentalAppReady pbR100F9StaffMode"><main id="app"></main></body>`);
  await page.addScriptTag({content:`window.data={shop:{name:'Test Shop'},staffMode:true,bookings:[{id:'reserved',status:'reserved',rental_start:'2030-10-12',rental_end:'2030-10-14'},{id:'out',status:'picked_up',rental_start:'2030-10-12',rental_end:'2030-10-14'},{id:'returned',status:'returned',rental_start:'2030-10-12',rental_end:'2030-10-14'}]};window.actions=[];window.api=async()=>data;window.bookingStatus=async(id,status)=>actions.push([id,status]);`});
  await page.addScriptTag({content:staff});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r100f86-shared-handover.js')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r100f74-staff-ui.js')});
  await page.evaluate(()=>{pbR100F9RenderStaffPortal();pbR100F89PickStaffDay('2030-10-12')});
  assert.deepEqual(await page.locator('.pbR100F9StaffTabs button').allTextContents(),['آفیش']);
  assert.equal(await page.locator('[data-booking="reserved"]').textContent(),'ثبت تحویل تجهیزات');
  assert.equal(await page.locator('[data-booking="out"]').textContent(),'ثبت دریافت تجهیزات');
  await page.locator('[data-booking="reserved"]').dispatchEvent('click');await page.waitForFunction(()=>actions.length===1);
  await page.locator('[data-booking="out"]').dispatchEvent('click');await page.waitForFunction(()=>actions.length===2);
  assert.deepEqual(await page.evaluate(()=>actions),[['reserved','picked_up'],['out','returned']]);
  assert.equal(await page.evaluate(()=>pbR100F89ActiveStaffDay),'2030-10-12');
  await page.evaluate(()=>pbR100F89PickStaffDay('2030-10-14'));
  assert.equal(await page.locator('[data-pb915-booking-id="returned"]').count(),1);
  assert.match(await page.locator('[data-pb915-booking-id="returned"] .pbR100F9StaffState').textContent(),/دریافت شده/);
  assert.equal(await page.locator('[data-booking="out"]').count(),1);
  await page.setContent(`<head>${styles}</head><body class="rentalAppReady pb899MainBookings"><section id="bookings" class="active"><div id="pb848BookingHeaderTabs">${['calendar','approved','out'].map(k=>`<button data-pb843-office-tab="${k}">${k}</button>`).join('')}</div><div id="calendarHost"></div></section></body>`);
  await page.addScriptTag({content:`const jalaliWeekdays=['ش','ی','د','س','چ','پ','ج'];${initialCalendar};document.getElementById('calendarHost').append(calendar);`});
  for(const key of ['approved','out'])assert.equal(await page.locator('[data-pb843-office-tab="'+key+'"]').evaluate(x=>getComputedStyle(x).display),'none');
  assert.equal(await page.locator('[data-pb843-office-tab="calendar"]').evaluate(x=>getComputedStyle(x).display==='none'),false);
  if(viewport.width<851){
   assert.equal(await page.locator('#pb904r2DayPanel').evaluate(x=>getComputedStyle(x).display),'none');
   assert.equal(await page.locator('#pb904r2DayPanel').evaluate(x=>x.getBoundingClientRect().height),0);
   assert.equal(await page.locator('body').textContent().then(x=>x.includes('یک تاریخ را انتخاب کن')||x.includes('روی یک روز از تقویم بزن.')),false);
  }
  await page.close();
 }}finally{await browser.close()}
});
