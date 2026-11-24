// Real HTTP/cache test: route mocking disables Chromium caching and misses this regression.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const web=path.resolve('dist/web'),read=name=>fs.readFileSync(path.join(web,name),'utf8');
function shell(portal,mobileScripts){
 const photo=portal==='photographer',header=photo?'<header id="photographerRoleHeaderV710" class="photographerHeaderRefined" data-pb1168-identity-ready="1"><div class="photographerHeaderIdentity"><h1>عکاسی آزمایشی</h1><small>پنل عکاسی</small></div><nav class="photographerHeaderNav"><button data-other>گالری</button></nav></header>':'<header class="labSingleHeader"><b>لابراتوار آزمایشی</b><nav class="pb1147LabNav"><button data-other>چاپ</button></nav></header>';
 const dock='<nav class="'+(photo?'photographerBottomAppNav':'labBottomAppNav')+'"><div class="photographerBottomAppNavGrid '+(photo?'':'labBottomAppNavGrid')+'"><button data-other class="active" aria-current="page">چاپ</button><button data-other>گالری</button></div></nav>';
 return '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>body{margin:0;font:14px Tahoma}header{height:100px;background:white;box-sizing:border-box;padding:15px;border-bottom:1px solid #ddd}nav{display:flex;gap:15px}button{cursor:pointer;padding:10px}main{padding:20px;min-height:100vh}nav button.active{background:#315efb!important;box-shadow:0 0 4px #315efb!important}.photographerBottomAppNav,.labBottomAppNav{display:none}@media(max-width:820px){.photographerBottomAppNav,.labBottomAppNav{display:block;position:fixed;bottom:0;left:0;right:0;height:66px;background:white;z-index:2147483645}.photographerBottomAppNavGrid{display:flex}}</style><link rel="stylesheet" href="/photobridge-r1126-desktop-navigation.css"><link rel="stylesheet" href="/photobridge-r1761-crm-nav.css"><link rel="stylesheet" href="/photobridge-r1124-photographer-desktop-header.css"><link rel="stylesheet" href="/customer-crm-host.css"></head><body class="'+(photo?'pbAuthenticatedPhotographerPortal':'')+'"><div id="root"><div class="'+(photo?'':'labRoleWorkspace')+'">'+header+'<main class="'+(photo?'photographerMain':'')+'">محتوای بخش دیگر</main>'+dock+'</div></div>' + (mobileScripts?'<script src="/photobridge-r1106-mobile-store-panel.js"></script>':'') + (photo?'<script src="/photobridge-r1099-photographer-tabs.js"></script>':'') + '<script src="/customer-crm-host.js"></script><script src="/photobridge-r1126-desktop-navigation.js"></script><script src="/photobridge-r1761-crm-nav.js"></script></body></html>';
}
(async()=>{
 let current=false,settingsUnavailable=false;const requests=[];
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://test');requests.push(req.url);
  if(u.pathname==='/customer-crm.html'){
   const old='<!doctype html><header>نسخه قدیمی <a id="back" href="/photographer/gallery">بازگشت</a></header><main><input id="marketing-consent"><div>old customer form</div></main>';
   const respond=()=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':current?'no-store':'public, max-age=31536000, immutable'});res.end(current?read('customer-crm.html'):old);};
   if(u.searchParams.get('view')==='calendar')setTimeout(respond,350);else respond();
   return;
  }
  if(['/lab','/photographer/gallery'].includes(u.pathname)){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(shell(u.pathname==='/lab'?'lab':'photographer',u.searchParams.has('testMobileDock')));return}
  if(settingsUnavailable&&u.pathname==='/api/photographer/navigation-tabs'){res.writeHead(503,{'content-type':'application/json'});res.end('{}');return}
  if(u.pathname.startsWith('/api/')){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(u.pathname.includes('navigation-tabs')?{tabs:{customers:true,calendar:true}}:u.pathname.includes('services-wallet')?{balance:1000}:u.pathname.includes('appointments')?{appointments:[]}:{customers:[],shootTypes:[],sessions:[],templates:[],invoices:[],occasions:[]}));return}
  const file=path.resolve(web,'.'+u.pathname);if(file.startsWith(web+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()){res.writeHead(200,{'content-type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'application/octet-stream','cache-control':'no-cache'});fs.createReadStream(file).pipe(res);return}
  res.writeHead(404);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const portal of ['lab','photographer'])for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  current=false;await page.goto(base+'/customer-crm.html?portal='+portal+'&pbDesktopContent=1');assert(await page.locator('#marketing-consent').isVisible());current=true;
  const root=portal==='lab'?'/lab':'/photographer/gallery';await page.goto(base+root+(portal==='photographer'&&width<=820?'?testMobileDock=1':''));
  const button=portal==='photographer'&&width>820?page.locator('#pb1126ChromeHost [data-pb1126-kind="crm"]'):page.locator('[data-pb-crm-pane="customers"]').first();
  await button.click();
  const frameElement=page.locator(portal==='photographer'&&width>820?'.pb1126ContentPanel[data-panel="crm"] iframe':'#pbCrmTabContent iframe');
  const frame=page.frameLocator(portal==='photographer'&&width>820?'.pb1126ContentPanel[data-panel="crm"] iframe':'#pbCrmTabContent iframe');
  await frame.locator('#customer-details').waitFor({state:'attached'});
  assert.match(await frameElement.getAttribute('src'),/crmRev=r1875-mobile-header-layout/);assert.equal(await frame.locator('#back').count(),0);assert.equal(await frame.locator('#marketing-consent').count(),0);assert(await frame.locator('body>header').isHidden());
  assert.equal(page.frames().length,2);assert.equal(new URL(page.url()).pathname,root);
  if(width<=820){
   const calendar=page.locator('[data-pb-crm-pane="calendar"]');
   assert(await button.locator('em').isVisible());
   assert.equal(await button.locator('em').textContent(),'مشتریان');
   assert.equal(await button.getAttribute('aria-current'),'page');
   const native=page.locator('.photographerBottomAppNavGrid > button[data-other].active').first();
   assert.equal(await native.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
   assert.equal(await native.evaluate(el=>getComputedStyle(el).boxShadow),'none');
   assert(await frame.locator('nav button[data-view="calendar"]').isHidden());
   await calendar.click();
   assert.equal(await page.locator('#pbCrmTabContent').getAttribute('aria-busy'),'true');
   assert(await frameElement.isHidden(),'old pane is hidden while the calendar is loading');
   assert.equal(await calendar.getAttribute('aria-current'),'page');
   assert.equal(await button.getAttribute('aria-current'),null);
   await frame.locator('.calDay').first().waitFor();
   assert(await frame.locator('#nav').isHidden());
   assert.equal(await frame.locator('.calDay').count(),42);
   assert.equal(page.frames().length,2);
   await button.click();
   await frame.locator('#customers').waitFor({state:'visible'});
   assert(await frame.locator('#nav').isHidden(),'embedded mobile CRM keeps its duplicate internal navigation hidden');
   assert(await button.locator('em').isVisible());
  }else if(portal==='photographer'){
   // R1966: desktop Calendar is its own main tab. The CRM internal button is hidden.
   assert(await frame.locator('nav button[data-view="calendar"]').isHidden());
   const calendarMain=page.locator('#pb1126ChromeHost [data-pb1126-kind="calendar"]');
   await calendarMain.click();
   const calendarFrame=page.frameLocator('.pb1126ContentPanel[data-panel="calendar"] iframe');
   await calendarFrame.locator('.calDay').first().waitFor();
   assert.equal(await calendarFrame.locator('.calDay').count(),42);
   assert(await frameElement.isHidden(),'Customers iframe is hidden while Calendar tab is selected');
   assert.equal(await calendarMain.getAttribute('aria-current'),'page');
   await button.click();
   assert(await frameElement.isVisible(),'Customers iframe is restored when its tab is reopened');
  }else{
   await frame.locator('nav button[data-view="calendar"]').click();
   await frame.locator('.calDay').first().waitFor();
   assert.equal(await frame.locator('.calDay').count(),42);
  }
  const visibleHeaders=await page.locator('header').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().height>0).length);assert.equal(visibleHeaders,1);
  const other=portal==='photographer'&&width>820?page.locator('#pb1126ChromeHost [data-pb1126-kind="gallery"]'):page.locator(width<=820?'.photographerBottomAppNavGrid [data-other]':'.pb1147LabNav [data-other]').first();
  await other.click();assert(await frameElement.isHidden());
  if(width<=820)assert.equal(await other.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(49, 94, 251)');
  const hasPrintPanel=portal==='photographer'&&width<=820;
  if(hasPrintPanel)assert(await page.locator('#pb1106PrintPanel').isVisible());
  await button.click();assert(await frameElement.isVisible());
  if(hasPrintPanel)assert(await page.locator('#pb1106PrintPanel').isHidden());
  assert.equal(page.frames().length,hasPrintPanel||(portal==='photographer'&&width>820)?3:2);
  // A portal navigation from inside CRM must leave the frame, never nest another portal shell.
  await (await frameElement.elementHandle()).contentFrame().then(child=>child.evaluate(path=>{location.href=path},root));
  await page.waitForURL(url=>url.pathname===root&&!url.searchParams.has('pbCrmTab')&&!url.searchParams.has('pbDesktopPanel'));
  assert(page.frames().every(f=>!f.parentFrame()||!f.parentFrame().parentFrame()));assert.deepEqual(errors,[]);
  assert(requests.some(url=>url.includes('crmRev=r1875-mobile-header-layout')));console.log('cached CRM tab, single header, calendar, tab switching, frame escape:',portal,width,'passed');await page.close();
 }
 settingsUnavailable=true;
 const page=await browser.newPage({viewport:{width:390,height:900}});
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.pb1106TabsPending='1'},{once:true}));
 await page.goto(base+'/photographer/gallery?testMobileDock=1');
 const print=page.locator('.photographerBottomAppNav').getByRole('button',{name:'چاپ',exact:true});
 await print.click();
 assert(await page.locator('#pb1106PrintPanel').isVisible(),'core tabs work when the settings API is unavailable');
 await page.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exit(1)});
