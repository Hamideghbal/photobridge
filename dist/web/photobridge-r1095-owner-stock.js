/* PB R1095 — store setting + visible date-specific shortages on incoming orders. */
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const number=x=>Number(x||0).toLocaleString('fa-IR');
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent=
'#pbR1095Mode{margin:12px 0;padding:13px;border:1px solid #e4e7ec;border-radius:11px;background:#fafcff;direction:rtl}'+
'#pbR1095Mode select{min-height:39px;width:100%;max-width:440px;border-radius:8px;border:1px solid #cdd5df;background:#fff;padding:6px 9px;font:inherit}'+
'#pbR1095Mode strong{display:block;font-size:13px;margin-bottom:7px}#pbR1095Mode small{display:block;margin-top:5px;font-size:11px;color:#667085;line-height:1.9}'+
'.pbR1095StockDetails{display:block;max-width:100%;font-size:11px;line-height:1.85;white-space:normal;overflow-wrap:anywhere;margin-top:7px;padding-top:5px;border-top:1px solid #eaecf0}'+
'.pbR1095StockDetails.bad{color:#b42318!important;border-top-color:#fda29b;font-weight:800}'+
'.pbR1095StockDetails.ok{color:#087f5b!important;font-weight:700}';
document.head.append(style);
let settingsLast='',shopId='',store=new Map(),working=new Set(),timer;
function mountSettings(){
 const form=q('#shopForm'),anchor=q('#settings .reachSettingsGroup');if(!form||!anchor)return;
 let group=q('#pbR1095Mode');
 if(!group){
  group=document.createElement('div');group.id='pbR1095Mode';
  group.innerHTML='<strong>نحوه پذیرش سفارش اجاره از مشتری</strong>'+
   '<label for="pbR1095Select">محدودیت موجودی هنگام ثبت درخواست</label>'+
   '<select name="customerStockMode" id="pbR1095Select">'+
   '<option value="flexible">پذیرش سفارش حتی با کسری موجودی</option>'+
   '<option value="strict">فقط تجهیزات موجود در تاریخ انتخاب‌شده</option></select>'+
   '<small>حالت اول: مشتری درخواست را ثبت می‌کند و کسری روی کارت سفارش مشخص می‌شود. حالت دوم: فقط تعداد آزاد همان تاریخ قابل سفارش است و تا تعیین تکلیف درخواست در موجودی نگه داشته می‌شود. تأیید نهایی همچنان با فروشگاه است.</small>';
  anchor.insertAdjacentElement('afterend',group);
 }
 const shop=typeof data!=='undefined'?data?.shop:null;
 if(shop&&settingsLast!==String(shop.id||'')+'|'+String(shop.customer_rental_stock_mode||'flexible')+'|'+String(shop.updated_at||'')){
  const field=q('#pbR1095Select');if(field)field.value=shop.customer_rental_stock_mode==='strict'?'strict':'flexible';
  settingsLast=String(shop.id||'')+'|'+String(shop.customer_rental_stock_mode||'flexible')+'|'+String(shop.updated_at||'');
 }
}
function stamp(b){return [b.id,b.status,b.rental_start,b.rental_end,(b.items||[]).map(x=>x.itemId+':'+x.quantity).join(',')].join('|')}
async function fetchOne(b){
 const id=String(b.id),key=stamp(b),cache=store.get(id);
 if(cache?.key===key&&Date.now()-cache.time<18000)return cache.value;
 if(working.has(id))return cache?.value||null;
 working.add(id);
 try{
  const response=await api('/api/rental/availability',{method:'POST',body:JSON.stringify({
   startDate:String(b.rental_start).slice(0,10),endDate:String(b.rental_end).slice(0,10),excludeBookingId:id,
   items:(b.items||[]).map(x=>({itemId:x.itemId,quantity:Number(x.quantity||1)}))
  })});
  store.set(id,{key,value:response,time:Date.now()});return response;
 }catch{return cache?.value||null}finally{working.delete(id)}
}
function apply(card,b,res){
 let el=card.querySelector('.pbR1095StockDetails');
 if(!el){el=document.createElement('div');el.className='pbR1095StockDetails';const target=card.querySelector('.pb854BookingIdentity,.pb914NameLine')||card.firstElementChild;target?.append(el)}
 if(!el)return;
 const lines=(res?.items||[]).filter(x=>Number(x.shortage||0)>0||x.valid===false);
 const shortage=lines.length>0;
 let text;
 if(!res){text='موجودی این سفارش در حال بررسی است…'}
 else if(shortage)text='کسری موجودی: '+lines.map(x=>(x.title||'تجهیز')+' — درخواست '+number(x.requested)+' عدد، موجود '+number(x.available)+' عدد، کسری '+number(x.shortage)+' عدد').join(' | ');
 else text=b.customer_stock_held?'موجودی این درخواست هنگام ثبت رزرو شده است؛ همه تجهیزات قابل تأمین‌اند.':'موجودی فعلی این سفارش کامل است؛ کسری ندارد.';
 if(el.textContent!==text)el.textContent=text;
 el.classList.toggle('bad',shortage);el.classList.toggle('ok',Boolean(res)&&!shortage);
}
function cards(){
 if(typeof data==='undefined'||!Array.isArray(data?.bookings))return [];
 const pending=data.bookings.filter(b=>b.status==='pending_approval'),host=q('[data-pb843-office-pane="pending"]');
 if(!host)return[];
 const nodes=[...host.querySelectorAll('.pb854BookingStatusCard')];
 return nodes.map((card,i)=>{
  const id=card.dataset.pb915BookingId||card.getAttribute('data-booking-id')||'';
  const b=(id?pending.find(x=>String(x.id)===id):null)||pending[i];
  return b?{card,b}:null;
 }).filter(Boolean);
}
async function update(){
 mountSettings();
 const shop=typeof data!=='undefined'?String(data?.shop?.id||''):'';
 if(shop!==shopId){shopId=shop;store.clear()}
 const pairs=cards();
 for(const {card,b} of pairs)apply(card,b,store.get(String(b.id))?.value||null);
 const pending=pairs.filter(({b})=>(b.items||[]).length).slice(0,50);
 // Requests are examined in small batches to avoid a burst of heavy daily-availability queries.
 for(let i=0;i<pending.length;i+=4){
  const group=pending.slice(i,i+4);await Promise.all(group.map(async({card,b})=>{const res=await fetchOne(b);if(card.isConnected)apply(card,b,res)}));
 }
}
function schedule(){if(timer)return;timer=setTimeout(()=>{timer=null;void update()},240)}
function start(){
 mountSettings();
 const host=q('[data-pb843-office-pane="pending"]');
 if(host)new MutationObserver(schedule).observe(host,{childList:true,subtree:false});
 void update();
 setInterval(schedule,17000);
 setInterval(mountSettings,1400);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
