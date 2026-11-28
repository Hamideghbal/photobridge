const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('installed launch uses one user-approved cream cover, matching its icon, and hides it after readiness',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'standalone',{get:()=>true});
   // Enter the workspace after the installed app's account picker hands off.
   if(window===window.top&&location.search.includes('pb2087AccountEntry')){
    sessionStorage.setItem('pb2092-account-handoff',JSON.stringify({path:'/photographer/gallery',until:Date.now()+10000}));
   }
  });
  await page.route('https://photobridge.test/**',route=>{
   const u=new URL(route.request().url());if(u.pathname.endsWith('.js'))return route.fulfill({contentType:'application/javascript',body:''});
   const file=u.pathname.startsWith('/photographer')?'dist/web/index.html':path.join('dist/web',u.pathname);
   return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
  });
  await page.goto('https://photobridge.test/photographer/gallery?pb2087AccountEntry=1');
  assert.equal(await page.locator('#pbAppSplashV780').count(),0);
  const cover=page.locator('#pbR1361MobileSplash');assert.equal(await cover.count(),1);assert.equal(await cover.isVisible(),true);
  assert.equal(await cover.getAttribute('data-launch'),'r1838-user');
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(247, 241, 231)');
  await page.evaluate(()=>document.getElementById('root').innerHTML='<div class="center">در حال بارگذاری…</div>');
  assert.equal(await cover.isVisible(),true);
  await page.evaluate(()=>{const frame=document.createElement('iframe');frame.id='embeddedTest';frame.src='/photographer/gallery';document.body.append(frame)});
  const embedded=page.frameLocator('#embeddedTest');await embedded.locator('#root').waitFor({state:'attached'});
  assert.equal(await embedded.locator('#pbAppSplashV780').count(),0);assert.equal(await embedded.locator('#pbR1361MobileSplash').isVisible(),false,'embedded content must not add another visible splash');
  await page.evaluate(()=>{document.getElementById('root').innerHTML='<button id="readyAction" onclick="window.readyClicked=true">برنامه آماده است</button>';window.__PB1836RoleHandoff=false;document.documentElement.classList.remove('pb1493SessionResumePending','pb1721MobileEntryPending')});
  await page.waitForFunction(()=>!document.documentElement.classList.contains('pb1479Launching')&&!document.documentElement.classList.contains('pb1838LaunchLeaving'));
  assert.equal(await cover.isVisible(),false);await page.locator('#readyAction').click();assert.equal(await page.evaluate(()=>window.readyClicked),true);
  const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest','utf8'));assert.equal(manifest.background_color,'#F7F1E6');
  const icon=manifest.icons.find(icon=>icon.sizes==='512x512'&&icon.purpose==='maskable');assert(icon);assert.equal(icon.src,'/photobridge-app-512-r1867.png');
  const {data,info}=await require('sharp')(path.join('dist/web',icon.src)).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,512);assert.equal(info.height,512);
  for(let x=0;x<512;x++)for(const y of [0,511]){const offset=(y*512+x)*info.channels;assert.deepEqual([...data.subarray(offset,offset+3)],[247,241,231]);}
 }finally{await browser.close()}
});
