(()=>{
  const state={createInvoice:false};
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
      <label class="pb787WorkflowToggle"><span><b>فاکتور و سفارش چاپ</b><small>در صورت فعال بودن، قیمت‌های شما، سایز چاپ، جمع مبلغ و فاکتور برای مشتری فعال می‌شود.</small></span><input id="pb787CreateInvoice" type="checkbox"></label>`;
    if(anchor)anchor.replaceWith(box); else form.insertBefore(box,form.querySelector('.modalActions'));
    box.querySelector('#pb787CreateInvoice').addEventListener('change',e=>state.createInvoice=e.target.checked);
  };
  const decorateManager=()=>{
    const settings=document.querySelector('.clientGallerySettings');if(!settings||settings.dataset.pb787==='1')return;
    settings.dataset.pb787='1';
    settings.querySelector('.clientGalleryBaseModeNotice')?.remove();
    const invoiceToggle=[...settings.querySelectorAll('label')].find(l=>text(l).includes('سفارش چاپ و فاکتور')||text(l).includes('نمایش قیمت و صدور فاکتور'));
    const title=invoiceToggle?.querySelector('b');if(title)title.textContent='نمایش قیمت و صدور فاکتور';
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
        if(method==='POST'&&!document.querySelector('.pb1112CreateDialog')&&/\/api\/customer\/client-galleries(?:\?|$)/.test(url)){body.selectionEnabled=true;body.orderingEnabled=state.createInvoice;}
        if(method==='PATCH'){
          const inv=[...document.querySelectorAll('.clientGallerySettings label')].find(l=>text(l).includes('فاکتور و سفارش چاپ')||text(l).includes('سفارش چاپ و فاکتور')||text(l).includes('نمایش قیمت و صدور فاکتور'))?.querySelector('input[type=checkbox]');if(inv)body.orderingEnabled=!!inv.checked;
        }
        body.selectionEnabled=true;
        init={...init,body:JSON.stringify(body)};
      }
    }catch{}
    return nativeFetch(input,init);
  };
  const mo=new MutationObserver(()=>requestAnimationFrame(sync));mo.observe(document.documentElement,{subtree:true,childList:true});
  addEventListener('popstate',()=>setTimeout(sync,0));addEventListener('pageshow',sync);setInterval(()=>{if(isGallery())cleanPrintResidue()},1200);sync();
})();
