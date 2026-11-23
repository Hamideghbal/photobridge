'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {documentHtml}=require('../thermal-printer.cjs');
const invoice={id:'invoice',number:42,total:20000,subtotal:20000,paid:5000,account_balance_at_issue:45000,items:[{description:'۱۳×۱۸ · متالیک',quantity:2,unitPrice:10000,lineTotal:20000,chassis:true}]};
test('native invoice restores the approved five-column bordered, bold thermal table',()=>{
 for(const widthMm of [58,80]){
  const html=documentHtml({kind:'invoice',labName:'لاب <unsafe>',order:{photographer_name:'عکاس نمونه'},invoice,widthMm,fontData:'AAAA'});
  for(const value of ['کالا / خدمات','تعداد','واحد','قیمت','قیمت کل','border:1px solid #000','font-weight:900','font-weight:100 900','data:font/woff2;base64,AAAA','مانده کل حساب شما','شاسی'])assert(html.includes(value),value);
  assert(html.includes('size:'+widthMm+'mm auto'));assert(html.includes('width:'+widthMm+'mm'));
  assert(!html.includes('<script>'));assert(!html.includes("url('/assets/"));assert(html.includes('لاب &lt;unsafe&gt;'));
  assert(html.includes('۲۰٬۰۰۰'));assert(html.includes('۱۵٬۰۰۰'));assert(html.includes('۴۵٬۰۰۰'));
 }
});
test('customer receipt does not show a photographer account block; verified photographer keeps it',()=>{
 let html=documentHtml({kind:'invoice',order:{source:'walkin',direct_customer_name:'مشتری'},invoice});
 assert(html.includes('رسید مشتری'));assert(!html.includes('مانده کل حساب شما'));
 html=documentHtml({kind:'invoice',order:{source:'walkin',photographer_id:'p',photographer_name:'عکاس'},invoice});
 assert(html.includes('رسید همکار'));assert(html.includes('مانده کل حساب شما'));
});
