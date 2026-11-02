'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {LabStore}=require('../store.cjs'),{createHost}=require('../host.cjs');
(async()=>{const ui=path.join(__dirname,'../verified-ui'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-navigation-')),store=new LabStore(':memory:');
 store.set('labId','A');store.set('auth',{user:{labRole:'lab_admin',name:'نمونه'},lab:{id:'A'}});store.set('nativeVersion',require('../package.json').version);
 const original=fs.readFileSync(path.join(ui,'assets/index-UIRefine-v655-r84.js'),'utf8'),entry='Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsx(ow,{})}));';assert(original.includes(entry));
 const source=original.replace(entry,'if(new URLSearchParams(location.search).has("qaHold")){const hold=document.createElement("style");hold.id="qaHold";hold.textContent=".labSettingsWorkspace{display:none!important}";document.head.append(hold);}Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsxs("div",{className:"labRoleWorkspace",children:[e.jsx("div",{className:"labSettingsWorkspace",style:{display:"none"},children:e.jsxs("div",{children:[e.jsx("nav",{className:"labCustomerSubnav",children:e.jsx("button",{children:"عکاس قدیمی"})}),e.jsx("nav",{className:"financeSectionTabs",children:e.jsx("button",{children:"مالی قدیمی"})}),e.jsxs("nav",{className:"labSettingsSectionTabs",children:[e.jsx("button",{children:"عمومی قدیمی"}),e.jsx("button",{children:"ساعت قدیمی"}),e.jsx("button",{children:"سایت قدیمی"})]})]})}),e.jsx(Bf,{me:{user:{labRole:"lab_admin",name:"نمونه"},lab:{id:"A"}},onLogout:()=>{},testMode:true})]})}));');
 fs.mkdirSync(path.join(temp,'assets'));fs.writeFileSync(path.join(temp,'assets/index-UIRefine-v655-r84.js'),source);fs.copyFileSync(path.join(ui,'index.html'),path.join(temp,'index.html'));
 const request=async url=>{const pathname=new URL(url,'http://localhost').pathname;let data={summary:{},orders:[],customers:[],invites:[],requests:[],notifications:[],transactions:[],invoices:[],payments:[],expenses:[]};
 if(pathname==='/api/lab/dashboard')data={lab:{id:'A',name:'لابراتوار آزمایشی',album_enabled:true},settings:{},customers:[],sizes:[],printSizes:[],albums:[],papers:[],status:{},walletBalance:0};
 if(pathname==='/api/lab/write-access')data={allowed:true,serverNow:new Date().toISOString(),activeUntil:'2030-01-01T00:00:00Z'};
 if(pathname==='/api/auth/me')data=store.get('auth');
 return Response.json(data);
 };
 const server=createHost({store,request,token:'test',roots:()=>[temp,ui],isOnline:()=>true,backups:{status:()=>({settings:{directory:temp,automatic:true,intervalHours:24},last:null})},sync:{status:()=>({...store.status(),online:true}),wake(){},run:async()=>({}),live:async()=>({})}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{const context=await browser.newContext({viewport:{width:1440,height:950}}),origin='http://127.0.0.1:'+server.address().port;await context.addCookies([{name:'desktop',value:'test',url:origin}]);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));

 for(const route of ['/lab/settings?qaHold=1#customers','/lab/settings#customers','/lab/settings#customers-invites','/lab/settings#customers-collaboration','/lab/settings/customers','/lab/settings/customers/invites']){
  await page.goto(origin+route);
  if(route.includes('qaHold')){await page.locator('.labRolePageScrollArea .labCustomerSubnav').waitFor({state:'attached'});await page.evaluate(()=>document.getElementById('qaHold').remove());}
  await page.waitForFunction(()=>document.querySelectorAll('.pb1372ThirdHeader>button').length===4);
  const labels=await page.locator('.pb1372ThirdHeader>button').allTextContents();
  for(const button of await page.locator('.pb1372ThirdHeader>button').all()){await button.waitFor({state:'visible'});assert(await button.isVisible());}
  for(const button of await page.locator('.pb1148SecondaryHeader>button[data-pb1173-index]').all())assert.equal(await button.isVisible(),false);
  assert(await page.locator('.pb1147LabNav button[data-category="1"]').evaluate(button=>button.classList.contains('active')));
  if(route.includes('qaHold'))await page.screenshot({path:'/tmp/photobridge-76-startup-customers.png',clip:{x:0,y:0,width:1440,height:170}});
  await page.locator('.pb1147LabNav button[data-source=".labArchiveHeaderBtn"]').click();await page.waitForURL('**/lab/archive');
  await page.locator('.pb1147LabNav button[data-category="1"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.pb1372ThirdHeader>button').length===4);
  assert.deepEqual(await page.locator('.pb1372ThirdHeader>button').allTextContents(),labels);
 }
 console.log('PASS: direct cold startup through canonical and legacy customer/invite/collaboration paths shows all four promoted buttons, hides the retired intermediate row, and matches archive round-trip');
 await page.goto(origin+'/lab/settings/general');await page.waitForSelector('.pb1147LabNav');
 const general=['عمومی و اعلان‌ها','ساعت کاری','پیامک مشتریان','اسنپ و ارسال','سایت اختصاصی','برنامهٔ ویندوز'];
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===6);
 assert.deepEqual(await page.locator('.pb1148SecondaryHeader>button[data-pb1173-index]').allTextContents(),general);
 for(const tab of await page.locator('.pb1148SecondaryHeader>button[data-pb1173-index]').all())assert(await tab.isVisible());
 await page.waitForSelector('.pb1148SecondaryHeader #pbLabBackupSettingsButton');
 await page.locator('.pb1147LabNav button[data-source=".labFinanceHeaderBtn"]').click();await page.waitForURL('**/lab/finance');
 await page.waitForSelector('.financeWorkspace .financeSectionTabs',{state:'attached'});
 await page.locator('.pb1147LabNav button[data-category="0"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===6);
 assert.deepEqual(await page.locator('.pb1148SecondaryHeader>button[data-pb1173-index]').allTextContents(),general);
 console.log('PASS: first General render ignores hidden legacy tabs; Finance round-trip preserves exactly the same complete tabs');

 assert(await page.locator('.pb1147LabNav button[data-source=".labArchiveHeaderBtn"]').isVisible());
 // Force the delayed/removed original-action case that the old one-shot header missed.
 await page.evaluate(()=>{const original=document.querySelector('.labArchiveHeaderBtn');window.__qaArchive=original;original.remove();});
 await page.waitForFunction(()=>!document.querySelector('.pb1147LabNav button[data-source=".labArchiveHeaderBtn"]'));
 await page.evaluate(()=>document.querySelector('.roleHeaderToolButtons').append(window.__qaArchive));
 await page.waitForSelector('.pb1147LabNav button[data-source=".labArchiveHeaderBtn"]');
 await page.locator('.pb1147LabNav button[data-category="1"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.pb1372ThirdHeader>button').length===4);
 const customers=await page.locator('.pb1372ThirdHeader>button').allTextContents();assert.equal(customers.length,4);for(const name of ['عکاس','دعوت','همکاری','مشتری آزاد'])assert(customers.some(label=>label.includes(name)));
 assert.equal(await page.locator('#pbLabBackupSettingsButton').count(),0);
 await page.locator('.pb1147LabNav button[data-source=".labArchiveHeaderBtn"]').click();await page.waitForURL('**/lab/archive');
 assert(await page.locator('.pb1147LabNav button[data-source=".labArchiveHeaderBtn"]').isVisible());
 await page.locator('.pb1147LabNav button[data-category="0"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===6);await page.waitForSelector('.pb1148SecondaryHeader #pbLabBackupSettingsButton');
 for(const name of general)assert(await page.locator('.pb1148SecondaryHeader>button[data-pb1173-index]').filter({hasText:name}).isVisible());
 await page.locator('.pb1147LabNav button[data-source=".labPrintTopNav"]').click();
 await page.waitForFunction(()=>location.pathname.startsWith('/lab/orders'));
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===3);
 assert.equal(await page.locator('#pbLabBackupSettingsButton').count(),0);
 await page.locator('.pb1147LabNav button[data-category="0"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.pb1148SecondaryHeader>button[data-pb1173-index]').length===6);
 console.log('PASS: print queue retains its three stage tabs and returning to General restores all six settings tabs');

 const diagnostics=require('../ui-diagnostics.cjs');
 await page.evaluate(()=>{const p=document.createElement('p');p.id='private-sentinel';p.textContent='PRIVATE-CUSTOMER-AND-INVOICE-DO-NOT-COLLECT';document.body.append(p);});
 const snapshot=await page.evaluate('('+diagnostics.rendererSnapshot.toString()+')()');
 const proof=await page.evaluate('('+diagnostics.browserProof.toString()+')()');
 assert(!JSON.stringify({snapshot,proof}).includes('PRIVATE-CUSTOMER-AND-INVOICE-DO-NOT-COLLECT'));
 const moduleName='assets/index-UIRefine-v655-r84.js';assert.equal(snapshot.proof.sha256,proof.host.data.roots[0].files[moduleName].sha256);
 assert.equal(proof['/'+moduleName].sha256,proof.host.data.roots[0].files[moduleName].servedSha256);
 console.log('PASS: UI diagnostics identify the executed module and served bytes without collecting customer/body data');
 await page.evaluate(()=>document.getElementById('private-sentinel').remove());
 await page.screenshot({path:'/tmp/photobridge-72-general.png',fullPage:true});
 assert(await page.locator('.pb1148SecondaryHeader #pbLabBackupSettingsButton').isVisible());
 await page.locator('#pbLabBackupSettingsButton').click();await page.waitForURL('**/desktop/backups');await page.getByRole('heading',{name:'پشتیبان اطلاعات برنامه',exact:true}).waitFor();assert.deepEqual(errors,[]);
 console.log('PASS: real native-host lab shell preserves all six General tabs, four customer tabs and clickable archive; delayed archive is restored; backup stays only in General');
 }finally{await browser.close();await new Promise(r=>server.close(r));store.db.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
