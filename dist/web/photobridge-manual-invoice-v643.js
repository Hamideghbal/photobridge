(()=>{
  'use strict';
  const VERSION='0.17.643';
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const digits=s=>String(s||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const num=s=>Math.max(0,Math.round(Number(digits(s).replace(/[^0-9.]/g,''))||0));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function request(url,opts={}){
    const r=await fetch(url,{credentials:'same-origin',headers:{'content-type':'application/json',...(opts.headers||{})},...opts});
    let d={};try{d=await r.json()}catch{}
    if(!r.ok){const e=new Error(d.error||`HTTP ${r.status}`);e.data=d;throw e}return d;
  }
  function isFinance(){return /^\/lab\/finance(?:\/|$)/.test(location.pathname)}
  function tariffPapers(row){
    const out=[];
    const defs=[['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']];
    for(const [key,label] of defs){const price=num(row?.[key]);if(price>0)out.push({key,label,price})}
    if(!out.length)out.push({key:'manual',label:'قیمت دستی',price:0});
    return out;
  }
  function ensureStyle(){
    if(document.getElementById('pb643-manual-invoice-style'))return;
    const st=document.createElement('style');st.id='pb643-manual-invoice-style';st.textContent=`
    .pb643ManualInvoiceBtn{white-space:nowrap}
    .pb643MIBackdrop{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(2px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Vazirmatn,Vazir,Tahoma,Arial,sans-serif;direction:rtl}
    .pb643MIModal{width:min(1080px,97vw);max-height:94vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 80px rgba(15,23,42,.28);padding:22px;color:#101828}
    .pb643MIHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.pb643MIHead h2{margin:0 0 6px;font-size:22px}.pb643MIHead p{margin:0;color:#667085;font-size:13px}.pb643MIClose{border:0;background:#f2f4f7;border-radius:12px;width:38px;height:38px;font-size:22px;cursor:pointer}
    .pb643MIGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pb643MIGrid label{display:grid;gap:6px;font-weight:700;font-size:13px}.pb643MIGrid .wide{grid-column:1/-1}.pb643MIGrid input,.pb643MIGrid select,.pb643MIGrid textarea{width:100%;border:1px solid #d0d5dd;border-radius:12px;padding:11px 12px;background:#fff;font:inherit;outline:none}.pb643MIGrid textarea{min-height:76px;resize:vertical}.pb643MIGrid input:focus,.pb643MIGrid select:focus,.pb643MIGrid textarea:focus{border-color:#315efb;box-shadow:0 0 0 3px rgba(49,94,251,.1)}
    .pb643MIItems{margin-top:18px;border:1px solid #e4e7ec;border-radius:16px;overflow:hidden}.pb643MIItemsHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#f8fafc}.pb643MIItemsHead b{font-size:14px}.pb643MIItemActions{display:flex;gap:7px;flex-wrap:wrap}.pb643MIAdd{border:1px solid #c7d2fe;background:#eef2ff;color:#315efb;border-radius:10px;padding:8px 12px;cursor:pointer;font:inherit;font-weight:800}.pb643MIAdd.extra{border-color:#d8dee8;background:#fff;color:#475467}
    .pb643MIRow{display:grid;grid-template-columns:70px minmax(145px,1.2fr) minmax(110px,.8fr) 74px 125px 128px 40px;gap:8px;align-items:center;padding:10px 12px;border-top:1px solid #eef2f6}.pb643MIRow input,.pb643MIRow select{min-width:0;width:100%;border:1px solid #d0d5dd;border-radius:10px;padding:9px;font:inherit;background:#fff}.pb643MIRow .kind{display:grid;place-items:center;min-height:36px;padding:4px 7px;border-radius:9px;background:#eef2ff;color:#3730a3;font-size:10px;font-weight:900}.pb643MIRow.extra .kind{background:#f2f4f7;color:#475467}.pb643MIRow .lineTotal{font-weight:900;text-align:center;white-space:nowrap}.pb643MIRow.extra [data-title]{grid-column:2/4}.pb643MIRemove{border:0;background:#fff1f2;color:#e11d48;border-radius:9px;width:36px;height:36px;cursor:pointer;font-size:18px}    .pb643MITotals{margin:16px 0 0;display:flex;justify-content:flex-end}.pb643MITotalBox{min-width:300px;border:1px solid #dbe2ea;background:#f8fafc;border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}.pb643MITotalBox b{font-size:19px}.pb643MIPayment{margin-top:16px;padding:14px;border:1px dashed #c7d2fe;border-radius:14px;background:#f8faff}.pb643MIActions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.pb643MIActions button{border:1px solid #d0d5dd;background:#fff;border-radius:12px;padding:10px 16px;font:inherit;font-weight:800;cursor:pointer}.pb643MIActions .primary{background:#315efb;color:#fff;border-color:#315efb}.pb643MIActions button:disabled{opacity:.6;cursor:wait}.pb643MIError{margin-top:12px;color:#b42318;background:#fef3f2;border:1px solid #fecdca;border-radius:10px;padding:9px 12px;font-size:13px;display:none}
    @media(max-width:860px){.pb643MIModal{padding:15px}.pb643MIGrid{grid-template-columns:1fr}.pb643MIGrid .wide{grid-column:auto}.pb643MIItemsHead{align-items:flex-start;flex-direction:column}.pb643MIRow{grid-template-columns:58px minmax(130px,1fr) minmax(100px,.8fr) 64px 100px 105px 36px;font-size:11px;padding:9px 7px;overflow-x:auto}.pb643MITotalBox{min-width:100%}}
    `;document.head.appendChild(st);
  }
  async function openModal(){
    ensureStyle();
    let customers=[],prices=[];
    try{
      const [finance,dashboard]=await Promise.all([request('/api/lab/finance/summary'),request('/api/lab/dashboard')]);
      customers=Array.isArray(finance.customers)?finance.customers:[];
      prices=Array.isArray(dashboard.prices)?dashboard.prices:[];
    }catch{
      try{const d=await request('/api/lab/finance/summary');customers=Array.isArray(d.customers)?d.customers:[]}catch{}
    }
    const tariffById=new Map(prices.map(x=>[String(x.id),x]));
    const sizeOptions=prices.map(x=>`<option value="${esc(x.id)}">${esc(x.label||`${x.width_cm||''}×${x.height_cm||''}`)}</option>`).join('');
    const wrap=document.createElement('div');wrap.className='pb643MIBackdrop';
    const options=customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name||'بدون نام')} · مانده ${fa(c.balance||0)} تومان</option>`).join('');
    wrap.innerHTML=`<section class="pb643MIModal" role="dialog" aria-modal="true" aria-label="فاکتور دستی">
      <div class="pb643MIHead"><div><h2>ثبت فاکتور دستی</h2><p>برای چاپ حضوری یا خدماتی که خارج از PhotoBridge انجام شده است؛ قیمت چاپ می‌تواند مستقیم از تعرفه لابراتوار بنشیند.</p></div><button class="pb643MIClose" type="button">×</button></div>
      <div class="pb643MIGrid"><label class="wide">مشتری<select data-f="customerId"><option value="__new__">＋ مشتری حضوری جدید</option>${options}</select></label><label data-new>نام مشتری / عکاسی<input data-f="customerName" placeholder="مثلاً آتلیه پارس یا مشتری حضوری"></label><label data-new>شماره موبایل<input data-f="customerMobile" dir="ltr" inputmode="tel" placeholder="09xxxxxxxxx"></label></div>
      <div class="pb643MIItems"><div class="pb643MIItemsHead"><b>ردیف‌های فاکتور</b><div class="pb643MIItemActions"><button class="pb643MIAdd" data-add-print type="button">＋ ردیف چاپ</button><button class="pb643MIAdd extra" data-add-extra type="button">＋ هزینه جانبی</button></div></div><div data-items></div></div>
      <div class="pb643MITotals"><div class="pb643MITotalBox"><span>جمع فاکتور</span><b><span data-total>۰</span> تومان</b></div></div>
      <div class="pb643MIPayment"><div class="pb643MIGrid"><label>دریافت همزمان (اختیاری)<input data-f="paidAmount" inputmode="numeric" placeholder="۰"></label><label>روش دریافت<select data-f="paymentMethod"><option value="cash">نقدی</option><option value="card">کارتخوان</option><option value="transfer">انتقال بانکی</option><option value="cheque">چک</option><option value="other">سایر</option></select></label><label class="wide">توضیحات<textarea data-f="note" placeholder="توضیح اختیاری فاکتور"></textarea></label></div></div>
      <div class="pb643MIError" data-error></div><div class="pb643MIActions"><button type="button" data-cancel>انصراف</button><button class="primary" type="button" data-save>ثبت فاکتور دستی</button></div>
    </section>`;
    document.body.appendChild(wrap);
    const itemsEl=wrap.querySelector('[data-items]'),totalEl=wrap.querySelector('[data-total]'),customerSel=wrap.querySelector('[data-f="customerId"]'),errEl=wrap.querySelector('[data-error]'),saveBtn=wrap.querySelector('[data-save]');
    const close=()=>wrap.remove();wrap.querySelector('.pb643MIClose').onclick=close;wrap.querySelector('[data-cancel]').onclick=close;wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
    const syncCustomer=()=>{const isNew=customerSel.value==='__new__';wrap.querySelectorAll('[data-new]').forEach(x=>x.style.display=isNew?'grid':'none')};customerSel.onchange=syncCustomer;syncCustomer();
    const updateTotal=()=>{let total=0;itemsEl.querySelectorAll('.pb643MIRow').forEach(r=>{const q=num(r.querySelector('[data-q]')?.value)||1,p=num(r.querySelector('[data-p]')?.value);const line=q*p;const out=r.querySelector('[data-line]');if(out)out.textContent=fa(line);total+=line});totalEl.textContent=fa(total)};
    const bindRemove=r=>{r.querySelector('.pb643MIRemove').onclick=()=>{r.remove();if(!itemsEl.children.length)addPrintRow();updateTotal()}};
    const fillPaper=(row,sizeId,selectPreferred='')=>{
      const paperSel=row.querySelector('[data-paper]'),priceInput=row.querySelector('[data-p]'),size=tariffById.get(String(sizeId||''));
      const papers=size?tariffPapers(size):[];
      paperSel.innerHTML=papers.length?papers.map(p=>`<option value="${esc(p.key)}" data-price="${p.price}">${esc(p.label)}</option>`).join(''):'<option value="manual" data-price="0">قیمت دستی</option>';
      if(selectPreferred&&papers.some(p=>p.key===selectPreferred))paperSel.value=selectPreferred;
      const chosen=paperSel.selectedOptions?.[0];priceInput.value=String(Number(chosen?.dataset?.price||0)||'');
      updateTotal();
    };
    const addPrintRow=()=>{
      const r=document.createElement('div');r.className='pb643MIRow print';
      r.innerHTML=`<span class="kind">چاپ</span><select data-size><option value="">انتخاب سایز…</option>${sizeOptions}</select><select data-paper><option value="manual">نوع کاغذ</option></select><input data-q inputmode="numeric" value="1" title="تعداد"><input data-p inputmode="numeric" placeholder="فی (تومان)" title="قیمت واحد؛ قابل ویرایش"><span class="lineTotal"><span data-line>۰</span> تومان</span><button type="button" class="pb643MIRemove" title="حذف">×</button>`;
      itemsEl.appendChild(r);const sizeSel=r.querySelector('[data-size]'),paperSel=r.querySelector('[data-paper]');
      sizeSel.onchange=()=>fillPaper(r,sizeSel.value);paperSel.onchange=()=>{const opt=paperSel.selectedOptions?.[0];r.querySelector('[data-p]').value=String(Number(opt?.dataset?.price||0)||'');updateTotal()};
      r.querySelector('[data-q]').addEventListener('input',updateTotal);r.querySelector('[data-p]').addEventListener('input',updateTotal);bindRemove(r);updateTotal();
    };
    const addExtraRow=()=>{
      const r=document.createElement('div');r.className='pb643MIRow extra';
      r.innerHTML=`<span class="kind">جانبی</span><input data-title placeholder="عنوان؛ مثل جلد، صحافی، طراحی"><input data-q inputmode="numeric" value="1" title="تعداد"><input data-p inputmode="numeric" placeholder="مبلغ (تومان)"><span class="lineTotal"><span data-line>۰</span> تومان</span><button type="button" class="pb643MIRemove" title="حذف">×</button>`;
      itemsEl.appendChild(r);r.querySelector('[data-q]').addEventListener('input',updateTotal);r.querySelector('[data-p]').addEventListener('input',updateTotal);bindRemove(r);updateTotal();
    };
    wrap.querySelector('[data-add-print]').onclick=addPrintRow;wrap.querySelector('[data-add-extra]').onclick=addExtraRow;addPrintRow();
    saveBtn.onclick=async()=>{
      errEl.style.display='none';
      const customerId=customerSel.value==='__new__'?'':customerSel.value,customerName=wrap.querySelector('[data-f="customerName"]').value.trim(),customerMobile=digits(wrap.querySelector('[data-f="customerMobile"]').value).replace(/\D/g,''),paidAmount=num(wrap.querySelector('[data-f="paidAmount"]').value),paymentMethod=wrap.querySelector('[data-f="paymentMethod"]').value,note=wrap.querySelector('[data-f="note"]').value.trim();
      const items=[...itemsEl.querySelectorAll('.pb643MIRow')].map(r=>{
        const quantity=num(r.querySelector('[data-q]')?.value)||1,unitPrice=num(r.querySelector('[data-p]')?.value);
        if(r.classList.contains('print')){const sizeId=r.querySelector('[data-size]')?.value||'',paperKey=r.querySelector('[data-paper]')?.value||'manual',size=tariffById.get(String(sizeId)),paper=tariffPapers(size||{}).find(x=>x.key===paperKey);if(!sizeId)return null;return{kind:'print',description:`چاپ ${String(size?.label||'')}${paper?.label?` · ${paper.label}`:''}`.trim(),quantity,unitPrice,sizeId,paper:paperKey}}
        const title=String(r.querySelector('[data-title]')?.value||'').trim();if(!title)return null;return{kind:'extra',description:title,quantity,unitPrice};
      }).filter(Boolean);
      const total=items.reduce((s,x)=>s+x.quantity*x.unitPrice,0),fail=m=>{errEl.textContent=m;errEl.style.display='block'};
      if(!customerId&&!customerName)return fail('نام مشتری را وارد کن.');
      if(!items.length)return fail('حداقل یک ردیف چاپ یا هزینه جانبی اضافه کن.');
      if(items.some(x=>x.unitPrice<=0))return fail('برای همه ردیف‌ها مبلغ معتبر وارد کن. اگر تعرفه‌ای ثبت نشده، قیمت را دستی بنویس.');
      if(total<=0)return fail('جمع فاکتور باید بیشتر از صفر باشد.');if(paidAmount>total)return fail('مبلغ دریافت‌شده نمی‌تواند از جمع فاکتور بیشتر باشد.');
      saveBtn.disabled=true;saveBtn.textContent='در حال ثبت…';
      try{await request('/api/lab/invoices/manual',{method:'POST',body:JSON.stringify({customerId:customerId||null,customerName,customerMobile,items,paidAmount,paymentMethod,note})});close();alert('فاکتور دستی ثبت شد و در حسابداری/فاکتورها قرار گرفت.');location.reload()}
      catch(e){const code=e?.data?.error||'',messages={invalid_manual_customer_mobile:'شماره موبایل معتبر نیست.',customer_not_found:'مشتری انتخاب‌شده پیدا نشد.',manual_invoice_total_required:'جمع فاکتور باید بیشتر از صفر باشد.',payment_exceeds_invoice_total:'مبلغ دریافت از جمع فاکتور بیشتر است.'};fail(messages[code]||'ثبت فاکتور دستی انجام نشد. دوباره تلاش کن.');saveBtn.disabled=false;saveBtn.textContent='ثبت فاکتور دستی'}
    };
  }
  function mount(){if(!isFinance())return;ensureStyle();const host=document.querySelector('.financeTopActions');if(!host||document.getElementById('pb643-manual-invoice-btn'))return;const b=document.createElement('button');b.type='button';b.id='pb643-manual-invoice-btn';b.className='pb643ManualInvoiceBtn';b.textContent='＋ فاکتور دستی';b.title='ثبت چاپ حضوری، جلد و هزینه‌های جانبی';b.onclick=openModal;host.prepend(b)}
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(mount,100)};new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('popstate',schedule);document.addEventListener('click',()=>setTimeout(schedule,50),true);schedule();
  console.info('[PhotoBridge] manual invoice patch',VERSION);
})();
