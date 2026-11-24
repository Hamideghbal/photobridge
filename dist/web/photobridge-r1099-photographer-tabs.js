/* Photographer tab controls; the admin bypass comes from the authenticated server response. */
(()=>{
'use strict';
const keys=['ai','album','instagram','customers','calendar','labCustomers','labCalendar'],labels={ai:'هوش مصنوعی',album:'طراحی آلبوم',instagram:'اینستاگرام',customers:'مشتریان عکاس',calendar:'تقویم مشتریان عکاس',labCustomers:'مشتریان لابراتوار',labCalendar:'تقویم مشتریان لابراتوار'};
let settings=null,scheduled=false,inFlight=false,loadedPath=null,redirecting=false,sessionEpoch=0;
const previousDisplay=new WeakMap();
// Release the initial mobile dock only after both server-controlled tab sets
// have been applied to the same canonical dock. No intermediate 5→8 buttons.
let dockRevealTimer=0;
function releaseStableDock(){
 if(!photographer()||!matchMedia('(max-width:820px)').matches)return;
 if(!window.pbR1877FeatureNavReady||!window.pbR1877CrmNavReady)return;
 if(!document.documentElement.classList.contains('pbR1877DockPending'))return;
 if(dockRevealTimer)clearTimeout(dockRevealTimer);
 // Allow the last React/CRM navigation mutation to settle before first paint.
 dockRevealTimer=setTimeout(()=>requestAnimationFrame(()=>{
  dockRevealTimer=0;
  if(!window.pbR1877FeatureNavReady||!window.pbR1877CrmNavReady)return;
  apply();
  document.documentElement.classList.remove('pbR1877DockPending');
  document.documentElement.classList.add('pbR1877DockReady');
 }),170);
}
window.addEventListener('pb-r1877-crm-ready',releaseStableDock);
const admin=()=>location.pathname.startsWith('/admin');
const photographer=()=>location.pathname.startsWith('/photographer')||location.pathname==='/equipment-rental/book';
async function api(path,options={}){
 const portal=admin()?'admin':'photographer';
 let token='';try{token=sessionStorage.getItem('lablink_test_session')||''}catch{}
 const r=await fetch(path,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json','x-photobridge-portal':portal,...(token?{authorization:'Bearer '+token}:{}),...options.headers}});
 const d=await r.json();if(!r.ok)throw Error(d.error||'request_failed');return d;
}
function feature(el){
 const text=(el.getAttribute('aria-label')||el.textContent||'').trim();
 const href=el.getAttribute('href')||el.dataset.mainHref||'';
 if(el.querySelector('.photographerBottomNavIcon.instagram')||/اینستاگرام/.test(text)||/pb_mode=instagram|instagram-post-design/.test(href))return 'instagram';
 if(el.querySelector('.photographerBottomNavIcon.ai')||/هوش مصنوعی/.test(text)||href.startsWith('/photographer/ai'))return 'ai';
 if(/طراحی آلبوم/.test(text)||href.startsWith('/photographer/album-design'))return 'album';
 // R1977: apply disabled CRM/Calendar flags to native and injected menus alike.
 if(el.dataset.pbCrmPane==='calendar'||el.dataset.pb1126Kind==='calendar'||/تقویم مشتریان/.test(text)||/[?&]view=calendar(?:&|$)/.test(href))return 'calendar';
 if(el.dataset.pbCrmPane==='customers'||el.dataset.pb1126Kind==='crm'||/^مشتریان(?: عکاس)?$/.test(text)||/\/customer-crm\.html/.test(href))return 'customers';
 return null;
}
function currentFeature(){
 if(new URLSearchParams(location.search).has('pbStorePanel'))return null;
 if(location.pathname.startsWith('/photographer/ai'))return 'ai';
 if(location.pathname.startsWith('/photographer/album-design'))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
 if(location.pathname.startsWith('/instagram-post-design'))return 'instagram';
 return null;
}
function apply(){
 if(!settings||!photographer())return;
 document.documentElement.dataset.pb1976PhotographerCustomers=settings.tabs.customers===false?'off':'on';
 document.documentElement.dataset.pb1976PhotographerCalendar=settings.tabs.calendar===false?'off':'on';
 if(matchMedia('(max-width:820px)').matches){const docks=[...document.querySelectorAll('.photographerBottomAppNav')],current=[...docks].reverse().find(el=>el.closest('#root'))||docks.at(-1);for(const el of docks){if(el===current){if(el.hasAttribute('data-pb1318-stale'))el.removeAttribute('data-pb1318-stale');}else if(!el.hasAttribute('data-pb1318-stale'))el.setAttribute('data-pb1318-stale','1');}}
 for(const el of document.querySelectorAll('.photographerHeaderNav button,.photographerHeaderNav a,.photographerHomeModeNav button,.photographerHomeModeNav a,.photographerBottomAppNav button,.photographerBottomAppNav a,#pbHomeMobileMenu button,#pbHomeMobileMenu a')){
  const key=feature(el);if(!key)continue;
  if(settings.tabs[key]===false){
   if(el.dataset.pb1099Hidden!=='1'){previousDisplay.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});el.dataset.pb1099Hidden='1'}
   // Legacy role-header CSS uses !important, so its button display rules must not restore disabled tabs.
   if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
  }else if(el.dataset.pb1099Hidden){
   delete el.dataset.pb1099Hidden;const previous=previousDisplay.get(el);
   if(previous?.value)el.style.setProperty('display',previous.value,previous.priority);else el.style.removeProperty('display');previousDisplay.delete(el);
  }
 }
 for(const grid of document.querySelectorAll('.photographerBottomAppNavGrid')){
  if(grid.dataset.pb1099Grid!=='1')grid.dataset.pb1099Grid='1';
  const count=[...grid.children].filter(el=>el.dataset.pb1099Hidden!=='1'&&!el.hidden&&getComputedStyle(el).display!=='none').length;
  if(count&&grid.style.getPropertyValue('--pb1099-tabs')!==String(count))grid.style.setProperty('--pb1099-tabs',String(count));
 }
 // Keep the Print tab visually centered in the main top menu for connected labs.
 if(settings.connectedLab===true){
  for(const nav of document.querySelectorAll('.photographerHeaderNav,.photographerHomeModeNav,#pb1126DesktopHeader .pb1126MainNav')){
   const elements=[...nav.children].filter(el=>el.matches('button,a'));
   const print=elements.find(el=>el.dataset.pb1126Kind==='print'||/چاپ عکس|^چاپ$/.test((el.textContent||'').trim()));
   if(!print)continue;
   const rest=elements.filter(el=>el!==print);
   rest.forEach((el,i)=>{if(el.style.order!==String(i))el.style.order=String(i)});
   const mid=Math.floor(rest.length/2);
   if(print.style.order!==String(mid))print.style.order=String(mid);
  }
 }
 const active=currentFeature();if(active&&settings.tabs[active]===false&&!redirecting){redirecting=true;location.replace('/photographer/gallery')}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();mountAdmin();if(photographer()&&loadedPath!==location.pathname)void load()})}
function installStyle(){
 if(document.querySelector('#pb1099TabsStyle'))return;
 const style=document.createElement('style');style.id='pb1099TabsStyle';
 style.textContent='@media(max-width:820px){html body .photographerBottomAppNav[data-pb1318-stale]{display:none!important}body.pbAuthenticatedPhotographerPortal :is(.pbHomeMobileAccountBar,.adminBottomAppNav,.labBottomAppNav){display:none!important}}[data-pb1099-hidden="1"]{display:none!important}html body #photographerStoreBottomNav .photographerBottomAppNavGrid[data-pb1099-grid],html body .photographerBottomAppNav .photographerBottomAppNavGrid[data-pb1099-grid]{grid-template-columns:repeat(var(--pb1099-tabs,6),minmax(0,1fr))!important}.pb1099TabsDialog{border:1px solid #dce3f0;border-radius:20px;padding:22px;width:min(430px,calc(100vw - 40px));font-family:inherit;direction:rtl;color:#24334d;background:#fff}.pb1099TabsDialog::backdrop{background:#16234088}.pb1099TabsDialog h3{margin:0 0 10px}.pb1099TabsDialog p{font-size:13px;line-height:1.8}.pb1099TabsDialog label{display:flex;gap:12px;align-items:center;padding:12px 0;font-size:16px}.pb1099TabsDialog input{width:20px;height:20px;accent-color:#315cff}.pb1099TabsActions{display:flex;gap:10px;margin-top:16px}.pb1099TabsActions button{font:inherit;padding:10px 18px;border:1px solid #dce3f0;border-radius:10px;cursor:pointer;background:#fff}.pb1099TabsActions button[type=submit]{background:#315cff;color:#fff}.pb1099TabsMessage{min-height:22px;color:#b42318}';
 style.textContent+='@media(min-width:821px){#pb1126DesktopHeader .pb1126MainNav{display:flex!important}#pb1126DesktopHeader .pb1126MainNav [data-pb1126-kind=print]{flex-shrink:0}}';
 document.head.append(style);
}
function mountAdmin(){
 if(!admin())return;
 const nav=document.querySelector('.adminTabsUnified,.adminTabs');if(!nav||nav.querySelector('[data-pb1099-open]'))return;
 const button=document.createElement('button');button.type='button';button.dataset.pb1099Open='1';button.textContent='تب‌های عکاس';button.addEventListener('click',openAdmin);nav.append(button);
}
async function openAdmin(){
 let dialog=document.querySelector('#pb1099TabsDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='pb1099TabsDialog';dialog.className='pb1099TabsDialog';dialog.innerHTML='<form><h3>تب‌های عکاس</h3><p>هر تب را جداگانه فعال یا غیرفعال کنید. مشتریان و تقویم را برای عکاس و لابراتوار جداگانه فعال یا غیرفعال کنید. هر گزینه مستقل است.</p>'+keys.map(key=>'<label><input type="checkbox" name="'+key+'">'+labels[key]+'</label>').join('')+'<p class="pb1099TabsMessage" role="status"></p><div class="pb1099TabsActions"><button type="submit">ذخیره</button><button type="button" data-close>بستن</button></div></form>';document.body.append(dialog);
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const save=dialog.querySelector('[type=submit]'),msg=dialog.querySelector('[role=status]');save.disabled=true;try{await api('/api/admin/photographer-tabs',{method:'PUT',body:JSON.stringify({tabs:Object.fromEntries(keys.map(key=>[key,dialog.querySelector('[name='+key+']').checked]))})});msg.textContent='تنظیمات ذخیره شد.'}catch{msg.textContent='ذخیره انجام نشد؛ دوباره تلاش کنید.'}finally{save.disabled=false}});
 }
 dialog.querySelector('[role=status]').textContent='در حال دریافت تنظیمات…';dialog.querySelector('[type=submit]').disabled=true;dialog.showModal();
 try{const d=await api('/api/admin/photographer-tabs');for(const key of keys)dialog.querySelector('[name='+key+']').checked=d.tabs[key]!==false;dialog.querySelector('[role=status]').textContent='';dialog.querySelector('[type=submit]').disabled=false}catch{dialog.querySelector('[role=status]').textContent='دریافت تنظیمات انجام نشد.'}
}
async function load(){
 if(!photographer()||inFlight)return;const epoch=sessionEpoch;inFlight=true;loadedPath=location.pathname;
 try{const next=await api('/api/photographer/navigation-tabs');if(epoch!==sessionEpoch)return;settings=next;
  // R1977: land in the native Print orders workspace, preserving its status
  // header, send-photos action and existing orders. Do not force the standalone
  // new-upload chooser over the order board on login.
  // R1995: once the connected photographer has visited native Orders, later
  // intentional Gallery navigation must NOT bounce back to Orders/Lab.
  if(next.connectedLab===true&&/^\/photographer\/(?:orders|upload|archive|finance)(?:\/|$)/.test(location.pathname)){
   try{sessionStorage.setItem('pb1976PrintLanding','1')}catch{}
  }
  if(next.connectedLab===true&&/^\/photographer(?:\/gallery)?\/?$/.test(location.pathname)&&!['pbDesktopPanel','pbCrmTab','pbStorePanel','pbDesktopContent','view'].some(key=>new URLSearchParams(location.search).has(key))){
   let seen=false;try{seen=sessionStorage.getItem('pb1976PrintLanding')==='1';if(!seen)sessionStorage.setItem('pb1976PrintLanding','1')}catch{}
   if(!seen){location.replace('/photographer/orders');return;}
  }
  if(matchMedia('(min-width:821px)').matches)window.dispatchEvent(new CustomEvent('photobridge-navigation-tabs',{detail:settings}));apply();delete document.documentElement.dataset.pb1106TabsPending}catch{}finally{if(epoch===sessionEpoch){inFlight=false;window.pbR1877FeatureNavReady=true;releaseStableDock()}}
}
function init(){installStyle();mountAdmin();void load();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-label','href']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('popstate',()=>{apply();void load()});window.addEventListener('focus',()=>void load());
window.addEventListener('photobridge-auth-session-changed',event=>{if(event.detail?.labRole!=='customer')try{sessionStorage.removeItem('pb1976PrintLanding')}catch{}sessionEpoch++;settings=null;loadedPath=null;redirecting=false;inFlight=false;window.pbR1877FeatureNavReady=false;window.pbR1877CrmNavReady=false;document.documentElement.classList.remove('pbR1877DockReady');document.documentElement.classList.add('pbR1877DockPending');document.documentElement.dataset.pb1106TabsPending='1';void load();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load()});
document.addEventListener('click',e=>{if(!settings||!photographer())return;const el=e.target.closest('button,a'),key=el&&feature(el);if(key&&settings.tabs[key]===false){e.preventDefault();e.stopImmediatePropagation()}},true);
})();
