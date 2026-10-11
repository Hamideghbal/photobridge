const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),features=['ai','album','instagram'];
async function serve(page,state){
 await page.route('**/*',r=>{const u=new URL(r.request().url());
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/photographer/navigation-tabs')return r.fulfill({json:{tabs:state.bypass?{ai:true,album:true,instagram:true}:state.tabs,adminBypass:!!state.bypass}});
  if(u.pathname==='/api/auth/me')return r.fulfill({json:{user:{userId:'customer',name:'Customer',labRole:'customer',platformRole:state.bypass?'platform_admin':'user',photographerName:'Test Studio'}}});
  if(u.pathname==='/api/customer/entry-context')return r.fulfill({json:state.entry||{destination:'none',connectedCount:0}});
  return r.fulfill({json:{labs:[],galleries:[],items:[],notifications:[],jobs:[],models:[],settings:{},stats:{},transactions:[],shops:[]}});
 }
 const f=u.pathname==='/equipment-rental/book'?path.join(root,'dist/api/equipment-rental-book.html'):path.join(root,'dist/web',u.pathname.startsWith('/photographer')?'index.html':u.pathname.slice(1));
 return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
 });
}
async function checkDock(page,count){
 await page.waitForFunction(count=>{const g=document.querySelector('.photographerBottomAppNavGrid');return g&&g.style.getPropertyValue('--pb1099-tabs')===String(count)&&[...g.children].filter(e=>getComputedStyle(e).display!=='none').length===count},count);
 const geometry=await page.locator('.photographerBottomAppNavGrid').evaluate(g=>({rect:g.getBoundingClientRect().toJSON(),gap:parseFloat(getComputedStyle(g).columnGap)||0,buttons:[...g.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>({label:e.getAttribute('aria-label'),rect:e.getBoundingClientRect().toJSON()}))}));
 assert.equal(geometry.buttons.length,count);assert(geometry.rect.width>0);
 for(const button of geometry.buttons){assert.equal(button.rect.top,geometry.buttons[0].rect.top,'dock must stay in one row');assert(Math.abs(button.rect.width-(geometry.rect.width-geometry.gap*(count-1))/count)<2,'buttons must share full dock width')}
}
test('actual mobile SPA: every disabled-tab combination occupies one full-width dock row and can be restored',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),state={tabs:{ai:true,album:true,instagram:true}};await serve(page,state);await page.goto('https://tabs.test/photographer/gallery');await checkDock(page,6);
 for(let mask=0;mask<8;mask++){state.tabs=Object.fromEntries(features.map((key,i)=>[key,!!(mask&(1<<i))]));await page.evaluate(()=>dispatchEvent(new Event('focus')));await checkDock(page,3+features.filter(key=>state.tabs[key]).length)}
 state.tabs={ai:true,album:true,instagram:true};await page.evaluate(()=>dispatchEvent(new Event('focus')));await checkDock(page,6);await page.close();
 }
 }finally{await browser.close()}
});
test('direct disabled AI and default entry settle on gallery without repeated document navigation; admin photographer keeps all tabs',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),state={tabs:{ai:false,album:false,instagram:false}},documents=[];await serve(page,state);page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents.push(new URL(r.url()).pathname)});
 for(const start of ['/photographer/ai/retouch','/photographer']){documents.length=0;await page.goto('https://tabs.test'+start);await page.waitForURL('**/photographer/gallery');await checkDock(page,3);await page.waitForTimeout(800);assert.deepEqual(documents,start==='/photographer'?[start]:[start,'/photographer/gallery'],'default entry uses SPA navigation; disabled direct routes redirect once')}
 state.bypass=true;await page.goto('https://tabs.test/photographer/ai/retouch');await checkDock(page,6);await page.waitForTimeout(300);assert.equal(new URL(page.url()).pathname,'/photographer/ai/retouch');await page.close();
 }finally{await browser.close()}
});
test('actual storefront dock hides three disabled tabs and fills a single row',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await serve(page,{tabs:{ai:false,album:false,instagram:false}});await page.goto('https://tabs.test/equipment-rental/book');await checkDock(page,3);
 assert.equal(await page.locator('script[src*="photobridge-r1099-photographer-tabs.js"]').count(),1,'tab controller must only load once');
 }finally{await browser.close()}
});

test('actual desktop role-header CSS cannot restore disabled tabs; enabling restores native buttons',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1366,height:844},serviceWorkers:'block'}),state={tabs:{ai:false,album:false,instagram:false}};await serve(page,state);await page.goto('https://tabs.test/photographer/gallery');
 await page.waitForFunction(()=>document.querySelectorAll('.photographerHomeModeNav [data-pb1099-hidden]').length===3);
 assert.equal(await page.locator('.photographerHomeModeNav button:visible').count(),3);
 state.tabs={ai:true,album:true,instagram:true};await page.evaluate(()=>dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>document.querySelector('.photographerHomeModeNav')&&!document.querySelector('.photographerHomeModeNav [data-pb1099-hidden]'));
 assert.equal(await page.locator('.photographerHomeModeNav button:visible').count(),6);
 }finally{await browser.close()}
});

test('default photographer entry always opens Gallery with AI enabled, including connected store/labs and admin photographer',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const entry of [{destination:'none',connectedCount:0},{destination:'rental',connectedCount:1},{destination:'lab',connectedCount:1,primaryLabId:'lab'},{destination:'lab',connectedCount:2}]){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),state={tabs:{ai:true,album:true,instagram:true},entry,bypass:entry.destination==='none'};
 await serve(page,state);await page.goto('https://tabs.test/photographer');await page.waitForURL('**/photographer/gallery');await checkDock(page,6);assert(await page.getByRole('button',{name:'گالری',exact:true}).last().evaluate(e=>e.classList.contains('active')));await page.close();
 }
 }finally{await browser.close()}
});
test('explicit print and lab chooser navigation stays on the requested route',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const query of ['?workspace=print','?pbEntryDone=lab','?pbLabChooser=1']){
 const page=await browser.newPage();let requests=0;await page.route('**/*',r=>{requests++;return r.fulfill({contentType:'text/html',body:'<body></body>'})});
 await page.goto('https://entry.test/photographer'+query);const before=requests;await page.addScriptTag({content:fs.readFileSync(path.join(root,'dist/web/photobridge-r100f5-entry-routing.js'),'utf8')});await page.waitForTimeout(800);
 assert.equal(new URL(page.url()).pathname+new URL(page.url()).search,'/photographer'+query);assert.equal(requests,before);await page.close();
 }
 }finally{await browser.close()}
});
