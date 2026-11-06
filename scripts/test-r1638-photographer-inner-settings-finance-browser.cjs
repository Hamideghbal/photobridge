'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:980,height:750}});
  const cells=['شماره','لابراتوار','سفارش','صدور','مبلغ','پرداخت','مانده','عملیات']
   .map(x=>'<div><small>'+x+'</small><b>نمونه</b></div>').join('');
  const html='<html lang="fa" dir="rtl" class="pb1126Embedded"><head></head><body><div id="root">'+
   '<main class="photographerMain"><div class="rolePageScrollArea photographerRolePageScrollArea">'+
   '<section class="settingsWorkspace photographerSettings"><aside class="card settingsNav photographerSettingsTabs"><button>موقعیت و آدرس</button><button>تعرفه و سرویس</button><button>دعوت همکار</button></aside><div class="settingsBody"><div class="photographerLocationSettings">نقشه و آدرس</div></div></section>'+
   '<section class="financeWorkspace"><div class="invoiceTableCard"><div class="invoiceRows accountingInvoiceRows"><div class="invoiceRow">'+cells+'</div></div></div></section>'+
   '</div></main></div></body></html>';
  await page.setContent(html);
  await page.addStyleTag({content:fs.readFileSync('dist/web/assets/index-UIRefine-v586.css','utf8')});
  // Ensure this regression actually reproduces the old desktop CSS.
  assert.notEqual(await page.locator('.photographerSettingsTabs').evaluate(el=>getComputedStyle(el).display),'none');
  assert.equal(await page.locator('.invoiceRow>div:nth-child(7)').evaluate(el=>getComputedStyle(el).display),'none');

  await page.addStyleTag({content:fs.readFileSync('scripts/r1638-photographer-inner-settings-finance.css','utf8')});
  for(const width of [980,1440]){
   await page.setViewportSize({width,height:750});
   assert.equal(await page.locator('.photographerSettingsTabs').evaluate(el=>getComputedStyle(el).display),'none');
   const invoice=page.locator('.accountingInvoiceRows .invoiceRow');
   assert.equal(await invoice.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),8,'eight visible invoice grid columns');
   assert.notEqual(await page.locator('.invoiceRow>div:nth-child(7)').evaluate(el=>getComputedStyle(el).display),'none');
   assert.notEqual(await page.locator('.invoiceRow>div:nth-child(8)').evaluate(el=>getComputedStyle(el).display),'none');
  }
  await page.setViewportSize({width:980,height:750});
  const horizontal=await page.locator('.accountingInvoiceRows').evaluate(el=>el.scrollWidth>el.clientWidth);
  assert.equal(horizontal,true,'invoice overflow scrolls instead of wrapping');

  await page.setViewportSize({width:390,height:750});
  assert.notEqual(await page.locator('.photographerSettingsTabs').evaluate(el=>getComputedStyle(el).display),'none','mobile UI untouched');
  const headerPage=await browser.newPage({viewport:{width:1366,height:768}});
  await headerPage.setContent('<html lang="fa" class="pb1126Desktop"><head></head><body><div id="pb1126ChromeHost"><header id="pb1126DesktopHeader"><div class="photographerHeaderIdentity"><button class="pb1163ProfileButton">ع</button><div class="workspaceIdentityCopy"><h1>نام عکاسی</h1><small>پنل عکاسی PhotoBridge</small><p class="photographerIdentityDateOnly">تاریخ</p></div></div></header></div></body></html>');
  await headerPage.addStyleTag({content:fs.readFileSync('scripts/r1638-photographer-inner-settings-finance.css','utf8')});
  assert.equal(await headerPage.locator('.workspaceIdentityCopy>small').evaluate(el=>getComputedStyle(el).display),'none');
  for(const selector of ['.workspaceIdentityCopy>h1','.photographerIdentityDateOnly','.pb1163ProfileButton'])
   assert.notEqual(await headerPage.locator(selector).evaluate(el=>getComputedStyle(el).display),'none',selector+' should remain visible');
  await headerPage.close();
  console.log('PASS R1638: legacy settings removed in embedded desktop, eight aligned invoice columns at 980/1440, mobile preserved, photographer identity subtitle removed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
