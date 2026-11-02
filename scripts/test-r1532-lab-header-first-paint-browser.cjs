const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 let release;const gate=new Promise(r=>release=r);let requested;const seen=new Promise(r=>requested=r);
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://local');
  if(url.pathname.startsWith('/api/')){
   let data={summary:{},orders:[],customers:[],invites:[],requests:[],notifications:[],transactions:[],invoices:[],payments:[],expenses:[]};
   if(url.pathname==='/api/auth/me')data={user:{userId:'U',labId:'A',labRole:'lab_admin',name:'نمونه'},lab:{id:'A'}};
   if(url.pathname==='/api/lab/dashboard')data={lab:{id:'A',name:'لابراتوار آزمایشی',album_enabled:true},settings:{},customers:[],sizes:[],printSizes:[],albums:[],papers:[],status:{},walletBalance:0};
   if(url.pathname==='/api/lab/write-access')data={allowed:true,serverNow:new Date().toISOString(),activeUntil:'2030-01-01T00:00:00Z'};
   res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(data));
  }
  let name=url.pathname.slice(1);if(!path.extname(name))name='index.html';
  if(name==='photobridge-r1147-lab-admin-header.js'){requested();await gate;}
  if(name.includes('..')){res.writeHead(403);return res.end();}
  const file=path.join('dist/web',name);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':name.endsWith('.woff2')?'font/woff2':'application/octet-stream'});res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:850}});
  await page.route(/https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\//,r=>r.abort());
  await page.addInitScript(()=>{
   window.__headerFrames=[];
   const sample=()=>{
    const h=document.querySelector('.labRoleWorkspace .labSingleHeader');
    if(h){const nav=h.querySelector('.pb1147LabNav');window.__headerFrames.push({current:!!nav&&h.classList.contains('pb1147LabAdminHeader'),oldVisible:!!h.querySelector(':scope>.labHeaderNav')&&getComputedStyle(h.querySelector(':scope>.labHeaderNav')).display!=='none'});}
    if(window.__headerFrames.length<120)requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  });
  const origin='http://127.0.0.1:'+server.address().port;
  console.log('Starting delayed-header navigation');await page.goto(origin+'/lab/orders',{waitUntil:'commit'});console.log('Document committed');await seen;console.log('Header request gated');
  assert.equal(await page.locator('.labSingleHeader').count(),0,'React cannot paint the legacy shell while critical header code is unavailable');
  console.log('Releasing header');release();await page.locator('.pb1147LabNav').waitFor({state:'visible'});
  await page.waitForFunction(()=>window.__headerFrames.length>=4);
  const frames=await page.evaluate(()=>window.__headerFrames);assert(frames.every(f=>f.current),'every painted lab header must already use current navigation');
  assert.equal(await page.locator('.labSingleHeader>.labHeaderNav').isVisible(),false);
  await page.locator('.pb1147LabNav').getByRole('button',{name:'عمومی',exact:true}).click();await page.waitForURL('**/lab/settings');
  await page.locator('.pb1148SecondaryHeader').waitFor({state:'visible'});
  await page.screenshot({path:'/tmp/photobridge-r1532-current-header.png'});
  console.log('PASS: delayed critical header never paints legacy UI; first painted header is current; settings navigation works.');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.goto(origin+'/lab/orders');
  await mobile.locator('.labSingleHeader').waitFor({state:'visible'});assert.equal(await mobile.locator('.pb1147LabNav').count(),0);await mobile.close();
  console.log('PASS: mobile keeps its existing navigation.');
 }finally{release();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
