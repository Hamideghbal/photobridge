(()=>{
  const state={createSelection:true,createInvoice:false,managerSelection:true};
  const isGallery=()=>location.pathname.startsWith('/photographer/gallery')||location.pathname.startsWith('/g/');
  const cleanPrintResidue=()=>{
    if(!isGallery())return;
    const main=document.querySelector('.photographerMain');
    if(main){['photographerPrintWorkspace','pb762Composing','pb737MobilePrintRedesign','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter'].forEach(c=>main.classList.remove(c));}
    document.body.classList.remove('pb737-mobile-print-active');
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
    const area=document.querySelector('.photographerRolePageScrollArea');
    if(area){area.style.removeProperty('overflow');area.style.removeProperty('height');area.style.removeProperty('max-height');}
  };
  const text=(el)=>String(el?.textContent||'').trim();
  const decorateCreate=()=>{
    const form=document.querySelector('.clientGalleryCreateForm'); if(!form||form.dataset.pb787==='1')return;
    form.dataset.pb787='1';
    form.querySelectorAll('label').forEach(l=>{
      const t=text(l);
      if(t.startsWith('عنوان پروژه')||t.startsWith('نام مشتری')||t.startsWith('رمز ورود خصوصی')){const s=document.createElement('em');s.className='pb787Req';s.textContent='اجباری';l.insertBefore(s,l.querySelector('input,textarea,div')||null)}
      if(t.startsWith('موبایل مشتری')){const s=document.createElement('em');s.className='pb787Opt';s.textContent='اختیاری';l.insertBefore(s,l.querySelector('input,textarea,div')||null)}
    });
    if(form.closest('.pb1112CreateDialog'))return;
    const anchor=[...form.children].find(x=>text(x).includes('حالت پایه گالری'))||form.querySelector('.clientGalleryBaseModeNotice');
    const box=document.createElement('div');box.className='pb787CreateWorkflow';box.innerHTML=`
      <label class="pb787WorkflowToggle"><span><b>انتخاب فایل</b><small>مشتری بتواند عکس‌های موردنظرش را انتخاب و توضیح ثبت کند.</small></span><input id="pb787CreateSelection" type="checkbox" checked></label>
      <label class="pb787WorkflowToggle"><span><b>فاکتور و سفارش چاپ</b><small>در صورت فعال بودن، قیمت‌های شما، سایز چاپ، جمع مبلغ و فاکتور برای مشتری فعال می‌شود.</small></span><input id="pb787CreateInvoice" type="checkbox"></label>`;
    if(anchor)anchor.replaceWith(box); else form.insertBefore(box,form.querySelector('.modalActions'));
    box.querySelector('#pb787CreateSelection').addEventListener('change',e=>state.createSelection=e.target.checked);
    box.querySelector('#pb787CreateInvoice').addEventListener('change',e=>state.createInvoice=e.target.checked);
  };
  const decorateManager=()=>{
    const settings=document.querySelector('.clientGallerySettings');if(!settings||settings.dataset.pb787==='1')return;
    settings.dataset.pb787='1';
    const oldNotice=settings.querySelector('.clientGalleryBaseModeNotice');
    if(oldNotice){oldNotice.innerHTML='<b>انتخاب فایل برای سفارش الزامی است</b><span>با فعال‌کردن فاکتور و سفارش چاپ، انتخاب فایل هم فعال می‌شود.</span>'}
    const invoiceToggle=[...settings.querySelectorAll('label')].find(l=>text(l).includes('سفارش چاپ و فاکتور'));
    const sel=document.createElement('label');sel.className='pb787WorkflowToggle';sel.innerHTML=`<span><b>انتخاب فایل</b><small>مشتری امکان انتخاب عکس و ثبت توضیح داشته باشد.</small></span><input id="pb787ManagerSelection" type="checkbox" ${state.managerSelection?'checked':''}>`;
    if(invoiceToggle){invoiceToggle.parentNode.insertBefore(sel,invoiceToggle);invoiceToggle.querySelector('b').textContent='فاکتور و سفارش چاپ';}
    else settings.insertBefore(sel,settings.children[1]||null);
    const selection=sel.querySelector('input'),invoice=invoiceToggle?.querySelector('input');
    const enforce=()=>{if(invoice?.checked)selection.checked=true;state.managerSelection=selection.checked};
    selection.addEventListener('change',enforce);invoice?.addEventListener('change',enforce);enforce();
  };
  const addInvoiceButton=()=>{
    const portal=document.getElementById('pb787-invoice-portal');
    if(!location.pathname.startsWith('/g/')){portal?.remove();return}
    const status=document.querySelector('.clientGallerySelectionStatus.locked,.clientGallerySelectionStatus:not(.editable)');
    const raw=text(status);
    if(!status||!/تومان|سفارش|ارسال شده/.test(raw)){portal?.remove();return}
    let btn=portal;
    if(!btn){btn=document.createElement('button');btn.id='pb787-invoice-portal';btn.className='pb787InvoiceButton pb792InvoicePortal';btn.type='button';btn.textContent='مشاهده فاکتور';document.body.appendChild(btn)}
    btn.onclick=()=>{const ov=document.createElement('div');ov.className='pb787InvoiceOverlay';let total='';const m=raw.match(/[۰-۹0-9,٬]+\s*تومان/);if(m)total=m[0];ov.innerHTML=`<div class="pb787InvoiceCard"><h3>فاکتور انتخاب عکس</h3><p>خلاصه سفارش ثبت‌شده شما</p><div class="sum">${total||'مبلغ در سفارش ثبت شده است'}</div><p>${raw.replace(/\s+/g,' ').slice(0,260)}</p><button>بستن</button></div>`;ov.onclick=e=>{if(e.target===ov||e.target.tagName==='BUTTON')ov.remove()};document.body.appendChild(ov)};
  };
  const sync=()=>{cleanPrintResidue();decorateCreate();decorateManager();addInvoiceButton()};
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      const method=String(init?.method||'GET').toUpperCase();
      if(url.includes('/api/customer/client-galleries')&&(method==='POST'||method==='PATCH')&&typeof init.body==='string'){
        const body=JSON.parse(init.body||'{}');
        if(method==='POST'&&!document.querySelector('.pb1112CreateDialog')&&/\/api\/customer\/client-galleries(?:\?|$)/.test(url)){body.selectionEnabled=state.createSelection;body.orderingEnabled=state.createInvoice;}
        if(method==='PATCH'){
          const cb=document.querySelector('#pb787ManagerSelection');if(cb)body.selectionEnabled=!!cb.checked;
          const inv=[...document.querySelectorAll('.clientGallerySettings label')].find(l=>text(l).includes('فاکتور و سفارش چاپ')||text(l).includes('سفارش چاپ و فاکتور'))?.querySelector('input[type=checkbox]');if(inv)body.orderingEnabled=!!inv.checked;
        }
        if(body.orderingEnabled)body.selectionEnabled=true;
        init={...init,body:JSON.stringify(body)};
      }
    }catch{}
    const response=await nativeFetch(input,init);
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(String(init?.method||'GET').toUpperCase()==='GET'&&/\/api\/customer\/client-galleries\/[0-9a-f-]+(?:\?|$)/.test(url)){
        const data=await response.clone().json();
        if(data?.gallery&&data.gallery.selection_enabled!==undefined){state.managerSelection=Boolean(data.gallery.selection_enabled||data.gallery.ordering_enabled);const cb=document.querySelector('#pb787ManagerSelection');if(cb)cb.checked=state.managerSelection;}
      }
    }catch{}
    return response;
  };
  const mo=new MutationObserver(()=>requestAnimationFrame(sync));mo.observe(document.documentElement,{subtree:true,childList:true});
  addEventListener('popstate',()=>setTimeout(sync,0));addEventListener('pageshow',sync);setInterval(()=>{if(isGallery())cleanPrintResidue()},1200);sync();
})();
