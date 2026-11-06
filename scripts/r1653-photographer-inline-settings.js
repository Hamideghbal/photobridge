/* R1653: Reuse photographer desktop settings pages across visits.
 * The old controller rebuilt each iframe, booted React and fetched all data
 * on EVERY click. We keep one same-origin iframe per actual route, while the
 * existing React forms, invitations and location handlers remain unchanged.
 */
(()=>{
 'use strict';
 if(!matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches||
    new URLSearchParams(location.search).get('pbDesktopContent')==='1')return;

 const options=[
  {key:'prices',label:'تعرفه‌های لابراتوار',path:'/photographer/settings/prices'},
  {key:'location',label:'موقعیت عکاسی',path:'/photographer/settings/location'},
  {key:'invites',label:'دعوت همکار',path:'/photographer/invites'}
 ];
 const frameCache=new Map(),frameLoaded=new Set();
 let panel=null,selected='',scheduled=false,renderWatch=null,loadTimeout=null;
 const change=()=>window.dispatchEvent(new Event('pb1653-settings-selection'));

 function stopWatching(){
  renderWatch?.disconnect();renderWatch=null;
  if(loadTimeout!==null)clearTimeout(loadTimeout);
  loadTimeout=null;
 }
 function shell(){
  if(panel?.isConnected)return panel;
  panel=document.createElement('section');panel.id='pb1635SettingsPanel';
  panel.setAttribute('role','region');panel.setAttribute('aria-label','تنظیمات عکاسی');
  panel.hidden=true;
  const status=document.createElement('div');
  status.className='pb1635SettingsLoading';status.setAttribute('role','status');
  status.hidden=true;
  panel.append(status);document.body.append(panel);
  return panel;
 }
 function activeStatus(){return panel?.querySelector('.pb1635SettingsLoading')}
 function showStatus(message){
  const status=activeStatus();if(!status)return;
  status.hidden=false;status.textContent=message;
 }
 function failure(key,frame){
  if(selected!==key||panel?.hidden)return;
  const status=activeStatus();if(!status)return;
  status.replaceChildren(document.createTextNode('نمایش این بخش انجام نشد. '));
  const retry=document.createElement('button');retry.type='button';retry.textContent='تلاش دوباره';
  retry.addEventListener('click',()=>{
   frameLoaded.delete(key);showStatus('در حال بارگذاری…');
   const url=new URL(frame.src,location.origin);url.searchParams.set('pbSettingsRetry',String(Date.now()));
   frame.src=url.pathname+url.search;
  });status.append(retry);status.hidden=false;
 }
 function displayReady(key,frame){
  if(selected!==key||panel?.hidden||!frame.contentDocument?.body)return;
  let doc,href;
  try{doc=frame.contentDocument;href=frame.contentWindow.location.href}catch{return}
  const url=new URL(href);
  if(url.href==='about:blank')return;
  if(url.origin===location.origin&&/^\/photographer\/orders(?:\/|$)/.test(url.pathname)){
   url.searchParams.delete('pbDesktopContent');
   window.location.assign(url.pathname+url.search+url.hash);return;
  }
  if(url.origin!==location.origin||/^\/photographer\/(login|signup|register)(?:\/|$)/.test(url.pathname)){failure(key,frame);return}
  if(!doc.getElementById('pb1636SettingsContentStyle')){
   const style=doc.createElement('style');style.id='pb1636SettingsContentStyle';
   style.textContent='.photographerSettingsTabs,.settingsNav.photographerSettingsTabs{display:none!important}.settingsWorkspace.photographerSettings{display:block!important;width:100%!important;max-width:none!important;grid-template-columns:minmax(0,1fr)!important}.settingsWorkspace.photographerSettings>.settingsBody{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;grid-column:1/-1!important}.settingsWorkspace.photographerSettings>.settingsBody>.photographerLocationSettings,.settingsWorkspace.photographerSettings>.settingsBody>.photographerPricingSettings{width:100%!important;max-width:none!important}';
   doc.head.append(style);
  }
  stopWatching();
  const ready=()=>{
   if(selected!==key||panel?.hidden)return;
   const target=key==='location'?doc.querySelector('.photographerLocationSettings'):
    key==='prices'?doc.querySelector('.photographerPricingSettings'):
    doc.querySelector('.photographerInviteWorkspace');
   if(target){frameLoaded.add(key);activeStatus().hidden=true;stopWatching();}
  };
  renderWatch=new MutationObserver(ready);
  renderWatch.observe(doc.documentElement,{subtree:true,childList:true});
  loadTimeout=setTimeout(()=>{if(selected===key&&!activeStatus()?.hidden){stopWatching();failure(key,frame)}},16000);
  ready();
 }
 function ensureFrame(item){
  shell();let frame=frameCache.get(item.key);
  if(frame)return frame;
  frame=document.createElement('iframe');
  frame.title=item.label;frame.dataset.pb1653Settings=item.key;
  frame.setAttribute('loading','eager');frame.hidden=true;frame.style.display='none';
  frame.addEventListener('load',()=>{
   const url=frame.contentWindow?.location?.href;
   if(url==='about:blank')return;
   if(selected===item.key)displayReady(item.key,frame);
  });
  frame.addEventListener('error',()=>failure(item.key,frame));
  panel.insertBefore(frame,activeStatus());
  frameCache.set(item.key,frame);
  // Browser caches the shared JS/CSS. Never reassign src on a normal tab switch.
  frame.src=item.path+'?pbDesktopContent=1';
  return frame;
 }
 function close(){
  stopWatching();
  if(panel)panel.hidden=true;
  selected='';document.documentElement.classList.remove('pb1635SettingsOpen');
  sync();change();
 }
 function open(key){
  const item=options.find(option=>option.key===key);if(!item)return;
  if(selected===key&&panel&&!panel.hidden)return;
  stopWatching();
  const frame=ensureFrame(item);
  selected=key;
  panel.hidden=false;panel.setAttribute('aria-label',item.label);
  document.documentElement.classList.add('pb1635SettingsOpen');
  for(const [k,cached] of frameCache){
   const active=k===key;cached.hidden=!active;cached.style.display=active?'block':'none';
   cached.setAttribute('aria-hidden',active?'false':'true');
  }
  showStatus('در حال بارگذاری '+item.label+'…');
  if(frameLoaded.has(key))activeStatus().hidden=true;
  else if(frame.contentDocument?.readyState==='complete')displayReady(key,frame);
  sync();change();
 }
 function sync(){
  scheduled=false;
  const header=document.querySelector('#pb1126DesktopHeader');
  const row=header?.querySelector('.pb1126Secondary');if(!row)return;
  header.querySelectorAll('.pb1163-settings,.settingsIconBtn,.photographerSettingsHeaderBtn,button[title="تنظیمات"],button[aria-label="تنظیمات"]').forEach(el=>el.remove());
  let nav=row.querySelector('.pb1635SettingsNav');
  if(!nav){
   nav=document.createElement('nav');nav.className='pb1635SettingsNav';
   nav.setAttribute('aria-label','تنظیمات عکاسی');row.append(nav);
  }
  if(nav.children.length!==options.length||options.some((item,i)=>nav.children[i]?.dataset.settings!==item.key)){
   nav.replaceChildren();
   for(const item of options){
    const button=document.createElement('button');button.type='button';
    button.textContent=item.label;button.dataset.settings=item.key;
    button.addEventListener('click',()=>open(item.key));
    // Warm only the hovered route, avoiding three heavy page loads together.
    button.addEventListener('pointerenter',()=>{if(!navigator.connection?.saveData)ensureFrame(item)},{passive:true});
    nav.append(button);
   }
  }
  for(const button of nav.children){
   const active=button.dataset.settings===selected;
   button.classList.toggle('active',active);
   if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
 }
 document.addEventListener('click',event=>{
  if(selected&&event.target.closest('#pb1126DesktopHeader button')&&!event.target.closest('.pb1635SettingsNav'))close();
 },true);
 window.addEventListener('popstate',close);
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(sync)}});
 observer.observe(document.documentElement,{subtree:true,childList:true});
 sync();
})();
