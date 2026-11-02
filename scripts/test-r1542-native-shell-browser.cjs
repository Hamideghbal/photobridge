'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const native=process.env.PB_NATIVE_SOURCE;if(!native)throw Error('PB_NATIVE_SOURCE is required');
 const {LabStore}=require(path.join(native,'store.cjs')),{createHost}=require(path.join(native,'host.cjs'));
 const ui=path.resolve(process.env.PB_UI_ROOT||'dist/web/lab-desktop-ui'),broken=process.env.PB_REPRODUCE_PREVIOUS==='1';
 require(path.join(native,'verify-native-ui.cjs')).validateNativeUi(ui);
 const catalogApi=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
 let catalog=catalogApi.addPrintType(catalogApi.normalizePrintCatalog(),{kind:'binding',name:'صحافی آلبوم ۶۰ گرم'});
 const prices=[{id:'s1',label:'۱۰×۱۵',width_cm:10,height_cm:15,luster:1444,silk:222222,metallic:null,album_binding_price:50,chassis:50,frame:null,chassis_stock:0,frame_stock:null},{id:'s2',label:'۱۳×۱۸',width_cm:13,height_cm:18,luster:200000,silk:400000,metallic:500000,album_binding_price:2000,chassis:100,frame:8000,chassis_stock:4,frame_stock:3}];
 const store=new LabStore(':memory:');store.set('labId','A');store.set('auth',{user:{userId:'U',labId:'A',labRole:'lab_admin',name:'نمونه'},lab:{id:'A'}});store.set('nativeVersion','1.0.83');
 let releaseCatalog;const catalogReady=new Promise(r=>releaseCatalog=r);let walkinMode='ready';
 const request=async url=>{
  const pathname=new URL(url,'http://localhost').pathname;let data={summary:{},orders:[],customers:[],invites:[],requests:[],notifications:[],transactions:[],invoices:[],payments:[],expenses:[]};
  if(pathname==='/api/lab/dashboard')data={lab:{id:'A',name:'لابراتوار آزمایشی',album_enabled:true},settings:{},customers:[],prices,sizes:prices,printSizes:prices,albums:[],papers:[],status:{},walletBalance:0};
  if(pathname==='/api/lab/print-catalog'){await catalogReady;data={catalog};}
  if(pathname==='/api/lab/walkin'){if(walkinMode==='error')return Response.json({error:'fixture_unavailable'},{status:503});data={lab:{id:'A',name:'نمونه'},prices:[],settings:{}};}
  if(pathname==='/api/lab/write-access')data={allowed:true,serverNow:new Date().toISOString(),activeUntil:'2030-01-01T00:00:00Z'};
  if(pathname==='/api/auth/me')data=store.get('auth');return Response.json(data);
 };
 const server=createHost({store,request,token:'test',roots:()=>[ui,path.join(native,'verified-ui')],isOnline:()=>true,sync:{status:()=>({...store.status(),online:true}),wake(){},run:async()=>({}),live:async()=>({})}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const origin='http://127.0.0.1:'+server.address().port,context=await browser.newContext({viewport:{width:1920,height:1000}});await context.addCookies([{name:'desktop',value:'test',url:origin}]);
  // Real native host: full shell, cached panes, font, storage and header patches,
  // independently frozen native stylesheets and the actual compiled React app.
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(origin+'/lab/settings/prices');await page.locator('.inventoryPriceGrid:not(.head)').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const metrics=()=>page.evaluate(()=>{const h=document.querySelector('.inventoryPriceGrid.head'),rect=n=>{const b=n.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2,width:b.width}};return{overflow:document.documentElement.scrollWidth>innerWidth,head:rect(h),headers:[...h.children].map(rect),rows:[...document.querySelectorAll('.inventoryPriceGrid:not(.head)')].map(row=>({rect:rect(row),inputs:[...row.querySelectorAll('label>input')].map(rect)}))}});
  const assertAligned=async label=>{const m=await metrics();assert.equal(m.overflow,false,label+' no page overflow');assert.equal(m.rows.length,prices.length);for(const row of m.rows){assert.equal(row.inputs.length,m.headers.length-1);assert(Math.abs(row.rect.width-m.head.width)<1,label+' same row width');for(let i=0;i<row.inputs.length;i++){assert(Math.abs(row.inputs[i].x-m.headers[i+1].x)<1,label+' header/input '+i+' align');assert(Math.abs(row.inputs[i].y-row.inputs[0].y)<1,label+' single field row');}}};
  if(!broken)await assertAligned('before catalog');releaseCatalog();await page.locator('.inventoryPriceGrid.head .pb1540BindingDelete').waitFor();
  const drift=await metrics();const maxDrift=Math.max(...drift.rows.flatMap(r=>r.inputs.map((p,i)=>Math.abs(p.x-drift.headers[i+1].x))));
  if(broken)assert(maxDrift>10,'previous full native shell must reproduce header drift');else{
   for(const width of [1920,1440,1266,1024,390]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await assertAligned('after catalog at '+width);await page.screenshot({path:'/tmp/photobridge-r1542-tariffs-'+width+'.png'});}
   await page.setViewportSize({width:1920,height:1000});
   const button=page.locator('.inventoryPriceGrid.head .pb1540BindingDelete');assert.deepEqual(await button.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,bg:getComputedStyle(el).backgroundColor})),{width:26,height:26,bg:'rgb(255, 245, 214)'});
  }
  await page.locator('.pb1147LabNav button[data-category="1"]').click();await page.locator('.pb1372ThirdHeader>button').filter({hasText:'مشتری آزاد'}).waitFor();
  const tab=text=>page.locator('.pb1372ThirdHeader>button').filter({hasText:text});
  await tab('مشتری آزاد').click();await page.waitForURL('**/lab/settings/walkin');
  if(broken){await tab('دعوت').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert(new URL(page.url()).pathname.endsWith('/walkin'),'previous native tabs must fail to leave walk-in');console.log('PASS: reproduced BOTH full-shell tariff drift and the cached walk-in navigation trap.');return;}
  for(const mode of ['ready','error']){
   walkinMode=mode;
   for(const [label,section,panel]of [['دعوت','invites','.labInvitesWorkspace'],['همکاری','collaboration','.labCollaborationWorkspace'],['عکاس','photographers','.labPhotographersPanel']]){
    if(!new URL(page.url()).pathname.endsWith('/walkin')){await tab('مشتری آزاد').click();await page.waitForURL('**/lab/settings/walkin');}
    assert.equal(await page.locator('.pb1372ThirdHeader>button:disabled').count(),0);await tab(label).click();await page.waitForURL('**/lab/settings/customers/'+section);
    if(section!=='collaboration')await page.locator(panel).waitFor({state:'visible'});else await page.waitForFunction(()=>[...document.querySelectorAll('.pb1372ThirdHeader>button')].some(b=>b.textContent.includes('همکاری')&&b.classList.contains('active')));
   }
  }
  await page.screenshot({path:'/tmp/photobridge-r1542-customers.png'});
  await page.goBack();await page.waitForURL('**/lab/settings/walkin');await page.goForward();await page.waitForURL('**/lab/settings/customers/photographers');
  for(let i=1;i<=5;i++)catalog=catalogApi.addPrintType(catalog,{kind:'binding',name:'صحافی ویژه با نام طولانی '+i});
  await page.goto(origin+'/lab/settings/prices');await page.waitForFunction(()=>document.querySelectorAll('.inventoryPriceGrid.head .pb1540BindingDelete').length===6);await assertAligned('after native reload with six bindings');
  await page.setViewportSize({width:1024,height:1000});await assertAligned('six bindings in narrow native shell');assert.deepEqual(errors,[]);
  console.log('PASS: full native shell keeps headers aligned before/after catalog arrival, resizing and reload; yellow delete stays 26px; every customer tab leaves walk-in with healthy/failed API and browser history.');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));store.db.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
