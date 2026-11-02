'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {LabStore}=require('../store.cjs'),{createHost}=require('../host.cjs');
(async()=>{const ui=path.join(__dirname,'../verified-ui'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-navigation-')),store=new LabStore(':memory:');
 store.set('labId','A');store.set('auth',{user:{userId:'U',labId:'A',labRole:'lab_admin',name:'نمونه'},lab:{id:'A'}});store.set('nativeVersion',require('../package.json').version);
 const original=fs.readFileSync(path.join(ui,'assets/index-UIRefine-v655-r84.js'),'utf8'),entry='Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsx(ow,{})}));';assert(original.includes(entry));
 const source=original;
 fs.mkdirSync(path.join(temp,'assets'));fs.writeFileSync(path.join(temp,'assets/index-UIRefine-v655-r84.js'),source);fs.copyFileSync(path.join(ui,'index.html'),path.join(temp,'index.html'));
 const request=async url=>{const pathname=new URL(url,'http://localhost').pathname;let data={summary:{},orders:[],customers:[],invites:[],requests:[],notifications:[],transactions:[],invoices:[],payments:[],expenses:[]};
 if(pathname==='/api/lab/dashboard')data={lab:{id:'A',name:'لابراتوار آزمایشی',album_enabled:true},settings:{},customers:[],sizes:[],printSizes:[],albums:[],papers:[],status:{},walletBalance:0};
 if(pathname==='/api/lab/write-access')data={allowed:true,serverNow:new Date().toISOString(),activeUntil:'2030-01-01T00:00:00Z'};
 if(pathname==='/api/auth/me')data=store.get('auth');
 return Response.json(data);
 };

 const http=require('node:http');let releaseHeader;const headerGate=new Promise(resolve=>releaseHeader=resolve);
 const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){const response=await request(url.pathname);res.writeHead(response.status,{'Content-Type':'application/json'});return res.end(await response.text());}
 let name=url.pathname.slice(1);if(!path.extname(name))name='index.html';if(name.includes('..')){res.writeHead(403);return res.end();}
 if(name==='photobridge-r1147-lab-admin-header.js')await headerGate;
 const file=path.join(ui,name);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.woff2')?'font/woff2':'application/octet-stream'});res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{const context=await browser.newContext({viewport:{width:1440,height:850}}),page=await context.newPage();await context.route(/https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\//,route=>route.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/lab/orders',{waitUntil:'commit'});
 await page.locator('.labSingleHeader .labPrintTopNav').waitFor({state:'visible'});assert.equal(await page.locator('.pb1147LabNav').count(),0);
 const capture=await context.newCDPSession(page),image=await capture.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/photobridge-web-before-header.png',Buffer.from(image.data,'base64'));
 console.log('REPRODUCED: fresh browser paints the raw React lab header while the deferred header-enhancement script is delayed');
 releaseHeader();await page.locator('.pb1147LabNav').waitFor({state:'visible'});assert.equal(await page.locator('.labSingleHeader>.labHeaderNav').isVisible(),false);
 await page.screenshot({path:'/tmp/photobridge-web-after-header.png'});
 console.log('PASS: releasing that script replaces the visible legacy header with the current lab header without another app deployment or page navigation');
 }finally{releaseHeader();await browser.close();await new Promise(r=>server.close(r));store.db.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
