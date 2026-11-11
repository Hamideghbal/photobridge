/* R1787 regression checks on the final composed release payload. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=p=>fs.readFileSync(p,'utf8');
const api=source('dist/api/server.js');
const catalog=source('dist/api/lab-print-catalog.js');
const ui=source('dist/web/assets/index-UIRefine-v655-r84.js');
const intake=source('dist/web/photobridge-r1137-lab-local-intake.js');
const part=(text,start,end)=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)+start.length));

test('combined album mode belongs to one lab and defaults to separate for legacy catalogs',()=>{
 assert.match(catalog,/albumPricingMode:data\.albumPricingMode==="combined"\?"combined":"separate"/);
 assert.match(catalog,/albumPricingMode:body\.albumPricingMode/);
 assert.match(catalog,/print_catalog_invalid_album_pricing_mode/);
 assert.match(catalog,/FOR UPDATE/);
});
test('album order snapshots freeze combined mode and avoid counting printed leaves twice',()=>{
 const album=part(api,'async function albumOrderSnapshot(','\nasync function ');
 assert.match(album,/pb1787Combined = !customSize && catalog\.printTariffCatalog\?\.albumPricingMode === 'combined'/);
 assert.match(album,/manualPrintRequired = !pb1787Combined/);
 assert.match(album,/!pb1787Combined && missingPaperTariff/);
 assert.match(album,/\(pb1787Combined\?0:knownPrintTotal\) \+ Number\(bindingTotal/);
 assert.match(album,/albumPricingMode: pb1787Combined \? 'combined' : 'separate'/);
});
test('combined album invoice generates a single bundled leaf line while preserving old invoices',()=>{
 const invoice=part(api,'const paperBreakdown = Array.isArray(ad?.paperBreakdown) && ad.paperBreakdown.length','const needManualCover =');
 assert.match(invoice,/const pb1787Combined = pricing\.albumPricingMode === 'combined'/);
 assert.match(invoice,/if \(!pb1787Combined && needManualPrint\)/);
 assert.match(invoice,/else if \(!pb1787Combined\)/);
 assert.match(invoice,/چاپ و صحافی هر برگ آلبوم/);
 assert.match(invoice,/kind: 'album_binding'/);
});
test('advances may create a credit; invoice-bound payments still respect invoice balance',()=>{
 const payment=part(api,"if (req.method === 'POST' && url.pathname === '/api/lab/finance/payments')","if (req.method === 'GET' && url.pathname === '/api/lab/finance/customer-statement')");
 assert.match(payment,/available = await customerReceivableBalance\(c, labId, customer\.id\)/);
 assert.match(payment,/if \(invoiceId && amount > available\)/);
 assert.match(payment,/accountKey: 'receivable'.*credit: amount/);
 assert.match(payment,/finishDesktopOperation/);
 assert.doesNotMatch(payment,/if \(amount > available\)/);
});
test('website exposes combined mode and advances with existing grouped payment field',()=>{
 assert.match(ui,/pb1787CombinedPriceToggle/);
 assert.match(ui,/pb1539\.albumPricingMode==="combined"/);
 assert.match(ui,/چاپ و صحافی · /);
 assert.match(ui,/پیش‌پرداخت \/ بستانکاری \(بدون فاکتور\)/);
 assert.match(ui,/Number\(Je.balance\)<0\?"بستانکار":"بدهکار"/);
 assert.match(ui,/ma=Tt\|\|l\.printTariffCatalog\?\.albumPricingMode==="combined"\?0/);
 assert.match(ui,/ja=!!\(\(Tt&&l\.printTariffCatalog\?\.albumPricingMode!=="combined"\)\|\|ka\)/);
});
test('opening debt remains grouped when typed and when field loses focus',()=>{
 assert.match(intake,/debt\.oninput=\(\)=>\{debt\.value=formatMoney\(debt\.value\);\}/);
 assert.match(intake,/debt\.onblur=\(\)=>\{debt\.value=formatMoney\(debt\.value\);\}/);
 assert.match(intake,/const rawDebt=moneyValue\(debt\.value\)/);
});