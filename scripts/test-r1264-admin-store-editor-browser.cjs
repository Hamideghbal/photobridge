const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const pageScript='dist/web/photobridge-v904r19-admin-stores.js';
const SHOP='11111111-1111-4111-8111-111111111111';
test('admin store list scrolls to the last row and mobile-only edit leaves other settings untouched',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:580}});
  const requests=[],alerts=[],errors=[];
  const shops=Array.from({length:24},(_,i)=>({id:i?String(i+1).padStart(8,'0')+'-1111-4111-8111-111111111111':SHOP,
    name:'فروشگاه شماره '+(i+1),manager_name:'مدیر',manager_mobile:'09120000001',active:true,
    activation_status:'approved',sale_enabled:true,rental_enabled:true,subscription_discount_percent:12,
    suspended:false,shop_staff_count:0,province:'تهران',city:'تهران'}));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{alerts.push(d.message());await d.accept()});
  await page.route('http://photobridge.local/**',async route=>{
   const req=route.request(),pathname=new URL(req.url()).pathname;
   if(pathname==='/admin')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"><main class="adminPage" style="height:580px;max-height:580px;overflow:hidden;display:flex;flex-direction:column"><div class="adminTabs"><button>لابراتوارها</button></div><section class="adminInternalScrollArea"><p>بخش دیگر</p></section></main></div></body></html>'});
   if(pathname==='/api/admin/equipment-rental/overview')return route.fulfill({contentType:'application/json',body:JSON.stringify({shops})});
   if(pathname.startsWith('/api/admin/equipment-rental/shops/')&&req.method()==='PATCH'){
    const body=JSON.parse(req.postData()||'{}');requests.push(body);
    if(Object.keys(body).length===1&&body.managerMobile!==undefined){
     shops[0].manager_mobile=body.managerMobile;
     return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,manager_mobile:body.managerMobile})});
    }
    return route.fulfill({status:400,contentType:'application/json',body:'{"error":"unexpected_profile_rewrite"}'});
   }
   return route.fulfill({status:404,body:'not_found'});
  });
  await page.goto('http://photobridge.local/admin?pbtab=stores');
  await page.addScriptTag({path:pageScript});
  await page.waitForFunction(()=>document.querySelectorAll('.pb904r19StoresTable tbody tr').length===24);
  const panel=page.locator('#pb904r19AdminStoresPanel');
  const geometry=await panel.evaluate(x=>({height:x.clientHeight,scrollHeight:x.scrollHeight,overflowY:getComputedStyle(x).overflowY}));
  assert.equal(geometry.overflowY,'auto');
  assert(geometry.scrollHeight>geometry.height,'admin store panel should be independently scrollable');
  const lastButton=page.locator('.pb904r19StoresTable tbody tr').last().locator('[data-edit]');
  await lastButton.scrollIntoViewIfNeeded();
  const rect=await lastButton.boundingBox();
  assert(rect&&rect.y>=0&&rect.y+rect.height<=580,'last store actions must be fully visible: '+JSON.stringify(rect));
  await page.locator('.pb904r19StoresTable tbody tr').first().locator('[data-edit]').click();
  await page.locator('#pb904r19StoreForm input[name="managerMobile"]').fill('۰۹۱۲۳۴۵۶۷۸۹');
  await page.locator('#pb904r19StoreSave').click();
  await page.waitForFunction(()=>!document.getElementById('pb904r19StoreModal')?.classList.contains('open'));
  assert.deepEqual(requests,[{managerMobile:'09123456789'}],'only manager-contact mobile should be patched');
  assert.equal(shops[0].manager_mobile,'09123456789');
  assert(!alerts.length,'valid mobile edit should not alert');
  await page.locator('.pb904r19StoresTable tbody tr').first().locator('[data-edit]').click();
  await page.locator('#pb904r19StoreForm input[name="managerMobile"]').fill('شماره نامعتبر');
  await page.locator('#pb904r19StoreSave').click();
  assert.equal(requests.length,1,'invalid mobile must never reach backend');
  assert(alerts.some(x=>x.includes('۱۱ رقم')));
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
