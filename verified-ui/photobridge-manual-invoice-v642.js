(()=>{
  'use strict';
  const VERSION='0.17.642';
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const digits=s=>String(s||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const num=s=>Math.max(0,Math.round(Number(digits(s).replace(/[^0-9.]/g,''))||0));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function request(url,opts={}){
    const r=await fetch(url,{credentials:'same-origin',headers:{'content-type':'application/json',...(opts.headers||{})},...opts});
    let d={}; try{ d=await r.json(); }catch{}
    if(!r.ok){const e=new Error(d.error||`HTTP ${r.status}`); e.data=d; throw e;} return d;
  }
  function isFinance(){return /^\/lab\/finance(?:\/|$)/.test(location.pathname)}
  function ensureStyle(){if(document.getElementById('pb642-manual-invoice-style'))return;const st=document.createElement('style');st.id='pb642-manual-invoice-style';st.textContent=`
  .pb642ManualInvoiceBtn{white-space:nowrap}
  .pb642MIBackdrop{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(2px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Vazirmatn,Tahoma,Arial,sans-serif;direction:rtl}
  .pb642MIModal{width:min(900px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 80px rgba(15,23,42,.28);padding:22px;color:#101828}
  .pb642MIHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.pb642MIHead h2{margin:0 0 6px;font-size:22px}.pb642MIHead p{margin:0;color:#667085;font-size:13px}.pb642MIClose{border:0;background:#f2f4f7;border-radius:12px;width:38px;height:38px;font-size:22px;cursor:pointer}
  .pb642MIGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pb642MIGrid label{display:grid;gap:6px;font-weight:700;font-size:13px}.pb642MIGrid .wide{grid-column:1/-1}.pb642MIGrid input,.pb642MIGrid select,.pb642MIGrid textarea{width:100%;border:1px solid #d0d5dd;border-radius:12px;padding:11px 12px;background:#fff;font:inherit;outline:none}.pb642MIGrid textarea{min-height:76px;resize:vertical}.pb642MIGrid input:focus,.pb642MIGrid select:focus,.pb642MIGrid textarea:focus{border-color:#315efb;box-shadow:0 0 0 3px rgba(49,94,251,.1)}
  .pb642MIItems{margin-top:18px;border:1px solid #e4e7ec;border-radius:16px;overflow:hidden}.pb642MIItemsHead{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc}.pb642MIItemsHead b{font-size:14px}.pb642MIAdd{border:1px solid #c7d2fe;background:#eef2ff;color:#315efb;border-radius:10px;padding:8px 12px;cursor:pointer;font:inherit;font-weight:800}
  .pb642MIRow{display:grid;grid-template-columns:minmax(180px,1fr) 92px 150px 130px 42px;gap:8px;align-items:center;padding:10px 12px;border-top:1px solid #eef2f6}.pb642MIRow input{min-width:0;border:1px solid #d0d5dd;border-radius:10px;padding:9px;font:inherit}.pb642MIRow .lineTotal{font-weight:900;text-align:center}.pb642MIRemove{border:0;background:#fff1f2;color:#e11d48;border-radius:9px;width:36px;height:36px;cursor:pointer;font-size:18px}
  .pb642MITotals{margin:16px 0 0;display:flex;justify-content:flex-end}.pb642MITotalBox{min-width:300px;border:1px solid #dbe2ea;background:#f8fafc;border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}.pb642MITotalBox b{font-size:19px}
  .pb642MIPayment{margin-top:16px;padding:14px;border:1px dashed #c7d2fe;border-radius:14px;background:#f8faff}.pb642MIActions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.pb642MIActions button{border:1px solid #d0d5dd;background:#fff;border-radius:12px;padding:10px 16px;font:inherit;font-weight:800;cursor:pointer}.pb642MIActions .primary{background:#315efb;color:#fff;border-color:#315efb}.pb642MIActions button:disabled{opacity:.6;cursor:wait}.pb642MIError{margin-top:12px;color:#b42318;background:#fef3f2;border:1px solid #fecdca;border-radius:10px;padding:9px 12px;font-size:13px;display:none}
  @media(max-width:700px){.pb642MIModal{padding:16px}.pb642MIGrid{grid-template-columns:1fr}.pb642MIGrid .wide{grid-column:auto}.pb642MIRow{grid-template-columns:1fr 70px 110px 1fr 38px;font-size:12px;padding:9px 8px}.pb642MITotalBox{min-width:100%}}
  `;document.head.appendChild(st)}

  async function openModal(){
    ensureStyle();
    let customers=[]; try{const d=await request('/api/lab/finance/summary'); customers=Array.isArray(d.customers)?d.customers:[]}catch{}
    const wrap=document.createElement('div');wrap.className='pb642MIBackdrop';
    const options=customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name||'بدون نام')} · مانده ${fa(c.balance||0)} تومان</option>`).join('');
    wrap.innerHTML=`<section class="pb642MIModal" role="dialog" aria-modal="true" aria-label="فاکتور دستی">
      <div class="pb642MIHead"><div><h2>ثبت فاکتور دستی چاپ</h2><p>برای چاپی که خارج از PhotoBridge یا به‌صورت حضوری دریافت و انجام شده است.</p></div><button class="pb642MIClose" type="button">×</button></div>
      <div class="pb642MIGrid">
        <label class="wide">مشتری<select data-f="customerId"><option value="__new__">＋ مشتری حضوری جدید</option>${options}</select></label>
        <label data-new>نام مشتری / عکاسی<input data-f="customerName" placeholder="مثلاً آتلیه پارس یا مشتری حضوری"></label>
        <label data-new>شماره موبایل<input data-f="customerMobile" dir="ltr" inputmode="tel" placeholder="09xxxxxxxxx"></label>
      </div>
      <div class="pb642MIItems"><div class="pb642MIItemsHead"><b>ردیف‌های فاکتور</b><button class="pb642MIAdd" type="button">＋ افزودن ردیف</button></div><div data-items></div></div>
      <div class="pb642MITotals"><div class="pb642MITotalBox"><span>جمع فاکتور</span><b><span data-total>۰</span> تومان</b></div></div>
      <div class="pb642MIPayment"><div class="pb642MIGrid"><label>دریافت همزمان (اختیاری)<input data-f="paidAmount" inputmode="numeric" placeholder="۰"></label><label>روش دریافت<select data-f="paymentMethod"><option value="cash">نقدی</option><option value="card">کارتخوان</option><option value="transfer">انتقال بانکی</option><option value="cheque">چک</option><option value="other">سایر</option></select></label><label class="wide">توضیحات<textarea data-f="note" placeholder="مثلاً ۲ قطعه ۳۰×۴۰ که مشتری حضوری تحویل داده بود"></textarea></label></div></div>
      <div class="pb642MIError" data-error></div><div class="pb642MIActions"><button type="button" data-cancel>انصراف</button><button class="primary" type="button" data-save>ثبت فاکتور دستی</button></div>
    </section>`;
    document.body.appendChild(wrap);
    const itemsEl=wrap.querySelector('[data-items]'), totalEl=wrap.querySelector('[data-total]'), customerSel=wrap.querySelector('[data-f="customerId"]'), errEl=wrap.querySelector('[data-error]'), saveBtn=wrap.querySelector('[data-save]');
    const close=()=>wrap.remove(); wrap.querySelector('.pb642MIClose').onclick=close;wrap.querySelector('[data-cancel]').onclick=close;wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
    const syncCustomer=()=>{const isNew=customerSel.value==='__new__';wrap.querySelectorAll('[data-new]').forEach(x=>x.style.display=isNew?'grid':'none')}; customerSel.onchange=syncCustomer;syncCustomer();
    const updateTotal=()=>{let total=0;itemsEl.querySelectorAll('.pb642MIRow').forEach(r=>{const q=num(r.querySelector('[data-q]').value)||1,p=num(r.querySelector('[data-p]').value);const line=q*p;r.querySelector('[data-line]').textContent=fa(line);total+=line});totalEl.textContent=fa(total)};
    const addRow=(desc='چاپ عکس',q='1',price='')=>{const r=document.createElement('div');r.className='pb642MIRow';r.innerHTML=`<input data-d placeholder="شرح خدمت / سایز / نوع کاغذ" value="${esc(desc)}"><input data-q inputmode="numeric" value="${esc(q)}" title="تعداد"><input data-p inputmode="numeric" value="${esc(price)}" placeholder="فی (تومان)"><span class="lineTotal"><span data-line>۰</span></span><button type="button" class="pb642MIRemove" title="حذف">×</button>`;itemsEl.appendChild(r);r.querySelectorAll('input').forEach(i=>i.addEventListener('input',updateTotal));r.querySelector('.pb642MIRemove').onclick=()=>{if(itemsEl.children.length>1)r.remove(); else{r.querySelector('[data-d]').value='';r.querySelector('[data-q]').value='1';r.querySelector('[data-p]').value=''}updateTotal()};updateTotal()};
    wrap.querySelector('.pb642MIAdd').onclick=()=>addRow('',1,'');addRow();
    saveBtn.onclick=async()=>{
      errEl.style.display='none';const customerId=customerSel.value==='__new__'?'':customerSel.value;const customerName=wrap.querySelector('[data-f="customerName"]').value.trim();const customerMobile=digits(wrap.querySelector('[data-f="customerMobile"]').value).replace(/\D/g,'');const paidAmount=num(wrap.querySelector('[data-f="paidAmount"]').value);const paymentMethod=wrap.querySelector('[data-f="paymentMethod"]').value;const note=wrap.querySelector('[data-f="note"]').value.trim();
      const items=[...itemsEl.querySelectorAll('.pb642MIRow')].map(r=>({description:r.querySelector('[data-d]').value.trim(),quantity:num(r.querySelector('[data-q]').value)||1,unitPrice:num(r.querySelector('[data-p]').value)})).filter(x=>x.description);
      const total=items.reduce((s,x)=>s+x.quantity*x.unitPrice,0);
      const fail=m=>{errEl.textContent=m;errEl.style.display='block'};
      if(!customerId&&!customerName)return fail('نام مشتری را وارد کن.');if(!items.length||total<=0)return fail('حداقل یک ردیف با مبلغ معتبر وارد کن.');if(paidAmount>total)return fail('مبلغ دریافت‌شده نمی‌تواند از جمع فاکتور بیشتر باشد.');
      saveBtn.disabled=true;saveBtn.textContent='در حال ثبت…';
      try{await request('/api/lab/invoices/manual',{method:'POST',body:JSON.stringify({customerId:customerId||null,customerName,customerMobile,items,paidAmount,paymentMethod,note})});close();alert('فاکتور دستی ثبت شد و در حسابداری/فاکتورها قرار گرفت.');location.reload()}
      catch(e){const code=e?.data?.error||'';const messages={invalid_manual_customer_mobile:'شماره موبایل معتبر نیست.',customer_not_found:'مشتری انتخاب‌شده پیدا نشد.',manual_invoice_total_required:'جمع فاکتور باید بیشتر از صفر باشد.',payment_exceeds_invoice_total:'مبلغ دریافت از جمع فاکتور بیشتر است.'};fail(messages[code]||'ثبت فاکتور دستی انجام نشد. دوباره تلاش کن.');saveBtn.disabled=false;saveBtn.textContent='ثبت فاکتور دستی'}
    };
  }
  function mount(){if(!isFinance())return;ensureStyle();const host=document.querySelector('.financeTopActions');if(!host||document.getElementById('pb642-manual-invoice-btn'))return;const b=document.createElement('button');b.type='button';b.id='pb642-manual-invoice-btn';b.className='pb642ManualInvoiceBtn';b.textContent='＋ فاکتور دستی';b.title='ثبت فاکتور چاپی که خارج از PhotoBridge انجام شده';b.onclick=openModal;host.prepend(b)}
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(mount,100)};new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('popstate',schedule);document.addEventListener('click',()=>setTimeout(schedule,50),true);schedule();
  console.info('[PhotoBridge] manual invoice patch',VERSION);
})();
