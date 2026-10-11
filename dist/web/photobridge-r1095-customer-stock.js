/* PB R1098 — photographer stock privacy: availability is binary, never inventory counts. */
(()=>{
'use strict';
const q=x=>document.querySelector(x),qa=x=>[...document.querySelectorAll(x)];
let signature='',seq=0,result=null,lastFetch=0,busy=false,renderedRoot=null,renderedSignature='',resultFingerprint='';
const request=()=>{try{return requestBody()}catch{return null}};
const ready=x=>x&&x.shopId&&x.startDate&&x.endDate;
const payload=()=>{
 const base=request();if(!base)return null;
 const rows=qa('#items label.item').map(card=>{
  const cb=card.querySelector('input.pick'),qty=card.querySelector('input.qty');
  if(!cb)return null;
  return {itemId:String(cb.value||''),quantity:Math.max(1,Math.min(99,Math.round(Number(qty?.value||1)||1)))};
 }).filter(x=>x?.itemId);
 return {...base,items:rows};
};
function status(text,bad=false){
 let note=q('#pbR1095CustomerNote'),list=q('#items');if(!list)return;
 if(!note){note=document.createElement('div');note.id='pbR1095CustomerNote';list.parentElement?.insertBefore(note,list)}
 const next=String(text||'');if(note.textContent!==next)note.textContent=next;
 note.hidden=!next;note.classList.toggle('bad',bad);
}
function update(itemsData){
 renderedRoot=q('#items')?.firstElementChild||null;renderedSignature=signature;
 const base=request(),dated=ready(base),map=new Map((itemsData?.items||[]).map(x=>[String(x.itemId),x]));
 let anyBlocked=false;
 for(const card of qa('#items label.item')){
  const cb=card.querySelector('input.pick'),qty=card.querySelector('input.qty');if(!cb||!qty)continue;
  const row=map.get(String(cb.value)),known=Boolean(dated&&row),blocked=!dated||!row||row.valid===false||row.isAvailable===false;
  const noUnits=known&&(row.valid===false||row.hasAnyAvailability===false);
  if(known&&blocked&&cb.checked){cb.checked=false;anyBlocked=true}
  cb.disabled=blocked;
  qty.disabled=!dated||!row||row.valid===false||noUnits;
  qty.max='99';
  let note=card.querySelector('.pbR1095ItemStock');
  if(!note){note=document.createElement('small');note.className='pbR1095ItemStock';card.querySelector('.itemInfo')?.append(note)}
  const text=!dated?'ابتدا تاریخ آفیش را انتخاب کنید':!row?'در حال بررسی موجودی…':blocked?'موجود نمی‌باشد':'';
  if(note.textContent!==text)note.textContent=text;
  note.hidden=!text;
  note.classList.toggle('bad',Boolean(known&&blocked));
  card.classList.toggle('pbR1095ItemUnavailable',Boolean(known&&blocked));
  card.classList.toggle('pbRentalItemUnavailable',Boolean(known&&blocked));
 }
 try{updateRentalCartCountV810()}catch{}
 const desc=!dated?'برای انتخاب تجهیزات ابتدا تاریخ شروع و پایان را تعیین کنید.':!itemsData?'در حال بررسی امکان رزرو تجهیزات…':anyBlocked?'تجهیزات ناموجود از انتخاب خارج شدند.':'';
 status(desc,anyBlocked);
}
async function refresh(force=false){
 const body=payload();if(!body)return;
 const key=[body.shopId,body.startDate,body.endDate,body.items.map(x=>x.itemId+':'+x.quantity).join(',')].join('|');
 const changed=signature!==key,needsPaint=renderedRoot!==(q('#items')?.firstElementChild||null)||renderedSignature!==key;
 if(!ready(body)){if(changed){signature=key;seq++;result=null;resultFingerprint=''}if(changed||needsPaint)update(null);return}
 if(!force&&!changed&&Date.now()-lastFetch<12000){if(needsPaint)update(result);return}
 signature=key;const serial=++seq;lastFetch=Date.now();
 if(changed){result=null;resultFingerprint='';update(null)}else if(needsPaint)update(result);
 try{
  if(!body.items.length){result={items:[],available:true};resultFingerprint='empty';update(result);return}
  const data=await api('/api/customer/equipment-rental/availability',{method:'POST',body:JSON.stringify(body)});
  if(serial!==seq||signature!==key)return;
  const fingerprint=JSON.stringify((data?.items||[]).map(x=>[x.itemId,x.valid,x.isAvailable,x.hasAnyAvailability]));
  const shouldPaint=fingerprint!==resultFingerprint||renderedRoot!==(q('#items')?.firstElementChild||null);
  result=data;resultFingerprint=fingerprint;if(shouldPaint)update(data);
 }catch(e){if(serial===seq){if(!result)update(null);status('بررسی امکان رزرو انجام نشد؛ دوباره تلاش کنید.',true)}}
}
async function checkFinal(e){
 e.preventDefault();e.stopImmediatePropagation();
 if(busy)return;busy=true;
 const btn=q('#rentalRequestSubmitV809');if(btn)btn.disabled=true;
 try{
  const body=request();if(!ready(body)||!body.items?.length){status('تاریخ و تجهیزات سفارش را بررسی کنید.',true);return}
  const out=await api('/api/customer/equipment-rental/availability',{method:'POST',body:JSON.stringify(body)});
  const blocked=(out.items||[]).some(x=>x.valid===false||x.isAvailable===false);
  if(blocked||out.available===false){
   const m=q('#rentalRequestMsgV809');if(m)m.innerHTML='<div class="msg">یک یا چند تجهیز برای این تاریخ موجود نیست و قابل سفارش نیست.</div>';
   status('تجهیزات ناموجود قابل انتخاب یا سفارش نیستند.',true);await refresh(true);return;
  }
  await submitRentalBooking(true);
 }catch(err){status('بررسی امکان رزرو انجام نشد؛ دوباره تلاش کنید.',true)}
 finally{busy=false;if(btn)btn.disabled=false}
}
function attach(){
 const submit=q('#rentalRequestSubmitV809');
 if(submit&&!submit.dataset.pbR1098Guard){submit.dataset.pbR1098Guard='1';submit.addEventListener('click',checkFinal,true)}
 const list=q('#items');
 if(list&&!list.dataset.pbR1098Watch){list.dataset.pbR1098Watch='1';new MutationObserver(()=>void refresh(false)).observe(list,{childList:true})}
 for(const id of ['start','end']){
  const field=q('#'+id);if(field&&!field.dataset.pbR1098Watch){field.dataset.pbR1098Watch='1';field.addEventListener('change',()=>void refresh(true));field.addEventListener('input',()=>void refresh(true))}
 }
}
function tick(){attach();void refresh(false)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
setInterval(tick,2200);
document.addEventListener('input',e=>{if(e.target.matches?.('#items .qty'))void refresh(true)},true);
document.addEventListener('change',e=>{if(e.target.matches?.('#items .qty'))void refresh(true)},true);
document.addEventListener('click',e=>{if(e.target.closest?.('.pbR63OfficeBtn'))setTimeout(()=>void refresh(true),0)},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh(true)});
})();
