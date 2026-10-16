(()=>{'use strict';
if(window.__PB_MANUAL_FRAME_R1263__)return;window.__PB_MANUAL_FRAME_R1263__=true;
const $=s=>document.querySelector(s),fetcher=window.__PB_DESKTOP_FETCH__||fetch.bind(window);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('fa-IR')+' تومان';
const shop=()=>typeof data==='undefined'?null:data?.shop;
const items=()=>typeof data==='undefined'?[]:(data.saleItems||[]).filter(x=>x.active!==false&&!x.deleted_at);
const frame=s=>['frame','chassis','frame_chassis'].includes(String(s?.business_category||''));
let enabled=false,modal=null,lastShop='',busy=false;
const css=document.createElement('style');css.id='pb1263FrameManualStyle';css.textContent=[
'#pb1263FrameOpen[hidden],#pb1263FrameDialog[hidden],#pb1263Invoice[hidden]{display:none!important}',
'#pb1263FrameOpen{background:#ecf3ff!important;color:#174da8!important;border:1px solid #adc9fa!important;border-radius:9px!important;margin:4px!important;font-weight:bold!important}',
'#pb1263FrameDialog{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:#0009;padding:10px;font:12px/2 Vazirmatn,Tahoma;direction:rtl}',
'#pb1263FrameBox{width:min(900px,96vw);max-height:94vh;overflow:auto;background:white;border-radius:14px;padding:18px;box-shadow:0 10px 30px #0003}',
'#pb1263FrameBox input,#pb1263FrameBox select,#pb1263FrameBox textarea{font:inherit;border:1px solid #d0d5dd;padding:7px;border-radius:8px;min-height:36px;max-width:100%;box-sizing:border-box}',
'#pb1263FrameBox label{display:grid;gap:4px}',
'#pb1263FrameBox button{font:inherit;border-radius:8px;padding:6px 11px;border:1px solid #ccd5e6;background:#edf2fa;cursor:pointer}',
'#pb1263FrameBox .pb1263Primary{background:#315efb;color:white;border-color:#315efb}',
'#pb1263FrameFields{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
'.pb1263FrameLine{display:grid;grid-template-columns:minmax(140px,3fr) 70px minmax(100px,1fr) 35px;gap:8px;align-items:end;margin:8px 0}',
'#pb1263FrameActions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}',
'#pb1263Invoice{margin:10px 0;padding:15px;border:1px dashed #a4b5d0}',
'@media print{body>*{display:none!important}#pb1263FrameDialog{display:block!important;position:static!important;background:white!important;padding:0!important}#pb1263FrameBox{box-shadow:none!important;width:100%!important;max-height:none!important;overflow:visible!important}#pb1263FrameBox>*{display:none!important}#pb1263Invoice{display:block!important;border:none!important}}',
'@media(max-width:570px){#pb1263FrameFields{grid-template-columns:1fr}.pb1263FrameLine{grid-template-columns:2fr 60px 90px 33px}}'
].join('\n');document.head.append(css);
function make(){
 if(modal)return;
 modal=document.createElement('section');modal.id='pb1263FrameDialog';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.innerHTML='<div id="pb1263FrameBox"><div style="display:flex;justify-content:space-between"><h2>ثبت سفارش حضوری قاب و شاسی</h2><button type="button" id="pb1263FrameClose">×</button></div>'+
 '<p>ثبت سفارش و صدور فاکتور محلی حتی در حالت آفلاین امکان‌پذیر است؛ فاکتور تا تأیید همگام‌سازی موقت خواهد بود.</p>'+
 '<div id="pb1263FrameFields"><label>نام مشتری<input id="pb1263FrameBuyer" maxlength="140" required></label><label>موبایل مشتری (اختیاری)<input id="pb1263FrameMobile" maxlength="11" dir="ltr" inputmode="tel"></label></div>'+
 '<label>توضیحات<textarea id="pb1263FrameNote" maxlength="500"></textarea></label>'+
 '<h3>اقلام سفارش</h3><div id="pb1263FrameLines"></div><button type="button" id="pb1263FrameAdd">+ افزودن قلم</button><h3>جمع: <b id="pb1263FrameTotal">۰ تومان</b></h3>'+
 '<div id="pb1263FrameActions"><button id="pb1263FrameSubmit" class="pb1263Primary" type="button">ثبت سفارش و ایجاد فاکتور</button><button id="pb1263FramePrint" type="button" hidden>چاپ فاکتور</button></div>'+
 '<p id="pb1263FrameMsg" role="status" aria-live="polite"></p><section id="pb1263Invoice" hidden></section>'+
 '<hr><h3>سفارش‌های حضوری قبلی</h3><div id="pb1263FrameHistory"></div></div>';
 document.body.append(modal);
 $('#pb1263FrameClose').onclick=()=>modal.hidden=true;
 $('#pb1263FrameAdd').onclick=()=>addLine();
 $('#pb1263FrameSubmit').onclick=submit;
 $('#pb1263FramePrint').onclick=()=>window.print();
 modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
}
function addLine(itemId='',qty=1){
 const container=$('#pb1263FrameLines'),list=items();
 if(!list.length){message('هنوز کالایی در فروشگاه ثبت نشده است.');return}
 if(container.children.length>=30)return message('حداکثر ۳۰ قلم مجاز است.');
 const line=document.createElement('div');line.className='pb1263FrameLine';
 line.innerHTML='<label>قاب / شاسی<select data-sale>'+list.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===itemId?'selected':'')+'>'+esc(p.title||p.model||'محصول')+'</option>').join('')+'</select></label>'+
 '<label>تعداد<input type="number" data-qty min="1" max="99" step="1" value="'+qty+'"></label><b data-amount>—</b><button aria-label="حذف قلم" type="button">×</button>';
 container.append(line);
 line.querySelector('button').onclick=()=>{line.remove();calculate()};
 line.oninput=calculate;line.onchange=calculate;calculate();
}
function calculate(){let total=0;for(const row of $('#pb1263FrameLines')?.children||[]){const id=row.querySelector('[data-sale]').value,qty=Number(row.querySelector('[data-qty]').value),p=items().find(x=>x.id===id),sum=Number(p?.sale_price||0)*qty;row.querySelector('[data-amount]').textContent=money(sum);total+=sum}$('#pb1263FrameTotal').textContent=money(total)}
const message=s=>{const el=$('#pb1263FrameMsg');if(el)el.textContent=s};
function preview(data,temporary=true){
 const lines=data.lines||[],html=lines.map((line,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(line.title)+'</td><td>'+line.quantity+'</td><td>'+money(line.unitPrice)+'</td><td>'+money(line.total)+'</td></tr>').join('');
 $('#pb1263Invoice').innerHTML='<h2>فاکتور سفارش حضوری</h2><p><b>'+esc(shop()?.name||'فروشگاه')+'</b> — شماره '+esc(data.invoiceRef)+'</p><p>نام مشتری: '+esc(data.buyerName)+' | موبایل: '+esc(data.buyerMobile||'—')+'</p>'+
 '<table border="1" cellpadding="6" cellspacing="0" style="width:100%"><thead><tr><th>ردیف</th><th>کالا</th><th>تعداد</th><th>قیمت واحد</th><th>مبلغ</th></tr></thead><tbody>'+html+'</tbody></table><h3>جمع کل: '+money(data.totalAmount)+'</h3><p>'+
 (temporary?'فاکتور موقت آفلاین: اعتبار نهایی منوط به همگام‌سازی موفق و تطبیق قیمت سرور است.':'فاکتور ثبت‌شده در فروشگاه')+'</p>';
 $('#pb1263Invoice').hidden=false;$('#pb1263FramePrint').hidden=false;
}
async function submit(){
 if(busy)return;const buyerName=$('#pb1263FrameBuyer').value.trim(),buyerMobile=$('#pb1263FrameMobile').value.trim(),notes=$('#pb1263FrameNote').value.trim();
 if(buyerName.length<2)return message('نام مشتری را وارد کنید.');
 const rows=[...$('#pb1263FrameLines').children],used=new Set(),order=[];
 for(const r of rows){const id=r.querySelector('[data-sale]').value,qty=Number(r.querySelector('[data-qty]').value);if(used.has(id)||!Number.isSafeInteger(qty)||qty<1||qty>99)return message('اقلام تکراری یا تعداد نامعتبر است.');used.add(id);order.push({saleItemId:id,quantity:qty})}
 if(!order.length)return message('حداقل یک قلم اضافه کنید.');
 busy=true;$('#pb1263FrameSubmit').disabled=true;
 try{const response=await fetcher('/api/rental/manual-sale-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({buyerName,buyerMobile,notes,items:order})}),result=await response.json();if(!response.ok)throw Error(result.message||result.error||'ثبت سفارش انجام نشد');
  preview(result,true);message('فاکتور محلی '+result.invoiceRef+' ثبت و برای همگام‌سازی در صف قرار گرفت.');history();
 }catch(e){message(e.message)}finally{busy=false;$('#pb1263FrameSubmit').disabled=false}
}
function history(){
 const list=Array.isArray(typeof data!=='undefined'?data?.saleOrders:null)?data.saleOrders:[],groups=new Map();
 for(const x of list){const match=String(x.notes||'').match(/سفارش حضوری \| (OFF-[A-Z0-9-]+)/);if(!match)continue;const rows=groups.get(match[1])||[];rows.push(x);groups.set(match[1],rows)}
 const host=$('#pb1263FrameHistory');host.replaceChildren();
 for(const [ref,rows] of [...groups].reverse().slice(0,25)){
  const btn=document.createElement('button');btn.type='button';const total=rows.reduce((n,x)=>n+Number(x.total_amount||0),0);btn.textContent=ref+' | '+rows[0].buyer_name+' | '+money(total)+(rows.some(x=>x._offline)?' | در صف همگام‌سازی':' | ثبت‌شده');
  btn.onclick=()=>preview({invoiceRef:ref,buyerName:rows[0].buyer_name,buyerMobile:rows[0].buyer_mobile,totalAmount:total,lines:rows.map(x=>({title:items().find(p=>p.id===x.sale_item_id)?.title||'قاب / شاسی',quantity:x.quantity,unitPrice:x.unit_price,total:x.total_amount}))},rows.some(x=>x._offline));host.append(btn);
 }
 if(!host.children.length)host.textContent='سفارش حضوری قبلی ثبت نشده است.';
}
function open(){if(!enabled||!frame(shop()))return;make();modal.hidden=false;$('#pb1263FrameMsg').textContent='';$('#pb1263Invoice').hidden=true;$('#pb1263FramePrint').hidden=true;$('#pb1263FrameLines').replaceChildren();addLine();history();$('#pb1263FrameBuyer').focus()}
async function check(){
 try{const response=await fetcher('/desktop/frame-manual-status',{cache:'no-store'}),json=response.ok?await response.json():null;
  const id=String(shop()?.id||'');enabled=Boolean(json?.supported&&json.enabled&&json.signedIn&&json.shopId===id&&frame(shop()));
  if(id!==lastShop){lastShop=id;if(modal)modal.hidden=true}
  const nav=$('#rentalDesktopPrimaryNav');
  if(nav&&!$('#pb1263FrameOpen')){const button=document.createElement('button');button.id='pb1263FrameOpen';button.textContent='＋ ثبت سفارش حضوری';button.type='button';button.onclick=open;nav.insertBefore(button,$('#rentalDesktopAddItemAction')||null)}
  if($('#pb1263FrameOpen'))$('#pb1263FrameOpen').hidden=!enabled;
 }catch{enabled=false;if($('#pb1263FrameOpen'))$('#pb1263FrameOpen').hidden=true}
}
void check();setInterval(()=>void check(),2500);
})();