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
 try{const context=await browser.newContext({viewport:{width:1266,height:635}}),origin='http://127.0.0.1:'+server.address().port;await context.addCookies([{name:'desktop',value:'test',url:origin}]);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));


 await page.goto(origin+'/lab/orders');
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===3);

 const hitTest=selector=>page.evaluate(selector=>[...document.querySelectorAll(selector)].map(button=>{const r=button.getBoundingClientRect(),header=button.closest('nav'),h=header.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{label:button.textContent,clickable:!!hit&&button.contains(hit),insideHeader:r.left>=h.left-1&&r.right<=h.right+1&&r.top>=h.top-1&&r.bottom<=h.bottom+1};}),selector);
 await page.locator('.pb1147LabNav button[data-category="0"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===6&&!document.querySelector('.pb1148SecondaryHeader.pb1526QueueHeader'));
 await page.locator('#pbLabBackupSettingsButton').waitFor({state:'visible'});
 const general=await hitTest('.pb1148SecondaryHeader>button[data-pb1173-index],#pbLabBackupSettingsButton');assert.equal(general.length,7);
 for(const tab of general){assert(tab.insideHeader,tab.label+' must fit inside the header');assert(tab.clickable,tab.label+' must receive pointer hits');}
 await page.screenshot({path:'/tmp/photobridge-79-general.png',clip:{x:0,y:0,width:1266,height:175}});
 await page.locator('.pb1147LabNav button[data-source=".labPrintTopNav"]').click();
 await page.waitForFunction(()=>!!document.querySelector('.pb1148SecondaryHeader.pb1526QueueHeader.pb1174QueueNav'));
 assert.equal(await page.locator('.pb1148SecondaryHeader>button[data-pb1173-index]').count(),3);
 console.log('PASS: cold print-to-General transition keeps six settings buttons and backup fully inside the header and clickable; print layout is restored on return');
 await page.locator('.pb1147LabNav button[data-category="1"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.pb1372ThirdHeader>button').length===4);
 const check=await page.evaluate(()=>({root:document.querySelector('.labRoleWorkspace').className,header:document.querySelector('.pb1148SecondaryHeader').className,display:getComputedStyle(document.querySelector('.pb1148SecondaryHeader')).display,buttons:[...document.querySelectorAll('.pb1372ThirdHeader>button')].map(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{label:b.textContent,hit:hit?.textContent,clickable:!!hit&&b.contains(hit)};})}));
 console.log('QUEUE_TO_CUSTOMERS',JSON.stringify(check));
 assert.equal(check.display,'none','retired secondary row must not cover the promoted customer tabs');
 for(const button of check.buttons)assert(button.clickable,button.label+' must receive pointer hits');
 await page.screenshot({path:'/tmp/photobridge-79-customers.png',clip:{x:0,y:0,width:1266,height:175}});
 console.log('PASS: real authenticated cold queue-to-customers transition hides the retired row and all four promoted tabs receive pointer hits');
 }finally{await browser.close();await new Promise(r=>server.close(r));store.db.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
