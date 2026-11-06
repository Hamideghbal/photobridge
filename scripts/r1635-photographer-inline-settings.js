/* R1636: desktop photographer settings are real in-page workspaces, never modals. */
(()=>{
 'use strict';
 if(!matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches||
    new URLSearchParams(location.search).get('pbDesktopContent')==='1')return;

 // These are existing photographer routes with their own React data and handlers.
 const options=[
  {key:'prices',label:'تعرفه‌های لابراتوار',path:'/photographer/settings/prices'},
  {key:'location',label:'موقعیت عکاسی',path:'/photographer/settings/location'},
  {key:'invites',label:'دعوت همکار',path:'/photographer/invites'}
 ];
 let panel=null,selected='',scheduled=false,renderWatch=null,loadTimeout=null;

 function stopWatching(){
  renderWatch?.disconnect();renderWatch=null;
  if(loadTimeout!==null)clearTimeout(loadTimeout);
  loadTimeout=null;
 }
 function close(){
  stopWatching();
  panel?.remove();panel=null;selected='';
  document.documentElement.classList.remove('pb1635SettingsOpen');
  sync();
 }
 function open(key){
  const item=options.find(option=>option.key===key);
  if(!item)return;
  if(selected===key&&panel?.isConnected)return;
  stopWatching();panel?.remove();selected=key;
  panel=document.createElement('section');
  panel.id='pb1635SettingsPanel';
  panel.setAttribute('role','region');
  panel.setAttribute('aria-label',item.label);
  const status=document.createElement('div');
  status.className='pb1635SettingsLoading';
  status.setAttribute('role','status');
  status.textContent='در حال بارگذاری '+item.label+'…';
  const frame=document.createElement('iframe');
  frame.title=item.label;
  frame.setAttribute('loading','eager');
  const fail=()=>{
   if(!panel?.isConnected||selected!==key)return;
   status.replaceChildren(document.createTextNode('نمایش این بخش انجام نشد. '));
   const retry=document.createElement('button');retry.type='button';retry.textContent='تلاش دوباره';
   retry.addEventListener('click',()=>{status.textContent='در حال بارگذاری '+item.label+'…';frame.src=item.path+'?pbDesktopContent=1';});
   status.append(retry);status.hidden=false;
  };
  frame.addEventListener('load',()=>{
   if(!panel?.isConnected||selected!==key)return;
   let url,doc;
   try{url=new URL(frame.contentWindow.location.href);doc=frame.contentDocument;}catch{fail();return;}
   if(url.href==='about:blank')return;
   // Selecting a lab in the real lab chooser navigates to the print workspace.
   // Promote that navigation to the desktop host rather than nesting an order page.
   if(url.origin===location.origin&&/^\/photographer\/orders(?:\/|$)/.test(url.pathname)){
    url.searchParams.delete('pbDesktopContent');
    window.location.assign(url.pathname+url.search+url.hash);return;
   }
   if(url.origin!==location.origin||/^\/photographer\/(login|signup|register)(?:\/|$)/.test(url.pathname)){
    fail();return;
   }
   if(!doc?.body){fail();return;}
   // Keep existing forms/React handlers intact; hide only redundant inner navigation.
   if(!doc.getElementById('pb1636SettingsContentStyle')){
    const style=doc.createElement('style');style.id='pb1636SettingsContentStyle';
    style.textContent='.photographerSettingsTabs,.settingsNav.photographerSettingsTabs{display:none!important}.settingsWorkspace.photographerSettings{display:block!important;width:100%!important;max-width:none!important;grid-template-columns:minmax(0,1fr)!important}.settingsWorkspace.photographerSettings>.settingsBody{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;grid-column:1/-1!important}.settingsWorkspace.photographerSettings>.settingsBody>.photographerLocationSettings,.settingsWorkspace.photographerSettings>.settingsBody>.photographerPricingSettings{width:100%!important;max-width:none!important}';
    doc.head.append(style);
   }
   stopWatching();
   const ready=()=>{
    if(!panel?.isConnected||selected!==key)return;
    const target=key==='location'?doc.querySelector('.photographerLocationSettings'):
     key==='prices'?doc.querySelector('.photographerPricingSettings'):
     doc.querySelector('.photographerInviteWorkspace');
    if(target){status.hidden=true;stopWatching();}
   };
   renderWatch=new MutationObserver(ready);
   renderWatch.observe(doc.documentElement,{subtree:true,childList:true});
   loadTimeout=setTimeout(()=>{if(!status.hidden){stopWatching();fail();}},16000);
   ready();
  });
  frame.addEventListener('error',fail);
  panel.append(frame,status);
  document.body.append(panel);
  document.documentElement.classList.add('pb1635SettingsOpen');
  frame.src=item.path+'?pbDesktopContent=1';
  sync();
 }
 function sync(){
  scheduled=false;
  const header=document.querySelector('#pb1126DesktopHeader');
  const row=header?.querySelector('.pb1126Secondary');
  if(!row)return;
  header.querySelectorAll('.pb1163-settings,.settingsIconBtn,.photographerSettingsHeaderBtn,button[title="تنظیمات"],button[aria-label="تنظیمات"]').forEach(el=>el.remove());
  let nav=row.querySelector('.pb1635SettingsNav');
  if(!nav){
   nav=document.createElement('nav');nav.className='pb1635SettingsNav';
   nav.setAttribute('aria-label','تنظیمات عکاسی');
   row.append(nav);
  }
  if(nav.children.length!==options.length||options.some((item,i)=>nav.children[i]?.dataset.settings!==item.key)){
   nav.replaceChildren();
   for(const item of options){
    const button=document.createElement('button');
    button.type='button';button.textContent=item.label;button.dataset.settings=item.key;
    button.addEventListener('click',()=>open(item.key));
    nav.append(button);
   }
  }
  for(const button of nav.children){
   const active=button.dataset.settings===selected;
   button.classList.toggle('active',active);
   if(active)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  }
 }
 document.addEventListener('click',event=>{
  if(panel&&event.target.closest('#pb1126DesktopHeader button')&&!event.target.closest('.pb1635SettingsNav'))close();
 },true);
 window.addEventListener('popstate',close);
 const observer=new MutationObserver(()=>{
  if(!scheduled){scheduled=true;requestAnimationFrame(sync);}
 });
 observer.observe(document.documentElement,{subtree:true,childList:true});
 sync();
})();
