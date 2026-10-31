/* v742: independent controls delegate to React buttons; no React node is moved. */
(()=>{
 'use strict';
 const ID='pb742-print-actions', mq=matchMedia('(max-width:820px)');
 let scheduled=false;
 const pilot=()=>document.querySelector('.photographerMain.simplePrintPilotWorkspaceMode .simplePrintPilot:not(.simplePrintPilotDone)');
 const realAdd=p=>p?.querySelector('button.simplePrintPilotPrimaryAdd');
 const realSend=p=>p?.querySelector('button.simplePrintPilotQuoteSubmit');
 function update(){
  scheduled=false;
  const p=mq.matches&&pilot(), old=document.getElementById(ID);
  if(!p){old?.remove();return;}
  p.classList.add('pb737MobilePrintRedesign');
  let bar=old;
  if(!bar){
   bar=document.createElement('div');bar.id=ID;bar.setAttribute('aria-label','اقدام‌های چاپ عکس');
   bar.innerHTML='<button type="button" class="pb742-add">＋ انتخاب سایز و عکس</button><button type="button" class="pb742-send">ارسال فایل چاپ</button>';
   document.body.append(bar);
   bar.querySelector('.pb742-add').addEventListener('click',()=>{const b=realAdd(pilot());if(b&&!b.disabled)b.click()});
   bar.querySelector('.pb742-send').addEventListener('click',()=>{const b=realSend(pilot());if(b&&!b.disabled)b.click()});
  }
  const workspace=p.closest('.photographerMain');
  const header=workspace?.querySelector('.unifiedRoleHeader.photographerHeaderRefined');
  const tabs=workspace?.querySelector('.photographerPrintModeNav');
  const lab=workspace?.querySelector('.photographerPrintTopLab');
  const lowerEdge=Math.max(0,...[header,tabs,lab].map(n=>n?.getBoundingClientRect().bottom||0).filter(n=>n>0&&n<innerHeight*.85));
  const top=Math.round(lowerEdge+6);
  const nav=workspace?.querySelector('.photographerBottomAppNav');
  const navTop=nav?.getBoundingClientRect().top;
  const navBottom=navTop>0&&navTop<innerHeight?Math.ceil(innerHeight-navTop):0;
  const available=Math.max(0,innerHeight-navBottom-top);
  // Keep the controls and a usable scroll region on short landscape viewports.
  bar.style.setProperty('--pb742-actions-top',`${top}px`);
  workspace.style.setProperty('--pb742-content-top',`${top+64}px`);
  workspace.style.setProperty('--pb742-nav-bottom',`${available<120?0:navBottom}px`);
  const a=realAdd(p),s=realSend(p);
  bar.querySelector('.pb742-add').disabled=!a||a.disabled;
  const send=bar.querySelector('.pb742-send');send.disabled=!s||s.disabled;
  const label=(s?.textContent||'').replace(/\s+/g,' ').trim()||'ارسال فایل چاپ';
  if(send.textContent!==label)send.textContent=label;
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
 function start(){
  new MutationObserver(schedule).observe(document.getElementById('root'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});
  mq.addEventListener?.('change',schedule);window.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('click',()=>setTimeout(schedule,0),true);schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
