/* PhotoBridge v749 — final mobile print/store alignment + lean installer UI bridge. */
(()=>{
'use strict';
const mq=matchMedia('(max-width:820px)'); let raf=0;
const txt=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
function replaceStoreLabels(){
  document.querySelectorAll('a,button').forEach(el=>{
    if(txt(el)==='ورود تجهیزات') el.textContent='ورود فروشگاه';
  });
}
function centerStoreActions(){
  document.querySelectorAll('a,button').forEach(el=>{if(el.getAttribute('href')==='/rental'||txt(el)==='فروشگاه تجهیزات'||el.getAttribute('aria-label')==='فروشگاه تجهیزات'||el.classList.contains('pbRental656DesktopShopBtn'))el.classList.add('pb749StoreCentered')});
}
function syncPrintLayout(){
  const w=document.querySelector('.photographerMain.photographerPrintWorkspace'); if(!w)return;
  const h=w.querySelector('.unifiedRoleHeader.photographerHeaderRefined');
  const nav=w.querySelector('.photographerPrintModeNav');
  const lab=w.querySelector('.photographerPrintTopLab');
  if(mq.matches&&h&&nav&&lab){
    const edge=Math.max(h.getBoundingClientRect().bottom||0,nav.getBoundingClientRect().bottom||0,lab.getBoundingClientRect().bottom||0);
    if(edge>0&&edge<innerHeight*.82){
      w.style.setProperty('--pb749-print-content-top',`${Math.ceil(edge+8)}px`);
      const bn=w.querySelector('.photographerBottomAppNav')?.getBoundingClientRect().top||0;
      w.style.setProperty('--pb749-print-bottom',`${bn>edge&&bn<innerHeight?Math.ceil(innerHeight-bn):0}px`);
    }
  }
}
function installerGate(){
  document.querySelectorAll('.windowsAlertSimpleInstall').forEach(box=>{
    const b=[...box.querySelectorAll('button')].find(x=>txt(x).includes('دریافت نصاب برنامه'));
    if(!b)return;
    const small=box.querySelector('small');
    // The server is authoritative. Old client code may still carry a creator-only disabled flag.
    if(small&&!txt(small).includes('لینک نصب مرکزی')&&!txt(small).includes('این حساب دسترسی')){
      if(/Windows NT/i.test(navigator.userAgent)) b.disabled=false;
    }
  });
}
function albumUi(){
  document.querySelectorAll('.albumRecordAddClean').forEach(b=>{if(txt(b)==='＋ فایل'||txt(b)==='+ فایل')b.textContent='افزودن فایل'});
}
function run(){raf=0;replaceStoreLabels();centerStoreActions();albumUi();syncPrintLayout();installerGate()}
function schedule(){if(!raf)raf=requestAnimationFrame(run)}
function start(){
  const root=document.getElementById('root'); if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});
  document.addEventListener('click',()=>setTimeout(schedule,0),true);
  window.addEventListener('resize',schedule,{passive:true}); window.visualViewport?.addEventListener('resize',schedule,{passive:true}); mq.addEventListener?.('change',schedule); schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
