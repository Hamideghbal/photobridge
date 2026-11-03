(()=>{'use strict';
if(!/^\/admin(?:\/|$)/.test(location.pathname)||window.__PB_R1556_LAB_DISCOUNTS__)return;
window.__PB_R1556_LAB_DISCOUNTS__=true;
const style=document.createElement('style');
style.textContent='.pbLabPercentEditor{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px;direction:rtl}.pbLabPercentEditor label{font-size:11px;white-space:nowrap;color:#344054;font-weight:700}.pbLabPercentEditor input{width:67px;max-width:67px;height:30px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;text-align:center;background:#fff;color:#101828;font:600 12px inherit;direction:ltr}.pbLabPercentEditor button{padding:5px 9px;min-height:30px;border:1px solid #b8c5ff;border-radius:7px;background:#eef2ff;color:#3531ad;font-size:11px;font-weight:700;cursor:pointer}.pbLabPercentEditor button:disabled{opacity:.5;cursor:wait}.pbLabPercentEditor small{font-size:10px;color:#667085;width:100%;display:block}.pbLabPercentEditor small.error{color:#b42318}.pbLabPercentEditor small.saved{color:#067647}';
document.head.appendChild(style);
const esc=(s)=>String(s||'').trim();
const api=async(u,opt={})=>{const r=await fetch(u,{credentials:'same-origin',cache:'no-store',...opt});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||j.error||'خطای ارتباط با سرور');return j};
let labs=null,loading=false,scheduled=false;
async function load(){if(loading)return;loading=true;try{const d=await api('/api/admin/labs');labs=Array.isArray(d.labs)?d.labs:[]}catch(e){labs=null;console.warn('[R1556 lab discount]',e.message)}finally{loading=false;schedule()}}
function editor(cell,lab){const wrap=document.createElement('div');wrap.className='pbLabPercentEditor';wrap.dataset.labId=lab.id;
const label=document.createElement('label');label.textContent='تخفیف اشتراک ٪';
const input=document.createElement('input');input.type='number';input.min='0';input.max='100';input.step='0.01';input.inputMode='decimal';input.value=String(Number(lab.subscription_discount_percent||0));input.setAttribute('aria-label','درصد تخفیف اشتراک '+lab.name);
const button=document.createElement('button');button.type='button';button.textContent='ذخیره';
const status=document.createElement('small');status.textContent=Number(lab.subscription_discount_percent||0)>0?'تخفیف فعال: '+Number(lab.subscription_discount_percent).toLocaleString('fa-IR')+'٪':'بدون تخفیف درصدی';
wrap.append(label,input,button,status);
button.addEventListener('click',async()=>{const raw=input.value.trim(),pct=Number(raw);if(!raw||!Number.isFinite(pct)||pct<0||pct>100||Math.round(pct*100)/100!==pct){status.textContent='درصد معتبر بین ۰ تا ۱۰۰، حداکثر دو رقم اعشار وارد کنید.';status.className='error';return}
button.disabled=true;input.disabled=true;button.textContent='در حال ذخیره';status.className='';
try{const saved=await api('/api/admin/labs/'+encodeURIComponent(lab.id),{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({subscriptionDiscountPercent:pct,subscriptionDiscountEnabled:pct>0,subscriptionDiscountAmount:0})});
if(Number(saved.subscription_discount_percent)!==pct)throw new Error('پاسخ ذخیره‌سازی تأیید نشد');
const verify=await api('/api/admin/labs');const latest=(verify.labs||[]).find(x=>String(x.id)===String(lab.id));
if(!latest||Number(latest.subscription_discount_percent)!==pct)throw new Error('مقدار ثبت‌شده در بازخوانی تأیید نشد');
labs=verify.labs;input.value=String(pct);status.textContent=pct?'ذخیره شد: '+pct.toLocaleString('fa-IR')+'٪':'تخفیف غیرفعال شد';status.className='saved';
const old=cell.querySelector('.labDiscountBadge,.mutedDash');if(old){old.textContent=pct?pct.toLocaleString('fa-IR')+'٪':'—';if(pct)old.className='labDiscountBadge';else old.className='mutedDash'}
}catch(e){status.textContent='خطا: '+e.message;status.className='error'}finally{button.disabled=false;input.disabled=false;button.textContent='ذخیره'}});
return wrap}
function paint(){scheduled=false;const table=document.querySelector('.adminLabsTable table');if(!table)return;if(!labs){if(!loading)void load();return}
for(const row of table.querySelectorAll('tbody tr')){const cells=row.querySelectorAll(':scope > td');if(cells.length<7)continue;
const name=esc(cells[0].querySelector('b')?.textContent),mobile=esc(cells[1].querySelector('small')?.textContent);
const matches=labs.filter(l=>esc(l.name)===name&&esc(l.admin_mobile)===mobile);if(matches.length!==1)continue;const lab=matches[0],cell=cells[3];const existing=cell.querySelector('.pbLabPercentEditor');
if(existing?.dataset.labId===String(lab.id))continue;existing?.remove();cell.appendChild(editor(cell,lab))}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
const start=()=>{new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});schedule()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();