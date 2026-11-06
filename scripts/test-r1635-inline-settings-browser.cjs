const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://panel.test/**',route=>route.fulfill({contentType:'text/html',body:'<html><head></head><body><section class="photographerSettings"><aside class="photographerSettingsTabs">old tabs</aside><div class="settingsBody">existing page content</div></section></body></html>'}));
 await page.goto('https://panel.test/photographer/orders');
 await page.setContent('<html class="pb1126Desktop"><head></head><body><div id="pb1126ChromeHost"><header id="pb1126DesktopHeader"><nav class="pb1126MainNav"><button>گالری</button></nav><div class="pb1126Secondary pb1127PrintRow"><button class="pb1163-settings">تنظیمات</button></div><nav class="pb1632FinanceTabs"><button class="active">فاکتورها</button></nav></header></div></body></html>');
 await page.addStyleTag({content:fs.readFileSync('scripts/r1635-photographer-inline-settings.css','utf8')});
 await page.addScriptTag({content:fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8')});
 assert.equal(await page.locator('.pb1163-settings').count(),0);
 assert.deepEqual(await page.locator('.pb1635SettingsNav button').allTextContents(),['تعرفه‌های لابراتوار','موقعیت عکاسی','دعوت همکار']);
 assert.equal(await page.locator('.pb1632FinanceTabs button').evaluate(el=>getComputedStyle(el).fontSize),'11px');
 assert.equal(await page.locator('.pb1632FinanceTabs button').evaluate(el=>getComputedStyle(el,'::after').height),'1px');
 for(const [key,label] of [['prices','تعرفه‌های لابراتوار'],['location','موقعیت عکاسی'],['invites','دعوت همکار']]){
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#pb1635SettingsPanel iframe')?.contentDocument?.querySelector('.settingsBody'));
  assert.match(await page.locator('#pb1635SettingsPanel iframe').getAttribute('src'),new RegExp('/settings/'+key+'\\?pbDesktopContent=1'));
  assert.equal(await page.locator('[role="dialog"]').count(),0);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pb1635SettingsPanel iframe').contentDocument.querySelector('.photographerSettingsTabs')).display==='none');
 }
 await page.getByRole('button',{name:'گالری',exact:true}).click();assert.equal(await page.locator('#pb1635SettingsPanel').count(),0);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.setContent('<div id="pb1126DesktopHeader"><div class="pb1126Secondary"><button class="pb1163-settings">تنظیمات</button></div></div>');await mobile.addScriptTag({content:fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8')});assert.equal(await mobile.locator('.pb1163-settings').count(),1);assert.equal(await mobile.locator('.pb1635SettingsNav').count(),0);
 console.log('PASS: desktop settings inline, all three routes, closing, finance type/underline; mobile unchanged');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
