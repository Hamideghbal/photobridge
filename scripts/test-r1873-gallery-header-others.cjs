'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('R1873: CRM overlay respects Gallery shared header and native fallback',()=>{
 const h=read('dist/web/customer-crm-host.js'),css=read('dist/web/customer-crm-host.css');
 assert(h.includes('#pbSharedPhotographerHeader,#pbSharedPhotographerSubheader'));
 assert(h.includes("document.body.classList.contains('pbSharedPhotographerHeaderActive')"));
 assert(h.includes('const ownHeaders=shared.length?shared:'));
 assert(h.includes('#root .labRoleWorkspace .labSingleHeader'));
 assert(h.includes('#photographerStoreRoleHeader'));
 assert.match(css,/#pbCrmTabContent\{[^}]*z-index:2147481400/);
 const s=read('dist/web/photobridge-v904r100f36-shared-header.js');
 assert(s.includes("document.documentElement.classList.contains('pbCrmTabOpen')"));
 assert(s.includes("pane==='calendar'?'calendar':'customers'"));
 assert(s.includes("if(m==='customers')return{title:'مشتریان'"));
 assert(s.includes("if(m==='calendar')return{title:'تقویم'"));
});
test('R1873: one Gallery header stays above both mobile CRM tabs',async t=>{
 if(!process.env.PB_BROWSER_EXECUTABLE)return t.skip('Chromium stage only');
 const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('https://photobridge.test/**',route=>{
   const p=new URL(route.request().url()).pathname;
   if(p==='/customer-crm.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fa" class="crmEmbedded"><head><style>html.crmEmbedded body>header{display:none!important}</style></head><body><header>هدر داخلی</header><main>دفتر مشتریان</main></body></html>'});
   return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'});
  });
  await page.goto('https://photobridge.test/photographer/gallery',{waitUntil:'load'});
  const css=read('dist/web/customer-crm-host.css');
  const html='<!doctype html><html lang="fa" dir="rtl"><head><style>'+
   'body{margin:0}#root{display:block}'+
   '#pbSharedPhotographerHeader{position:fixed;inset:0 0 auto 0;height:64px;background:white;z-index:2147481500}'+
   '#pbSharedPhotographerSubheader{position:fixed;top:64px;left:0;right:0;height:86px;background:#eef7ff;z-index:2147481499}'+
   '#photographerRoleHeaderV710{display:none}'+
   '.photographerBottomAppNav{position:fixed;bottom:0;height:70px;left:0;right:0;background:white}'+
   '</style><style>'+css+'</style></head><body class="pbSharedPhotographerHeaderActive">'+
   '<header id="pbSharedPhotographerHeader">مدیریت عکاسی · نوار گالری</header>'+
   '<section id="pbSharedPhotographerSubheader">نواری که باید در همه تب‌ها بماند</section>'+
   '<div id="root"><main class="photographerMain"><header id="photographerRoleHeaderV710">هدر قدیمی</header></main>'+
   '<nav class="photographerBottomAppNav">تب‌های پایین</nav></div></body></html>';
  await page.setContent(html,{waitUntil:'load'});
  await page.addScriptTag({content:read('dist/web/customer-crm-host.js')});
  for(const pane of ['customers','calendar']){
   await page.evaluate(p=>window.pbCrmOpen('photographer',true,p),pane);
   await page.waitForFunction(()=>Math.abs(document.querySelector('#pbCrmTabContent').getBoundingClientRect().top-150)<2);
   const s=await page.evaluate(()=>{
    const host=document.querySelector('#pbCrmTabContent'),sh=document.querySelector('#pbSharedPhotographerHeader'),sub=document.querySelector('#pbSharedPhotographerSubheader');
    return {top:host.getBoundingClientRect().top,headers:document.querySelectorAll('#pbSharedPhotographerHeader').length,
      first:document.elementFromPoint(10,25)?.id,second:document.elementFromPoint(10,90)?.id,
      hostZ:getComputedStyle(host).zIndex,sharedZ:getComputedStyle(sh).zIndex,subZ:getComputedStyle(sub).zIndex};
   });
   assert.equal(s.top,150);assert.equal(s.headers,1);
   assert.equal(s.first,'pbSharedPhotographerHeader');
   assert.equal(s.second,'pbSharedPhotographerSubheader');
   assert(Number(s.hostZ)<Number(s.sharedZ)&&Number(s.hostZ)<Number(s.subZ));
  }
  await page.evaluate(()=>window.pbCrmClose());
  assert(await page.locator('#pbCrmTabContent').isHidden());
 }finally{await browser.close();}
});
