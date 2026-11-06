'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const routes={
   '/photographer/settings/prices':'<main class="photographerMain"><section class="settingsWorkspace photographerSettings"><aside class="photographerSettingsTabs">منوی قدیمی</aside><div class="settingsBody"><section class="photographerPricingSettings"><h2>تعرفه‌های لابراتوار</h2></section></div></section></main>',
   '/photographer/settings/location':'<main class="photographerMain"><section class="settingsWorkspace photographerSettings"><aside class="photographerSettingsTabs">منوی قدیمی</aside><div class="settingsBody"><section class="photographerLocationSettings">نقشه و آدرس عکاسی<input placeholder="آدرس"></section></div></section></main>',
   '/photographer/invites':'<main class="photographerMain"><section class="photographerInviteWorkspace"><h2>دعوت همکار</h2><form><input placeholder="شماره موبایل"></form></section></main>'
  };
  await page.route('https://panel.test/**',route=>{
   const path=new URL(route.request().url()).pathname;
   route.fulfill({contentType:'text/html',body:'<html><head></head><body><div id="root">'+(routes[path]||'<main>در حال دریافت</main>')+'</div></body></html>'});
  });
  await page.goto('https://panel.test/photographer/orders');
  await page.setContent('<html class="pb1126Desktop"><head><style>#pb1126DesktopHeader{position:fixed;z-index:2147483550;top:0;left:0;right:0;height:113px;background:#fff}.pb1126Secondary{display:flex;justify-content:space-between;direction:rtl;height:41px}.pb1127PrintModes{display:flex;gap:9px}.pb1126ContentPanel{position:fixed;inset:113px 0 0;z-index:2147483400;background:#ececec}</style></head><body><div id="pb1126ChromeHost"><header id="pb1126DesktopHeader"><nav class="pb1126MainNav"><button>گالری</button></nav><div class="pb1126Secondary pb1127PrintRow"><div class="pb1127PrintModes"><button>چاپ</button><button>آلبوم</button></div><button class="pb1163-settings">تنظیمات</button></div><nav class="pb1632FinanceTabs"><button class="active">فاکتورها</button></nav></header></div><section class="pb1126ContentPanel">پنل چاپ زیر تنظیمات</section><div id="root"><main class="photographerMain photographerPrintWorkspace pb1461Orders"><div class="photographerContextStatusesDesktop"><button class="active">در جریان<b>2</b></button><button>آماده تحویل<b>1</b></button></div></main></div></body></html>');
  await page.addStyleTag({content:fs.readFileSync('scripts/r1635-photographer-inline-settings.css','utf8')});
  await page.addScriptTag({content:fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8')});
  assert.equal(await page.locator('.pb1163-settings').count(),0);
  assert.deepEqual(await page.locator('.pb1635SettingsNav button').allTextContents(),['تعریف لابراتوار','موقعیت عکاسی','دعوت همکار']);
  for(const sel of ['.pb1127PrintModes>button','.pb1635SettingsNav>button']){
   assert.equal(await page.locator(sel).first().evaluate(el=>getComputedStyle(el).fontSize),'11px');
   assert.equal(await page.locator(sel).first().evaluate(el=>getComputedStyle(el).fontWeight),'800');
  }
  assert.equal(await page.locator('.pb1127PrintModes').evaluate(el=>getComputedStyle(el).gap),'4px');
  assert.equal(await page.locator('.pb1126MainNav>button').first().evaluate(el=>getComputedStyle(el).fontSize),'12px');
  assert.equal(await page.locator('.pb1635SettingsNav').evaluate(el=>getComputedStyle(el).gap),'4px');
  assert.equal(await page.locator('.photographerContextStatusesDesktop>button').first().evaluate(el=>getComputedStyle(el).fontSize),'10.5px');

  for(const [key,label,url,marker] of [
   ['prices','تعرفه‌های لابراتوار','/photographer/settings/prices','.photographerPricingSettings'],
   ['location','موقعیت عکاسی','/photographer/settings/location','.photographerLocationSettings'],
   ['invites','دعوت همکار','/photographer/invites','.photographerInviteWorkspace']
  ]){
   await page.getByRole('button',{name:label,exact:true}).click();
   await page.waitForFunction(selector=>document.querySelector('#pb1635SettingsPanel iframe')?.contentDocument?.querySelector(selector),marker);
   const frame=page.locator('#pb1635SettingsPanel iframe');
   const dest=new URL(await frame.getAttribute('src'),'https://panel.test');
   assert.equal(dest.pathname,url);
   assert.equal(dest.searchParams.get('pbDesktopContent'),'1');
   assert.equal(await page.locator('[role="dialog"]').count(),0);
   assert.equal(await page.locator('#pb1635SettingsPanel').evaluate(el=>getComputedStyle(el).zIndex),'2147483475');
   assert.equal(await page.evaluate(()=>{
    const panel=document.getElementById('pb1635SettingsPanel'),box=panel.getBoundingClientRect();
    return document.elementFromPoint(box.left+box.width/2,box.top+Math.min(70,box.height/2))===panel.querySelector('iframe');
   }),true,'inline iframe must be above desktop print pane');
   await page.waitForFunction(()=>document.querySelector('#pb1635SettingsPanel .pb1635SettingsLoading')?.hidden===true);
   assert.equal(await page.locator('#pb1635SettingsPanel iframe').evaluate(el=>getComputedStyle(el.contentDocument.querySelector('.photographerSettingsTabs'))?.display || 'none'), 'none');
  }
  await page.getByRole('button',{name:'گالری',exact:true}).click();
  assert.equal(await page.locator('#pb1635SettingsPanel').count(),0);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await mobile.setContent('<div id="pb1126DesktopHeader"><div class="pb1126Secondary"><button class="pb1163-settings">تنظیمات</button></div></div>');
  await mobile.addScriptTag({content:fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8')});
  assert.equal(await mobile.locator('.pb1163-settings').count(),1);
  assert.equal(await mobile.locator('.pb1635SettingsNav').count(),0);
  console.log('PASS: desktop settings content above print pane, all 3 routes, matching fonts/gaps, slim statuses, mobile unchanged');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
