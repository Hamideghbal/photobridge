'use strict';
function createManualInvoiceDialog({document,request,complete}){
 const dialogs=new Map();
 return function open({orderId,labId,onIssued}={}){
  if(dialogs.has(orderId))return dialogs.get(orderId);
  let resolve;const promise=new Promise(r=>{resolve=r;});dialogs.set(orderId,promise);
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
  const dialog=el('dialog');dialog.className='pbManualInvoiceDialog';dialog.dir='rtl';dialog.setAttribute('aria-label','صدور فاکتور سفارش');
  const style=el('style');style.textContent='.pbManualInvoiceDialog{width:min(680px,92vw);max-height:85vh;overflow:auto;border:1px solid #d7e2f4;border-radius:18px;padding:24px;color:#263b60;font:14px/1.9 Vazirmatn,Tahoma;background:white}.pbManualInvoiceDialog::backdrop{background:#23314b88}.pbManualInvoiceDialog h2{margin-top:0}.pbManualInvoiceDialog label{display:grid;grid-template-columns:1fr 160px;align-items:center;gap:12px;margin:10px 0}.pbManualInvoiceDialog input{box-sizing:border-box;width:100%;padding:10px;border:1px solid #bdcde5;border-radius:8px}.pbManualInvoiceDialog footer{display:flex;gap:12px;margin-top:20px}.pbManualInvoiceDialog button{padding:10px 18px;border:1px solid #ccd9ed;border-radius:9px;cursor:pointer}.pbManualInvoiceDialog .primary{background:#315aff;color:white}.pbManualInvoiceDialog [role=alert]{color:#aa3520}';
  const title=el('h2','صدور فاکتور سفارش'),body=el('div'),notice=el('p'),footer=el('footer');notice.setAttribute('role','alert');
  const action=el('button','تلاش مجدد'),cancel=el('button','انصراف');action.type=cancel.type='button';action.className='primary';footer.append(action,cancel);dialog.append(style,title,body,notice,footer);document.body.append(dialog);
  let busy=false,finished=false,pricingReload=false,completedOutcome=null,rows=[],inputs=[];
  const lock=value=>{busy=value;action.disabled=value;cancel.disabled=value;inputs.forEach(input=>input.disabled=value);};
  const finish=result=>{if(finished)return;finished=true;dialogs.delete(orderId);dialog.close();dialog.remove();resolve(result);};
  cancel.onclick=()=>{if(!busy)finish(completedOutcome||{cancelled:true});};dialog.addEventListener('cancel',event=>{event.preventDefault();if(!busy)finish(completedOutcome||{cancelled:true});});
  async function issue(){
   lock(true);body.replaceChildren(el('p','در حال صدور فاکتور و بررسی چاپ…'));notice.textContent='';
   try{const outcome=await complete(orderId,labId);if(outcome?.pricingRequired){pricingReload=true;await load();return;}if(!outcome?.completed||!outcome.invoice?.id)throw Error('صدور فاکتور تأیید نشد.');completedOutcome=outcome;if(onIssued)try{await onIssued(outcome);}catch{outcome.warning=[outcome.warning,'فاکتور ثبت شد؛ نمایش سفارش نیاز به تازه‌سازی دارد.'].filter(Boolean).join(' ');}if(outcome.warning){title.textContent='فاکتور صادر شد';body.replaceChildren(el('p','فاکتور ثبت شده است؛ مرحلهٔ صدور را دوباره انجام ندهید.'));notice.textContent=outcome.warning;action.textContent='بستن';action.onclick=()=>finish(outcome);cancel.hidden=true;lock(false);return;}finish(outcome);}
   catch(error){notice.textContent=error.message||'صدور فاکتور انجام نشد.';body.replaceChildren(el('p','سفارش و عکس‌های ذخیره‌شده حفظ شده‌اند.'));action.textContent='تلاش مجدد برای صدور فاکتور';action.onclick=()=>load();lock(false);}
  }
  async function save(){
   const normalized=inputs.map(input=>input.value.trim().replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,٬]/g,''));
   if(normalized.some(v=>!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v))||Number(v)>9e9)){notice.textContent='قیمت واحد معتبر همهٔ ردیف‌ها را وارد کنید.';return;}
   lock(true);notice.textContent='';
   try{await request('/api/lab/orders/'+encodeURIComponent(orderId)+'/invoice-pricing',{method:'PUT',body:JSON.stringify({prices:rows.map((r,i)=>({key:r.key,sizeId:r.sizeId,printType:r.printType,unitPrice:Number(normalized[i])}))})});await issue();}
   catch(error){notice.textContent=error.message||'ذخیرهٔ قیمت انجام نشد.';lock(false);}
  }
  async function load(){
   lock(true);notice.textContent='';body.replaceChildren(el('p','در حال بررسی تعرفه و فاکتور سفارش…'));
   try{const pricing=await request('/api/lab/orders/'+encodeURIComponent(orderId)+'/invoice-pricing');if(!Array.isArray(pricing.requirements))throw Error('پاسخ قیمت‌گذاری کامل نیست؛ دوباره تلاش کنید.');rows=pricing.requirements.filter(r=>!r.resolved);inputs=[];
    if(!rows.length){if(pricingReload){pricingReload=false;throw Error('سرور هنوز قیمت‌گذاری را لازم می‌داند ولی ردیف قیمت ارسال نکرده است. مرحلهٔ سفارش تغییر نکرد.');}await issue();return;}pricingReload=false;
    title.textContent='تعیین قیمت و صدور فاکتور';body.replaceChildren(el('p','قیمت واحد ردیف‌های بدون تعرفه را برای همین سفارش وارد کنید.'));for(const row of rows){const label=el('label'),input=el('input');input.type='text';input.inputMode='numeric';const description=[row.sizeLabel||row.sizeId,row.printTypeLabel||row.printType,String(row.quantity||1)+' عدد'].filter(Boolean).join(' · ');input.setAttribute('aria-label','قیمت واحد '+description);label.append(el('span',description+' — تومان'),input);body.append(label);inputs.push(input);}action.textContent='ثبت قیمت و صدور فاکتور';action.onclick=()=>save();lock(false);inputs[0]?.focus();
   }catch(error){notice.textContent=error.message||'دریافت قیمت‌گذاری انجام نشد.';action.textContent='تلاش مجدد';action.onclick=()=>load();lock(false);}
  }
  dialog.showModal();void load();return promise;
 };
}
module.exports={createManualInvoiceDialog};
