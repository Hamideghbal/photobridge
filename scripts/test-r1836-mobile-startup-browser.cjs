const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
async function measure(browser,root,{ios=true,baseline=false}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
 let start=Date.now(),cssReleased=0,firstRole=0,entryAt=0,documents=0;
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents++});
 await page.addInitScript(({ios})=>{Object.defineProperty(navigator,'standalone',{get:()=>ios});if(!ios){const original=window.matchMedia.bind(window);window.matchMedia=query=>{const result=original(query);if(query.includes('display-mode: standalone'))Object.defineProperty(result,'matches',{value:true});return result;}};window.visibleStartupPaths=[];function sample(){const root=document.getElementById('root'),splash=document.getElementById('pbR1361MobileSplash');if(root?.childElementCount&&getComputedStyle(root).visibility!=='hidden'&&(!splash||getComputedStyle(splash).display==='none'||getComputedStyle(splash).visibility==='hidden'))window.visibleStartupPaths.push(location.pathname);requestAnimationFrame(sample)}requestAnimationFrame(sample)},{ios});
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname.startsWith('/api/')){
   if(url.pathname==='/api/auth/me'){
    const portal=request.headers()['x-photobridge-portal'];if(portal&&!firstRole)firstRole=Date.now()-start;
    if(portal==='lab'||portal==='rental'){await new Promise(r=>setTimeout(r,500));return route.fulfill({status:401,json:{error:'unauthorized'}})}
    return route.fulfill({json:{user:{userId:'customer',name:'Test',labRole:'customer',platformRole:'user',photographerName:'Test Studio'}}});
   }
   if(url.pathname==='/api/customer/entry-context'){entryAt=entryAt||Date.now()-start;await new Promise(r=>setTimeout(r,180));return route.fulfill({json:{destination:'free',connectedCount:0}})}
   if(url.pathname==='/api/photographer/navigation-tabs')return route.fulfill({json:{tabs:{ai:false,album:false,instagram:false},adminBypass:false}});
   return route.fulfill({json:{labs:[],galleries:[],items:[],notifications:[],jobs:[],models:[],settings:{},stats:{},transactions:[],shops:[]}});
  }
  if(url.pathname==='/assets/index-UIRefine-v586.css'){await new Promise(r=>setTimeout(r,700));cssReleased=Date.now()-start;}
  const file=path.join(root,'dist/web',url.pathname.startsWith('/photographer')?'index.html':url.pathname.slice(1));
  if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
  return route.fulfill({status:404,body:''});
 });
 start=Date.now();await page.goto('https://startup.test/photographer',{waitUntil:'domcontentloaded'});
 await page.waitForURL('**/photographer/gallery');
 let stable=true;await page.waitForFunction(()=>document.querySelector('.clientGalleryListHead,.clientGalleryEmpty,.clientGalleryCards')&&!document.documentElement.classList.contains('pb1479Launching'),null,{timeout:baseline?4000:15000}).catch(async error=>{if(baseline){stable=false;return;}console.log('BOOT_DIAGNOSTIC',root,await page.evaluate(()=>({url:location.href,cls:document.documentElement.className,text:document.body.innerText.slice(0,1200),children:[...document.querySelector('#root')?.children||[]].map(n=>n.className)})),errors);throw error});
 const ready=Date.now()-start;await page.waitForTimeout(250);
 const state=await page.evaluate(()=>({paths:[...new Set(window.visibleStartupPaths)],desktopPrepaint:document.documentElement.classList.contains('pb1602PhotographerDesktop')}));
 await context.close();return {ready:stable?ready:null,stable,firstRole,entryAt,cssReleased,documents,errors,...state};
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const baseline=process.env.STARTUP_BASELINE_ROOT?await measure(browser,process.env.STARTUP_BASELINE_ROOT,{baseline:true}):null;
  const current=await measure(browser,path.resolve(__dirname,'..'));
  const android=await measure(browser,path.resolve(__dirname,'..'),{ios:false});
  console.log(JSON.stringify({baseline,current,android},null,2));
  assert.equal(android.documents,1);assert.deepEqual(android.errors,[]);assert.equal(android.desktopPrepaint,false);assert(android.paths.every(p=>p==='/photographer/gallery'));
  assert.equal(current.documents,1,'same-document photographer startup');
  assert.equal(current.desktopPrepaint,false,'mobile never acquires desktop prepaint');
  assert(current.firstRole<current.cssReleased,'role probes overlap the slow application stylesheet');
  assert(current.entryAt<current.cssReleased,'entry data overlaps application assets');
  assert.deepEqual(current.errors,[]);
  assert(current.paths.length>0&&current.paths.every(p=>p==='/photographer/gallery'),'no intermediate visible page');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
