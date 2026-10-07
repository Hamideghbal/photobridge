/* PhotoBridge R100F28 — invite-style Lab/Store login hero, non-destructive DOM decoration. */
(()=>{
  'use strict';
  if(window.__PB_R100F28_PORTAL_ENTRY__)return;
  window.__PB_R100F28_PORTAL_ENTRY__=true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const configs={
    lab:{eyebrow:'ورود لابراتوار',title:'به PhotoBridge خوش آمدید',copy:'سفارش‌های عکاس‌ها، فایل‌ها، چاپ، تحویل و حسابداری لابراتوار را در یک پنل مدیریت کنید.',facts:['سفارش و چاپ','مدیریت فایل','فاکتور و حسابداری']},
    rental:{eyebrow:'ورود فروشگاه تجهیزات',title:'به PhotoBridge خوش آمدید',copy:'اجاره و فروش تجهیزات، آفیش‌ها، مشتری‌ها و امور مالی فروشگاه را در پنل اختصاصی PhotoBridge مدیریت کنید.',facts:['اجاره تجهیزات','فروش تجهیزات','آفیش و مالی']}
  };
  function visible(el){return !!el&&!el.closest?.('.hidden')&&!el.hidden}
  function target(){
    const rental=document.querySelector('#loginView .rentalUnifiedLogin');
    if(rental&&visible(rental))return{kind:'rental',form:rental};
    const lab=document.querySelector('form.labLogin');
    if(lab&&/^\/lab(?:\/|$)/.test(location.pathname))return{kind:'lab',form:lab};
    return null;
  }
  function decorate(t){
    const form=t.form,cfg=configs[t.kind],shell=form.closest('.authShell')||form.parentElement;
    if(!shell)return false;
    document.body.classList.add('pbR100F28PortalLogin',`pbR100F28${t.kind==='lab'?'Lab':'Rental'}Login`);
    shell.classList.add('pbR100F28AuthShell');
    shell.dataset.pbR100F28Kind=t.kind;
    if(!shell.querySelector(':scope > .pbR100F28AuthBrand')){
      const brand=document.createElement('a');brand.className='pbR100F28AuthBrand';brand.href='/';brand.setAttribute('aria-label','PhotoBridge');brand.innerHTML='<img src="/photobridge-favicon-v0140.png" alt="PhotoBridge"><b>PhotoBridge</b>';
      shell.insertBefore(brand,shell.firstChild);
    }
    let hero=shell.querySelector(':scope > .pbR100F28AuthHero');
    if(!hero){hero=document.createElement('section');hero.className='pbR100F28AuthHero';shell.insertBefore(hero,form)}
    const sig=JSON.stringify(cfg);if(hero.dataset.sig!==sig){hero.dataset.sig=sig;hero.innerHTML=`<span class="pbR100F28AuthEyebrow">${esc(cfg.eyebrow)}</span><h1>${esc(cfg.title)}</h1><p>${esc(cfg.copy)}</p><div class="pbR100F28AuthFacts">${cfg.facts.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`}
    return true;
  }
  function clearIfNeeded(){
    if(target())return;
    document.body.classList.remove('pbR100F28PortalLogin','pbR100F28LabLogin','pbR100F28RentalLogin');
  }
  let queued=false;
  function sync(){queued=false;const t=target();if(t)decorate(t);else clearIfNeeded()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  const mo=new MutationObserver(queue);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{sync();mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']})},{once:true});
  else{sync();mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']})}
  addEventListener('pageshow',queue,{passive:true});
  addEventListener('popstate',queue,{passive:true});
})();
