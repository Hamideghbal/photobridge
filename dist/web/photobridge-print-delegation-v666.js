(()=>{
  if(window.__photobridgePrintDelegationRuntimeV666)return;
  window.__photobridgePrintDelegationRuntimeV666=true;
  window.__photobridgePrintDelegateToLabV666=false;
  const nativeFetch=window.fetch.bind(window);
  const style=document.createElement('style');
  style.textContent=`
    .pbPrintDelegateV666{display:flex;align-items:center;gap:9px;border:1px solid #d0d5dd;background:#f8fafc;border-radius:11px;padding:9px 10px;margin:8px 0;font-size:11px;cursor:pointer}.pbPrintDelegateV666 input{width:18px;height:18px;accent-color:#2563eb}.pbPrintDelegateV666 span{display:flex;flex-direction:column;gap:2px}.pbPrintDelegateV666 b{font-size:11px;color:#344054}.pbPrintDelegateV666 small{font-size:9px;color:#667085;line-height:1.6}`;
  document.head.appendChild(style);
  function syncChecks(value){
    window.__photobridgePrintDelegateToLabV666=!!value;
    document.querySelectorAll('.pbPrintDelegateV666 input').forEach(x=>{x.checked=!!value});
  }
  function make(){
    const label=document.createElement('label');label.className='pbPrintDelegateV666';
    label.innerHTML='<input type="checkbox"><span><b>بسپار به لابراتوار</b><small>اگر نسبت فایل با سایز چاپ فرق دارد، اصلاح قاب‌بندی را لابراتوار انجام دهد.</small></span>';
    const input=label.querySelector('input');input.checked=!!window.__photobridgePrintDelegateToLabV666;input.addEventListener('change',()=>syncChecks(input.checked));return label;
  }
  function mount(){
    if(!document.querySelector('.simplePrintPilot')){window.__photobridgePrintDelegateToLabV666=false;return}
    const targets=[...document.querySelectorAll('.simplePrintPilotCheckout,.simplePrintMobileQuoteModal')];
    for(const target of targets){
      if(target.querySelector(':scope > .pbPrintDelegateV666'))continue;
      const send=target.querySelector('.simplePrintPilotQuoteSend,.simplePrintMobileQuoteConfirm');
      const label=make();
      if(send&&send.parentNode===target)target.insertBefore(label,send);else target.appendChild(label);
    }
  }
  window.fetch=async function(input,init){
    let nextInit=init;
    try{
      const url=String(typeof input==='string'?input:(input&&input.url)||'');
      const method=String(init?.method||'GET').toUpperCase();
      if(window.__photobridgePrintDelegateToLabV666&&method==='POST'&&url.includes('/api/customer/uploads/presign')&&document.querySelector('.simplePrintPilot')&&typeof init?.body==='string'){
        const body=JSON.parse(init.body);body.cropHandling='lab';nextInit={...init,body:JSON.stringify(body)};
      }
    }catch{}
    return nativeFetch(input,nextInit);
  };
  const mo=new MutationObserver(()=>mount());mo.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',()=>setTimeout(mount,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
