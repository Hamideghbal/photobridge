const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.join(__dirname,'../dist/api/equipment-rental-portal.html'),'utf8');
const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(x=>`<style>${x[1]}</style>`).join('');
const details=html.match(/<script id="pbR100F71UnifiedHandoverRuntime">([\s\S]*?)<\/script>/)[1];
const begin=html.indexOf('  async function openBookingInvoice('),end=html.indexOf('  const oldDayRenderer=',begin);
assert(begin>=0&&end>begin);
const click=html.split('\n').find(x=>x.includes("document.addEventListener('click',e=>{const card=e.target.closest?.('[data-pb904r5-booking-id]')"));
test('calendar cards open issued invoices or read-only complete proforma, without invoice label',async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
  try{
    for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
      const page=await browser.newPage({viewport});
      await page.setContent(`<html><head>${styles}</head><body class="rentalAppReady pb899MainBookings"><div id="bookings"><button class="pb904r2DayBooking" data-pb904r5-booking-id="booking"><b>آتلیه تست</b></button></div></body></html>`);
      await page.addScriptTag({content:`
        window.data={bookings:[{id:'booking',photographer_name:'آتلیه تست',photographer_mobile:'09120000001',rental_start:'2026-10-10',rental_end:'2026-10-12',status:'reserved',total_amount:90000,gross_amount:100000,discount_amount:10000,deposit_amount:5000,notes:'توضیح آفیش <script>',items:[{itemId:'camera',title:'دوربین Canon',quantity:2,subtotal:90000,rental_days:3,daily_price:15000}]}],items:[]};
        window.accountingData={invoices:[]};window.opened=[];window.notices=[];window.refreshCount=0;
        window.money=n=>n+' تومان';window.statusLabel=s=>s;
        window.loadAccounting=async()=>{window.refreshCount++;if(window.failLoad)throw Error('offline');if(window.refreshedInvoice)accountingData.invoices=[window.refreshedInvoice]};
        window.pb922OpenInvoice=id=>window.opened.push(id);window.storeNotice=text=>window.notices.push(text);
        window.cancelCalls=[];window.acceptCancel=false;
        window.bookingStatus=async(id,status)=>{cancelCalls.push([id,status]);if(acceptCancel)data.bookings.find(x=>x.id===id).status=status};
      `});
      await page.addScriptTag({content:details});
      await page.addScriptTag({content:html.slice(begin,end)+click});
      const card=page.locator('[data-pb904r5-booking-id]');
      assert.notEqual(await card.evaluate(el=>getComputedStyle(el,'::after').content),'"مشاهده فاکتور"');
      await page.evaluate(()=>accountingData.invoices=[{id:'invoice',booking_id:'booking'}]);
      await card.click();
      assert.deepEqual(await page.evaluate(()=>opened),['invoice']);
      assert.equal(await page.locator('#pbR100F71Details.open').count(),0);
      await page.evaluate(()=>{accountingData.invoices=[];window.refreshedInvoice={id:'refreshed',booking_id:'booking'}});
      await card.click();
      await page.waitForFunction(()=>opened.includes('refreshed'));
      await page.evaluate(()=>{accountingData.invoices=[];window.refreshedInvoice=null});
      await card.click();
      await page.waitForSelector('#pbR100F71Details.open');
      assert.match(await page.locator('#pbR100F71Title').innerText(),/پیش‌فاکتور.*آتلیه تست/);
      const text=await page.locator('.pbR100F71Body').innerText();
      for(const value of ['09120000001','دوربین Canon','۹۰','اجاره روزانه: 15000 تومان', 'توضیح آفیش <script>','تخفیف','ودیعه']){
        // Amount fixtures deliberately use plain decimal digits.
        if(value==='۹۰')assert.match(text,/90000/);else assert(text.includes(value),value);
      }
      assert.equal(await page.locator('.pbR100F71Body script').count(),0,'booking text is escaped');
      assert.equal(await page.locator('[data-pb-r71-cancel]').count(),1);
      await page.locator('[data-pb-r71-cancel]').click();
      assert.equal(await page.locator('#pbR100F71Details.open').count(),1,'declined confirmation preserves preview');
      await page.evaluate(()=>window.acceptCancel=true);
      await page.locator('[data-pb-r71-cancel]').click();
      await page.waitForFunction(()=>!document.querySelector('#pbR100F71Details.open'));
      assert.deepEqual(await page.evaluate(()=>cancelCalls),[['booking','cancelled'],['booking','cancelled']]);
      for(const status of ['picked_up','returned','cancelled','rejected']){
        await page.evaluate(status=>{data.bookings[0].status=status;window.pbR100F71OpenBookingDetails('booking',{proforma:true})},status);
        assert.equal(await page.locator('[data-pb-r71-cancel]').count(),0,'protected/closed bookings have no deletion action');
        await page.locator('.pbR100F71Close').click();
      }
      await page.evaluate(()=>window.failLoad=true);
      await card.click();
      await page.waitForFunction(()=>notices.length>0);
      assert.equal(await page.locator('#pbR100F71Details.open').count(),0,'lookup failure must not masquerade as unissued invoice');
      await page.close();
    }
  }finally{await browser.close()}
});
