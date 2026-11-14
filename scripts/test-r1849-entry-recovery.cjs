const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const lab={id:'11111111-1111-4111-8111-111111111111',name:'Lab',active:true,service_only:false};
const targets=['/assets/index-UIRefine-v655-r84.js','/photobridge-v904r99-lab-chooser.js'];
async function serverFixture({rejectPage=false,rejectAll=false,slowHome=0}={}){
 let current=false;const requests=[];
 const html=fs.readFileSync('dist/web/index.html','utf8'),appFile=path.resolve('dist/web'+targets[0]),appCode=fs.readFileSync(appFile,'utf8');
 // The cached predecessor lacks the new entry-ready notification contract.
 const predecessor=appCode.replaceAll('PB1848EntryUI?.ordersReady()','void 0');
 const oldHtml=html.replace(/<script id="pb1847LabEntry">[\s\S]*?<\/script>/,'').replace(/([?&])pbLabEntryRev=[^"'&<>]*/g,'');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local'),p=url.pathname;requests.push({path:p,query:url.search});
  const json=(body,status=200)=>{const send=()=>{if(res.destroyed)return;res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body))};if(slowHome&&p==='/api/customer/home'){const timer=setTimeout(send,slowHome);res.on('close',()=>clearTimeout(timer));return}send()};
  if(p.startsWith('/api/')){
   if(p==='/api/auth/me')return json({user:{id:'photographer',userId:'photographer',name:'Studio',photographerName:'Studio',labRole:'customer',platformRole:'user'},lab});
   if(p==='/api/customer/home')return json({lab,profile:{studio_name:'Studio'},status:{open:true},prices:[],orderStats:{total:1,active:1,ready:0},recentOrders:[],walletBalance:0});
   if(p==='/api/customer/labs')return json({activeLabId:lab.id,memberships:[{...lab,selected:true}],labs:[]});
   if(p.endsWith('/select'))return json({ok:true,lab});
   if(p==='/api/customer/orders'){
    if(rejectAll||rejectPage&&url.searchParams.has('pageSize'))return json({error:'temporary_orders_failure'},500);
    return json({labId:lab.id,orders:[{id:'order-one',lab_id:lab.id,number:123,status:'sent',mode:'print',created_at:new Date().toISOString(),file_count:1,total_bytes:1000}],paymentSettings:{},...(url.searchParams.has('pageSize')?{pagination:{limit:30,offset:0,hasMore:false,total:1,counts:{flow:1,ready:0,needs_fix:0,completed:0}}}:{})});
   }
   return json({items:[],orders:[],galleries:[],notifications:[],invoices:[],tabs:{ai:false,album:false,instagram:false},settings:{},stats:{},summary:{},entries:[]});
  }
  if(p.startsWith('/photographer')){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});return res.end(current?html:oldHtml)}
  const file=path.resolve('dist/web','.'+p);if(!file.startsWith(path.resolve('dist/web')+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end()}
  const type=p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.woff2')?'font/woff2':'application/octet-stream';
  res.writeHead(200,{'content-type':type,'cache-control':'public, max-age=31536000, immutable'});
  if(p===targets[0])return res.end(url.searchParams.has('pbLabEntryRev')?appCode:predecessor);
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {origin:'http://127.0.0.1:'+server.address().port,requests,upgrade(){current=true},recover(){rejectAll=false;rejectPage=false},close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)})};
}
for(const width of [390,1366])test('a returning browser refreshes immutable entry scripts and never stays behind the new skeleton at '+width,async()=>{
 const app=await serverFixture(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await context.newPage();
  await page.goto(app.origin+'/photographer/orders/flow?workspace=print&pbLabChooser=1&pbDesktopContent=1');await page.locator('[data-select]').waitFor();
  app.upgrade();await page.evaluate(lab=>{sessionStorage.setItem('photobridge:r99:selected-lab',lab.id);sessionStorage.setItem('photobridge:r1847:entry-lab',JSON.stringify({...lab,at:Date.now()}));sessionStorage.setItem('photobridge:r100f37:lab-enter-pending',String(Date.now()))},lab);
  await page.goto(app.origin+'/photographer/orders/flow?workspace=print&pbEntryDone=lab&pbDesktopContent=1');await page.waitForTimeout(1000);
  console.log('warm-cache state',width,await page.evaluate(()=>({skeleton:!!document.getElementById('pb1847EntrySkeleton'),orders:!!document.querySelector('[data-order-id="order-one"]')})));
  for(const target of targets)assert(app.requests.some(req=>req.path===target&&new URLSearchParams(req.query).has('pbLabEntryRev')),'changed entry script has a fresh URL: '+target);
  await page.locator('[data-order-id="order-one"]').waitFor();assert.equal(await page.locator('#pb1847EntrySkeleton').count(),0);
  await context.close();
 }finally{await browser.close();await app.close()}
});
test('real desktop iframe shows an error and can retry instead of hiding content behind entry skeleton',async()=>{
 const app=await serverFixture({rejectAll:true}),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});app.upgrade();
 try{const page=await browser.newPage({viewport:{width:1366,height:844},serviceWorkers:'block'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(app.origin+'/photographer/gallery?pbDesktopPanel=print&pbPrintRoute='+encodeURIComponent('/photographer/orders/flow?workspace=print&pbLabChooser=1&pbDesktopContent=1'));
  const handle=await page.locator('iframe').first().elementHandle(),frame=await handle.contentFrame();await frame.locator('[data-select]').waitFor();await frame.locator('[data-select]').click();await frame.locator('.pb1849OrdersError').waitFor();
  assert.equal(await frame.locator('#pb1847EntrySkeleton').count(),0);assert.equal(await frame.evaluate(()=>document.documentElement.classList.contains('pbR100F37LabEnterBoot')),false);
  app.recover();await frame.locator('.pb1849OrdersError button').click();await frame.locator('[data-order-id="order-one"]').waitFor();assert.equal(await frame.locator('.pb1849OrdersError').count(),0);assert.equal(app.requests.filter(req=>req.path.endsWith('/select')).length,1);assert.deepEqual(errors,[]);await page.close();
 }finally{await browser.close();await app.close()}
});

test('the actual new skeleton becomes nonblocking after its 2500ms cap while home is slow',async()=>{
 const app=await serverFixture({slowHome:4000}),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});app.upgrade();
 try{const page=await browser.newPage({viewport:{width:1366,height:844},serviceWorkers:'block'});await page.goto(app.origin+'/photographer/orders/flow?workspace=print&pbEntryDone=lab&pbDesktopContent=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>{const node=document.getElementById('pb1847EntrySkeleton');return node&&getComputedStyle(node).position==='relative'},null,{timeout:3500});assert.equal(await page.locator('#pb1847EntrySkeleton').evaluate(node=>getComputedStyle(node).pointerEvents),'none');await page.locator('[data-order-id="order-one"]').waitFor();assert.equal(await page.locator('#pb1847EntrySkeleton').count(),0);assert.equal(app.requests.filter(req=>req.path==='/api/customer/orders').length,1,'handoff does not abort and repeat the prefetched request');await page.close()}finally{await browser.close();await app.close()}
});
