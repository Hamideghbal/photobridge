/* PB R1095 — strict customer equipment selection for the chosen rental dates. */
(()=>{
'use strict';
const q=x=>document.querySelector(x),qa=x=>[...document.querySelectorAll(x)];
const mode=()=>{try{const s=selectedShopRecord();return s?.customer_rental_stock_mode||s?.customerStockMode||'flexible'}catch{return'flexible'}};
const strict=()=>mode()==='strict';
const num=x=>Number(x||0).toLocaleString('fa-IR');
let signature='',seq=0,result=null,lastFetch=0,busy=false;
const body=()=>{try{return requestBody()}catch{return null}};
const ready=x=>x&&x.shopId&&x.startDate&&x.endDate;
function status(text,bad=false){
 let note=q('#pbR1095CustomerNote');const list=q('#items');if(!list)return;
 if(!note){note=document.createElement('div');note.id='pbR1095CustomerNote';list.parentElement?.insertBefore(note,list)}
 note.hidden=!strict();note.textContent=strict()?text:'';
 note.classList.toggle('bad',bad);
}
function update(itemsData){
 if(!strict())return;
 const b=body(),dated=ready(b),map=new Map((itemsData?.items||[]).map(x=>[String(x.itemId),x]));
 let anyShort=false;
 for(const card of qa('#items label.item')){
  const cb=card.querySelector('input.pick'),qty=card.querySelector('input.qty');if(!cb||!qty)continue;
  const row=map.get(cb.value),free=dated&&row?Math.max(0,Math.floor(Number(row.available||0))):0;
  const blocked=!dated||!row||row.valid===false||free===0;
  if(dated&&row&&blocked&&cb.checked){cb.checked=false;anyShort=true}
  cb.disabled=blocked;
  qty.disabled=blocked;qty.max=String(Math.max(1,free));
  if(free>0&&Number(qty.value)>free){qty.value=String(free);anyShort=true}
  let note=card.querySelector('.pbR1095ItemStock');
  if(!note){note=document.createElement('small');note.className='pbR1095ItemStock';card.querySelector('.itemInfo')?.append(note)}
  const msg=!dated?'ابتدا تاریخ آفیش را انتخاب کنید':!row?'در حال بررسی موجودی…':free===0?'برای این تاریخ ناموجود': 'موجودی آزاد در این تاریخ: '+num(free)+' عدد';
  if(note.textContent!==msg)note.textContent=msg;
  note.classList.toggle('bad',blocked&&dated);
  card.classList.toggle('pbR1095ItemUnavailable',blocked);
 }
 try{updateRentalCartCountV810()}catch{}
 const desc=!dated?'برای انتخاب تجهیزات ابتدا تاریخ شروع و پایان را تعیین کنید.':!itemsData?'در حال بررسی موجودی واقعی تاریخ انتخاب‌شده…':anyShort?'موجودی تغییر کرده است؛ تعداد یا اقلام انتخابی اصلاح شد.':'فقط تجهیزاتی که در تمام روزهای این بازه موجودند قابل انتخاب‌اند.';
 status(desc,anyShort);
}
async function refresh(force=false){
 if(!strict()){status('');return}
 const b=body();if(!b)return;
 const key=[b.shopId,b.startDate,b.endDate,(typeof items!=='undefined'?items:[]).map(x=>x.id).join(',')].join('|');
 if(!ready(b)){signature=key;result=null;update(null);return}
 if(!force&&signature===key&&Date.now()-lastFetch<12000){update(result);return}
 signature=key;const serial=++seq;lastFetch=Date.now();update(null);
 try{
  const catalog=(typeof items!=='undefined'?items:[]);if(!catalog.length){result={items:[]};update(result);return}
  const data=await api('/api/customer/equipment-rental/availability',{method:'POST',body:JSON.stringify({shopId:b.shopId,startDate:b.startDate,endDate:b.endDate,items:catalog.map(x=>({itemId:x.id,quantity:1}))})});
  if(serial!==seq||signature!==key)return;
  result=data;update(data);
 }catch(e){if(serial===seq){result=null;status('بررسی موجودی انجام نشد؛ اتصال اینترنت را بررسی کنید.',true)}}
}
async function checkFinal(e){
 if(!strict())return;
 // Prevent all existing submit listeners until the fresh server check has completed.
 e.preventDefault();e.stopImmediatePropagation();
 if(busy)return;busy=true;
 const btn=q('#rentalRequestSubmitV809');if(btn)btn.disabled=true;
 try{
  const b=body();if(!ready(b)||!b.items.length){status('تاریخ و تجهیزات سفارش را بررسی کنید.',true);return}
  const out=await api('/api/customer/equipment-rental/availability',{method:'POST',body:JSON.stringify(b)});
  const lacks=(out.items||[]).filter(x=>x.valid===false||Number(x.shortage||0)>0);
  if(lacks.length||!out.available){
   const detail=lacks.map(x=>(x.title||'تجهیز')+': درخواست '+num(x.requested)+'، موجود '+num(x.available)+'، کسری '+num(x.shortage)).join(' | ');
   const m=q('#rentalRequestMsgV809');if(m)m.innerHTML='<div class="msg">'+escapeHtml(detail||'موجودی این تاریخ کافی نیست؛ اقلام را اصلاح کنید.')+'</div>';
   status('برخی اقلام انتخابی برای این تاریخ موجود نیستند.',true);await refresh(true);return;
  }
  await submitRentalBooking(true);
 }catch(err){status('بررسی موجودی انجام نشد؛ دوباره تلاش کنید.',true)}
 finally{busy=false;if(btn)btn.disabled=false}
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function attach(){
 if(q('#rentalRequestSubmitV809')&&!q('#rentalRequestSubmitV809').dataset.pbR1095Guard){const t=q('#rentalRequestSubmitV809');t.dataset.pbR1095Guard='1';t.addEventListener('click',checkFinal,true)}
 const list=q('#items');if(list&&!list.dataset.pbR1095Watch){list.dataset.pbR1095Watch='1';new MutationObserver(()=>{if(strict())update(result)}).observe(list,{childList:true})}
 for(const id of ['start','end']){const field=q('#'+id);if(field&&!field.dataset.pbR1095Watch){field.dataset.pbR1095Watch='1';field.addEventListener('change',()=>void refresh(true));field.addEventListener('input',()=>void refresh(true))}}
}
function tick(){attach();if(strict())void refresh(false);else{const note=q('#pbR1095CustomerNote');if(note)note.hidden=true}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
setInterval(tick,2200);
})();
