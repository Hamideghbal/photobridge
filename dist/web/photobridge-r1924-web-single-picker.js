/* R1924: website-only one-step photo picker parity with the lab desktop. */
(()=>{'use strict';
 if(window.pbNativeStorage||window.__pbR1924SitePicker)return;
 window.__pbR1924SitePicker=true;
 const selector='dialog.pb1137Intake';
 const css=document.createElement('style');css.textContent=
  '.pb1137Intake .pb1139Add,.pb1137Intake .pb1924RedundantAdd{display:none!important}' +
  '.pb1137Intake button[aria-label="انتخاب عکس‌ها"]{appearance:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:115px!important;max-width:100%!important;min-height:36px!important;padding:7px 13px!important;border:1px solid #1d5ec0!important;border-radius:8px!important;background:#1d5ec0!important;color:#fff!important;font-size:13px!important;font-weight:700!important;line-height:1.35!important;cursor:pointer!important;box-shadow:0 2px 5px #144b8c26!important}' +
  '.pb1137Intake button[aria-label="انتخاب عکس‌ها"]:disabled{opacity:.65!important;cursor:wait!important}';
 (document.head||document.documentElement).append(css);
 function enhance(){
  for(const dialog of document.querySelectorAll(selector)){
   // Don't change the already one-step November app-equivalent renderer.
   if(!dialog.querySelector('.pb1139Add'))continue;
   for(const button of dialog.querySelectorAll('.pb1139GroupHead button')){
    if(button.textContent.trim()==='افزودن عکس')button.classList.add('pb1924RedundantAdd');
   }
  }
 }
 const scheduleAdd=dialog=>{
  if(!dialog?.isConnected||!dialog.open||window.pbNativeStorage)return;
  const add=dialog.querySelector('.pb1139Add');
  if(add&&!add.disabled&&dialog.querySelector('form')?.dataset.busy!=='1')add.click();
 };
 // The old file-input renderer and modern File System Access renderer both
 // retain their existing validation and hashing: this only triggers Add once.
 document.addEventListener('change',event=>{
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.matches('form > input[type="file"]')||!input.files?.length)return;
  const dialog=input.closest(selector);if(dialog?.querySelector('.pb1139Add'))setTimeout(()=>scheduleAdd(dialog),0);
 });
 function wrapPicker(){
  const mover=window.pb1466IntakeMove;
  if(!mover||typeof mover.pick!=='function'||mover.pick.__pb1924SiteWrapped)return;
  const original=mover.pick;
  const wrapped=async function(...args){
   const dialog=document.querySelector(selector+'[open]');
   const armed=dialog?.dataset.pb1924SelectArmed==='1'&&!!dialog.querySelector('.pb1139Add');
   try{
    const photos=await original.apply(this,args);
    if(armed&&photos?.length)setTimeout(()=>scheduleAdd(dialog),0);
    return photos;
   }finally{if(armed)delete dialog.dataset.pb1924SelectArmed;}
  };
  wrapped.__pb1924SiteWrapped=true;mover.pick=wrapped;
 }
 // Capture precedes the original button handler. The wrapper sees the
 // selection, but never reacts to a per-group action or cancelled picker.
 document.addEventListener('click',event=>{
  const choose=event.target?.closest?.('button[aria-label="انتخاب عکس‌ها"]');
  if(!choose)return;
  const dialog=choose.closest(selector);
  if(!dialog||!dialog.querySelector('.pb1139Add'))return;
  dialog.dataset.pb1924SelectArmed='1';wrapPicker();
 },true);
 let scheduled=false;
 new MutationObserver(()=>{
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;enhance()});
 }).observe(document.body||document.documentElement,{childList:true,subtree:true});
 enhance();
})();
