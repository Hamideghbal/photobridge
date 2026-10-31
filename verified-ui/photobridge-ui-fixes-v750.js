/* PhotoBridge v750 — restored album visibility + dynamic add-file label. */
(()=>{
'use strict';
let raf=0;
const txt=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
function faNumber(s){
  const m={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  const n=String(s||'').replace(/[۰-۹٠-٩]/g,ch=>m[ch]||ch).match(/\d+/);
  return n?Number(n[0]):0;
}
function activeAlbum(){
  return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumMultiProjectShell.active') ||
    document.querySelector('.photographerAlbumCreateWorkspaceMode .albumMultiProjectShell');
}
function activeCount(){
  const shell=activeAlbum();
  return faNumber(txt(shell?.querySelector('.albumRecordTitleClean small')));
}
function syncLabels(){
  if(!location.pathname.startsWith('/photographer/album/new')) return;
  const count=activeCount();
  const label=count>0?'افزودن فایل به آلبوم':'انتخاب فایل آلبوم';
  const quick=document.querySelector('.photographerAlbumCreateWorkspaceMode .albumQuickActions button:first-child');
  if(quick && txt(quick)!==label) quick.textContent=label;
  document.querySelectorAll('[role="dialog"] .modalActions button').forEach(b=>{
    const t=txt(b);
    if(t==='انتخاب فایل آلبوم'||t==='افزودن فایل به آلبوم') b.textContent=label;
  });
}
function revealRestoredFiles(){
  if(!location.pathname.startsWith('/photographer/album/new')) return;
  const shell=activeAlbum(); if(!shell || activeCount()<=0) return;
  if(shell.querySelector('.albumPrintFilesBody')) return;
  const toggle=shell.querySelector('.albumRecordChevronClean[aria-label="باز کردن کارت"]');
  if(toggle && !shell.dataset.pb750AutoOpened){
    shell.dataset.pb750AutoOpened='1';
    toggle.click();
  }
}
function sync(){raf=0;syncLabels();revealRestoredFiles()}
function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
function start(){
  const root=document.getElementById('root');
  if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','aria-label','aria-expanded']});
  document.addEventListener('click',()=>setTimeout(schedule,0),true);
  window.addEventListener('popstate',schedule);
  schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
