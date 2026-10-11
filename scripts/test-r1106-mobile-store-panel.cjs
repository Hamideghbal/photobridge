const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function serve(page,state){
 await page.route('**/*',async r=>{const u=new URL(r.request().url());
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/photographer/navigation-tabs'){if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));return r.fulfill({json:{tabs:state.tabs||{ai:false,album:false,instagram:false},adminBypass:false}})}
  if(u.pathname==='/api/auth/me')return r.fulfill({json:{user:{userId:'customer',name:'Customer',labRole:'customer',platformRole:'user',photographerName:'Test Studio'}}});
  if(u.pathname==='/api/customer/entry-context')return r.fulfill({json:{destination:'none',connectedCount:0}});
  return r.fulfill({json:{labs:[],galleries:[],items:[],notifications:[],jobs:[],models:[],settings:{},stats:{},transactions:[],shops:[]}});
 }
 const f=u.pathname==='/equipment-rental/book'?path.join(root,'dist/api/equipment-rental-book.html'):path.join(root,'dist/web',u.pathname.startsWith('/photographer')?'index.html':u.pathname.slice(1));
 return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
 });
}
test('mobile Gallery → Store → Print → Gallery → Store retains one document and one visible three-tab dock',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await serve(page,{delay:1200});
 const docs=[];page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())docs.push(r.url())});
 await page.addInitScript(()=>{window.dockFrames=[];function sample(){const nav=document.querySelector('.photographerBottomAppNavGrid');if(nav){const visible=[...nav.children].filter(x=>getComputedStyle(x).display!=='none');window.dockFrames.push({count:visible.length,height:nav.getBoundingClientRect().height})}requestAnimationFrame(sample)}requestAnimationFrame(sample)});
 await page.goto('https://panel.test/photographer/gallery');
 await page.waitForFunction(()=>document.querySelector('.photographerBottomAppNavGrid')?.style.getPropertyValue('--pb1099-tabs')==='3');
 const nav=page.locator('.photographerBottomAppNav');const original=await nav.elementHandle();
 assert((await page.evaluate(()=>dockFrames)).every(x=>x.count===3),'disabled tabs must never flash before settings load');
 await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();await page.waitForSelector('#pb1106StorePanel iframe');
 const frame=await page.locator('#pb1106StorePanel iframe').elementHandle().then(x=>x.contentFrame());
 await frame.waitForSelector('#storePhotographerWorkspace',{state:'attached'});await page.waitForSelector('#pb1106StoreLoading',{state:'hidden'});
 assert.equal(await frame.locator('#photographerStoreBottomNav').isVisible(),false,'store content must not duplicate the dock');
 assert(await nav.isVisible());
 await nav.getByRole('button',{name:'چاپ',exact:true}).click();await page.waitForSelector('#pb1106StorePanel',{state:'hidden'});
 await page.waitForSelector('#pb1106PrintPanel',{state:'visible'});await nav.getByRole('button',{name:'گالری',exact:true}).click({timeout:5000});await page.waitForURL('**/photographer/gallery');
 await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();await page.waitForSelector('#pb1106StorePanel',{state:'visible'});
 assert.equal(await page.evaluate(node=>node===document.querySelector('.photographerBottomAppNav'),original),true,'same dock DOM node remains mounted');
 assert.equal(docs.length,1,'Store navigation must not reload the main document');
 assert((await page.evaluate(()=>dockFrames)).every(x=>x.count===3&&x.height>0),'dock remains visible in every sampled animation frame');
 await page.goBack();await page.waitForSelector('#pb1106StorePanel',{state:'hidden'});assert(await nav.isVisible());
 await page.close();
 }
 }finally{await browser.close()}
});
test('direct mobile Store entry restores its store panel; desktop Store navigation remains unchanged',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'block'});await serve(mobile,{delay:0});await mobile.goto('https://panel.test/equipment-rental/book');await mobile.waitForSelector('#pb1106StorePanel',{state:'visible',timeout:8000});await mobile.waitForSelector('#pb1106StoreLoading',{state:'hidden'});assert(await mobile.locator('.photographerBottomAppNav').isVisible());await mobile.close();
 const desktop=await browser.newPage({viewport:{width:1366,height:844},serviceWorkers:'block'});await serve(desktop,{delay:0});await desktop.goto('https://panel.test/equipment-rental/book');assert.equal(new URL(desktop.url()).pathname,'/equipment-rental/book');assert.equal(await desktop.locator('#pb1106StorePanel').count(),0);await desktop.close();
 }finally{await browser.close()}
});

test('disabling the underlying AI route while Store is open keeps Store and its dock mounted',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'block'}),state={tabs:{ai:true,album:true,instagram:true}};await serve(page,state);await page.goto('https://panel.test/photographer/ai/retouch');
 await page.waitForFunction(()=>document.querySelector('.photographerBottomAppNavGrid')?.style.getPropertyValue('--pb1099-tabs')==='6');
 await page.locator('.photographerBottomAppNav').getByRole('button',{name:'فروشگاه',exact:true}).click();await page.waitForSelector('#pb1106StorePanel',{state:'visible'});
 state.tabs={ai:false,album:false,instagram:false};await page.evaluate(()=>dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>document.querySelector('.photographerBottomAppNavGrid')?.style.getPropertyValue('--pb1099-tabs')==='3');assert(await page.locator('#pb1106StorePanel').isVisible());assert(new URL(page.url()).searchParams.has('pbStorePanel'));await page.close();
 }finally{await browser.close()}
});
