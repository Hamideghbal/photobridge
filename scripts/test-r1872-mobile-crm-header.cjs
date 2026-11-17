'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=path=>fs.readFileSync(path,'utf8');

test('R1872: Customers and Calendar use native selected blue, not legacy pale blue',()=>{
 const css=read('dist/web/photobridge-r1761-crm-nav.css');
 assert(css.includes('linear-gradient(135deg,#315efb,#244fcf)'));
 assert(css.includes('button.pb1761CrmMobileTab[aria-current="page"]'));
 assert(css.includes('html.pb1448LabPhoneMode body>.pb1448LabPhoneDock'));
 assert(css.includes('color:#fff!important'));
 assert(!css.includes('color:#254fc6!important;background:#eaf0ff!important'));
 const host=read('dist/web/customer-crm-host.js');
 assert(host.includes('#root main.photographerMain .photographerPrintModeHeader'));
 assert(host.includes('#root .labRoleWorkspace .labSingleHeader'));
 assert(host.includes('#photographerStoreRoleHeader'));
 assert(host.includes('#photographerRoleHeaderV710'));
 assert(host.includes('rect.bottom>0&&rect.top<innerHeight*.45'));
 assert(host.includes("attributeFilter:['class','style']"));
 const crm=read('dist/web/customer-crm.html');
 assert(crm.includes('html.crmEmbedded body>header'));
});

test('R1872: portal header survives both CRM mobile tabs without new or overlapping header',async t=>{
 if(!process.env.PB_BROWSER_EXECUTABLE)return t.skip('Browser-level test runs in the Chromium CI stage');
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE,args:['--no-sandbox']});
 try{
  for(const kind of ['photographer','lab','store']){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   await page.route('https://photobridge.test/**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/customer-crm.html')
      return route.fulfill({contentType:'text/html',body:'<!doctype html><html class="crmEmbedded"><head><style>html.crmEmbedded body>header{display:none!important}</style></head><body><header>هدر دوم</header><main>مشتریان و تقویم</main></body></html>'});
    return route.fulfill({status:404,body:''});
   });
   const isLab=kind==='lab',isStore=kind==='store',portal=isStore?'photographer':kind;
   const header=isLab?'<header class="labSingleHeader" style="height:94px">هدر لابراتوار</header>':isStore?
     '<header id="photographerStoreRoleHeader" style="height:106px">هدر فروشگاه</header>':
     '<header class="unifiedRoleHeader photographerPrintModeHeader" style="height:112px">هدر عکاسی / چاپ</header>';
   const buttons='<button type="button" class="pb1761CrmMobileTab" data-pb1761-crm="'+portal+'" data-pb-crm-pane="customers"><svg viewBox="0 0 24 24"></svg><em>مشتریان</em></button><button type="button" class="pb1761CrmMobileTab" data-pb1761-crm="'+portal+'" data-pb-crm-pane="calendar"><svg viewBox="0 0 24 24"></svg><em>تقویم</em></button>';
   await page.goto('https://photobridge.test/photographer/gallery', {waitUntil:'domcontentloaded'}).catch(()=>{});
   await page.setContent('<!doctype html><html lang="fa" dir="rtl"><head><style>body{margin:0}header{display:block;background:white}nav{position:fixed;bottom:0;left:0;right:0;height:65px;display:block;background:white}nav>div{display:flex}nav button{height:50px;flex:1}#root{display:block}main{display:block}</style><style>'+
     read('dist/web/photobridge-r1761-crm-nav.css')+'</style><style>'+read('dist/web/customer-crm-host.css')+'</style></head><body>'+(isStore?header:'')+'<div id="root"><div class="'+(isLab?'labRoleWorkspace':'')+'"><main class="'+(isLab?'labWorkspace':'photographerMain')+'">'+(isStore?'':header)+'</main><nav class="'+(isLab?'labBottomAppNav':'photographerBottomAppNav')+'"><div class="'+(isLab?'labBottomAppNavGrid':'photographerBottomAppNavGrid')+'">'+buttons+'</div></nav></div></div></body></html>');
   await page.addScriptTag({content:read('dist/web/customer-crm-host.js')});
   for(const pane of ['customers','calendar']){
    await page.evaluate(({portal,pane})=>window.pbCrmOpen(portal,false,pane),{portal,pane});
    await page.waitForFunction(()=>{const header=document.querySelector('header'),host=document.querySelector('#pbCrmTabContent');return host&&Math.abs(header.getBoundingClientRect().bottom-host.getBoundingClientRect().top)<2;});
    const state=await page.evaluate(pane=>{
     const header=document.querySelector('header');
     const selected=document.querySelector('[data-pb-crm-pane="'+pane+'"]');
     return {headerCount:document.querySelectorAll('header').length,
       headerVisible:getComputedStyle(header).display!=='none',
       hostTop:document.querySelector('#pbCrmTabContent').getBoundingClientRect().top,
       headerBottom:header.getBoundingClientRect().bottom,
       selected:selected.getAttribute('aria-current'),
       background:getComputedStyle(selected).backgroundImage,
       foreground:getComputedStyle(selected).color,
       label:getComputedStyle(selected.querySelector('em')).color};
    },pane);
    assert.equal(state.headerCount,1,kind+': parent header duplicated');
    assert(state.headerVisible);
    assert.equal(state.selected,'page');
    assert(Math.abs(state.hostTop-state.headerBottom)<2,kind+': iframe covers header');
    assert.match(state.background,/linear-gradient/);
    assert.equal(state.foreground,'rgb(255, 255, 255)');
    assert.equal(state.label,'rgb(255, 255, 255)');
   }
   await page.evaluate(()=>window.pbCrmClose());
   assert(await page.locator('#pbCrmTabContent').isHidden());
   await page.close();
  }
 }finally{await browser.close();}
});
