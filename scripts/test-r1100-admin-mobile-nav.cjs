const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function app(page){await page.route('**/*',r=>{
 const u=new URL(r.request().url());
 if(u.pathname.startsWith('/api/'))return r.fulfill({json:u.pathname==='/api/auth/me'?{user:{userId:'admin',name:'Platform Admin',platformRole:'platform_admin'}}:{labs:[],photographers:[],plans:[],renewals:[],payments:[],account:{name:'Platform Admin',mobile:'09123456789'},settings:{},tabs:{ai:true,album:true,instagram:true},stats:{},transactions:[],shops:[]}});
 const f=path.join(root,'dist/web',u.pathname.startsWith('/admin')?'index.html':u.pathname.slice(1));
 return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
 });await page.goto('https://admin.test/admin/labs');await page.waitForSelector('#pb1100AdminNav',{state:'attached'});}
async function choose(page,text){const value=await page.locator('#pb1100AdminNav option').evaluateAll((options,text)=>options.find(o=>o.textContent===text)?.value,text);assert(value,'missing section '+text);await page.locator('#pb1100AdminNav select').selectOption(value)}
test('actual admin SPA exposes all sections on mobile and retains account/store/settings navigation',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await app(page);
 const nav=page.locator('#pb1100AdminNav');assert(await nav.isVisible());assert(!await page.locator('.adminTabs').isVisible());
 await page.waitForFunction(()=>[...document.querySelectorAll('#pb1100AdminNav option')].some(o=>o.textContent==='تب‌های عکاس'));
 const options=await nav.locator('option').allTextContents();for(const name of ['لابراتوارها','فروشگاه‌ها','عکاس‌ها','حساب ادمین','تب‌های عکاس'])assert(options.includes(name),name);
 assert(await nav.locator('select').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=14&&el.getBoundingClientRect().height>=42));
 const geometry=await page.evaluate(()=>({nav:document.querySelector('#pb1100AdminNav').getBoundingClientRect().toJSON(),header:document.querySelector('#root>header').getBoundingClientRect().toJSON(),page:document.querySelector('.adminPage').getBoundingClientRect().toJSON(),width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth}));
 assert(geometry.nav.top>=geometry.header.bottom);assert(geometry.page.bottom<=geometry.height+1,JSON.stringify(geometry));assert(geometry.nav.right<=geometry.width+1);assert(geometry.scroll<=geometry.width+1);
 await choose(page,'عکاس‌ها');await page.waitForURL('**/admin/photographers');assert(await page.locator('.adminPhotographersTable').isVisible());
 await choose(page,'فروشگاه‌ها');await page.waitForFunction(()=>document.body.classList.contains('pb904r19AdminStores'));assert(await nav.isVisible());assert(await page.locator('#pb904r19AdminStoresPanel').isVisible());
 await choose(page,'حساب ادمین');await page.waitForURL('**/admin/account');assert(await page.locator('.adminAccountPanel').isVisible());assert(await nav.isVisible());
 await choose(page,'تب‌های عکاس');await page.waitForSelector('#pb1099TabsDialog[open]');await page.getByRole('button',{name:'بستن',exact:true}).click();
 await choose(page,'لابراتوارها');await page.waitForURL('**/admin/labs');assert(await page.locator('.adminLabsTable').isVisible());
 await page.locator('.adminInternalScrollArea').evaluate(el=>el.scrollTop=200);assert(await nav.isVisible());
 await page.close();
 }
 }finally{await browser.close()}
});
test('desktop retains its original admin tab row',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});await app(page);
 assert(!await page.locator('#pb1100AdminNav').isVisible());assert(await page.locator('.adminTabs').isVisible());await page.locator('.adminTabs').getByRole('button',{name:'عکاس‌ها',exact:true}).click();await page.waitForURL('**/admin/photographers');assert(await page.locator('.adminPhotographersTable').isVisible());
 }finally{await browser.close()}
});
test('admin selector initializes when entering admin through SPA navigation',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/*',r=>new URL(r.request().url()).pathname==='/nav.js'?r.fulfill({path:path.join(root,'dist/web/photobridge-r1100-admin-mobile-nav.js')}):r.fulfill({contentType:'text/html; charset=utf-8',body:'<div id="root"><header style="height:68px">PhotoBridge</header><main class="adminPage"><div class="adminTabs"><button class="active">لابراتوارها</button><button>عکاس‌ها</button></div></main></div><script src="/nav.js"></script>'}));
 await page.goto('https://admin.test/');assert.equal(await page.locator('#pb1100AdminNav').count(),0);
 await page.evaluate(()=>{history.pushState(null,'','/admin/labs');window.dispatchEvent(new PopStateEvent('popstate'))});await page.waitForSelector('#pb1100AdminNav');assert.deepEqual(await page.locator('#pb1100AdminNav option').allTextContents(),['لابراتوارها','عکاس‌ها']);
 }finally{await browser.close()}
});
