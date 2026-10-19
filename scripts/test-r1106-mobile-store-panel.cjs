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
 assert.equal(await frame.locator('#photographerStoreBottomNav').isVisible(),false,'store content must not duplicate the dock');await frame.evaluate(()=>{document.body.classList.remove('pbR96ChoosingStore');});await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();assert.equal(await frame.evaluate(()=>document.body.classList.contains('pbR96ChoosingStore')),true);await frame.evaluate(()=>document.body.classList.remove('pbR96ChoosingStore'));await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();assert.equal(await frame.evaluate(()=>document.body.classList.contains('pbR96ChoosingStore')),true);
 await frame.locator('#photographerStoreBottomNav').evaluate(nav=>nav.style.setProperty('display','flex','important'));await frame.waitForFunction(()=>document.querySelector('#photographerStoreBottomNav').style.getPropertyValue('display')==='none');assert.equal(await frame.locator('#photographerStoreBottomNav').isVisible(),false,'legacy inline styles cannot restore an embedded dock');
 assert(await nav.isVisible());
 for(const y of [30,140,260]){
 const topOwner=await page.evaluate(y=>document.elementFromPoint(innerWidth/2,y)?.closest('#pb1106StorePanel')?.id||null,y);
 assert.equal(topOwner,'pb1106StorePanel','Gallery header, subheader and New Gallery action must not cover Store');
 }
 if(process.env.PB_CAPTURE_UI)await page.screenshot({path:'/tmp/r1107-store-'+width+'.png'});
 assert.deepEqual(await nav.locator('button.active').evaluateAll(list=>list.map(b=>b.getAttribute('aria-label'))),['فروشگاه'],'only Store is selected, not the underlying Gallery');
 await nav.getByRole('button',{name:'چاپ',exact:true}).click();await page.waitForSelector('#pb1106StorePanel',{state:'hidden'});
 await page.waitForSelector('#pb1106PrintPanel',{state:'visible'});
 assert.equal(await page.evaluate(()=>document.elementFromPoint(innerWidth/2,30)?.closest('#pb1106PrintPanel')?.id),'pb1106PrintPanel','Print covers the old Gallery header');
 assert.deepEqual(await nav.locator('button.active').evaluateAll(list=>list.map(b=>b.getAttribute('aria-label'))),['چاپ']);
 await nav.getByRole('button',{name:'گالری',exact:true}).click({timeout:5000});await page.waitForURL('**/photographer/gallery');
 assert.deepEqual(await nav.locator('button.active').evaluateAll(list=>list.map(b=>b.getAttribute('aria-label'))),['گالری'],'closing Print restores the Gallery selection');
 await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();await page.waitForSelector('#pb1106StorePanel',{state:'visible'});
 assert.equal(await page.evaluate(node=>node===document.querySelector('.photographerBottomAppNav'),original),true,'same dock DOM node remains mounted');
 assert.equal(docs.length,1,'Store navigation must not reload the main document');
 assert((await page.evaluate(()=>dockFrames)).every(x=>x.count===3&&x.height>0),'dock remains visible in every sampled animation frame');
 await page.goBack();await page.waitForSelector('#pb1106StorePanel',{state:'hidden'});assert(await nav.isVisible());
 assert.deepEqual(await nav.locator('button.active').evaluateAll(list=>list.map(b=>b.getAttribute('aria-label'))),['گالری'],'browser Back restores the underlying Gallery');
 await page.close();
 }
 }finally{await browser.close()}
});
test('direct Store entry retains the mobile dock and uses the shared desktop header',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'block'});await serve(mobile,{delay:0});await mobile.goto('https://panel.test/equipment-rental/book');await mobile.waitForSelector('#pb1106StorePanel',{state:'visible',timeout:8000});await mobile.waitForSelector('#pb1106StoreLoading',{state:'hidden'});assert(await mobile.locator('.photographerBottomAppNav').isVisible());await mobile.close();
 const desktop=await browser.newPage({viewport:{width:1366,height:844},serviceWorkers:'block'});await serve(desktop,{delay:0});await desktop.goto('https://panel.test/equipment-rental/book');await desktop.waitForSelector('#pb1126DesktopHeader',{state:'visible'});await desktop.waitForSelector('.pb1126ContentPanel:not([hidden]) iframe');assert.equal(new URL(desktop.url()).pathname,'/photographer/gallery');assert.equal(new URL(desktop.url()).searchParams.get('pbDesktopPanel'),'store');assert.equal(await desktop.locator('#pb1106StorePanel').count(),0);await desktop.close();
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

test('mobile dock reopens the lab chooser on repeated Print clicks without reloading the outer page',async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'block'});await serve(p,{delay:0});await p.goto('https://panel.test/photographer/gallery');
 const nav=p.locator('.photographerBottomAppNav');await nav.getByRole('button',{name:'چاپ',exact:true}).click();await p.waitForSelector('#pb1106PrintPanel',{state:'visible'});
 const handle=await p.locator('#pb1106PrintPanel iframe').elementHandle(),frame=await handle.contentFrame();await frame.waitForSelector('#pbR99LabChooser');
 // Simulate entering a lab, preserving the actual chooser's route listeners.
 await frame.evaluate(()=>{history.replaceState(null,'','/photographer/orders/flow?workspace=print&pbEmbeddedStore=1');document.querySelector('#pbR99LabChooser')?.remove();});
 await nav.getByRole('button',{name:'چاپ',exact:true}).click();await frame.waitForSelector('#pbR99LabChooser');assert(new URL(frame.url()).searchParams.get('pbLabChooser')==='1');assert.equal(new URL(p.url()).pathname,'/photographer/gallery');
 await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();await p.waitForSelector('#pb1106StorePanel',{state:'visible'});await nav.getByRole('button',{name:'چاپ',exact:true}).click();await p.waitForSelector('#pb1106PrintPanel',{state:'visible'});assert(await frame.locator('#pbR99LabChooser').isVisible());
 }finally{await b.close()}
});

test('mobile Store and Lab chooser introductions share padding, fonts and top spacing',async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'block'});await serve(p,{delay:0});await p.goto('https://panel.test/photographer/gallery');const nav=p.locator('.photographerBottomAppNav');
 await nav.getByRole('button',{name:'فروشگاه',exact:true}).click();const sh=await p.locator('#pb1106StorePanel iframe').elementHandle(),sf=await sh.contentFrame();await sf.waitForSelector('.pbR96StoreChooserHead',{state:'visible'});
 const measure=el=>{const s=getComputedStyle(el),h=el.querySelector('h1,h2'),t=getComputedStyle(h);return {top:el.getBoundingClientRect().top,padding:s.padding,font:t.fontSize,line:t.lineHeight,bg:s.backgroundImage,radius:s.borderRadius}};
 await sf.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));const store=await sf.locator('.pbR96StoreChooserHead').evaluate(measure);
 await nav.getByRole('button',{name:'چاپ',exact:true}).click();const lh=await p.locator('#pb1106PrintPanel iframe').elementHandle(),lf=await lh.contentFrame();await lf.waitForSelector('.pbR99LabIntro',{state:'visible'});const lab=await lf.locator('.pbR99LabIntro').evaluate(measure);
 assert.deepEqual({...store,top:0},{...lab,top:0});assert(store.top>=14,'Store introduction has space above it');assert(Math.abs(store.top-lab.top)<=2,'both introductions start at the same vertical offset: '+JSON.stringify({store,lab}));
 }finally{await b.close()}
});
