const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const source=fs.readFileSync('dist/web/index.html','utf8'),styles=[...source.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]).join('');
 const start=source.indexOf('<div id="pbR1361MobileSplash"'),end=source.indexOf('<div id="root">',start),markup=source.slice(start,end);
 const boot=source.match(/<script id="pb1479LaunchBoot">([\s\S]*?)<\/script>/)[1];
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const [width,height,reduced,installed] of [[390,844,false,true],[320,568,false,true],[430,932,true,true],[390,844,false,false]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://launch.test/**',route=>{
   const u=new URL(route.request().url());if(u.pathname!=='/')return route.fulfill({path:path.join(process.cwd(),'dist/web',u.pathname.slice(1))});
   return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html dir="rtl" class="'+(installed?'pbR1361IosStandalone pb1493SessionResumePending':'')+'"><head><meta charset="utf-8"><meta name="theme-color" content="#dff2f6"><meta name="viewport" content="width=device-width,initial-scale=1">'+styles+'<style>@font-face{font-family:Vazirmatn;src:url(/assets/photobridge-handover-vazirmatn.woff2)}body{margin:0}</style><script>Object.defineProperty(navigator,"standalone",{value:'+installed+'});</script><script>'+boot+'</script></head><body>'+markup+'<div id="root"></div></body></html>'});
  });
  await page.goto('https://launch.test/');
  if(installed){
   await page.waitForTimeout(1400);assert.equal(await page.locator('#pbR1361MobileSplash').isVisible(),true);
   assert.equal(await page.locator('#pbR1361MobileSplash').count(),1);assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#F7F1E7');
   assert.equal(await page.locator('#pbR1361MobileSplash').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(247, 241, 231)');
   assert.equal(await page.locator('#pb1838Userword').evaluate(e=>getComputedStyle(e).fontFamily.split(',')[0]),'PBLaunchPlayfair');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(reduced){assert.equal(await page.locator('#pb1838Userring').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('#pb1838Userring').evaluate(e=>getComputedStyle(e).strokeDashoffset),'0px')}
   else assert.equal(await page.locator('#pb1838Userring').evaluate(e=>getComputedStyle(e).animationName),'pb1838Draw');
   if(width===390)await page.screenshot({path:'work/user-splash-final.png'});
   const ready=Date.now();await page.evaluate(()=>{document.getElementById('root').innerHTML='<button id="readyButton" onclick="window.readyClicked=true">ورود</button>';document.documentElement.classList.remove('pb1493SessionResumePending')});
   await page.locator('#readyButton').click();assert.equal(await page.evaluate(()=>window.readyClicked),true);
   await page.waitForFunction(()=>!document.documentElement.classList.contains('pb1838LaunchLeaving')&&!document.documentElement.classList.contains('pb1479Launching'));
   assert(Date.now()-ready<1000,'animation never imposes its own multi-second loading delay');
   assert.equal(await page.locator('#pbR1361MobileSplash').isVisible(),false);assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#dff2f6');
  }else assert.equal(await page.locator('#pbR1361MobileSplash').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS user splash',width,height,'reduced='+reduced,'installed='+installed);await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
