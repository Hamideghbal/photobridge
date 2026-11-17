'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(name,'utf8');

test('R1873: one Gallery account component survives all mobile routes',()=>{
 const header=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const crm=read('dist/web/customer-crm-host.js');
 assert.doesNotThrow(()=>new vm.Script(header));
 assert.doesNotThrow(()=>new vm.Script(crm));
 assert(header.includes("if(m==='store'){"));
 assert(header.includes("ensureHeader();ensureMenu();"));
 assert(header.includes("$('#pbF37Subheader')?.remove();"));
 assert(header.includes("function nativeHeader(){return mode()==='store'?"));
 assert(css.includes('body.pbF37UnifiedActive.pbF37StoreMode #photographerStoreRoleHeader.pbF37CoreHeader'));
 assert(css.includes('body.pbF37UnifiedActive.pbF37StoreMode #pbF37PhotographerHeader'));
 assert(css.includes('z-index:2147483300!important'));
 assert(crm.includes("'#pbF37PhotographerHeader,#pbF37Subheader,'"));
 assert(crm.includes("'#photographerStoreRoleHeader,#photographerStoreIdentityBar,#storeSectionNavV673,'"));
 assert(crm.includes('const top=measuredTop||lastHeaderBottom'));
 assert(crm.includes("attributeFilter:['class','hidden']"));
});
test('R1873: HTML entrypoints always refresh Gallery account header + CRM host',()=>{
 const rev=read('DEPLOY_REVISION.txt').trim();
 for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  const html=read(file);
  for(const name of [
   'photobridge-v904r100f41-header-date-name-fit.js',
   'photobridge-v904r100f41-header-date-name-fit.css',
   'customer-crm-host.js',
   'customer-crm-host.css'
  ]){
   if(html.includes('/'+name+'?rev='+encodeURIComponent(rev)))continue;
   if(name.endsWith('.css')){
    // The final perf step merges individual stylesheets into a hash-named
    // first-paint CSS bundle, leaving no standalone CSS link in HTML.
    const boot=html.match(/href="(\/assets\/photobridge-boot-[a-f0-9]+[.]css)[^"]*"/);
    const bundle=boot&&read('dist/web'+boot[1]);
    assert(bundle&&bundle.includes(read('dist/web/'+name)),file+': missing bundled '+name);
    continue;
   }
   assert.fail(file+': '+name);
  }
 }
});
test('R1873: visible Gallery header is not covered by Customers/Calendar',async t=>{
 if(!process.env.PB_BROWSER_EXECUTABLE)return t.skip('Chromium integration runs in browser CI stage');
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE,args:['--no-sandbox']});
 try{
  for(const kind of ['gallery','print','ai','album','store']){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const route=kind==='store'?'/equipment-rental/book':kind==='print'?'/photographer/orders':kind==='ai'?'/photographer/ai/retouch':kind==='album'?'/photographer/album-design':'/photographer/gallery';
   const native='<div class="workspaceIdentityCopy"><h1>استودیو نمونه</h1></div><button type="button" class="mobileHeaderSettings" onclick="window.__settingsClicks++">تنظیمات</button><button type="button" class="mobileHeaderWallet">اعتبار</button>';
   const isStore=kind==='store';
   const content=isStore?
    '<div id="storePhotographerWorkspace"><header id="photographerStoreRoleHeader" class="photographerHeaderRefined">'+native+'</header><div id="photographerStoreIdentityBar" style="position:fixed;top:90px;height:42px;left:0;right:0">هویت فروشگاه</div><nav id="storeSectionNavV673" style="position:fixed;top:139px;height:42px;left:0;right:0">تب‌های فروشگاه</nav><div class="shell">محتوا</div></div>':
    '<div id="root"><main class="photographerMain'+(kind==='print'?' photographerPrintWorkspace':'')+'"><header id="photographerRoleHeaderV710" class="unifiedRoleHeader photographerHeaderRefined">'+native+'</header><div class="photographerRolePageScrollArea">محتوای '+kind+'</div></main></div>';
   await page.route('https://photobridge.test/**',rt=>{
    const u=new URL(rt.request().url());
    if(u.pathname==='/api/auth/me')return rt.fulfill({contentType:'application/json',body:JSON.stringify({user:{photographerName:'استودیو نمونه',name:'مدیر نمونه'}})});
    if(u.pathname==='/api/customer/notifications')return rt.fulfill({contentType:'application/json',body:'{"unread":0}'});
    if(u.pathname==='/api/customer/services-wallet')return rt.fulfill({contentType:'application/json',body:'{"balance":20000}'});
    if(u.pathname==='/customer-crm.html')return rt.fulfill({contentType:'text/html',body:'<!doctype html><html class="crmEmbedded"><head><style>body>header{display:none!important}</style></head><body><header>هدر تکراری ممنوع</header><main>مشتریان و تقویم</main></body></html>'});
    if(u.pathname===route)return rt.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fa" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="pbAuthenticatedPhotographerPortal"><script>window.__settingsClicks=0</script>'+content+'</body></html>'});
    return rt.fulfill({status:404,body:''});
   });
   await page.goto('https://photobridge.test'+route,{waitUntil:'load'});
   await page.addStyleTag({content:read('dist/web/photobridge-v904r100f41-header-date-name-fit.css')});
   await page.addStyleTag({content:read('dist/web/customer-crm-host.css')});
   await page.addScriptTag({content:read('dist/web/photobridge-v904r100f41-header-date-name-fit.js')});
   await page.addScriptTag({content:read('dist/web/customer-crm-host.js')});
   await page.locator('#pbF37PhotographerHeader').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.getElementById('pbF37StudioName')?.textContent==='استودیو نمونه');
   assert.equal(await page.locator('#pbF37PhotographerHeader').count(),1,kind+' must use Gallery account header');
   if(isStore)assert(await page.locator('#photographerStoreRoleHeader').isHidden(),'Store duplicate should remain nonvisual');
   else assert(await page.locator('#photographerRoleHeaderV710').isHidden(),'legacy header should remain nonvisual');
   await page.locator('#pbF37MenuBtn').click();
   await page.locator('#pbF37MenuPanel [data-f37-menu="settings"]').click();
   assert.equal(await page.evaluate(()=>window.__settingsClicks),1,kind+' menu must forward to existing settings');
   for(const pane of ['customers','calendar']){
    await page.evaluate(pane=>window.pbCrmOpen('photographer',false,pane),pane);
    await page.waitForFunction(()=>{
     const overlay=document.querySelector('#pbCrmTabContent');
     if(!overlay||overlay.hidden)return false;
     const selectors=['#pbF37PhotographerHeader','#pbF37Subheader','#photographerStoreIdentityBar','#storeSectionNavV673'];
     const bottoms=selectors.map(q=>document.querySelector(q)).filter(n=>n&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden').map(n=>n.getBoundingClientRect().bottom);
     return overlay.getBoundingClientRect().top>=Math.max(...bottoms)-2;
    });
    assert(await page.locator('#pbF37PhotographerHeader').isVisible());
    assert.equal(await page.locator('#pbF37PhotographerHeader').count(),1);
    await page.waitForFunction(()=>{const overlay=document.getElementById('pbCrmTabContent');return overlay&&!overlay.hasAttribute('aria-busy')},{timeout:12000});
    assert(await page.locator('#pbCrmTabContent iframe').isVisible(),kind+' '+pane+' content must be visible');
    // Account tools remain interactive above the iframe even on CRM pages.
    if(pane==='customers'){
     await page.locator('#pbF37MenuBtn').click();
     await page.locator('#pbF37MenuPanel [data-f37-menu="settings"]').click();
     assert.equal(await page.evaluate(()=>window.__settingsClicks),2,kind+' CRM tools blocked by iframe');
    }
   }
   await page.evaluate(()=>window.pbCrmClose());
   assert(await page.locator('#pbCrmTabContent').isHidden());
   if(kind==='gallery'){
    await page.evaluate(()=>{window.__headerRef=document.getElementById('pbF37PhotographerHeader');history.pushState({},'','/photographer/ai/retouch')});
    await page.waitForFunction(()=>window.PBStorePhotographerHeaderCore?.getMode()==='ai');
    assert(await page.evaluate(()=>window.__headerRef===document.getElementById('pbF37PhotographerHeader')),'SPA route must retain same header element');
   }
   assert.deepEqual(errors,[],kind+': browser errors');
   await page.close();
  }
 }finally{await browser.close()}
});
