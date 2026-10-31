/* PhotoBridge v741 — inline print actions fix */
(()=>{
'use strict';
const BOX='pb741-inline-print-actions';
const mq=window.matchMedia('(max-width: 820px)');
const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
function pilot(){return document.querySelector('.photographerMain.simplePrintPilotWorkspaceMode .simplePrintPilot');}
function addBtn(p){return p?.querySelector('button.simplePrintPilotPrimaryAdd');}
function sendBtn(p){return p?.querySelector('button.simplePrintPilotQuoteSubmit,button.simplePrintPilotHeaderSubmit');}
function mount(){
 if(!mq.matches){document.getElementById(BOX)?.remove();return;}
 const p=pilot(); if(!p)return;
 let box=document.getElementById(BOX);
 if(!box){
  box=document.createElement('div'); box.id=BOX;
  box.innerHTML='<button class="pb741-add">＋ انتخاب سایز و عکس</button><button class="pb741-send">ارسال برای چاپ</button>';
  const header=p.querySelector('.simplePrintPilotHeader,.simplePrintPilotTabs,.simplePrintPilotTop');
  (header||p).after(box);
  box.querySelector('.pb741-add').onclick=()=>addBtn(p)?.click();
  box.querySelector('.pb741-send').onclick=()=>sendBtn(p)?.click();
 }
 const a=box.querySelector('.pb741-add'),s=box.querySelector('.pb741-send');
 const realSend=sendBtn(p);
 a.disabled=!!addBtn(p)?.disabled;
 s.disabled=!!realSend?.disabled;
 s.textContent=text(realSend)||'ارسال برای چاپ';
}
new MutationObserver(()=>requestAnimationFrame(mount)).observe(document.documentElement,{subtree:true,childList:true,attributes:true});
mq.addEventListener?.('change',mount); mount();
})();
