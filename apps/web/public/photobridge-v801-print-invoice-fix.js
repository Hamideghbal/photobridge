/* PhotoBridge v801 — mobile print invoice/back/plus cleanup. */
(()=>{
  'use strict';
  if(window.__PB801_PRINT_INVOICE_FIX__)return;
  window.__PB801_PRINT_INVOICE_FIX__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const isMobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  let raf=0;

  function workspace(){return qs('.photographerMain.photographerPrintWorkspace')}
  function uploadMode(w){return !!w&&(w.classList.contains('photographerUploadWorkspaceMode')||w.classList.contains('simplePrintPilotWorkspaceMode')||!!qs('.simplePrintPilot',w))}
  function financeMode(w){return !!w&&(!!qs('.financeWorkspace',w)||/\/photographer\/finance(?:\/|$)/.test(location.pathname))}

  function setInvoiceLabel(btn){
    if(!btn)return;
    btn.classList.remove('pb801InvoiceAsBack','pb801InvoiceHidden');
    btn.setAttribute('aria-label','فاکتور');
    btn.setAttribute('title','فاکتور');
    btn.innerHTML='<span aria-hidden="true">▤</span><em>فاکتور</em>';
  }

  function setBackLabel(btn){
    if(!btn)return;
    btn.classList.remove('pb801InvoiceHidden');
    btn.classList.add('pb801InvoiceAsBack');
    btn.setAttribute('aria-label','بازگشت');
    btn.setAttribute('title','بازگشت');
    btn.innerHTML='<span aria-hidden="true">←</span><em>بازگشت</em>';
  }

  function sync(){
    raf=0;
    const w=workspace();

    // v783 added a second floating "فاکتور" shortcut on mobile. The native header
    // action is now authoritative, so the floating duplicate must never be shown.
    const oldShortcut=qs('#pb783FinanceShortcut');
    if(oldShortcut){oldShortcut.hidden=true;oldShortcut.setAttribute('aria-hidden','true');oldShortcut.classList.add('pb801LegacyInvoiceHidden')}

    if(!w){
      document.documentElement.classList.remove('pb801PrintFinance','pb801PrintUpload');
      return;
    }

    const finance=financeMode(w),upload=uploadMode(w);
    w.classList.toggle('pb801FinanceMode',finance);
    w.classList.toggle('pb801UploadMode',upload);
    document.documentElement.classList.toggle('pb801PrintFinance',finance&&isMobile());
    document.documentElement.classList.toggle('pb801PrintUpload',upload&&isMobile());

    const cluster=qs('.photographerPrintModeUtilityCluster',w);
    if(!cluster)return;
    const invoiceButtons=qsa(':scope > .photographerPrintCommonAction.finance',cluster);
    const invoice=invoiceButtons[0]||null;
    invoiceButtons.slice(1).forEach(el=>{el.hidden=true;el.classList.add('pb801InvoiceHidden')});
    const nativeBack=qs(':scope > .photographerPrintModeBack',cluster);

    // Any historical lower finance controls are duplicates in print workspace.
    qsa('.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',w)
      .forEach(el=>{el.hidden=true;el.classList.add('pb801LegacyInvoiceHidden')});

    if(upload){
      setInvoiceLabel(invoice);
      invoice?.classList.add('pb801InvoiceHidden');
      if(invoice)invoice.hidden=true;
      if(nativeBack){nativeBack.hidden=false;nativeBack.classList.remove('pb801NativeBackHidden')}
      return;
    }

    if(finance){
      setBackLabel(invoice);
      if(invoice)invoice.hidden=false;
      if(nativeBack){nativeBack.hidden=true;nativeBack.classList.add('pb801NativeBackHidden')}
      // The floating "+" creates a new print order; it has no place inside invoices.
      const plus=qs('#pb765-add');
      if(plus){plus.hidden=true;plus.classList.add('pb801PlusHidden')}
      const composerBack=qs('#pb765-back');
      if(composerBack){composerBack.hidden=true;composerBack.classList.add('pb801ComposerBackHidden')}
      return;
    }

    setInvoiceLabel(invoice);
    if(invoice)invoice.hidden=false;
    if(nativeBack){nativeBack.hidden=false;nativeBack.classList.remove('pb801NativeBackHidden')}
    const plus=qs('#pb765-add');
    if(plus){plus.hidden=false;plus.classList.remove('pb801PlusHidden')}
    const composerBack=qs('#pb765-back');
    if(composerBack)composerBack.classList.remove('pb801ComposerBackHidden');
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}

  // In invoice view, the top slot that used to be Invoice is now Back.
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('.photographerPrintCommonAction.finance.pb801InvoiceAsBack');
    if(!b)return;
    const w=workspace();if(!financeMode(w))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
    const realBack=qs('.photographerPrintModeUtilityCluster > .photographerPrintModeBack',w);
    if(realBack){realBack.click();return}
    if(history.length>1)history.back();
    else location.assign('/photographer/orders/flow?workspace=print');
  },true);

  const mo=new MutationObserver(schedule);
  function start(){
    mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
    schedule();setTimeout(schedule,80);setTimeout(schedule,260);setTimeout(schedule,900);
  }
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  addEventListener('popstate',schedule,{passive:true});
  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb801)continue;
    const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);return out};fn.__pb801=true;history[name]=fn;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v801 mobile print invoice/back cleanup active');
})();
