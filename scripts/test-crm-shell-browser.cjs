// Real HTTP/cache test: route mocking disables Chromium caching and misses this regression.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const web=path.resolve('dist/web'),read=name=>fs.readFileSync(path.join(web,name),'utf8');
function shell(portal){
 const photo=portal==='photographer',header=photo?'<header id="photographerRoleHeaderV710" class="photographerHeaderRefined" data-pb1168-identity-ready="1"><div class="photographerHeaderIdentity"><h1>عکاسی آزمایشی</h1><small>پنل عکاسی</small></div><nav class="photographerHeaderNav"><button data-other>گالری</button></nav></header>':'<header class="labSingleHeader"><b>لابراتوار آزمایشی</b><nav class="pb1147LabNav"><button data-other>چاپ</button></nav></header>';
 const dock='<nav class="'+(photo?'photographerBottomAppNav':'labBottomAppNav')+'"><div class="photographerBottomAppNavGrid '+(photo?'':'labBottomAppNavGrid')+'"><button data-other>چاپ</button><button data-other>گالری</button></div></nav>';
 return '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>body{margin:0;font:14px Tahoma}header{height:100px;background:white;box-sizing:border-box;padding:15px;border-bottom:1px solid #ddd}nav{display:flex;gap:15px}button{cursor:pointer;padding:10px}main{padding:20px;min-height:100vh}.photographerBottomAppNav,.labBottomAppNav{display:none}@media(max-width:820px){.photographerBottomAppNav,.labBottomAppNav{display:block;position:fixed;bottom:0;left:0;right:0;height:66px;background:white;z-index:2147483645}.photographerBottomAppNavGrid{display:flex}}</style><link rel="stylesheet" href="/photobridge-r1126-desktop-navigation.css"><link rel="stylesheet" href="/photobridge-r1761-crm-nav.css"><link rel="stylesheet" href="/photobridge-r1124-photographer-desktop-header.css"><link rel="stylesheet" href="/customer-crm-host.css"></head><body class="pbAuthenticatedPhotographerPortal"><div id="root"><div class="'+(photo?'':'labRoleWorkspace')+'">'+header+'<main class="'+(photo?'photographerMain':'')+'">محتوای بخش دیگر</main>'+dock+'</div></div><script src="/customer-crm-host.js"></script><script src="/photobridge-r1126-desktop-navigation.js"></script><script src="/photobridge-r1761-crm-nav.js"></script></body></html>';
}
(async()=>{
 let current=false;const requests=[];
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://test');requests.push(req.url);
  if(u.pathname==='/customer-crm.html'){
   const old='<!doctype html><header>نسخه قدیمی <a id="back" href="/photographer/gallery">بازگشت</a></header><main><input id="marketing-consent"><div>old customer form</div></main>';
   res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':current?'no-store':'public, max-age=31536000, immutable'});res.end(current?read('customer-crm.html'):old);return;
  }
  if(['/lab','/photographer/gallery'].includes(u.pathname)){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(shell(u.pathname==='/lab'?'lab':'photographer'));return}
  if(u.pathname.startsWith('/api/')){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(u.pathname.includes('navigation-tabs')?{tabs:{customers:true}}:u.pathname.includes('services-wallet')?{balance:1000}:u.pathname.includes('appointments')?{appointments:[]}:{customers:[],shootTypes:[],sessions:[],templates:[],invoices:[],occasions:[]}));return}
  const file=path.resolve(web,'.'+u.pathname);if(file.startsWith(web+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()){res.writeHead(200,{'content-type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'application/octet-stream','cache-control':'no-cache'});fs.createReadStream(file).pipe(res);return}
  res.writeHead(404);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const portal of ['lab','photographer'])for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  current=false;await page.goto(base+'/customer-crm.html?portal='+portal+'&pbDesktopContent=1');assert(await page.locator('#marketing-consent').isVisible());current=true;
  const root=portal==='lab'?'/lab':'/photographer/gallery';await page.goto(base+root);
  const button=portal==='photographer'&&width>820?page.locator('#pb1126ChromeHost [data-pb1126-kind="crm"]'):page.locator('[data-pb1761-crm]').first();
  await button.click();
  const frameElement=page.locator(portal==='photographer'&&width>820?'.pb1126ContentPanel[data-panel="crm"] iframe':'#pbCrmTabContent iframe');
  const frame=page.frameLocator(portal==='photographer'&&width>820?'.pb1126ContentPanel[data-panel="crm"] iframe':'#pbCrmTabContent iframe');
  await frame.locator('#customer-details').waitFor({state:'attached'});
  assert.match(await frameElement.getAttribute('src'),/crmRev=r1867-crm-delivery/);assert.equal(await frame.locator('#back').count(),0);assert.equal(await frame.locator('#marketing-consent').count(),0);assert(await frame.locator('body>header').isHidden());
  assert.equal(page.frames().length,2);assert.equal(new URL(page.url()).pathname,root);
  await frame.locator('nav button[data-view="calendar"]').click();await frame.locator('.calDay').first().waitFor();assert.equal(await frame.locator('.calDay').count(),42);
  const visibleHeaders=await page.locator('header').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden'&&n.getBoundingClientRect().height>0).length);assert.equal(visibleHeaders,1);
  const other=portal==='photographer'&&width>820?page.locator('#pb1126ChromeHost [data-pb1126-kind="gallery"]'):page.locator(width<=820?'.photographerBottomAppNavGrid [data-other]':'.pb1147LabNav [data-other]').first();
  await other.click();assert(await frameElement.isHidden());await button.click();assert(await frameElement.isVisible());assert.equal(page.frames().length,2);
  // A portal navigation from inside CRM must leave the frame, never nest another portal shell.
  await (await frameElement.elementHandle()).contentFrame().then(child=>child.evaluate(path=>{location.href=path},root));
  await page.waitForURL(url=>url.pathname===root&&!url.searchParams.has('pbCrmTab')&&!url.searchParams.has('pbDesktopPanel'));
  assert(page.frames().every(f=>!f.parentFrame()||!f.parentFrame().parentFrame()));assert.deepEqual(errors,[]);
  assert(requests.some(url=>url.includes('crmRev=r1867-crm-delivery')));console.log('cached CRM tab, single header, calendar, tab switching, frame escape:',portal,width,'passed');await page.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exit(1)});
