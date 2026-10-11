/* One desktop photographer header; legacy Store/Print documents are content only. */
(()=>{
 'use strict';
 if(!matchMedia('(min-width:821px)').matches)return;
 const query=new URLSearchParams(location.search);
 if(query.get('pbDesktopContent')==='1'){document.documentElement.classList.add('pb1126Embedded');return;}
 if(!/^\/photographer(?:\/|$)/.test(location.pathname)||/^\/photographer\/(login|signup|register|invite)(?:\/|$)/.test(location.pathname)){
  if(location.pathname==='/equipment-rental/book')location.replace('/photographer/gallery?pbDesktopPanel=store&pbDesktopStoreQuery='+encodeURIComponent(location.search));
  return;
 }
 document.documentElement.classList.add('pb1126Desktop');
 const tabs=[['print','چاپ','/photographer/orders/flow?workspace=print&pbLabChooser=1'],['ai','هوش مصنوعی','/photographer/ai/retouch'],['gallery','گالری','/photographer/gallery'],['album','طراحی آلبوم','/photographer/album-design'],['instagram','اینستاگرام','/photographer/album-design?pb_mode=instagram'],['store','فروشگاه','/equipment-rental/book']];
 let settings={tabs:{ai:false,album:false,instagram:false}},chrome,selected=null,scheduled=false,authenticated=false;
 try{const saved=JSON.parse(sessionStorage.getItem('pb1126-desktop-tabs'));if(saved?.tabs)settings=saved;}catch{}
 const panels=new Map();
 const kind=()=>new URLSearchParams(location.search).get('pbDesktopPanel')||(/\/orders|\/upload|\/archive|\/finance|\/album(?:\/|$)/.test(location.pathname)?'print':location.pathname.includes('/ai/')?'ai':location.pathname.includes('/album-design')?(new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album'):'gallery');
 const nativeHeader=doc=>doc.querySelector('#photographerRoleHeaderV710,#photographerStoreRoleHeader');
 function currentDocument(){return selected?panels.get(selected)?.querySelector('iframe')?.contentDocument:document;}
 function cleanClone(original){const el=original.cloneNode(true);el.removeAttribute('id');el.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));return el;}
 function placeMainIndicator(nav){
  if(!nav||!nav.isConnected)return;
  let indicator=nav.querySelector(':scope > .pb1131MovingIndicator');
  if(!indicator){
   indicator=document.createElement('span');
   indicator.className='pb1131MovingIndicator';
   indicator.setAttribute('aria-hidden','true');
   nav.append(indicator);
  }
  const active=nav.querySelector(':scope > button.active');
  if(!active||active.getBoundingClientRect().width===0){indicator.style.opacity='0';return;}
  const base=nav.getBoundingClientRect(),rect=active.getBoundingClientRect();
  const width=Math.max(18,rect.width-14)+'px';
  const x=Math.round(rect.left-base.left+7+nav.scrollLeft)+'px';
  if(!indicator.dataset.ready)indicator.style.transition='none';
  if(indicator.style.width!==width)indicator.style.width=width;
  if(indicator.style.transform!=='translateX('+x+')')indicator.style.transform='translateX('+x+')';
  indicator.style.opacity='1';
  if(!indicator.dataset.ready){
   indicator.dataset.ready='1';
   requestAnimationFrame(()=>{if(indicator.isConnected)indicator.style.removeProperty('transition');});
  }
 }
 function render(){
  scheduled=false;if(!document.body)return;
  if(!/^\/photographer(?:\/|$)/.test(location.pathname)||/^\/photographer\/(login|signup|register|invite)(?:\/|$)/.test(location.pathname)){chrome?.parentElement.remove();chrome=null;closePanels();document.documentElement.classList.remove('pb1126Desktop');return;}
  const native=nativeHeader(currentDocument()||document)||nativeHeader(document);if(!native)return;
  if(!chrome){
   const host=document.createElement('div');host.id='pb1126ChromeHost';
   chrome=document.createElement('header');chrome.id='pb1126DesktopHeader';chrome.className='photographerHeaderRefined';chrome.setAttribute('aria-label','دسترسی‌های عکاس');
   chrome.innerHTML='<div class="photographerHeaderIdentity"></div><nav class="photographerHeaderNav pb1126MainNav"></nav><div class="pb1124PrimaryActions"><button type="button" class="pb1124Wallet">کیف پول</button><button type="button" class="pb1124Exit">خروج</button></div><div class="pb1126Secondary"></div>';
   host.append(chrome);document.body.append(host);
   chrome.querySelector('.pb1124Wallet').onclick=()=>nativeHeader(document)?.querySelector('.headerWalletBadge,.mobileHeaderWallet')?.click();
   chrome.querySelector('.pb1124Exit').onclick=()=>nativeHeader(document)?.querySelector('.headerLogoutBtn,.mobileHeaderPower')?.click();
  }
  const identity=(nativeHeader(document)||native).querySelector('.photographerHeaderIdentity');
  if(identity){const target=chrome.querySelector('.photographerHeaderIdentity');const signature=identity.innerHTML;if(target.dataset.source!==signature){const copy=cleanClone(identity);copy.querySelectorAll('#pbR100F25AvatarBtn,.pbF25AvatarBtn').forEach(el=>el.remove());target.replaceChildren(...copy.childNodes);target.dataset.source=signature;}}
  const nav=chrome.querySelector('.pb1126MainNav'),active=selected||kind();
  for(const [key,label,href] of tabs){
   let button=nav.querySelector('[data-pb1126-kind="'+key+'"]');
   if(['ai','album','instagram'].includes(key)&&settings.tabs[key]===false){button?.remove();continue;}
   if(!button){button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.pb1126Kind=key;button.dataset.mainHref=href;nav.append(button);}
   button.classList.toggle('active',active===key);if(active===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  // Preserve ordering if settings enable a previously removed tab.
  const ordered=tabs.map(([key])=>nav.querySelector('[data-pb1126-kind="'+key+'"]')).filter(Boolean);if(ordered.some((b,i)=>b!==nav.children[i]))nav.replaceChildren(...ordered);
  requestAnimationFrame(()=>placeMainIndicator(nav));
  const wallet=nativeHeader(document)?.querySelector('.headerWalletBadge,.mobileHeaderWallet');
  if(wallet){const label='کیف پول · '+wallet.textContent.trim().replace(/^اعتبار\s*|^کیف پول\s*/,'');const b=chrome.querySelector('.pb1124Wallet');if(b.textContent!==label)b.textContent=label;}
  const row=chrome.querySelector('.pb1126Secondary'),doc=currentDocument();
  const choosing=active==='store'?(!doc?.querySelector('#photographerStoreRoleHeader')||doc.body?.classList.contains('pbR96ChoosingStore')):active==='print'?(!!doc?.querySelector('#pbR99LabChooser')||doc?.body?.classList.contains('pbR100F14ChoosingLab')||doc?.documentElement?.classList.contains('pbR100F14LabChooserBoot')||(!doc?.querySelector('.photographerPrintModeNav')&&selected==='print')):false;
  document.documentElement.classList.toggle('pb1127Choosing',choosing);
  chrome.classList.toggle('pb1127Choosing',choosing);
  row.hidden=choosing;
  const sources=choosing?[]:active==='store'?[...native.querySelectorAll('#pbR1123StoreDesktopNav>button')]:active==='print'?[...native.querySelectorAll('.photographerPrintModeNav>button,.photographerPrintModeUtilityCluster button')]:[...native.querySelectorAll('.roleHeaderToolButtons>button:not(.headerWalletBadge):not(.headerLogoutBtn)')];
  const visible=sources.filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&!el.classList.contains('photographerPrintModeBack'));
  const signature=active+'|'+choosing+'|'+visible.map(el=>el.outerHTML).join('');
  if(row.dataset.source!==signature){
   row.replaceChildren();row.classList.toggle('pb1127PrintRow',active==='print');
   let modes,utilities;
   if(active==='print'&&!choosing){modes=document.createElement('div');modes.className='pb1127PrintModes';utilities=document.createElement('div');utilities.className='pb1127PrintUtilities';row.append(modes,utilities);}
   for(const original of visible){
    const copy=cleanClone(original);copy.style.removeProperty('display');
    copy.onclick=()=>{press(copy);original.click();const content=doc.querySelector('.rentalPanel.mobileActive,.photographerPrintWorkspace');reveal(content);};
    if(active==='store'){const labels={equipmentPanel:'اجاره تجهیزات',salesPanel:'خرید تجهیزات',bookingsPanel:'آفیش‌های من',financePanel:'مالی'};if(labels[copy.dataset.storePanel])copy.textContent=labels[copy.dataset.storePanel];}
    if(copy.classList.contains('archive'))copy.textContent='آرشیو';
    if(copy.classList.contains('finance')){copy.textContent='مالی';copy.setAttribute('aria-label','مالی');}
    if(utilities&&original.closest('.photographerPrintModeUtilityCluster'))utilities.append(copy);else (modes||row).append(copy);
   }
   if(utilities){for(const cls of ['finance','archive']){const b=utilities.querySelector('.'+cls);if(b)utilities.append(b);}}
   row.dataset.source=signature;
  }
 }
 function press(el){if(!matchMedia('(prefers-reduced-motion:reduce)').matches)el?.animate([{transform:'scale(1)'},{transform:'scale(.94)',filter:'brightness(.97)'},{transform:'scale(1)',filter:'none'}],{duration:200,easing:'ease-out'});}
 function reveal(el){if(!matchMedia('(prefers-reduced-motion:reduce)').matches)el?.animate([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});}

 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
 function closePanels(){for(const p of panels.values())p.hidden=true;selected=null;document.documentElement.classList.remove('pb1126PanelOpen');}
 function open(key,push=true){
  if(selected===key)return;
  let panel=panels.get(key);if(!panel){
   panel=document.createElement('section');panel.className='pb1126ContentPanel';panel.dataset.panel=key;
   const loading=document.createElement('div');loading.className='pb1126Loading';loading.textContent='در حال دریافت…';loading.setAttribute('role','status');
   const frame=document.createElement('iframe');frame.title=key==='store'?'فروشگاه':'چاپ';
   frame.addEventListener('load',()=>{try{const u=new URL(frame.contentWindow.location.href);if(u.href==='about:blank')return;if(u.origin!==location.origin||!/^\/(equipment-rental|photographer)(\/|$)/.test(u.pathname)||/^\/photographer\/(login|signup|register)/.test(u.pathname)){location.assign(u.href);return;}loading.hidden=true;schedule();new MutationObserver(schedule).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});}catch{}});
   panel.append(frame,loading);document.body.append(panel);panels.set(key,panel);
   const q=new URLSearchParams(key==='store'?query.get('pbDesktopStoreQuery')||'':'workspace=print&pbLabChooser=1');q.set('pbDesktopContent','1');frame.src=(key==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;
  }
  closePanels();panel.hidden=false;selected=key;document.documentElement.classList.add('pb1126PanelOpen');
  if(push){const u=new URL(location.href);u.searchParams.set('pbDesktopPanel',key);history.pushState({pb1126Panel:key},'',u);}
  render();reveal(panel.querySelector('iframe'));
 }
 function navigate(key){if(key==='store'||key==='print'){open(key);return;}closePanels();const tab=tabs.find(x=>x[0]===key);if(!tab)return;history.pushState(null,'',tab[2]);window.dispatchEvent(new PopStateEvent('popstate'));render();reveal(document.querySelector('#root .photographerMain'));}
 // Register before legacy full-document navigation handlers.
 window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();press(b);navigate(b.dataset.pb1126Kind);},true);
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('popstate',()=>{const panel=new URLSearchParams(location.search).get('pbDesktopPanel');if(['store','print'].includes(panel))open(panel,false);else{closePanels();schedule();}});
 window.addEventListener('photobridge-navigation-tabs',e=>{if(e.detail?.tabs){settings=e.detail;try{sessionStorage.setItem('pb1126-desktop-tabs',JSON.stringify(settings));}catch{}schedule();}});
 window.addEventListener('photobridge-auth-session-changed',e=>{if(e.detail?.labRole==='customer'){authenticated=true;return;}if(!authenticated)return;authenticated=false;try{sessionStorage.removeItem('pb1126-desktop-tabs');}catch{}closePanels();for(const p of panels.values())p.remove();panels.clear();schedule();});
 function start(){render();const panel=query.get('pbDesktopPanel');if(['store','print'].includes(panel))open(panel,false);new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
