const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
test('frame settings omit equipment handover staff, deposit policy and rental acceptance on phone and desktop; equipment retains all three',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1440])for(const category of ['frame','chassis','frame_chassis','equipment_rental_sale']){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent('<body class="rentalAppReady"><section id="sales"><div class="box"><div id="saleOrdersList"></div></div></section><section id="bookings"></section><section id="settings"><form id="shopForm"><label id="depositField">قانون ودیعه<input name="depositPolicy" value="قانون قبلی"></label><label id="storeName">نام فروشگاه<input name="name" value="فروشگاه"></label></form></section></body>');
  await page.addScriptTag({content:`const data={shop:{id:'shop',business_category:${JSON.stringify(category)}},saleItems:[],saleOrders:[]};const fa=String,money=String,esc=String,normalizeDigits=String;let renderSales=()=>{},showApp=()=>{},rentalTabFromPath=()=> 'sales',selectRentalTab=()=>{};const api=async()=>({options:{types:[],models:[],sizes:[],thicknesses:[],colors:[]}});`});
  await page.addScriptTag({path:path.resolve('dist/web/photobridge-r1172-production-owner.js')});
  // The legacy staff and stock controllers mount these after the shop UI loads.
  await page.locator('#settings').evaluate(el=>{for(const id of ['pbR100F9StaffSettings','pbR1095Mode']){const section=document.createElement('section');section.id=id;section.textContent=id;el.append(section);}});
  const visible=category==='equipment_rental_sale';
  for(const selector of ['#pbR100F9StaffSettings','#depositField','#pbR1095Mode'])assert.equal(await page.locator(selector).isVisible(),visible,category+' '+width+' '+selector);
  assert(await page.locator('#storeName').isVisible());assert.equal(await page.locator('[name=depositPolicy]').inputValue(),'قانون قبلی');assert.equal(await page.locator('#shopForm').evaluate(el=>new FormData(el).get('depositPolicy')),'قانون قبلی');
  await page.close();
 }}finally{await browser.close()}
});
