/* R1976: honor separate CRM/Calendar settings inside embedded and direct CRM pages. */
(()=>{'use strict';
 const query=new URLSearchParams(location.search),portal=query.get('portal')==='lab'?'lab':'photographer';
 let allowed=null,loading=false;
 function restrict(){
  if(!allowed)return;
  const customers=allowed.customers===true,calendar=allowed.calendar===true;
  document.documentElement.classList.toggle('pb1976CustomersOff',!customers);
  document.documentElement.classList.toggle('pb1976CalendarOff',!calendar);
  const nav=document.querySelector('#nav');
  for(const [pane,enabled] of [['customers',customers],['calendar',calendar]]){
   const button=nav?.querySelector('button[data-view="'+pane+'"]');
   if(button){button.hidden=!enabled;button.disabled=!enabled;button.setAttribute('aria-hidden',enabled?'false':'true');}
  }
  if(!customers&&!calendar){
   document.querySelector('main')?.setAttribute('aria-hidden','true');document.querySelector('main')?.setAttribute('hidden','');
   let note=document.querySelector('#pb1976NoCrm');
   if(!note){note=document.createElement('p');note.id='pb1976NoCrm';note.setAttribute('role','status');note.textContent='دسترسی به مشتریان و تقویم توسط مدیر غیرفعال شده است.';document.body.prepend(note);}
   return;
  }
  document.querySelector('#pb1976NoCrm')?.remove();
  document.querySelector('main')?.removeAttribute('aria-hidden');document.querySelector('main')?.removeAttribute('hidden');
  const visible=document.querySelector('#calendar:not([hidden])')?'calendar':'customers';
  if(!allowed[visible]){
   const fallback=customers?'customers':'calendar';
   const button=nav?.querySelector('button[data-view="'+fallback+'"]');
   if(button&&!button.disabled)button.click();
  }
 }
 async function refresh(){
  if(loading)return;loading=true;
  try{
   let token='';try{token=sessionStorage.getItem('lablink_test_session')||''}catch{}
   const r=await fetch('/api/photographer/navigation-tabs',{cache:'no-store',credentials:'include',headers:{'x-photobridge-portal':portal,...(token?{authorization:'Bearer '+token}:{})}});
   if(!r.ok)throw Error('not_authorized');
   const data=await r.json();allowed={customers:data.tabs?.customers===true,calendar:data.tabs?.calendar===true};
  }catch{allowed={customers:false,calendar:false}}finally{loading=false;restrict()}
 }
 const css=document.createElement('style');
 css.textContent='html.pb1976CustomersOff #nav button[data-view=customers],html.pb1976CustomersOff #customers,html.pb1976CalendarOff #nav button[data-view=calendar],html.pb1976CalendarOff #calendar{display:none!important}#pb1976NoCrm{direction:rtl;text-align:center;font:16px Tahoma;padding:28px;color:#344054}';
 document.head.append(css);
 document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button[data-view]');if(b&&allowed&&allowed[b.dataset.view]===false){e.preventDefault();e.stopImmediatePropagation()}},true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else void refresh();
 window.addEventListener('focus',refresh);
})();
