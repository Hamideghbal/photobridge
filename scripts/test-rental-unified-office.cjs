const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.join(__dirname,'../dist/api/equipment-rental-portal.html'),'utf8');
const styles=[...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(x=>x[0]).join('');
const staff=html.match(/<script id="pbR100F9StaffScript">([\s\S]*?)<\/script>/)[1];
const ensureTabs=html.split('\n').find(x=>x.startsWith('function pb854EnsureBookingStatusTabs()'));
const picker=html.slice(html.indexOf('const jDiv='),html.indexOf('const pbR100F11StaffQuery'))+'';
const pickerHelpers=html.split('\n').filter(x=>x.startsWith('const normalizeDigits=')||x.startsWith('const dateObj=')).join('\n');
const initialCalendar=html.split('\n').find(x=>x.includes("calendar.innerHTML='<div class=\"box pb843BookingCalendarBox"));
test('requests precede Office, mobile day strip stays readable and registration opens an independent calendar',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
  const page=await browser.newPage({viewport});
  await page.setContent(`<head>${styles}</head><body class="rentalAppReady pbR100F9StaffMode"><main id="app"></main></body>`);
  await page.addStyleTag({path:path.join(__dirname,'../dist/web/photobridge-r100f86-shared-handover.css')});
  await page.addStyleTag({path:path.join(__dirname,'../dist/web/photobridge-r1073-mobile-office.css')});
  await page.addScriptTag({content:`window.data={shop:{name:'Test Shop'},staffMode:true,bookings:[{id:'reserved',status:'reserved',rental_start:'2030-10-12',rental_end:'2030-10-14'},{id:'out',status:'picked_up',rental_start:'2030-10-12',rental_end:'2030-10-14'},{id:'returned',status:'returned',rental_start:'2030-10-12',rental_end:'2030-10-14'}]};window.actions=[];window.api=async()=>data;window.bookingStatus=async(id,status)=>actions.push([id,status]);`});
  await page.addScriptTag({content:staff});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r100f72-staff-views.js')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r100f86-shared-handover.js')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r100f74-staff-ui.js')});
  await page.evaluate(()=>{pbR100F9RenderStaffPortal();pbR100F89PickStaffDay('2030-10-12')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r1073-mobile-office.js')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r100f89-staff-desktop-calendar.js')});
  await page.evaluate(()=>{const tabs=document.querySelector('.pbR100F9StaffTabs');const stale=document.createElement('button');stale.dataset.staffMode='in';stale.textContent='دریافت';tabs.append(stale);pbR1073PaintMobileOffice()});
  assert.deepEqual(await page.locator('.pbR100F9StaffTabs button').allTextContents(),['آفیش','کسری دریافت']);
  if(viewport.width<851){
   assert.equal(await page.locator('#pbR1079OperatorNav .pbR100F9StaffTabs').count(),1);
   const bar=await page.locator('#pbR1079OperatorNav').boundingBox();assert(Math.abs(bar.y+bar.height-viewport.height)<2);
   await page.locator('[data-staff-mode=returnShortages]').click();await page.waitForSelector('#pbR100F72ExtraPane:not([hidden])');
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('pbR100F72ExtraActive')),true);
   await page.locator('[data-staff-mode=out]').click();await page.evaluate(()=>pbR100F89PickStaffDay('2030-10-12'));assert.equal(await page.locator('#pbR100F72ExtraPane').isVisible(),false);
  }
  await page.evaluate(()=>{const stale=document.createElement('button');stale.className='pbOfficeExtendButton';document.getElementById('pbR100F9StaffList').append(stale)});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r1059-office-extension.js')});
  await page.waitForFunction(()=>!document.querySelector('.pbOfficeExtendButton'));
  assert.equal(await page.locator('[data-booking="reserved"]').textContent(),'تحویل تجهیزات به مشتری');
  assert.equal(await page.locator('[data-booking="out"]').textContent(),'دریافت زودهنگام تجهیزات');
  await page.locator('[data-booking="reserved"]').dispatchEvent('click');await page.waitForFunction(()=>actions.length===1);
  await page.locator('[data-booking="out"]').dispatchEvent('click');await page.waitForFunction(()=>actions.length===2);
  assert.deepEqual(await page.evaluate(()=>actions),[['reserved','picked_up'],['out','returned']]);
  assert.equal(await page.evaluate(()=>pbR100F89ActiveStaffDay),'2030-10-12');
  if(viewport.width<851){
   assert.equal(await page.locator('#pbR100F9StaffDates').evaluate(el=>getComputedStyle(el).overflowX),'auto');
   assert.equal(await page.locator('#pbR100F9StaffDates>button').first().evaluate(el=>Math.round(el.getBoundingClientRect().height)),48);
   assert.equal(await page.locator('#pbR100F9StaffDates>button.active strong').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  }
  await page.evaluate(()=>pbR100F89PickStaffDay('2030-10-14'));
  assert.equal(await page.locator('[data-pb915-booking-id="returned"]').count(),1);
  assert.match(await page.locator('[data-pb915-booking-id="returned"] .pbR100F9StaffState').textContent(),/دریافت شده/);
  assert.equal(await page.locator('[data-booking="out"]').count(),1);
  assert.equal(await page.locator('[data-booking="out"]').textContent(),'دریافت تجهیزات از مشتری');
  const colors=await page.evaluate(()=>[...document.querySelectorAll('[data-booking="reserved"],[data-booking="out"]')].map(b=>getComputedStyle(b).backgroundColor));assert.equal(colors.length,2);assert.notEqual(colors[0],colors[1]);
  const priorOrder=await page.locator('#pbR100F9StaffList>[data-pb915-booking-id]').evaluateAll(cards=>cards.map(c=>c.dataset.pb915BookingId));
  await page.evaluate(()=>{data.bookings.find(b=>b.id==='out').status='returned';data.bookings.reverse();pbR100F9PaintStaffList()});
  assert.deepEqual(await page.locator('#pbR100F9StaffList>[data-pb915-booking-id]').evaluateAll(cards=>cards.map(c=>c.dataset.pb915BookingId)),priorOrder);
  if(viewport.width>850)assert.equal(await page.locator('[data-pb89-day="2030-10-13"] small').textContent(),'۳ آفیش');
  assert.equal(await page.evaluate(()=>pbR100F89ActiveStaffDay),'2030-10-14');assert.match(await page.locator('[data-pb915-booking-id="out"] .pbR100F9StaffState').textContent(),/دریافت شده/);

  await page.setContent(`<head>${styles}</head><body class="rentalAppReady pb899MainBookings"><section id="bookings" class="active"><div id="rentalHeaderFilterHost"><div id="pb848BookingHeaderTabs">${['calendar','approved','out'].map(k=>`<button data-pb843-office-tab="${k}">${k}</button>`).join('')}</div></div><div id="calendarHost"></div></section></body>`);
  await page.addScriptTag({content:`const jalaliWeekdays=['ش','ی','د','س','چ','پ','ج'];${initialCalendar};document.getElementById('calendarHost').append(calendar);`});
  assert.equal(await page.locator('[data-pb843-office-tab="calendar"]').evaluate(x=>getComputedStyle(x).display==='none'),false);
  if(viewport.width<851){
   assert.equal(await page.locator('#pb904r2DayPanel').evaluate(x=>getComputedStyle(x).display),'none');
   assert.equal(await page.locator('#pb904r2DayPanel').evaluate(x=>x.getBoundingClientRect().height),0);
   assert.equal(await page.locator('body').textContent().then(x=>x.includes('یک تاریخ را انتخاب کن')||x.includes('روی یک روز از تقویم بزن.')),false);
  }
  await page.addStyleTag({path:path.join(__dirname,'../dist/web/photobridge-r100f86-shared-handover.css')});
  await page.addStyleTag({path:path.join(__dirname,'../dist/web/photobridge-r1073-mobile-office.css')});
  await page.addScriptTag({content:`window.data={bookings:[{id:'first',status:'reserved',rental_start:'2030-10-12',rental_end:'2030-10-12',photographer_name:'First'},{id:'second',status:'picked_up',rental_start:'2030-10-13',rental_end:'2030-10-14',photographer_name:'Second'}]};window.pbR17TehranIsoDate=()=> '2030-10-12';window.registered=[];window.pbR1076RegisterOfficeDays=ds=>registered.push(ds);`});
  await page.evaluate(()=>{const nav=document.createElement('nav');nav.id='rentalMobileBottomNav';nav.className='rentalMobileBottomNav';nav.innerHTML='<button data-rental-bottom-tab="items">اجاره تجهیزات</button><button data-rental-bottom-tab="sales" hidden data-pb-channel-off="true">فروش تجهیزات</button><button data-rental-bottom-tab="bookings">آفیش</button><button data-rental-bottom-tab="photographers">عکاس</button><button data-rental-bottom-tab="accounting">حسابداری</button>';document.body.append(nav)});
  await page.addScriptTag({path:path.join(__dirname,'../dist/web/photobridge-r1073-mobile-office.js')});
  await page.evaluate(()=>pbR1073PaintMobileOffice());
  await page.addScriptTag({content:`window.$=s=>document.querySelector(s);window.pb854RenderBookingStatusPanes=()=>{};${ensureTabs}`});
  // Exercise the actual legacy renderer repeatedly, not just CSS visibility.
  await page.evaluate(()=>{for(let i=0;i<3;i++){pb854EnsureBookingStatusTabs();pbR1073PaintMobileOffice()}});
  for(const key of ['approved','out']){
   assert.equal(await page.locator('[data-pb843-office-tab="'+key+'"]').count(),0);
   assert.equal(await page.locator('[data-pb843-office-pane="'+key+'"]').count(),1);
  }
  assert.equal(await page.locator('[data-pb843-office-tab="calendar"]').count(),1);
  await page.evaluate(()=>{const tab=document.createElement('button');tab.dataset.pb843OfficeTab='returnShortages';tab.textContent='کسری دریافت';document.getElementById('pb848BookingHeaderTabs').append(tab);pbR1073PaintMobileOffice()});
  assert.deepEqual(await page.locator('#pb848BookingHeaderTabs>button').evaluateAll(bs=>bs.filter(b=>getComputedStyle(b).display!=='none').map(b=>b.dataset.pb843OfficeTab)),['pending','calendar','shortages','returnShortages']);
  if(viewport.width<851){
   assert.equal(await page.locator('.pb904r2CalendarSplit').evaluate(x=>getComputedStyle(x).display),'none');
   const widths=await page.locator('#rentalMobileBottomNav>button:not([hidden]):not([data-rental-bottom-tab="photographers"])').evaluateAll(buttons=>buttons.map(b=>b.getBoundingClientRect().width));
   assert.equal(widths.length,3);assert(widths.every(w=>Math.abs(w-widths[0])<2));
   const nav=await page.locator('#rentalMobileBottomNav').evaluate(el=>({width:el.getBoundingClientRect().width,padding:parseFloat(getComputedStyle(el).paddingLeft)+parseFloat(getComputedStyle(el).paddingRight),gap:parseFloat(getComputedStyle(el).columnGap)||0,display:getComputedStyle(el).display}));
   assert(Math.abs(widths.reduce((a,b)=>a+b,0)+nav.padding+2*nav.gap-nav.width)<3,JSON.stringify({widths,nav}));
   assert.equal(await page.locator('#pbR1073OfficeRows [data-pb915-booking-id="first"]').count(),1);
   await page.addScriptTag({content:`(()=>{let jalaliPickerInput=null,jalaliPickerYear=null,jalaliPickerMonth=null;${pickerHelpers};const fa=x=>String(x);${picker};pbR17TehranIsoDate=window.pbR17TehranIsoDate;window.openJalaliCalendar=openJalaliCalendar;window.jalaliInputToIso=jalaliInputToIso;window.isoToJalaliInput=isoToJalaliInput;window.pickRegistrationDay=chooseJalaliDay;window.dateParts=jalaliPartsFromIso;window.jalaliPartsFromIso=jalaliPartsFromIso;window.jalaliMonthLength=jalaliMonthLength;})();`});
   assert.equal(await page.locator('#pb848BookingHeaderTabs').evaluate(el=>getComputedStyle(el).overflowX),'hidden');
   assert.equal(await page.locator('#pbR1073OfficeRail').evaluate(el=>getComputedStyle(el).scrollbarWidth),'none');
   assert.equal(await page.locator('#pbR1073OfficeRail button.active strong').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
   await page.locator('#pbR1073Register').click();
   await page.waitForSelector('#pbR1076Registration');assert.deepEqual(await page.evaluate(()=>registered),[]);
   assert.equal(await page.locator('[data-register-next]').isDisabled(),true);
   await page.locator('[data-register-close]').click();assert.deepEqual(await page.evaluate(()=>registered),[]);

   await page.locator('[data-office-day="2030-10-13"]').click();
   assert.equal(await page.locator('#pbR1073OfficeRows [data-pb915-booking-id="first"]').count(),0);
   assert.equal(await page.locator('#pbR1073OfficeRows [data-pb915-booking-id="second"]').count(),1);
   assert.match(await page.locator('#pbR1073OfficeRows').textContent(),/دریافت زودهنگام تجهیزات/);
   await page.evaluate(()=>pbR1073PaintMobileOffice());assert.equal(await page.locator('[data-office-day="2030-10-13"]').getAttribute('class').then(x=>x.includes('active')),true);
   await page.locator('#pbR1073Register').click();await page.waitForSelector('#pbR1076Registration');
   await page.locator('[data-register-day="2030-10-12"]').click();
   await page.locator('[data-register-day="2030-10-14"]').click();
   assert.equal(await page.locator('[data-register-day="2030-10-12"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('[data-register-day="2030-10-14"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-register-next]').click();assert.deepEqual(await page.evaluate(()=>registered),[]);
   assert.match(await page.locator('#pbR1076Registration [role=alert]').textContent(),/پشت سر هم/);
   await page.locator('[data-register-day="2030-10-13"]').click();
   await page.locator('[data-register-next]').click();
   assert.deepEqual(await page.evaluate(()=>registered),[['2030-10-12','2030-10-13','2030-10-14']]);
   assert.equal(await page.locator('#pbR1076Registration').count(),0);
   await page.locator('#pbR1073Register').click();
   const boundary=await page.evaluate(()=>{const p=jalaliPartsFromIso('2030-10-12'),last=jalaliInputToIso(`${p.year}/${p.month}/${jalaliMonthLength(p.year,p.month)}`);return[last,new Date(Date.parse(last+'T12:00:00Z')+86400000).toISOString().slice(0,10)]});
   await page.locator('[data-register-day="'+boundary[0]+'"]').click();await page.locator('[data-register-month="1"]').click();
   await page.locator('[data-register-day="'+boundary[1]+'"]').click();await page.locator('[data-register-month="-1"]').click();
   assert.equal(await page.locator('[data-register-day="'+boundary[0]+'"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-register-next]').click();assert.deepEqual(await page.evaluate(()=>registered[1]),boundary);

   const tabFit=await page.locator('#pb848BookingHeaderTabs').evaluate(el=>el.scrollWidth<=el.clientWidth);assert.equal(tabFit,true);
   assert.equal(await page.locator('[data-office-day="2030-10-13"]').getAttribute('class').then(x=>x.includes('active')),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

  }else assert.equal(await page.locator('#pbR1073MobileOffice').count(),0);
  await page.close();
 }}finally{await browser.close()}
});
