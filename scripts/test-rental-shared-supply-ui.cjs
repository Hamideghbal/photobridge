const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8'),start=html.indexOf('(()=>{if(window.__PB_R91_ASSET_SCAN__)');
const runtime=html.slice(start,html.indexOf('</script>',start));
const financeStart=html.indexOf('(()=>{',html.indexOf('<script id="pb922FormalFinanceRuntime">')),finance=html.slice(financeStart,html.indexOf('</script>',financeStart));
test('real pickup dialog chooses shared external or owned unit and inventory shows actual customer',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
   const page=await browser.newPage({viewport});
   await page.setContent('<div id="itemsList"><article class="rentalItemCard"><button onclick="editItem(\'camera\')">Edit</button></article></div>');
   await page.addScriptTag({content:`window.calls=[];window.data={bookings:[{id:'b',status:'reserved'},{id:'a',status:'reserved'}],assets:[{item_id:'camera',current_booking_id:'a',system_code:'CAM-1',customer_name:'Actual A'}],externalSupplyHolders:[{itemId:'camera',bookingId:'b',customerName:'Actual B',code:'supplier note'}]};window.fa=String;window.dateFa=String;window.renderItems=()=>{};window.esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));window.load=async()=>{};window.notices=[];window.details=[];window.storeNotice=(...args)=>notices.push(args);window.pb916ShowBookingDetails=id=>details.push(id);window.bookingStatus=()=>{};window.accountingData=null;window.money=String;window.pb923EquipmentName=x=>x.title;window.pb921ReturnDeadline=()=>null;
    window.fetch=async url=>({ok:true,json:async()=>String(url).includes('by-code')?{asset:{id:'asset',item_id:'camera',system_code:'CAM-1',serial_number:'serial'}}:{items:[{itemId:'camera',title:'Camera',quantity:1,externalSupplyQty:0,pendingSupplyQty:0,assets:[],supplyOptions:[{id:'source',itemId:'camera',bookingId:'a',plannedCustomer:'Planned A',availableQuantity:1,supplied:false,startDate:'2030-10-12',endDate:'2030-10-12'}]}]}});
    window.api=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,invoice:{id:'invoice-'+url.split('/').pop(),invoice_number:'42',photographer_name:'Receiving Customer',rental_start:'2030-10-12',rental_end:'2030-10-12',total_amount:100,items:[{title:'Camera',quantity:1,rental_days:1,daily_price:100,subtotal:100}]}}};`});
   for(const id of ['pbR85AssetScanStyles','pb922FormalFinanceStyle'])await page.addStyleTag({content:html.match(new RegExp('<style id="'+id+'">([\\s\\S]*?)</style>'))[1]});
   await page.addScriptTag({content:finance});await page.addScriptTag({content:runtime});
   await page.addScriptTag({path:path.join(root,'dist/web/photobridge-r1058-handover-holders.js')});
   assert.match(await page.locator('.pbR1058Holders').textContent(),/Actual A/);assert.match(await page.locator('.pbR1058Holders').textContent(),/Actual B/);assert.doesNotMatch(await page.locator('.pbR1058Holders').textContent(),/Planned A/);
   await page.evaluate(()=>{void bookingStatus('b','picked_up')});
   await page.waitForSelector('.pbR1058SupplyChoice summary');await page.locator('.pbR1058SupplyChoice summary').click();assert.deepEqual(await page.locator('.pbR1063SourceOptions button').allTextContents(),['تجهیز خود فروشگاه','تجهیز تأمین‌شده']);assert.equal(await page.locator('.pbR1063SourceOptions small').count(),0);
   assert.equal(await page.locator('[data-source-kind=external]').evaluate(x=>parseFloat(getComputedStyle(x.querySelector('b')).fontSize)>=15),true);const optionBox=await page.locator('[data-source-kind=external]').boundingBox();assert(optionBox.width<=viewport.width&&optionBox.height>=48);await page.locator('[data-source-kind=external]').click();
   assert.equal(await page.locator('[data-done]').isDisabled(),true);
   await page.locator('[data-supplied-toggle]').check();await page.locator('[data-slot-input]').fill('arbitrary identifier');
   await page.locator('[data-done]').click();await page.waitForFunction(()=>calls.length===1);
   await page.waitForSelector('#pb922InvoiceModal:not([hidden])');assert.match(await page.locator('.pb922InvoiceContent').textContent(),/Receiving Customer/);assert.match(await page.locator('.pb922InvoiceContent').textContent(),/Camera/);assert.match(await page.locator('.pb922InvoiceContent').textContent(),/100/);assert.deepEqual(await page.evaluate(()=>notices),[]);assert.deepEqual(await page.evaluate(()=>details),[]);await page.locator('[data-pb922-close]').click();
   const external=await page.evaluate(()=>calls[0].body);assert.deepEqual(external.assetCodes,[]);assert.deepEqual(external.externalSupplyCodes,[{itemId:'camera',code:'arbitrary identifier',shortageId:'source'}]);
   await page.evaluate(()=>{void bookingStatus('a','picked_up')});await page.waitForSelector('.pbR1058SupplyChoice summary');await page.locator('.pbR1058SupplyChoice summary').click();
   await page.locator('[data-source-kind=owned]').click();await page.locator('[data-slot-input]').fill('CAM-1');await page.locator('[data-slot-add]').click();
   await page.waitForFunction(()=>!document.querySelector('[data-done]').disabled);await page.locator('[data-done]').click();await page.waitForFunction(()=>calls.length===2);
   await page.waitForSelector('#pb922InvoiceModal:not([hidden])');assert.equal(await page.locator('.pbR85ScanBack').count(),0);assert.deepEqual(await page.evaluate(()=>notices),[]);assert.deepEqual(await page.evaluate(()=>details),[]);
   const owned=await page.evaluate(()=>calls[1].body);assert.deepEqual(owned.assetCodes,['CAM-1']);assert.deepEqual(owned.externalSupplyCodes,[]);
   await page.locator('[data-pb922-close]').click();
   await page.evaluate(()=>{window.fetch=async url=>({ok:true,json:async()=>String(url).includes('by-code')?{asset:{id:'asset',item_id:'camera',system_code:'CAM-1',serial_number:'serial'}}:({items:[{itemId:'camera',title:'Camera',quantity:3,assets:[],supplyOptions:[{id:'source',bookingId:'a',availableQuantity:1,supplied:false},{id:'second',bookingId:'a',availableQuantity:1,supplied:false}]}]})});void bookingStatus('b','picked_up')});
   await page.waitForSelector('[data-slot="2"]');
   for(const index of [0,1]){const row=page.locator('[data-slot="'+index+'"]');await row.locator('summary').click();assert.equal(await row.locator('.pbR1063SourceOptions button').count(),2);await row.locator('[data-source-kind=external]').click();}
   await page.locator('[data-slot="2"] summary').click();assert.equal(await page.locator('[data-slot="2"] [data-source-kind=external]').isDisabled(),true);
   await page.locator('[data-slot="0"] summary').click();await page.locator('[data-slot="0"] [data-source-kind=owned]').click();
   await page.locator('[data-slot="2"] summary').click();assert.equal(await page.locator('[data-slot="2"] [data-source-kind=external]').isEnabled(),true);await page.locator('[data-slot="2"] [data-source-kind=external]').click();
   for(const index of [1,2])await page.locator('[data-slot="'+index+'"] [data-supplied-toggle]').check();
   await page.locator('[data-slot="0"] [data-slot-input]').fill('CAM-1');await page.locator('[data-slot="0"] [data-slot-add]').click();await page.waitForFunction(()=>!document.querySelector('[data-done]').disabled);await page.locator('[data-done]').click();await page.waitForFunction(()=>calls.length===3);const mixed=await page.evaluate(()=>calls[2].body);assert.deepEqual(mixed.assetCodes,['CAM-1']);assert.deepEqual(mixed.externalSupplyCodes.map(x=>x.shortageId).sort(),['second','source']);
   await page.close();
  }
 }finally{await browser.close()}
});
