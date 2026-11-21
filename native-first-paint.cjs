'use strict';

// This gate runs before the React bundle and the deferred desktop navigation
// scripts. It prevents the legacy lab chrome from painting while the final
// navigation is being promoted. It does not download or reload another UI.
function readyToReveal(doc, win) {
  const root=doc.getElementById('root');
  if(!root || !root.firstElementChild || !win.__PB_LAB_DESKTOP_OVERLAY__)return false;
  const workspace=root.querySelector('.labRoleWorkspace');
  if(!workspace)return Boolean(root.querySelector('input[type="password"],.labLoginPage,.loginPage'));
  const header=workspace.querySelector('.labSingleHeader');
  if(!header || !header.querySelector('.settingsIconBtn,.mobileHeaderSettings'))return false;
  if(!header.classList.contains('pb1147LabAdminHeader') || !header.querySelector('.pb1147LabNav'))return false;
  const secondarySource=doc.querySelector('.labSettingsSectionTabs,.financeSectionTabs,.mainQueueFilters');
  if(secondarySource && !workspace.querySelector('.pb1148SecondaryHeader'))return false;
  const thirdSource=workspace.querySelector('.labCustomerSubnav,.albumSettingsInnerTabs,.financeSectionTabs,.labPrintPricingCard>.panelHead');
  if(secondarySource && thirdSource && !workspace.querySelector('.pb1372ThirdHeader'))return false;
  return true;
}
function bootNativeFirstPaint(ready) {
  'use strict';
  if(!window.matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches)return;
  const html=document.documentElement;
  html.classList.add('pbNativeFirstPaintPending');
  let observer=null, interval=null, scheduled=false, settling=false, done=false, retry=null;
  function finish(){
    if(done)return;
    done=true;
    html.classList.remove('pbNativeFirstPaintPending','pbNativeFirstPaintStalled');
    observer?.disconnect();
    window.removeEventListener('popstate',schedule);
    clearInterval(interval);
    clearTimeout(stallTimer);
    retry?.remove();
  }
  function check(){
    scheduled=false;
    if(done || settling || !ready(document,window))return;
    settling=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      settling=false;
      if(ready(document,window))finish();
    }));
  }
  function schedule(){
    if(done || scheduled)return;
    scheduled=true;
    requestAnimationFrame(check);
  }
  function start(){
    if(done)return;
    observer=new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('popstate',schedule);
    // The embedded native bridge can mark itself ready without a DOM mutation.
    interval=setInterval(schedule,400);
    schedule();
  }
  const stallTimer=setTimeout(()=>{
    /* PB_R1967_NATIVE_FIRST_PAINT_RECOVERY: visual gate only, never a security or download gate. */
    const root=document.getElementById('root');
    const workspace=root?.querySelector('.labRoleWorkspace');
    const snapshot={
      schema:1,
      appMounted:Boolean(root?.firstElementChild),
      workspace:Boolean(workspace),
      overlay:Boolean(window.__PB_LAB_DESKTOP_OVERLAY__),
      primaryHeader:Boolean(workspace?.querySelector('.labSingleHeader')),
      primaryNavigation:Boolean(workspace?.querySelector('.pb1147LabNav')),
      secondaryNavigation:Boolean(workspace?.querySelector('.pb1148SecondaryHeader')),
      tertiaryNavigation:Boolean(workspace?.querySelector('.pb1372ThirdHeader'))
    };
    window.__PB_NATIVE_FIRST_PAINT_DIAGNOSTICS__=snapshot;
    if(snapshot.appMounted){
      console.warn('[PhotoBridge R1967] Showing existing React page: native header paint readiness was delayed.');
      finish();
      return;
    }

    if(done)return;
    html.classList.add('pbNativeFirstPaintStalled');
    if(!document.body || retry)return;
    retry=document.createElement('button');
    retry.id='pbNativeFirstPaintRetry';
    retry.type='button';
    retry.textContent='تلاش دوباره';
    retry.title='نمایش دوبارهٔ رابط؛ اطلاعات و عکس‌های ذخیره‌شده حذف نمی‌شوند.';
    const hint=document.createElement('div');
    hint.id='pbNativeFirstPaintDiagnostic';
    hint.textContent='رابط اصلی هنوز ساخته نشده است (UI-R1967-MOUNT). شبکه یا خطای اجرای جاوااسکریپت را بررسی کنید.';
    hint.style.cssText='position:fixed;z-index:2147483003;left:50%;top:calc(50% + 125px);transform:translateX(-50%);width:min(630px,90vw);text-align:center;font:12px Vazirmatn,Tahoma,sans-serif;color:#667085;direction:rtl;pointer-events:none';
    document.body.append(hint);

    retry.addEventListener('click',()=>location.reload());
    document.body.append(retry);
  },6500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
}
const STYLE='html.pbNativeFirstPaintPending #root,html.pbNativeFirstPaintPending #pbAppSplashV780{visibility:hidden!important;pointer-events:none!important}' +
  'html.pbNativeFirstPaintPending body{background:#f5f7fb!important}' +
  'html.pbNativeFirstPaintPending body::before{content:"";position:fixed;inset:0;z-index:2147483000;background:#f5f7fb!important;pointer-events:auto}' +
  'html.pbNativeFirstPaintPending body::after{content:"در حال آماده‌سازی صفحهٔ لابراتوار…";position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;text-align:center;padding:32px;direction:rtl;color:#3156a5;font:750 16px Vazirmatn,Tahoma,sans-serif;pointer-events:none}' +
  'html.pbNativeFirstPaintStalled body::after{content:"بارگذاری کامل نشده است. اتصال را بررسی کنید یا تلاش دوباره را بزنید."}' +
  '#pbNativeFirstPaintRetry{position:fixed;z-index:2147483002;left:50%;top:calc(50% + 65px);transform:translateX(-50%);border:1px solid #b7c9e7;border-radius:12px;padding:11px 24px;background:#fff;color:#3156a5;font:750 14px Vazirmatn,Tahoma,sans-serif;cursor:pointer}';
function injectFirstPaint(html){
  if(html.includes('id="pbNativeFirstPaintScript"'))return html;
  const inject='<style id="pbNativeFirstPaintStyle">'+STYLE+'</style>'+
    '<script id="pbNativeFirstPaintScript">('+bootNativeFirstPaint.toString()+')('+readyToReveal.toString()+');</script>';
  if(!/<head(?:\s[^>]*)?>/i.test(html))throw Error('native_ui_document_head_missing');
  return html.replace(/<head(?:\s[^>]*)?>/i,match=>match+inject);
}
module.exports={injectFirstPaint,readyToReveal};
