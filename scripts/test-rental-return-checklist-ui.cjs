const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
test('manager and operator return checked units without a camera; missing units remain explicit',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
  const page=await browser.newPage({viewport,serviceWorkers:'block',timezoneId:'UTC'});page.setDefaultTimeout(5000);
  const booking={id:'00000000-0000-0000-0000-000000000001',status:'picked_up',photographer_name:'Customer',rental_start:'2030-10-12',rental_end:'2030-10-14',items:[{itemId:'camera',title:'Camera',quantity:3}]};const writes=[];
  await page.addInitScript(()=>{window.cameraCalls=0;Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{window.cameraCalls++;throw new Error('camera should not be needed')}}});});
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());let body={};
   if(u.pathname.startsWith('/api/')){
    if(u.pathname==='/api/auth/me')body={user:{id:'manager',name:'Manager'},rentalShop:{id:'shop',name:'Seven'}};
    if(u.pathname==='/api/rental/overview')body={shop:{id:'shop',name:'Seven',rental_enabled:true,sale_enabled:true,active:true,activation_status:'approved'},items:[],bookings:[booking],photographers:[],saleItems:[],plans:[],renewals:[],collaborationRequests:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
    if(u.pathname.endsWith('/assets'))body={items:[{itemId:'camera',title:'Camera',quantity:3,externalSupplyQty:1,assets:[{system_code:'CAM-1',serial_number:'serial-1'},{system_code:'CAM-2'}]}]};
    if(req.method()==='PATCH'){writes.push(JSON.parse(req.postData()));body={ok:true};}
    return route.fulfill({json:body});
   }
   if(u.pathname==='/rental/test')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8')});
   const file=path.join(root,'dist/web',u.pathname.slice(1));if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});return route.fulfill({status:404,body:''});
  });
  await page.goto('https://returns.test/rental/test');await page.waitForFunction(()=>data?.shop&&document.body.classList.contains('rentalAppReady'));
  await page.evaluate(()=>{window.pb923ReturnDialog=async()=>({});window.confirm=()=>true;window.pbR100F9ReloadStaff=async()=>{};});
  for(const staff of [false,true]){
   await page.evaluate(({staff,id})=>{document.body.classList.toggle('pbR100F9StaffMode',staff);void bookingStatus(id,'returned')},{staff,id:booking.id});await page.waitForSelector('.pbR100F73ReturnRow');
   assert.equal(await page.locator('.pbR100F73ReturnRow input:checked').count(),0);assert.equal(await page.locator('.pbR85CameraWrap').count(),0);
   await page.locator('[data-check="0"]').check();await page.locator('[data-check="0"]').uncheck();await page.locator('[data-check="0"]').check();await page.locator('[data-check="2"]').check();
   const before=writes.length;await page.locator('.pbR100F73ReturnBack [data-submit]').click();assert.equal(writes.length,before);assert.match(await page.locator('[data-warning]').textContent(),/۱ تجهیز/);
   await page.locator('.pbR100F73ReturnBack [data-submit]').click();await page.waitForFunction(()=>!document.querySelector('.pbR100F73ReturnBack'));await page.waitForTimeout(100);if(await page.locator('#storeNoticeOk').isVisible())await page.locator('#storeNoticeOk').click();
   assert.deepEqual(writes.at(-1),{status:'returned',returnChecklist:true,returnItems:[{itemId:'camera',returnedQty:2}],assetCodes:['CAM-1']});
  }
  await page.evaluate(id=>{document.body.classList.remove('pbR100F9StaffMode');void bookingStatus(id,'returned')},booking.id);await page.waitForSelector('.pbR100F73ReturnRow');await page.locator('[data-submit]').click();await page.locator('[data-submit]').click();await page.waitForFunction(()=>!document.querySelector('.pbR100F73ReturnBack'));await page.waitForTimeout(100);if(await page.locator('#storeNoticeOk').isVisible())await page.locator('#storeNoticeOk').click();assert.deepEqual(writes.at(-1).returnItems,[{itemId:'camera',returnedQty:0}]);assert.deepEqual(writes.at(-1).assetCodes,[]);
  const before=writes.length;await page.evaluate(id=>{void bookingStatus(id,'returned')},booking.id);await page.waitForSelector('.pbR100F73ReturnRow');await page.locator('.pbR100F73ReturnBack [data-cancel]').first().click();assert.equal(writes.length,before);assert.equal(await page.evaluate(()=>cameraCalls),0);
  const print=await page.evaluate(()=>{data.bookings=[{id:'print',status:'picked_up',handover_serials_recorded_at:'2026-03-20T21:00:00Z',items:[{itemId:'camera',title:'Camera',quantity:1}],handover_serials:[{itemId:'camera',serials:['CAM-1']}]}];let printed='';window.open=()=>({document:{open(){},write(html){printed=html},close(){}}});pb916PrintCommitment('print');return printed;});assert.match(print,/تاریخ ثبت سیستم: ۱۴۰۵\/۰۱\/۰۱, ۰۰:۳۰/);
  await page.close();
 }}finally{await browser.close()}
});
