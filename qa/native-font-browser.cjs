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
 const server=createHost({store,request,token:'test',roots:()=>[temp,ui],isOnline:()=>true,backups:{status:()=>({settings:{directory:temp,automatic:true,intervalHours:24},last:null})},sync:{status:()=>({...store.status(),online:true}),wake(){},run:async()=>({}),live:async()=>({})}});await new Promise(r=>server.listen(0,'127.0.0.1',r));

 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{const context=await browser.newContext({viewport:{width:1440,height:850}}),origin='http://127.0.0.1:'+server.address().port;await context.addCookies([{name:'desktop',value:'test',url:origin}]);let remoteFonts=0;
 await context.route(/https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\//,route=>{remoteFonts++;return route.abort();});
 const page=await context.newPage();await page.goto(origin+'/lab/settings/general');await page.locator('.pb1147LabNav').waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);
 const client=await context.newCDPSession(page);await client.send('DOM.enable');await client.send('CSS.enable');const {root}=await client.send('DOM.getDocument'),{nodeId}=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.pb1147LabNav button[data-category="0"] .pb1149NavLabel'}),{fonts}=await client.send('CSS.getPlatformFontsForNode',{nodeId});
 assert(fonts.some(font=>font.isCustomFont&&/vazirmatn/i.test(font.familyName)),JSON.stringify(fonts));assert.equal(remoteFonts,0);assert.equal((await page.request.get(origin+'/desktop/ui-assets/vazirmatn.woff2')).status(),200);
 console.log('PASS: real native UI Persian glyphs render with bundled custom Vazirmatn with remote font hosts blocked; no Google font request is issued');console.log('FONT',JSON.stringify(fonts));
 await page.screenshot({path:'/tmp/photobridge-80-local-font.png',clip:{x:0,y:0,width:1440,height:190}});
 }finally{await browser.close();await new Promise(r=>server.close(r));store.db.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
