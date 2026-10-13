(function financeUi(){
'use strict';
if(window.pb1176Finance)return;
const money=n=>Number(n||0).toLocaleString('fa-IR');
const digits=v=>String(v||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\d]/g,'');
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el};
const labeled=(root,label,input)=>{const l=node('label','pb1176Field');l.append(node('span',null,label),input);root.append(l);return input};
function manual({api,customers=[],refresh}){
 if(document.querySelector('.pb1176Backdrop'))return;
 const dialog=node('dialog','pb1176Backdrop');dialog.dir='rtl';dialog.setAttribute('aria-label','ثبت فاکتور دستی');
 const box=node('section','pb1176Form');
 const header=node('header','pb1176ModalHead'),close=node('button','pb1176Close');
 close.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';
 close.type='button';close.setAttribute('aria-label','بستن');close.onclick=()=>dialog.close();
 header.append(node('h2',null,'ثبت فاکتور دستی'),close);box.append(header);
 const help=node('p','pb1176Help','می‌توانید برای چاپ عکس با سایزها و قیمت‌های مختلف، یا برای هر کالا و خدمت دیگری ردیف ثبت کنید. این فاکتور در حساب مشتری ثبت می‌شود.');
 box.append(help);
 const grid=node('div','pb1176CustomerGrid');
 const select=node('select');select.append(new Option('انتخاب عکاسی موجود / مشتری جدید',''));
 for(const customer of customers){select.append(new Option(String(customer.name||'مشتری')+' · '+String(customer.mobile||''),String(customer.id)));}
 labeled(grid,'طرف حساب',select);
 const name=labeled(grid,'نام مشتری جدید',node('input'));name.placeholder='در صورت انتخاب‌نکردن عکاسی';
 const mobile=labeled(grid,'شماره موبایل (اختیاری)',node('input'));mobile.inputMode='tel';mobile.placeholder='۰۹۱۲…';
 select.onchange=()=>{name.disabled=!!select.value;mobile.disabled=!!select.value};
 box.append(grid);
 const list=node('div','pb1176ManualRows');box.append(list);
 const add=node('button','pb1176Add','+ افزودن ردیف');add.type='button';
 box.append(add);
 const bottom=node('div','pb1176CustomerGrid');
 const note=labeled(bottom,'توضیح کلی فاکتور',node('textarea'));note.rows=2;
 const paid=labeled(bottom,'دریافت همزمان (تومان)',node('input'));paid.inputMode='numeric';paid.value='۰';
 const payType=node('select');for(const [v,l] of [['cash','نقدی'],['card','کارتخوان'],['transfer','انتقال بانکی'],['cheque','چک'],['other','سایر']])payType.append(new Option(l,v));
 labeled(bottom,'روش دریافت',payType);box.append(bottom);
 const totals=node('div','pb1176Totals','جمع فاکتور: ۰ تومان');box.append(totals);
 const actions=node('footer','pb1176ModalActions');
 const cancel=node('button',null,'انصراف'),submit=node('button','pb1176Submit','ثبت فاکتور و سند حسابداری');
 cancel.type='button';cancel.onclick=()=>dialog.close();submit.type='button';actions.append(cancel,submit);box.append(actions);
 const data=[];
 function refreshTotal(){const sum=data.reduce((total,r)=>total+Number(digits(r.price.value)||0)*Math.max(1,Number(digits(r.count.value)||1)),0);totals.textContent='جمع فاکتور: '+money(sum)+' تومان';return sum;}
 function appendRow(kind='manual_print'){
  if(data.length>=50)return alert('حداکثر ۵۰ ردیف امکان ثبت دارد.');
  const row=node('div','pb1176ManualRow');
  const type=node('select');type.append(new Option('چاپ عکس','manual_print'),new Option('ردیف آزاد / خدمات','extra'));type.value=kind;
  const description=node('input');description.placeholder=kind==='extra'?'شرح کالا یا خدمت':'سایز، نوع کاغذ یا مشخصات چاپ';
  type.onchange=()=>{description.placeholder=type.value==='extra'?'شرح کالا یا خدمت':'سایز، نوع کاغذ یا مشخصات چاپ';};
  const count=node('input');count.type='number';count.min='1';count.step='1';count.value='1';count.setAttribute('aria-label','تعداد');
  const price=node('input');price.inputMode='numeric';price.placeholder='قیمت واحد (تومان)';price.setAttribute('aria-label','قیمت واحد');
  const remove=node('button','pb1176Remove','×');remove.type='button';remove.setAttribute('aria-label','حذف ردیف');
  const record={row,type,description,count,price};data.push(record);
  remove.onclick=()=>{if(data.length===1)return;const idx=data.indexOf(record);if(idx>=0)data.splice(idx,1);row.remove();refreshTotal()};
  count.oninput=price.oninput=refreshTotal;
  row.append(type,description,count,price,remove);list.append(row);refreshTotal();
 }
 add.onclick=()=>appendRow();
 appendRow();
 submit.onclick=async()=>{
  if(!select.value&&!name.value.trim())return alert('طرف حساب را انتخاب کنید یا نام مشتری جدید را بنویسید.');
  const items=data.map(r=>({kind:r.type.value,description:r.description.value.trim(),quantity:Number(digits(r.count.value)||0),unitPrice:Number(digits(r.price.value)||0)}));
  if(items.some(r=>!r.description||!Number.isSafeInteger(r.quantity)||r.quantity<1||!Number.isSafeInteger(r.unitPrice)||r.unitPrice<0))return alert('شرح، تعداد و مبلغ هر ردیف را تکمیل کنید.');
  const subtotal=refreshTotal(),payment=Number(digits(paid.value)||0);
  if(subtotal<=0||payment>subtotal)return alert('مبلغ کل باید مثبت و دریافت کمتر یا مساوی جمع فاکتور باشد.');
  if(!confirm('فاکتور به مبلغ '+money(subtotal)+' تومان ثبت شود؟'))return;
  const payload={customerId:select.value||undefined,customerName:name.value.trim(),customerMobile:digits(mobile.value),note:note.value.trim(),items,paidAmount:payment,paymentMethod:payType.value};
  submit.disabled=true;submit.textContent='در حال ثبت…';
  try{const out=await api('/api/lab/invoices/manual',{method:'POST',body:JSON.stringify(payload)});dialog.close();await refresh();alert('فاکتور شماره '+String(out.invoice?.number||'')+' ثبت و در حسابداری منظور شد.');}
  catch(e){alert('ثبت فاکتور انجام نشد: '+String(e?.data?.error||e?.message||'خطا'));}finally{submit.disabled=false;submit.textContent='ثبت فاکتور و سند حسابداری'}
 };
 dialog.append(box);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());
 dialog.addEventListener('click',ev=>{if(ev.target===dialog)dialog.close()});
 dialog.showModal();
}
const escape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function detailed(statement,invoices){
 if(!statement)return;
 const rows=Array.isArray(statement.rows)?statement.rows:[];
 const docs=new Map((invoices||[]).filter(x=>x.document_type==='invoice').map(x=>[String(x.id),x]));
 const heading=escape(statement.customer?.name||'طرف حساب');
 const total=statement.summary||{};
 const chunks=rows.map((r,i)=>{
 const invoice=r.reference_type==='invoice'?docs.get(String(r.reference_id)):null;
 const items=invoice?(Array.isArray(invoice.items)?invoice.items:typeof invoice.items==='string'?JSON.parse(invoice.items):[]):[];
 const table=invoice?'<div class="items"><b>ریز فاکتور #'+escape(invoice.number)+'</b><table><thead><tr><th>شرح / سایز</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead><tbody>'+ (items.length?items.map(item=>'<tr><td>'+escape(item.description||item.sizeLabel||item.printSize||'خدمت')+'</td><td>'+escape(item.quantity||item.copies||1)+'</td><td>'+money(item.unitPrice||0)+'</td><td>'+money(item.lineTotal||item.total||0)+'</td></tr>').join(''):'<tr><td colspan="4">جزئیات ردیف‌ها در دسترس نیست.</td></tr>')+'</tbody></table></div>':'';
 return '<article><div class="line"><b>'+String(i+1)+'. '+escape(r.description||'سند')+'</b><span>'+escape(String(r.txn_date||'').slice(0,10))+'</span><span>بدهکار: '+money(r.debit)+'</span><span>بستانکار: '+money(r.credit)+'</span><strong>مانده: '+money(r.balance)+'</strong></div>'+table+'</article>';
 }).join('');
 const html='<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>حساب معین تفصیلی '+heading+'</title><style>@page{size:A4;margin:12mm}body{font:12px/1.8 Tahoma,Arial,sans-serif;color:#172033}.wrap{max-width:1000px;margin:auto}h1{font-size:22px}.meta{background:#eef3ff;padding:12px;border-radius:8px}.line{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.line span{font-size:10px;color:#526178}.line strong{margin-right:auto}article{padding:10px 0;border-bottom:1px solid #ccd5e2;break-inside:avoid}.items{margin:8px 12px;background:#fafcff;padding:8px;border-radius:6px}table{border-collapse:collapse;width:100%;margin-top:5px}th,td{border:1px solid #dce4f2;padding:4px 7px;text-align:right}th{background:#eef3ff}footer{margin-top:18px;font-weight:800}@media print{article{break-inside:avoid}}</style></head><body><div class="wrap"><h1>حساب معین با جزئیات فاکتورها</h1><div class="meta">طرف حساب: '+heading+' · تعداد گردش: '+rows.length+' · مانده اول دوره: '+money(statement.opening)+'</div>'+chunks+'<footer>جمع بدهکار: '+money(total.debit)+' · جمع بستانکار: '+money(total.credit)+' · مانده پایان دوره: '+money(total.closing)+'</footer></div><script>window.onload=function(){window.print()}<\/script></body></html>';
 const w=window.open('','_blank','width=1024,height=900');if(!w)return alert('مرورگر پنجره چاپ را مسدود کرده است.');
 w.document.open();w.document.write(html);w.document.close();
}
function items(invoice){if(!invoice)return [];try{const list=typeof invoice.items==='string'?JSON.parse(invoice.items):invoice.items;return Array.isArray(list)?list:[]}catch{return []}}
window.pb1176Finance={manual,detailed,items};
})();
