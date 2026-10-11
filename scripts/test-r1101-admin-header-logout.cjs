const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
test('mobile multi-role admin keeps header and section selection usable while remembered stores load; logout does not wait for a worker',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});let loggedOut=false,storeRequested=false;
 await page.addInitScript(()=>sessionStorage.setItem('pb_admin_tab_v1','stores'));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());
 if(u.pathname==='/api/admin/equipment-rental/overview'){storeRequested=true;return;}
 if(u.pathname==='/api/auth/logout'){loggedOut=true;assert.equal(route.request().method(),'POST');assert.equal(route.request().headers()['x-photobridge-portal'],'admin');return route.fulfill({json:{ok:true}})}
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:u.pathname==='/api/auth/me'?{user:loggedOut?null:{userId:'admin',name:'Platform Admin',platformRole:'platform_admin',labRole:'lab_admin',labId:'lab',photographerName:'Admin Studio',mobile:'09123456789'}}:{labs:[],photographers:[],plans:[],renewals:[],payments:[],settings:{},tabs:{ai:true,album:true,instagram:true},stats:{},transactions:[],shops:[]}});
 const file=path.join(root,'dist/web',u.pathname.startsWith('/admin')?'index.html':u.pathname.slice(1));return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});});
 await page.goto('https://admin.test/admin/labs',{waitUntil:'domcontentloaded'});await page.waitForSelector('#pb1100AdminNav');await page.waitForFunction(()=>document.documentElement.classList.contains('pbR100F11AdminStoreBoot'));assert(storeRequested);
 const header=page.locator('#root>header'),select=page.locator('#pb1100AdminNav select'),logout=page.locator('.topPowerLogout');assert(await header.isVisible());assert(await select.isVisible());assert(await logout.isVisible());
 for(const locator of [select,logout])assert(await locator.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)}),'header control covered during store load');
 assert(await logout.evaluate(el=>el.getBoundingClientRect().height>=44));
 const value=await select.locator('option').evaluateAll(options=>options.find(o=>o.textContent==='عکاس‌ها')?.value);await select.selectOption(value);await page.waitForURL('**/admin/photographers');assert(await page.locator('.adminPhotographersTable').isVisible());assert(!await page.locator('.photographerMain').count());
 const request=page.waitForRequest('**/api/auth/logout',{timeout:4000});await logout.tap();await request;await page.waitForURL('**/admin?logged_out=1',{timeout:4000});assert(loggedOut);
 await page.close();
 }}finally{await browser.close()}
});
test('existing Web Push subscription is removed before logout without awaiting serviceWorker.ready',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage();await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));await page.goto('https://push.test/photographer');
 await page.evaluate(()=>{window.calls=[];window.fetch=async(path,opts)=>{calls.push([path,opts?.method]);return new Response('{}',{status:200})};Object.defineProperty(navigator,'serviceWorker',{value:{ready:new Promise(()=>{}),getRegistration:async()=>({pushManager:{getSubscription:async()=>({endpoint:'https://push.test/sub',unsubscribe:async()=>calls.push(['unsubscribe'])})},active:{postMessage:msg=>calls.push([msg.type])}})}})});
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'dist/web/photobridge-push-v728.js'),'utf8')});await page.evaluate(()=>fetch('/api/auth/logout',{method:'POST'}));
 const calls=await page.evaluate(()=>window.calls.filter(c=>['/api/customer/push/subscribe','unsubscribe','PB_PUSH_LOGOUT','/api/auth/logout'].includes(c[0])));assert.deepEqual(calls,[['/api/customer/push/subscribe','DELETE'],['unsubscribe'],['PB_PUSH_LOGOUT'],['/api/auth/logout','POST']]);
 }finally{await browser.close()}
});
