/* R1836: one startup cover until role resolution and first-entry routing settle. */
(()=>{
 'use strict';
 const html=document.documentElement;
 let standalone=false;
 try{standalone=window===window.top&&(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches)&&matchMedia('(max-width:820px)').matches}catch{}
 if(!standalone)return;
 html.classList.add('pb1479Launching');
 let observer,timer,finished=false;
 const finish=()=>{if(finished)return;finished=true;observer?.disconnect();clearTimeout(timer);html.classList.remove('pb1479Launching')};
 const check=()=>{
  if(window.__PB1836RoleHandoff||html.classList.contains('pb1493SessionResumePending')||html.classList.contains('pb1721MobileEntryPending'))return;
  const root=document.getElementById('root');
  if(!root){finish();return}
  if(!root.childElementCount)return;
  const child=root.firstElementChild;
  if(root.childElementCount===1&&child.classList.contains('center')&&/^در حال بارگذاری/.test(child.textContent.trim()))return;
  finish();
 };
 const start=()=>{
  observer=new MutationObserver(check);
  observer.observe(html,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  timer=setTimeout(finish,15000);check();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
