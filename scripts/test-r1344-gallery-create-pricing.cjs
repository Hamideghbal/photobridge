const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PB_PLAYWRIGHT_PATH||'playwright');
const id='11111111-1111-4111-8111-111111111111',orderId='22222222-2222-4222-8222-222222222222',mediaId='33333333-3333-4333-8333-333333333333';
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII=';
for(const [width,existing] of [[320,false],[390,false],[390,true],[1366,true]])test(`${width}px existing=${existing}: creation fields and pricing review`,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});const calls=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname;
  if(p==='/test-upload'){await new Promise(resolve=>setTimeout(resolve,600));return route.fulfill({status:200,body:''});}
  if(p.startsWith('/api/')){
   if(p==='/api/auth/me')return route.fulfill({json:{user:{id,userId:id,name:'عکاس',labRole:'customer',platformRole:'user',photographerName:'آتلیه'}}});
   if(p==='/api/photographer/navigation-tabs')return route.fulfill({json:{tabs:{ai:false,album:false,instagram:false},adminBypass:false}});
   if(p==='/api/customer/entry-context')return route.fulfill({json:{destination:'none',connectedCount:0}});
   if(p==='/api/customer/client-galleries'){
    if(req.method()==='POST'){calls.push({method:'POST',body:req.postDataJSON()});return route.fulfill({json:{gallery:{id}}});}
    return route.fulfill({json:{billing:{enabled:true,fee:0,freeGalleriesRemaining:3,maxPhotos:100,balance:2000,lifetimeDays:30},galleries:[],printSizes:[{id:'size1',label:'۱۳ × ۱۸',width_cm:13,height_cm:18}],profilePrintTariffs:existing?[{size_id:'size1',active:true,luster_enabled:true,luster_price:25000}]:[],uploadAvailable:true}});
   }
   if(p.startsWith('/api/customer/client-galleries/')&&['PUT','PATCH'].includes(req.method())){calls.push({method:req.method(),body:req.postDataJSON()});return route.fulfill({json:{ok:true}});}
   return route.fulfill({json:{items:[],notifications:[],labs:[],shops:[],settings:{},balance:2000}});
  }
  const file=path.join(process.cwd(),'dist/web',p.startsWith('/photographer')?'index.html':p.slice(1));
  return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 await page.goto('https://panel.test/photographer/gallery');
 await page.getByRole('button').filter({hasText:/ساخت اولین گالری|گالری جدید/}).first().click();
 const form=page.locator('.clientGalleryCreateForm');await form.waitFor();
 const boxes=await form.locator('.pb1344Project,.pb1344Name,.pb1344Mobile,.pb1344Password').evaluateAll(ns=>ns.map(n=>{const b=n.getBoundingClientRect();return {top:b.top,width:b.width}}));
 assert.equal(boxes.length,4);
 if(width<820){assert(Math.abs(boxes[0].top-boxes[1].top)<3);assert(Math.abs(boxes[2].top-boxes[3].top)<3);assert(boxes[2].top>boxes[0].top+30);assert(boxes.every(b=>b.width>(width<350?100:120)));assert.equal(await form.evaluate(el=>el.scrollWidth>el.clientWidth+1),false);}
 else assert(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))<3);
 await form.locator('.pb1344Project input').fill('پروژه آزمایشی');await form.locator('.pb1344Name input').fill('مشتری');await form.locator('.pb1344Password input').fill('123456');
 const toggle=form.locator('.clientGalleryOrderingToggle input');await toggle.click();
 const prices=page.locator('.globalModalLayer').filter({hasText:'مدیریت تعرفه چاپ گالری'});await prices.waitFor();assert.equal(calls.length,0);assert.equal(await toggle.isChecked(),false);
 await prices.getByRole('button',{name:'بستن',exact:true}).last().click();await prices.waitFor({state:'hidden'});assert.equal(await toggle.isChecked(),false);assert.equal(calls.length,0);await toggle.click();await prices.waitFor();
 const row=prices.locator('.clientGalleryTariffPriceGrid:not(.head)').first();
 if(existing)assert.equal((await row.locator('input[inputmode="numeric"]').first().inputValue()).replace(/[^0-9۰-۹]/g,''),'۲۵۰۰۰');
 else{await row.locator('input[inputmode="numeric"]').first().fill('25000');await row.locator('.clientGalleryTariffRowToggle input').check();}
 await prices.getByRole('button',{name:'تأیید قیمت‌ها',exact:true}).click();await prices.waitFor({state:'hidden'});assert.equal(await toggle.isChecked(),true);assert.equal(calls.length,0);
 await form.getByRole('button').filter({hasText:/ساخت گالری رایگان/}).click();await page.waitForFunction(()=>!document.querySelector('.clientGalleryCreateForm'));
 assert.deepEqual(calls.map(c=>c.method),['POST','PUT','PATCH']);assert.equal(calls[0].body.orderingEnabled,false);assert.equal(calls[1].body.rows[0].lusterPrice,25000);assert.equal(calls[2].body.orderingEnabled,true);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
