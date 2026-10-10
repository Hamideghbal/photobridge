const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
test('store settings select cities independently, explain free invites, and fit personnel rows',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1366,height:768}]){
  const page=await browser.newPage({viewport,serviceWorkers:'block'});page.setDefaultTimeout(5000);const writes=[];
  const shop={id:'shop',name:'Seven',rental_enabled:true,sale_enabled:true,active:true,activation_status:'approved',manager_name:'Manager',manager_mobile:'09123456789',rental_reach:{mode:'selected',provinces:[],cities:[]},sale_reach:{mode:'selected',provinces:[],cities:[]}};
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());let body={};
   if(u.pathname.startsWith('/api/')){
    if(u.pathname==='/api/auth/me')body={user:{id:'manager',name:'Manager'},rentalShop:shop};
    if(u.pathname==='/api/public/iran-locations')body={locations:{'تهران':['تهران','ری'],'البرز':['کرج','فردیس']}};
    if(u.pathname==='/api/rental/overview')body={shop,items:[],bookings:[],photographers:[],saleItems:[],plans:[],renewals:[],collaborationRequests:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
    if(u.pathname==='/api/rental/handover-staff')body={staff:[{id:'staff',name:'پرسنل تحویل تجهیزات',mobile:'09123456789'}]};
    if(req.method()==='PATCH'){const saved=JSON.parse(req.postData());writes.push(saved);shop.rental_reach=saved.rentalReach;shop.sale_reach=saved.saleReach;body={ok:true};}
    return route.fulfill({json:body});
   }
   if(u.pathname==='/rental/test')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8')});
   const file=path.join(root,'dist/web',u.pathname.slice(1));if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});return route.fulfill({status:404,body:''});
  });
  await page.goto('https://settings.test/rental/test');await page.waitForFunction(()=>data?.shop&&document.body.classList.contains('rentalAppReady'));
  await page.evaluate(()=>{selectRentalTab('settings',{reloadExtra:false});pbFillReach(data.shop);pb861SyncReachBuilders();});
  await page.waitForSelector('[data-pb861-reach="rental"] [data-add-city]');
  for(const channel of ['rental','sale']){
   const builder=page.locator(`[data-pb861-reach="${channel}"]`);await builder.locator('[data-province]').selectOption('البرز');await builder.locator('[data-city]').selectOption('البرز/کرج');await builder.locator('[data-add-city]').click();
   assert.equal(await builder.locator('[data-remove-province]').count(),0);assert.equal(await builder.locator('[data-remove-city]').count(),1);
   await builder.locator('[data-add-province]').click();assert.equal(await builder.locator('[data-remove-province]').count(),1);await builder.locator('[data-remove-province]').click();assert.equal(await builder.locator('[data-remove-city]').count(),1);
  }
  const saved=page.waitForResponse(r=>r.url().endsWith('/api/rental/shop')&&r.request().method()==='PATCH');await page.evaluate(()=>document.querySelector('#shopForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await saved;assert(writes.length);assert.deepEqual(writes[0].rentalReach,{mode:'selected',provinces:[],cities:['البرز/کرج']});assert.deepEqual(writes[0].saleReach,{mode:'selected',provinces:[],cities:['البرز/کرج']});
  await page.evaluate(()=>{data.shop.rental_reach={mode:'selected',provinces:[],cities:['البرز/کرج']};pbFillReach(data.shop);});await page.waitForFunction(()=>document.querySelector('[data-pb861-reach=rental] [data-remove-city]'));
  assert.equal(await page.locator('[data-pb861-reach=rental] [data-remove-province]').count(),0);
  await page.evaluate(()=>pbR100F9InitStaffSettings());await page.waitForSelector('.pbR100F9StaffRow');
  const row=await page.locator('.pbR100F9StaffRow').evaluate(el=>{const r=el.getBoundingClientRect(),info=el.firstElementChild.getBoundingClientRect(),button=el.lastElementChild.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,buttonFits:button.right<=info.left,phoneFont:parseFloat(getComputedStyle(el.querySelector('small')).fontSize)}});
  assert(row.left>=0&&row.right<=viewport.width&&row.height<100&&row.buttonFits&&row.phoneFont>=13,JSON.stringify(row));
  await page.evaluate(()=>selectRentalTab('sms',{reloadExtra:false}));assert(await page.locator('#smsInviteCreditHint').isVisible());assert.match(await page.locator('#smsInviteCreditHint').textContent(),/از اعتبار پیامکی شما کسر نمی‌شود/);
  await page.close();
 }}finally{await browser.close()}
});
