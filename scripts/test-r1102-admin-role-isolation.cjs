const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
test('admin with photographer role never mounts photographer header or menu',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});let loggedOut=false,storeRequested=false;
 await page.addInitScript(()=>sessionStorage.setItem('pb_admin_tab_v1','stores'));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());
 if(u.pathname==='/api/admin/equipment-rental/overview'){storeRequested=true;return;}
 if(u.pathname==='/api/auth/logout'){loggedOut=true;assert.equal(route.request().method(),'POST');assert.equal(route.request().headers()['x-photobridge-portal'],'admin');return route.fulfill({json:{ok:true}})}
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:u.pathname==='/api/auth/me'?{user:loggedOut?null:{userId:'admin',name:'Platform Admin',platformRole:'platform_admin',labRole:'customer',labId:'lab',photographerName:'Admin Studio',mobile:'09123456789'}}:{labs:[],photographers:[],plans:[],renewals:[],payments:[],settings:{},tabs:{ai:true,album:true,instagram:true},stats:{},transactions:[],shops:[]}});
 const file=path.join(root,'dist/web',u.pathname.startsWith('/admin')?'index.html':u.pathname.slice(1));return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});});
 await page.goto('https://admin.test/admin/labs',{waitUntil:'domcontentloaded'});await page.waitForSelector('#pb1100AdminNav');await page.waitForFunction(()=>document.documentElement.classList.contains('pbR100F11AdminStoreBoot'));assert(storeRequested);
 const header=page.locator('#root>header'),select=page.locator('#pb1100AdminNav select'),logout=page.locator('.topPowerLogout');await page.waitForTimeout(250);assert.equal(await page.locator('#pbF37PhotographerHeader').count(),0,'photographer header leaked into admin');assert(await header.isVisible());assert(await select.isVisible());assert(await logout.isVisible());
 for(const locator of [select,logout])assert(await locator.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)}),'header control covered during store load');
 assert(await logout.evaluate(el=>el.getBoundingClientRect().height>=44));
 const value=await select.locator('option').evaluateAll(options=>options.find(o=>o.textContent==='عکاس‌ها')?.value);await select.selectOption(value);await page.waitForURL('**/admin/photographers');assert(await page.locator('.adminPhotographersTable').isVisible());assert(!await page.locator('.photographerMain').count());
 const request=page.waitForRequest('**/api/auth/logout',{timeout:4000});await logout.tap();await request;await page.waitForURL('**/admin?logged_out=1',{timeout:4000});assert(loggedOut);
 await page.close();
 }}finally{await browser.close()}
});
test('photographer header follows SPA routes and ignores stale photographer body class on admin and signup',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});let identityCalls=0;
 await page.route('**/*',route=>{if(new URL(route.request().url()).pathname.startsWith('/api/')){identityCalls++;return route.fulfill({json:{user:{name:'عکاس آزمایشی',photographerName:'آتلیه تست'}}})}return route.fulfill({contentType:'text/html',body:'<body class="pbAuthenticatedPhotographerPortal"><div id="root"><main class="photographerMain"></main></div></body>'})});
 await page.goto('https://header.test/photographer/gallery');await page.addScriptTag({content:fs.readFileSync(path.join(root,'dist/web/photobridge-v904r100f41-header-date-name-fit.js'),'utf8')});await page.waitForSelector('#pbF37PhotographerHeader');assert(await page.locator('#pbF37MenuBtn').count());
 await page.evaluate(()=>{document.querySelector('main').className='adminPage';history.pushState(null,'','/admin/labs');dispatchEvent(new PopStateEvent('popstate'))});await page.waitForFunction(()=>!document.getElementById('pbF37PhotographerHeader'));assert.equal(await page.locator('#pbF37MenuPanel').count(),0);assert.equal(await page.locator('#pbF37Subheader').count(),0);assert.equal(await page.locator('#pbF37MenuBtn').count(),0);assert(!await page.evaluate(()=>document.body.classList.contains('pbF37UnifiedActive')));
 const count=identityCalls;await page.evaluate(()=>dispatchEvent(new CustomEvent('photobridge-auth-session-changed',{detail:{labRole:'customer'}})));await page.waitForTimeout(100);assert.equal(identityCalls,count,'admin must not fetch photographer header identity');
 await page.evaluate(()=>{document.querySelector('main').className='photographerMain';history.pushState(null,'','/photographer/gallery');dispatchEvent(new PopStateEvent('popstate'))});await page.waitForSelector('#pbF37PhotographerHeader');
 await page.evaluate(()=>{history.pushState(null,'','/photographer/signup');dispatchEvent(new PopStateEvent('popstate'))});await page.waitForFunction(()=>!document.getElementById('pbF37PhotographerHeader'));
 }finally{await browser.close()}
});
