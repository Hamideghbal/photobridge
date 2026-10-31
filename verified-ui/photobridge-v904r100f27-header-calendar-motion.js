/* PhotoBridge R100F27 — wallet money line + menu/tab motion helpers. */
(()=>{
  'use strict';
  if(window.__PB_R100F27_HEADER_CALENDAR_MOTION__)return;
  window.__PB_R100F27_HEADER_CALENDAR_MOTION__=true;
  const $=s=>document.querySelector(s);
  const fa=n=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:0}).format(Math.max(0,Number(n||0)));
  let walletBalance=null,walletLoading=false;
  function walletMenuButton(){return $('#pbR100F25MenuPanel [data-pbf25-target="storeWalletBtn"]')}
  function renderWalletLine(){
    const b=walletMenuButton();if(!b)return false;
    const small=b.querySelector('.pbF25MenuText small');if(!small)return false;
    if(walletBalance==null){small.textContent='معادل پولی: در حال دریافت…';return true}
    small.textContent=`اعتبار ${fa(walletBalance)} · معادل پولی ${fa(walletBalance)} تومان`;
    small.id='pbR100F27WalletMoney';
    return true;
  }
  async function refreshWallet(){
    if(walletLoading)return;walletLoading=true;renderWalletLine();
    try{
      const r=await fetch('/api/customer/services-wallet',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});
      if(r.ok){const d=await r.json();walletBalance=Number(d?.balance||0);renderWalletLine()}
    }catch{}finally{walletLoading=false}
  }
  function enhanceMenu(){
    const btn=$('#pbR100F25MenuBtn'),panel=$('#pbR100F25MenuPanel');if(!btn||!panel)return false;
    if(!btn.__pbf27WalletHook){
      btn.__pbf27WalletHook=true;
      btn.addEventListener('click',()=>{if(btn.getAttribute('aria-expanded')!=='true')setTimeout(refreshWallet,30);else setTimeout(refreshWallet,30)},true);
    }
    renderWalletLine();
    return true;
  }
  // R1192 mobile tab reflow removed: no forced offsetWidth or double RAF.
  function enhanceTabs(){
    const root=$('#storePhotographerWorkspace');if(!root||root.__pbf27Motion)return Boolean(root);
    root.__pbf27Motion=true;
    return true;
  }
  function init(){
    const ok1=enhanceMenu(),ok2=enhanceTabs();
    if(ok1)void refreshWallet();
    if(ok1&&ok2)return;
    const mo=new MutationObserver(()=>{const a=enhanceMenu(),b=enhanceTabs();if(a&&b){void refreshWallet();mo.disconnect()}});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>{enhanceMenu();enhanceTabs();void refreshWallet();mo.disconnect()},3500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
