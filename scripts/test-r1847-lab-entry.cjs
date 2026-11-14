const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const lab={id:'11111111-1111-4111-8111-111111111111',name:'لابراتوار آزمایشی',active:true,service_only:false};
async function fixture(browser,{width=390,deep=false,unauthorized=false,slowModule=false,embedded=true,many=false,slowOptional=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await context.newPage();
 page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);
 const calls=[],errors=[];let selects=0,selected=deep,entryDocument=0,identityDone=0,entryIdentityDone=false;
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{const originalInterval=window.setInterval;window.setInterval=function(fn,ms,...args){if(ms===15000&&String(fn).includes('PB1848PageRef'))window.__PB1848TestRefresh=fn;return originalInterval(fn,ms,...args)};window.entryStarted=performance.now();window.pb1847FirstSkeletonAt=0;window.pb1847FirstSkeleton=null;window.pb1847CoverGone=null;function sample(){const el=document.getElementById('pb1847EntrySkeleton');if(el&&getComputedStyle(el).display!=='none'&&window.pb1847FirstSkeleton===null){window.pb1847FirstSkeleton=performance.now();window.pb1847FirstSkeletonAt=Date.now()}if(window.__PB1847EntryUI&&!document.documentElement.classList.contains('pbR100F37LabEnterBoot')&&window.pb1847CoverGone===null)window.pb1847CoverGone=performance.now();requestAnimationFrame(sample)}requestAnimationFrame(sample)});
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),p=url.pathname;
  if(p.startsWith('/api/')){
   calls.push({path:p,query:url.search,at:Date.now(),entry:selected});
   if(p==='/api/auth/me'){const forEntry=selected;await new Promise(r=>setTimeout(r,1500));if(forEntry){if(!identityDone)identityDone=Date.now();entryIdentityDone=true;}return route.fulfill({status:unauthorized?401:200,json:unauthorized?{error:'unauthorized'}:{user:{id:'photographer',userId:'photographer',name:'عکاسی آزمایشی',photographerName:'عکاسی آزمایشی',labRole:'customer',platformRole:'user'},lab}})}
   if(p===`/api/customer/labs/${lab.id}/select`){selects++;selected=true;return route.fulfill({json:{ok:true,lab}})}
   if(p==='/api/customer/labs')return route.fulfill({json:{activeLabId:lab.id,memberships:[{...lab,selected:true}],labs:[],canDiscoverLabs:false}});
   if(p==='/api/customer/home'){if(slowOptional&&selected)await new Promise(r=>setTimeout(r,4000));return route.fulfill({json:{lab,profile:{studio_name:'عکاسی آزمایشی'},prices:[],status:{open:true},orderStats:{total:1,active:1,ready:0},recentOrders:[],walletBalance:0}});}
   if(p==='/api/customer/orders/order-one')return route.fulfill({json:{order:{id:'order-one',number:123,status:'sent',created_at:new Date().toISOString()},files:Array.from({length:60},(_,i)=>({id:'file-'+i,original_name:'photo-'+i+'.jpg',content_type:'image/jpeg',bytes:1000,width:100,height:100,size_label:'10×15',print_type:'luster'}))}});
   if(/^\/api\/customer\/order-files\/[^/]+\/preview$/.test(p))return route.fulfill({json:{url:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}});
   if(p==='/api/customer/orders'){
    await new Promise(r=>setTimeout(r,800));const size=Number(url.searchParams.get('pageSize')||300),offset=Number(url.searchParams.get('offset')||0),orders=Array.from({length:many?70:1},(_,i)=>({id:i?'order-'+i:'order-one',lab_id:lab.id,number:123+i,status:'sent',mode:'print',created_at:new Date(Date.now()-i*1000).toISOString(),file_count:1,total_bytes:1000}));
    return route.fulfill({status:unauthorized?401:200,json:unauthorized?{error:'unauthorized'}:{labId:lab.id,orders:orders.slice(offset,offset+size),paymentSettings:{},pagination:{limit:size,offset,hasMore:offset+size<orders.length,total:orders.length,counts:{flow:orders.length,ready:0,needs_fix:0,completed:0}}}})
   }
   if(p.includes('wallet')||p.includes('notifications'))await new Promise(r=>setTimeout(r,4000));
   return route.fulfill({json:{items:[],orders:[],invoices:[],galleries:[],archive:[],notifications:[],tabs:{ai:false,album:false,instagram:false},settings:{},stats:{},entries:[],summary:{},labId:lab.id}});
  }
  if(request.isNavigationRequest()&&request.frame()===page.mainFrame()){entryDocument++;}
  if(slowModule&&p.startsWith('/assets/')&&p.endsWith('.js'))await new Promise(r=>setTimeout(r,3200));
  const file=path.join(process.cwd(),'dist/web',p.startsWith('/photographer')?'index.html':p.slice(1));
  if(p.startsWith('/assets/index-')&&p.endsWith('.js')&&fs.existsSync(file))return route.fulfill({contentType:'text/javascript',body:'window.__PB1847MainStartedAt=Date.now();\n'+fs.readFileSync(file,'utf8')});
  return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 const suffix=deep?'pbEntryDone=lab':'pbLabChooser=1';
 await page.goto('https://entry.test/photographer/orders/flow?workspace=print&'+suffix+(embedded?'&pbDesktopContent=1':''),{waitUntil:slowModule?'commit':'domcontentloaded'});
 return {page,context,calls,errors,selects:()=>selects,documents:()=>entryDocument,identityDone:()=>identityDone,identityResolved:()=>entryIdentityDone};
}
for(const width of [390,1366])test('actual lab card enters with one select, early skeleton/prefetch and deferred tabs at '+width,async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const h=await fixture(browser,{width}),{page}=h;
  await page.locator('[data-select]').waitFor();
  const started=Date.now();await page.locator('[data-select]').click();await page.waitForURL('**pbEntryDone=lab**');
  await page.locator('#pb1847EntrySkeleton').waitFor();
  await page.waitForFunction(()=>window.pb1847FirstSkeletonAt>0);const firstSkeletonAt=await page.evaluate(()=>window.pb1847FirstSkeletonAt);assert(!h.identityDone()||firstSkeletonAt<h.identityDone(),'lab header and orders skeleton precede delayed identity');assert.match(await page.locator('#pb1847EntrySkeleton').innerText(),/لابراتوار آزمایشی/);
  await page.waitForFunction(()=>window.pb1847CoverGone!==null);assert((await page.evaluate(()=>window.pb1847CoverGone))<=2500,'legacy cover bounded from destination head');
  await page.locator('.photographerMain.photographerPrintWorkspace').waitFor().catch(async error=>{console.log('WORKSPACE_DIAG',await page.evaluate(()=>({url:location.href,body:document.body.innerText.slice(0,1800),root:document.getElementById('root')?.innerHTML.slice(0,1500)})),h.errors,h.calls);throw error});await page.waitForFunction(()=>!document.getElementById('pb1847EntrySkeleton'));
  await page.locator('[data-order-id="order-one"]').waitFor();
  assert(h.calls.find(c=>c.path==='/api/customer/orders'&&c.entry).at<await page.evaluate(()=>window.__PB1847MainStartedAt),'orders start before the main module executes');
  assert.equal(h.selects(),1);assert.equal(h.calls.filter(c=>c.path==='/api/customer/orders'&&c.entry).length,1,'prefetched orders consumed once');assert(h.calls.find(c=>c.path==='/api/customer/orders'&&c.entry).at<h.identityDone(),'orders start before identity');
  assert.equal(await page.evaluate(()=>window.__PB1847EntryEarly),undefined);
  const optional=/^\/api\/customer\/(?:archive|invoices|finance|accounting|client-galleries)/;
  assert.deepEqual(h.calls.filter(c=>optional.test(c.path)),[],'inactive tab data is deferred');
  console.log(JSON.stringify({width,clickToOrdersMs:Date.now()-started,firstSkeletonMs:await page.evaluate(()=>window.pb1847FirstSkeleton),coverGoneMs:await page.evaluate(()=>window.pb1847CoverGone),documents:h.documents()}));
  await page.evaluate(()=>{history.pushState(null,'','/photographer/archive?workspace=print&pbDesktopContent=1');dispatchEvent(new PopStateEvent('popstate'))});
  await page.waitForFunction(()=>location.pathname==='/photographer/archive');await page.waitForTimeout(300);assert(h.calls.some(c=>c.path==='/api/customer/archive'),'archive requested when opened');
  assert.deepEqual(h.errors,[]);await h.context.close();
 }finally{await browser.close()}
});
for(const width of [390,1366])test('deep link and a stalled module show a skeleton within the 2500ms cap at '+width,async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const h=await fixture(browser,{width,deep:true,slowModule:true});await h.page.locator('#pb1847EntrySkeleton').waitFor();await h.page.waitForFunction(()=>window.pb1847CoverGone!==null);assert((await h.page.evaluate(()=>window.pb1847CoverGone))<=2500);await h.page.waitForFunction(()=>!document.getElementById('pb1847EntrySkeleton'),null,{timeout:15000});assert.equal(h.selects(),0);assert.deepEqual(h.errors,[]);await h.context.close()}finally{await browser.close()}
});
test('one-shot API preload keeps mismatched labs and 401 errors on the original API path',async()=>{
 const wrapper=fs.readFileSync('scripts/r1847-entry-api.js.txt','utf8'),calls=[];const sandbox={window:{__PB1847EntryUI:{ordersReady(){},remove(){calls.push('cleanup')}}},location:{origin:'https://entry.test'},URL,Sr:()=>'',yg:()=>null,PB1847OriginalApi:async(url)=>{calls.push(url);throw Object.assign(Error('unauthorized'),{status:401})}};vm.createContext(sandbox);vm.runInContext(wrapper+';this.api=Me',sandbox);
 sandbox.window.__PB1847EntryEarly={labId:'wanted',orders:Promise.resolve({labId:'wrong',orders:[]})};await assert.rejects(sandbox.api('/api/customer/orders?_lab=wanted'),{status:401});assert.deepEqual(calls,['/api/customer/orders?_lab=wanted','cleanup']);assert.equal(sandbox.window.__PB1847EntryEarly,undefined);
 sandbox.window.__PB1847EntryEarly={labId:'wanted',home:Promise.resolve(null)};await assert.rejects(sandbox.api('/api/customer/home'),{status:401});assert.equal(sandbox.window.__PB1847EntryEarly,undefined);
});

for(const width of [390,1366])test('P2 website reuses its SPA while embedded and deep links retain fallback at '+width,async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const h=await fixture(browser,{width,embedded:width>=821,slowOptional:width<821}),{page}=h;
  if(width>=821){await page.locator('[data-select]').waitFor();await page.locator('[data-select]').click();await page.waitForFunction(()=>!document.getElementById('pb1847EntrySkeleton')&&!!document.querySelector('[data-order-id="order-one"]'));assert.equal(h.documents(),2,'embedded desktop keeps full-navigation fallback');assert.equal(h.selects(),1);assert.deepEqual(h.errors,[]);await h.context.close();return}
  await page.waitForFunction(()=>window.__PB1848PrintEntryReady&&document.querySelector('#root .photographerMain'),null,{timeout:15000});
  await page.locator('[data-select]').waitFor();const before=h.documents(),started=Date.now();await page.locator('[data-select]').click();
  await page.locator('#pb1847EntrySkeleton').waitFor();await page.waitForFunction(()=>!document.getElementById('pb1847EntrySkeleton'));await page.locator('[data-order-id="order-one"]').waitFor();
  assert(Date.now()-started<3500,'orders do not await the 4s optional home/wallet response');assert.equal(h.documents(),before,'SPA entry has no document navigation');assert.equal(h.selects(),1);assert.equal(h.calls.filter(c=>c.path==='/api/customer/orders'&&c.entry).length,1);assert.equal(h.calls.filter(c=>c.path==='/api/auth/me'&&c.entry).length,0,'loaded identity reused');assert.deepEqual(h.errors,[]);console.log(JSON.stringify({spaWidth:width,clickToOrdersMs:Date.now()-started,documents:h.documents()}));await page.waitForTimeout(4300);assert.equal(h.calls.filter(c=>c.path==='/api/customer/home'&&c.entry).length,1,'first paint must not cancel and repeat optional home');await h.context.close();
 }finally{await browser.close()}
});

for(const width of [390,1366])test('P2 first page and load-more are bounded, while below-fold preview requests wait at '+width,async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const h=await fixture(browser,{width,deep:true,many:true}),{page}=h;await page.locator('[data-order-id="order-one"]').waitFor();await page.waitForFunction(()=>!document.getElementById('pb1847EntrySkeleton'));
  const first=h.calls.filter(c=>c.path==='/api/customer/orders');assert.equal(first.length,1);assert.equal(new URLSearchParams(first[0].query).get('pageSize'),'30');assert.equal(new URLSearchParams(first[0].query).get('view'),'flow');
  await page.locator('.pb1848LoadOrders').click();await page.waitForFunction(()=>document.querySelector('.pb1848LoadOrders')?.disabled===false);assert(h.calls.some(c=>c.path==='/api/customer/orders'&&new URLSearchParams(c.query).get('offset')==='30'));
  await page.evaluate(()=>window.__PB1848TestRefresh());await page.waitForTimeout(1000);assert(h.calls.some(c=>c.path==='/api/customer/orders'&&new URLSearchParams(c.query).get('pageSize')==='60'),'refresh preserves loaded pages');
  await page.locator('[data-order-id="order-one"] .customerOrderQuickActions .detail').click();await page.locator('.pb1326SizeGroup>summary').first().click();await page.locator('.customerOrderDetailThumb').first().waitFor();await page.waitForTimeout(200);
  const previews=()=>h.calls.filter(c=>c.path.includes('/order-files/')&&c.path.endsWith('/preview'));
  assert(previews().length>0&&previews().length<60,'below-fold thumbnail URLs are deferred');await page.locator('.customerOrderDetailThumb').last().scrollIntoViewIfNeeded();await page.waitForTimeout(250);assert(previews().some(c=>c.path.includes('/file-59/')),'scrolling loads newly visible preview');assert.deepEqual(h.errors,[]);await h.context.close();
 }finally{await browser.close()}
});
