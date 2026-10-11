const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const file=path.resolve('dist/web/photobridge-r1099-photographer-tabs.js');
test('mobile and desktop hide each disabled tab, redistribute dock, admin bypass, and restore enabled tabs',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [390,1366])for(const bypass of [false,true]){
 const page=await browser.newPage({viewport:{width,height:844}});let tabs={ai:false,album:true,instagram:false};
 await page.route('**/*',r=>{
 const p=new URL(r.request().url()).pathname;
 if(p==='/api/photographer/navigation-tabs')return r.fulfill({json:{tabs:bypass?{ai:true,album:true,instagram:true}:tabs,adminBypass:bypass}});
 if(p==='/feature.js')return r.fulfill({path:file});
 return r.fulfill({contentType:'text/html; charset=utf-8',body:'<div class="photographerHomeModeNav"><button>چاپ</button><button>هوش مصنوعی</button><button>طراحی آلبوم</button><button>طراحی اینستاگرام</button><button>گالری</button></div><nav class="photographerBottomAppNav"><div class="photographerBottomAppNavGrid" style="display:grid"><button aria-label="چاپ">چاپ</button><button aria-label="هوش مصنوعی"><span class="photographerBottomNavIcon ai"></span></button><button aria-label="طراحی آلبوم"><span class="photographerBottomNavIcon album"></span></button><button aria-label="اینستاگرام"><span class="photographerBottomNavIcon instagram"></span></button><button aria-label="گالری">گالری</button><button aria-label="فروشگاه">فروشگاه</button></div></nav><script src="/feature.js"></script>'});
 });
 await page.goto('https://tabs.test/photographer/gallery');await page.waitForFunction(()=>document.querySelector('#pb1099TabsStyle'));
 if(!bypass)await page.waitForFunction(()=>document.querySelectorAll('[data-pb1099-hidden]').length===4);
 else await page.waitForFunction(()=>document.querySelector('.photographerBottomAppNavGrid').style.getPropertyValue('--pb1099-tabs')==='6');
 assert.equal(await page.getByRole('button',{name:'هوش مصنوعی',exact:true}).count(),bypass?2:0);
 assert.equal(await page.getByRole('button',{name:'طراحی آلبوم',exact:true}).count(),2);
 assert.equal(await page.getByRole('button',{name:'اینستاگرام',exact:true}).count(),bypass?1:0);
 assert.equal(await page.locator('.photographerBottomAppNavGrid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),bypass?6:4);
 tabs={ai:true,album:false,instagram:true};await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 if(!bypass)await page.waitForFunction(()=>document.querySelectorAll('[data-pb1099-hidden]').length===2&&document.querySelector('.photographerHomeModeNav button:nth-child(3)').dataset.pb1099Hidden==='1');
 assert.equal(await page.getByRole('button',{name:'طراحی آلبوم',exact:true}).count(),bypass?2:0);
 assert.equal(await page.getByRole('button',{name:'هوش مصنوعی',exact:true}).count(),2);
 for(const route of ['/photographer/ai/retouch','/photographer/album-design','/photographer/album-design?pb_mode=instagram']){
 tabs={ai:false,album:false,instagram:false};await page.goto('https://tabs.test'+route);
 if(bypass){await page.waitForFunction(()=>document.querySelector('.photographerBottomAppNavGrid').style.getPropertyValue('--pb1099-tabs')==='6');assert.equal(new URL(page.url()).pathname+new URL(page.url()).search,route)}
 else await page.waitForURL('https://tabs.test/photographer');
 }
 await page.close();
 }
 }finally{await browser.close()}
});
test('admin can edit all three settings in the rendered dialog',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage();let saved;
 await page.route('**/*',r=>{const p=new URL(r.request().url()).pathname;
 if(p==='/api/admin/photographer-tabs'){if(r.request().method()==='PUT')saved=r.request().postDataJSON().tabs;return r.fulfill({json:{tabs:saved||{ai:true,album:true,instagram:true},ok:true}})}
 if(p==='/feature.js')return r.fulfill({path:file});
 return r.fulfill({contentType:'text/html; charset=utf-8',body:'<div class="adminTabs adminTabsUnified"><button>عکاس‌ها</button></div><script src="/feature.js"></script>'});});
 await page.goto('https://tabs.test/admin/labs');await page.getByRole('button',{name:'تب‌های عکاس',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#pb1099TabsDialog [type=submit]').disabled);
 await page.locator('[name=ai]').uncheck();await page.locator('[name=instagram]').uncheck();await page.getByRole('button',{name:'ذخیره',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#pb1099TabsDialog [role=status]').textContent==='تنظیمات ذخیره شد.');
 assert.deepEqual(saved,{ai:false,album:true,instagram:false});await page.getByRole('button',{name:'بستن',exact:true}).click();assert(!await page.locator('dialog').isVisible());
 }finally{await browser.close()}
});
