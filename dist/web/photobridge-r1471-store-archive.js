/* PhotoBridge store archive — shop-scoped read-only history. */
(() => {
'use strict';
const el=id=>document.getElementById(id);
const safe=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>Number(n||0).toLocaleString('fa-IR'),money=n=>fa(n)+' ریال';
const date=s=>{const d=s?new Date(s):null;return d&&Number.isFinite(d.getTime())?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d):'—'};
let page=1,reqId=0,rows=[],total=0,timer=0;
const names=['pbArchiveSearch','pbArchiveKind','pbArchiveFrom','pbArchiveTo'];
const params=()=>{const p=new URLSearchParams({page:String(page),kind:el('pbArchiveKind')?.value||'all'});const q=el('pbArchiveSearch')?.value.trim();if(q)p.set('search',q);for(const [k,n] of [['from','pbArchiveFrom'],['to','pbArchiveTo']])if(el(n)?.value)p.set(k,el(n).value);return p};
function render(){
const body=el('pbArchiveRows');if(!body)return;
body.innerHTML=rows.length?rows.map((o,i)=>'<tr><td><b>'+safe(o.kind==='sale'?'فروش':'اجاره')+'</b><small>'+safe(o.id.slice(0,8))+'</small></td>'+
'<td><b>'+safe(o.customer_name||'—')+'</b><small dir="ltr">'+safe(o.customer_mobile||'')+'</small></td>'+
'<td>'+safe(o.item_titles||'—')+'<small>'+fa(o.item_count)+' عدد</small></td><td>'+date(o.created_at)+'</td><td>'+date(o.closed_at)+'</td><td>'+money(o.total_amount)+'</td>'+
'<td><button type="button" class="mini" data-pb-archive-print="'+i+'">چاپ خلاصه</button><details><summary>جزئیات</summary><div class="pbArchiveDetail">وضعیت: '+safe(o.kind==='rental'?'برگشت داده شد':'تکمیل‌شده')+
(o.kind==='rental'?'<br>شروع اجاره: '+date(o.start_date)+'<br>پایان اجاره: '+date(o.end_date)+'<br>ودیعه: '+money(o.deposit_amount):'')+
'<br>شناسه: <span dir="ltr">'+safe(o.id)+'</span></div></details></td></tr>').join(''):'<tr><td colspan="7" class="pbArchiveEmpty">سفارش تکمیل‌شده‌ای با این فیلتر پیدا نشد.</td></tr>';
const pages=Math.max(1,Math.ceil(total/40));el('pbArchiveHint').textContent=fa(total)+' سفارش · صفحه '+fa(page)+' از '+fa(pages);
el('pbArchivePrev').disabled=page<=1;el('pbArchiveNext').disabled=page>=pages;
}
async function load(){
if(!el('pbArchiveRows'))return;const token=++reqId;el('pbArchiveRows').innerHTML='<tr><td colspan="7" class="pbArchiveEmpty">در حال دریافت آرشیو…</td></tr>';
try{const r=await fetch('/api/rental/archive?'+params().toString(),{credentials:'same-origin'});if(!r.ok)throw Error('HTTP '+r.status);
const v=await r.json();if(token!==reqId)return;rows=Array.isArray(v.orders)?v.orders:[];total=Number(v.total||0);
if(page>1&&rows.length===0&&total>0){page=Math.ceil(total/40);return load()}render();
}catch(e){if(token!==reqId)return;el('pbArchiveRows').innerHTML='<tr><td colspan="7" class="pbArchiveEmpty">دریافت آرشیو انجام نشد؛ دوباره تلاش کنید.</td></tr>';el('pbArchiveHint').textContent='خطا در بارگذاری'}
}
function print(index){
const o=rows[index];if(!o)return;const w=window.open('','_blank','width=760,height=650');if(!w){alert('اجازه باز شدن پنجره چاپ را فعال کنید.');return}
const parts=[['نوع سفارش',o.kind==='sale'?'فروش تجهیزات':'اجاره تجهیزات'],['شناسه سفارش',o.id],['مشتری',o.customer_name],['موبایل',o.customer_mobile],['کالا',o.item_titles],['تعداد',fa(o.item_count)],['تاریخ ثبت',date(o.created_at)],['تاریخ تکمیل',date(o.closed_at)],['مبلغ',money(o.total_amount)]];
if(o.kind==='rental')parts.push(['ودیعه',money(o.deposit_amount)],['شروع اجاره',date(o.start_date)],['پایان اجاره',date(o.end_date)]);
w.document.write('<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>خلاصه آرشیو</title><style>body{font:14px Tahoma,sans-serif;margin:32px}table{width:100%;border-collapse:collapse}td{padding:10px;border-bottom:1px solid #ddd}td:first-child{font-weight:bold;width:140px}small{color:#777}</style></head><body><h2>خلاصه آرشیو فروشگاه PhotoBridge</h2><small>این برگه خلاصه سوابق است و جایگزین فاکتور رسمی نیست.</small><table>'+parts.map(x=>'<tr><td>'+safe(x[0])+'</td><td>'+safe(x[1])+'</td></tr>').join('')+'</table></body></html>');
w.document.close();w.focus();w.print();
}
function init(){
const tbody=el('pbArchiveRows');if(!tbody)return;window.pbStoreArchiveLoad=load;
names.forEach(n=>el(n)?.addEventListener(n==='pbArchiveSearch'?'input':'change',()=>{page=1;clearTimeout(timer);timer=setTimeout(load,250)}));
el('pbArchivePrev')?.addEventListener('click',()=>{if(page>1){page--;load()}});
el('pbArchiveNext')?.addEventListener('click',()=>{if(page*40<total){page++;load()}});
el('pbArchiveReset')?.addEventListener('click',()=>{names.forEach(n=>{if(el(n))el(n).value=n==='pbArchiveKind'?'all':''});page=1;load()});
tbody.addEventListener('click',e=>{const b=e.target.closest('[data-pb-archive-print]');if(b)print(Number(b.dataset.pbArchivePrint))});
if(location.pathname.replace(/\/+$/,'')==='/rental/archive')load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
