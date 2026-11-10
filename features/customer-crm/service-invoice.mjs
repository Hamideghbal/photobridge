// Independent CRM service invoices; no writes to existing order, ledger or wallet.
export const CURRENCY='تومان';
const tidy=(s,max)=>String(s??'').trim().replace(/\s+/g,' ').slice(0,max);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function amount(v,max=1_000_000_000_000){const n=Number(v);if(!Number.isSafeInteger(n)||n<0||n>max)throw new Error('invalid_invoice_amount');return n}
export function prepareServiceInvoice(input){
 const raw=input?.items;
 if(!Array.isArray(raw)||raw.length<1||raw.length>50)throw new Error('invalid_invoice_items');
 const items=raw.map((r,i)=>{
  const description=tidy(r?.description,200),quantity=amount(r?.quantity,10000),unitPriceToman=amount(r?.unitPriceToman,1_000_000_000);
  if(!description||!quantity)throw new Error('invalid_invoice_item_'+i);
  const lineTotalToman=quantity*unitPriceToman;
  if(!Number.isSafeInteger(lineTotalToman)||lineTotalToman>1_000_000_000_000)throw new Error('invoice_total_too_large');
  return {description,quantity,unitPriceToman,lineTotalToman};
 });
 const subtotalToman=items.reduce((acc,r)=>acc+r.lineTotalToman,0);
 if(!Number.isSafeInteger(subtotalToman)||subtotalToman>1_000_000_000_000)throw new Error('invoice_total_too_large');
 const discountToman=amount(input.discountToman??0,subtotalToman);
 const totalToman=subtotalToman-discountToman,paidToman=amount(input.paidToman??0,totalToman);
 return {items,subtotalToman,discountToman,totalToman,paidToman,dueToman:totalToman-paidToman,notes:tidy(input.notes,500)};
}
export function renderServiceInvoiceHtml(invoice,format='a4'){
 const paper=format==='thermal'?'thermal':'a4';
 const n=Number(invoice?.invoiceNumber);
 if(!Number.isSafeInteger(n)||n<1)throw new Error('invalid_invoice_number');
 const customerName=tidy(invoice.customerName,180),customerMobile=tidy(invoice.customerMobile,32);
 const businessName=tidy(invoice.businessName,180),businessPhone=tidy(invoice.businessPhone,32),businessAddress=tidy(invoice.businessAddress,240);
 if(!customerName||!businessName)throw new Error('missing_invoice_identity');
 const data=prepareServiceInvoice(invoice);
 const issuedAt=new Date(invoice.issuedAt);
 if(Number.isNaN(issuedAt.getTime()))throw new Error('invalid_issue_date');
 const num=n=>new Intl.NumberFormat('fa-IR').format(n);
 const dt=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(issuedAt);
 const rows=data.items.map((r,i)=>'<tr><td>'+num(i+1)+'</td><td class="service">'+escape(r.description)+'</td><td>'+num(r.quantity)+'</td><td>'+num(r.unitPriceToman)+'</td><td>'+num(r.lineTotalToman)+'</td></tr>').join('');
 const css='*{box-sizing:border-box}body{direction:rtl;color:#203148;font:12px/1.8 Tahoma,Arial,sans-serif;margin:0;background:#f3f6fa}.paper{background:white;max-width:190mm;padding:12mm;margin:12px auto}.head{display:flex;justify-content:space-between;border-bottom:2px solid #253b57;padding-bottom:8px}h1{font-size:19px;margin:0}h2{font-size:13px;margin:0}.meta{margin:15px 0}table{width:100%;border-collapse:collapse}th,td{padding:6px 3px;text-align:right;border-bottom:1px solid #ccd4e0}th{background:#f1f4f8}.service{overflow-wrap:anywhere}.totals{max-width:310px;margin:15px 0 0 auto}.totals>div{display:flex;justify-content:space-between;gap:6px}.final{font-weight:bold;font-size:14px;border-top:2px solid #233b58}.foot{margin-top:25px;text-align:center;border-top:1px solid #aaa;padding-top:8px}.actions{text-align:center;margin:15px}.thermal .paper{max-width:78mm;width:78mm;padding:3mm}.thermal{font-size:10px}.thermal h1{font-size:13px}.thermal .head{display:block}.thermal table{font-size:9px}.thermal th,.thermal td{padding:2px 1px}@media print{body{background:white}.paper{margin:0;max-width:none;padding:0}.actions{display:none}@page{size:auto;margin:5mm}}';
 const div=(label,value,final=false)=>'<div'+(final?' class="final"':'')+'><span>'+label+'</span><strong>'+num(value)+' تومان</strong></div>';
 return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>فاکتور '+num(n)+'</title><style>'+css+'</style></head><body class="'+paper+'"><div class="actions"><button type="button" onclick="window.print()">چاپ فاکتور</button></div><article class="paper"><header class="head"><div><h1>فاکتور خدمات عکاسی</h1><h2>'+escape(businessName)+'</h2></div><div>شماره: '+num(n)+'<div>تاریخ: '+escape(dt)+'</div></div></header><section class="meta">مشتری: <strong>'+escape(customerName)+'</strong><div>شماره همراه: '+escape(customerMobile||'—')+'</div></section><table><thead><tr><th>ردیف</th><th>خدمت</th><th>تعداد</th><th>فی (تومان)</th><th>مبلغ (تومان)</th></tr></thead><tbody>'+rows+'</tbody></table><div class="totals">'+div('جمع خدمات',data.subtotalToman)+div('تخفیف',data.discountToman)+div('مبلغ کل',data.totalToman,true)+div('دریافتی',data.paidToman)+div('باقی‌مانده',data.dueToman)+'</div>'+(data.notes?'<p>توضیحات: '+escape(data.notes)+'</p>':'')+'<footer class="foot">'+escape(businessPhone)+' '+escape(businessAddress)+'</footer></article></body></html>';
}
