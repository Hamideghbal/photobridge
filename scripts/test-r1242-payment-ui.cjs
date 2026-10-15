const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const paymentId='70000000-0000-4000-8000-000000000001';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII=','base64');
async function setup(page,isOwner){
 let status=isOwner?'pending':'awaiting_receipt';const calls=[];
 const bank={cardNumber:'6037991234567890',iban:'IR820540102680020817909002',accountHolder:'فروشگاه نمونه'};
 await page.route('**/*',async route=>{const r=route.request(),url=new URL(r.url());if(url.pathname==='/fixture')return route.fulfill({contentType:'text/html',body:'<!doctype html><html dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body'+(isOwner?'':' class="frameCustomerStore"')+'>'+(isOwner?'<section id="settings"></section><article data-production-order="order"></article>':'<section id="saleOrders"><article data-frame-payment-id="'+paymentId+'"><div class="salePaymentMeta"><span></span></div></article></section>')+'</body></html>'});
  if(!url.pathname.startsWith('/api/'))return route.fulfill({status:404,body:''});calls.push({path:url.pathname,method:r.method(),body:r.postDataJSON()});
  if(url.pathname.endsWith('/frame-payment-settings'))return route.fulfill({json:{paymentSettings:bank,ok:true}});
  if(url.pathname.endsWith('/receipt')&&r.method()==='GET')return route.fulfill({body:png,contentType:'image/png'});
  if(url.pathname.endsWith('/receipt')&&r.method()==='POST'){status='pending';return route.fulfill({json:{ok:true,status}});}
  if(url.pathname.endsWith('/review')){status=r.postDataJSON().action==='approve'?'approved':'rejected';return route.fulfill({json:{ok:true,status}});}
  return route.fulfill({json:{payment:{id:paymentId,status,totalAmount:75000,hasReceipt:status!=='awaiting_receipt',submittedAt:'2026-10-15'},paymentSettings:bank}});
 });
 await page.goto('http://payments.test/fixture');
 await page.addStyleTag({path:path.resolve('dist/web/photobridge-r1242-payments.css')});
 await page.addScriptTag({content:`const ${isOwner?'data={shop:{id:"shop",business_category:"frame_chassis"},saleOrders:[{id:"order",frame_payment_id:"'+paymentId+'",receipt_status:"pending"}]}':'saleOrders=[{frame_payment_id:"'+paymentId+'",payment_status:"unpaid"}]'};`});
 await page.addScriptTag({path:path.resolve('dist/web/photobridge-r1242-frame-payments.js')});
 await page.locator('[data-frame-payment-open]').waitFor();return calls;
}
test('customer sees store bank details, uploads a receipt, and waits for store review on mobile and Windows',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});try{
  for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:900}}),calls=await setup(page,false);await page.locator('[data-frame-payment-open]').click();await page.locator('.pb1242ReceiptForm').waitFor();assert((await page.locator('.pb1242PaymentDialog .pb1242BankAccount').innerText()).includes('6037 9912 3456 7890'));assert((await page.locator('.pb1242PaymentAmount').innerText()).includes('۷۵٬۰۰۰'));
   await page.locator('input[type=file]').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:png});await page.locator('.pb1242ReceiptPreview').waitFor({state:'visible'});await page.locator('.pb1242ReceiptForm button').click();await page.locator('.pb1242PaymentStatus').filter({hasText:'رسید در انتظار تأیید'}).waitFor();assert.equal(await page.locator('.pb1242ReceiptForm').count(),0);const sent=calls.find(c=>c.method==='POST');assert(sent.body.image.startsWith('data:image/png;base64,'));assert(calls.every(c=>!c.path.includes('wallet')));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'/tmp/r1242-customer-payment-'+width+'.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('.pb1242PaymentOverlay').count(),0);await page.close();}
 }finally{await browser.close();}
});
test('owner bank settings save separately and receipt review offers approve/reject with full receipt preview',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage({viewport:{width:1366,height:900}}),calls=await setup(page,true);await page.locator('#pb1242BankSettings button').waitFor();await page.waitForFunction(()=>!document.querySelector('#pb1242BankSettings button').disabled);await page.locator('#pb1242BankSettings input[name=accountHolder]').fill('صاحب حساب فروشگاه');await page.locator('#pb1242BankSettings button').click();await page.locator('#pb1242BankSettings [role=status]').filter({hasText:'ذخیره شد'}).waitFor();assert(calls.some(c=>c.method==='PUT'&&c.body.accountHolder==='صاحب حساب فروشگاه'));await page.locator('[data-frame-payment-open]').click();await page.locator('.pb1242ReceiptReview').waitFor();assert.equal(await page.locator('.pb1242ReceiptLink img').count(),1);await page.locator('.pb1242ReceiptReview textarea').fill('رسید بررسی شد');await page.screenshot({path:'/tmp/r1242-owner-receipt.png'});await page.locator('[data-review-receipt=approve]').click();await page.locator('.pb1242PaymentStatus').filter({hasText:'پرداخت تأیید شده'}).waitFor();assert(calls.some(c=>c.path.endsWith('/review')&&c.body.action==='approve'&&c.body.note==='رسید بررسی شد'));}finally{await browser.close();}
});
