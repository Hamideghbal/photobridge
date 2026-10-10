// Full shipped portal + external runtimes, local API fixtures, no live writes.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
test('complete mobile/desktop store portal settles without observer loops and remains interactive',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'});
   await page.addInitScript(()=>{
    const Native=MutationObserver;window.__observerStats=[];
    window.MutationObserver=class extends Native{constructor(fn){const stat={count:0,stopped:false,stack:new Error().stack};window.__observerStats.push(stat);super((records,observer)=>{stat.count++;if(stat.count>1000){stat.stopped=true;observer.disconnect();return}fn(records,observer)})}};
   });
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith('/api/')){
     let body={};
     if(url.pathname==='/api/auth/me')body={user:{id:'manager',name:'Manager'},rentalShop:{id:'shop',name:'Seven'}};
     if(url.pathname==='/api/rental/overview')body={shop:{id:'shop',name:'Seven',rental_enabled:true,sale_enabled:true,active:true,activation_status:'approved'},items:[],saleItems:[],bookings:[],photographers:[],plans:[],renewals:[],collaborationRequests:[],saleOrders:[],shortages:[],returnShortages:[],stats:{},subscription:{}};
     return route.fulfill({json:body});
    }
    const file=url.pathname.startsWith('/rental')?path.join(root,'dist/api/equipment-rental-portal.html'):path.join(root,'dist/web',url.pathname);
    if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});
   });
   await page.goto('http://localhost/rental/bookings',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('body.rentalAppReady');
   await page.waitForTimeout(2400);
   await page.evaluate(()=>{
    const rail=document.getElementById('pb848BookingHeaderTabs');window.__railChanges=0;
    const observer=new MutationObserver(records=>window.__railChanges+=records.filter(r=>r.type==='childList').length);
    observer.observe(rail,{subtree:true,childList:true});
   });
   await page.waitForTimeout(1400);
   const stats=await page.evaluate(()=>({rail:__railChanges,stopped:__observerStats.filter(x=>x.stopped).map(x=>x.stack),returnLabel:document.querySelector('[data-pb843-office-tab="returnShortages"]')?.textContent}));
   assert.deepEqual(stats.stopped,[],'no observer should hit runaway safeguard');
   assert(stats.rail<10,`idle rail must not rebuild repeatedly: ${JSON.stringify(stats)}`);
   if(viewport.width<851)assert.match(stats.returnLabel,/کسری دریافت/);
   const elapsed=await page.evaluate(()=>new Promise(resolve=>{const t=performance.now();setTimeout(()=>resolve(performance.now()-t),50)}));
   assert(elapsed<250,`main thread timer was delayed ${elapsed}ms`);
   for(const tab of ['sales','items','bookings']){
    await page.evaluate(tab=>selectRentalTab(tab,{push:false,reloadExtra:false}),tab);
    await page.waitForTimeout(160);
    assert.equal(await page.locator('#'+(tab==='sales'?'sales':tab==='items'?'items':'bookings')+'.active').count(),1);
   }
   assert.deepEqual(await page.evaluate(()=>__observerStats.filter(x=>x.stopped).map(x=>x.stack)),[]);
   await page.close();
  }
 }finally{await browser.close()}
});
