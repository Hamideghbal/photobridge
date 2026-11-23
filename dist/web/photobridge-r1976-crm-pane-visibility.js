/* R1976: independent CRM/Calendar visibility inside the embedded CRM document. */
(()=>{'use strict';
 const params=new URLSearchParams(location.search);
 const portal=params.get('portal')==='lab'?'lab':'photographer';
 const name=portal==='lab'?'لابراتوار':'عکاس';
 let visibility={customers:false,calendar:false},busy=false,generation=0;
 const paneFor=view=>view==='calendar'?'calendar':'customers';
 const allowed=view=>visibility[paneFor(view)]===true;
 function update(){
  const nav=document.querySelector('#nav'),main=document.querySelector('main');
  if(!main)return;
  const enabled=visibility.customers||visibility.calendar;
  for(const node of document.querySelectorAll('#nav button[data-view]')){
   const off=!allowed(node.dataset.view);
   node.hidden=off;
   if(off)node.style.setProperty('display','none','important');else node.style.removeProperty('display');
  }
  // Never leave a disabled pane visible after a flag is changed in admin.
  const active=document.querySelector('main .view:not([hidden])');
  if(active&&!allowed(active.id)){
   const next=document.querySelector('#nav button[data-view="'+(visibility.customers?'customers':'calendar')+'"]');
   if(enabled&&next)next.click();
   else active.hidden=true;
  }
  for(const section of ['customers','calendar','events','templates']){
   const target=document.getElementById(section);if(target&&!allowed(section))target.hidden=true;
  }
  let message=main.querySelector('#pb1976CrmDisabledMessage');
  if(!enabled&&!message){
   message=document.createElement('p');message.id='pb1976CrmDisabledMessage';message.setAttribute('role','status');
   message.textContent='بخش مشتریان و تقویم برای '+name+' توسط مدیر غیرفعال است.';
   main.prepend(message);
  }
  if(message)message.hidden=enabled;
  document.documentElement.dataset.pb1976CrmReady='1';
 }
 async function load(){
  if(busy)return;
  const epoch=++generation;busy=true;
  try{
   let token='';try{token=sessionStorage.getItem('lablink_test_session')||''}catch{}
   const r=await fetch('/api/photographer/navigation-tabs',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':portal,...(token?{authorization:'Bearer '+token}:{})}});
   if(!r.ok)throw Error('unavailable');
   const d=await r.json();if(generation!==epoch)return;
   visibility={customers:d?.tabs?.customers===true,calendar:d?.tabs?.calendar===true};
  }catch{if(generation!==epoch)return;visibility={customers:false,calendar:false}}
  finally{busy=false;update()}
 }
 document.addEventListener('click',event=>{
  const b=event.target.closest?.('#nav [data-view]');
  if(b&&!allowed(b.dataset.view)){event.preventDefault();event.stopImmediatePropagation()}
 },true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void load(),{once:true});else void load();
 window.addEventListener('focus',()=>void load());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load()});
 window.addEventListener('pageshow',()=>void load());
})();
