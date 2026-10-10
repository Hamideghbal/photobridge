const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
test('unit QR actions replace group actions and update stock on mobile and desktop',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390},{width:1366,height:768}]){
  const page=await browser.newPage({viewport,serviceWorkers:'block'});page.setDefaultTimeout(5000);
  const item={id:'camera',title:'Camera',model:'Camera',category:'camera',active:true,stock_total:2,daily_price:100};
  let assets=[{id:'free',item_id:'camera',system_code:'CAM-1',active:true},{id:'held',item_id:'camera',system_code:'CAM-2',active:true,current_booking_id:'booking',control_block_reason:'asset_in_booking'}],writes=[];
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());let body={};
   if(u.pathname.startsWith('/api/')){
    if(u.pathname==='/api/auth/me')body={user:{id:'manager',name:'Manager'},rentalShop:{id:'shop',name:'Seven'}};
    if(u.pathname==='/api/rental/overview')body={shop:{id:'shop',name:'Seven',rental_enabled:true,sale_enabled:true,active:true,activation_status:'approved'},items:[item],assets,bookings:[],photographers:[],saleItems:[],plans:[],renewals:[],collaborationRequests:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
    if(u.pathname==='/api/rental/assets')body={assets};
    if(u.pathname==='/api/rental/assets/free'&&req.method()==='PATCH'){writes.push({method:'PATCH',body:JSON.parse(req.postData())});assets[0].active=!assets[0].active;item.stock_total=assets.filter(x=>x.active).length;body={ok:true,asset:assets[0],stockTotal:item.stock_total};}
    if(u.pathname==='/api/rental/assets/free'&&req.method()==='DELETE'){writes.push({method:'DELETE'});assets=assets.filter(x=>x.id!=='free');item.stock_total=1;body={ok:true,stockTotal:1};}
    return route.fulfill({json:body});
   }
   if(u.pathname==='/rental/test')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist/api/equipment-rental-portal.html'),'utf8')});
   const file=path.join(root,'dist/web',u.pathname.slice(1));if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});return route.fulfill({status:404,body:''});
  });
  await page.goto('https://asset.test/rental/test');await page.waitForFunction(()=>data?.shop&&document.body.classList.contains('rentalAppReady'));
  await page.evaluate(()=>{selectRentalTab('items',{reloadExtra:false});renderItems()});
  assert.equal(await page.locator('.rentalItemCard button[onclick^="toggleItem"],.rentalItemCard button[onclick^="deleteItem"]').count(),0);
  await page.evaluate(()=>pbR85AssetLabels('camera'));
  const free=page.locator('[data-asset-id=free]'),held=page.locator('[data-asset-id=held]');
  if(viewport.width<851)await page.locator('[data-next]').click();
  assert(await held.locator('[data-unit-toggle]').isDisabled());assert(await held.locator('[data-unit-delete]').isDisabled());
  assert(await page.evaluate(()=>{const c=document.querySelector('.pbR1084AssetLabels .pbR85ScanCard'),r=c.getBoundingClientRect();return c.scrollHeight<=c.clientHeight+1&&r.top>=0&&r.bottom<=innerHeight&&c.scrollWidth<=c.clientWidth+1&&[...c.querySelectorAll('button')].every(b=>{const br=b.getBoundingClientRect();return br.top>=r.top&&br.bottom<=r.bottom&&br.left>=r.left&&br.right<=r.right})}),'QR dialog must fit without scroll');
  if(viewport.width<851)await page.locator('[data-prev]').click();
  await free.locator('[data-unit-toggle]').click();await page.waitForFunction(()=>document.querySelector('[data-asset-id=free] [data-unit-toggle]')?.textContent==='فعال‌سازی این واحد');assert.equal(writes[0].body.active,false);
  await free.locator('[data-unit-toggle]').click();await page.waitForFunction(()=>document.querySelector('[data-asset-id=free] [data-unit-toggle]')?.textContent==='غیرفعال‌سازی این واحد');assert.equal(writes[1].body.active,true);
  await page.evaluate(()=>{pb920Confirm=async()=>true});await free.locator('[data-unit-delete]').click();await page.waitForFunction(()=>!document.querySelector('[data-asset-id=free]'));assert.equal(writes[2].method,'DELETE');assert.equal(await page.evaluate(()=>data.items[0].stock_total),1);
  await page.locator('.pbR85ScanBack [data-close]').click();
  assets.push(...Array.from({length:7},(_,n)=>({id:'extra-'+n,item_id:'camera',system_code:'CAM-'+(n+3),active:true})));
  await page.evaluate(()=>pbR85AssetLabels('camera'));
  assert.equal(await page.locator('[data-page]').textContent(),viewport.width<851?'۱ / ۸':'۱ / ۳');
  const firstCode=await page.locator('.pbR85AssetCode').first().textContent();await page.locator('[data-next]').click();assert.notEqual(await page.locator('.pbR85AssetCode').first().textContent(),firstCode);
  assert(await page.locator('.pbR1084AssetLabels .pbR85ScanCard').evaluate(c=>c.scrollHeight<=c.clientHeight+1));
  await page.locator('.pbR85ScanBack [data-close]').click();
  await page.evaluate(()=>{data.photographers=[{user_id:'p',active:true,name:'آتلیه عکاسی با نام بسیار طولانی برای بررسی تک خطی ماندن عنوان عکاس در کادر انتخاب'}];selectRentalTab('accounting',{reloadExtra:false});fillAccountingPhotographers();accountingData={entries:[{id:'old',created_at:'2026-01-01',entry_date:'2026-12-01',description:'older registration'},{id:'new',created_at:'2026-02-01',entry_date:'2025-12-01',description:'newer registration'}]};renderAccounting();document.querySelector('#accPhotographer').value='p';document.querySelector('#accPhotographer').dispatchEvent(new Event('change'));});
  assert.deepEqual(await page.locator('#accountingForm select[name=kind] option').allTextContents(),['مبلغ دریافتی از عکاس','افزایش بدهی عکاس']);
  assert.match(await page.locator('#accountingEntries tbody tr').first().textContent(),/newer registration/);
  assert(await page.locator('#accPhotographer + .pb892Picker .pb892PickerButton span').evaluate(el=>getComputedStyle(el).whiteSpace==='nowrap'));
  await page.evaluate(()=>editItem('camera'));
  assert.equal(await page.locator('#itemForm [name=stockTotal]').getAttribute('min'),'1');
  await page.close();
 }}finally{await browser.close()}
});
