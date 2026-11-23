/* CRM is content inside the authenticated portal, sharing its header and navigation. */
(()=>{
 'use strict';
 if(window.self!==window.top||window.pbCrmOpen)return;
 const REV='r1875-mobile-header-layout';
 let host=null,frame=null,owner=null,pending=false,frameUrl=null,lastHeaderBottom=0;
 const notifyHeader=()=>window.dispatchEvent(new Event('pb-crm-header-change'));
 window.pbCrmHeaderAction=(action)=>{
  const doc=frame?.contentDocument;if(!doc)return;
  const target=action==='book'?doc.querySelector('#cal-create'):doc.querySelector('#nav button[data-view="'+action+'"]');
  if(target&&!target.disabled){target.click();if(action!=='book')window.pbCrmInnerView=action;notifyHeader()}
 };
 const params=()=>new URLSearchParams(location.search);
 window.pbCrmFrameUrl=(portal,pane)=>{
  const q=new URLSearchParams({portal,pbDesktopContent:'1',pbCrmEmbedded:'1',crmRev:REV});
  const source=params();
  if(pane&&matchMedia('(max-width:820px)').matches)q.set('pbCrmMobile','1');
  if((pane??source.get('view'))==='calendar'){q.set('view','calendar');if(/^\d{4}-\d{2}-\d{2}$/.test(source.get('date')||''))q.set('date',source.get('date'));}
  return '/customer-crm.html?'+q;
 };
 const shown=node=>node&&node.getBoundingClientRect().height>0&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden';
 function layout(){
  pending=false;if(!host||host.hidden)return;
  // R1873: the gallery header is the mobile photographer chrome in every
  // section. Unlike the old React source headers, F37 lives directly in
  // document.body and its title/tabs extend below the 90px account row.
  // Place the CRM iframe below the *visible* header AND subheader so neither
  // Customers nor Calendar can cover them with the iframe's higher z-index.
  const headers=[...new Set(document.querySelectorAll(
   '#pbF37PhotographerHeader,#pbF37Subheader,'+
   '#pbSharedPhotographerHeader,#pbSharedPhotographerSubheader,'+
   '#photographerStoreRoleHeader,#photographerStoreIdentityBar,#storeSectionNavV673,'+
   '#root .labRoleWorkspace .labSingleHeader,'+
   '#root main.photographerMain > .unifiedRoleHeader,'+
   '#root main.photographerMain .photographerPrintModeHeader,'+
   '#photographerRoleHeaderV710,#pb1126DesktopHeader'
  ))].filter(shown).map(node=>node.getBoundingClientRect())
    .filter(rect=>rect.bottom>0&&rect.top<innerHeight*.45);
  const measuredTop=Math.max(0,...headers.map(rect=>Math.min(rect.bottom,innerHeight-120)));
  // Keep the previous safe clearance through a one-frame SPA header swap;
  // otherwise the CRM frame flashes over the gallery account row.
  if(measuredTop>0)lastHeaderBottom=measuredTop;
  const top=measuredTop||lastHeaderBottom;
  const docks=matchMedia('(max-width:820px)').matches?[...document.querySelectorAll('#root .labBottomAppNav,#root .photographerBottomAppNav,#photographerStoreBottomNav,body>.pb1448LabPhoneDock')].filter(shown):[];
  const bottom=Math.max(0,...docks.map(node=>innerHeight-node.getBoundingClientRect().top));
  if(host.style.top!==top+'px')host.style.top=top+'px';
  if(host.style.bottom!==bottom+'px')host.style.bottom=bottom+'px';
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(layout)}}
 function close(update=false){
  if(host)host.hidden=true;document.documentElement.classList.remove('pbCrmTabOpen');
  window.pbCrmActivePane=null;window.pbCrmInnerView=null;notifyHeader();
  for(const b of document.querySelectorAll('[data-pb1761-crm]')){b.classList.remove('active');b.removeAttribute('aria-current')}
  if(update&&params().get('pbCrmTab')==='1'){const u=new URL(location.href);u.searchParams.delete('pbCrmTab');u.searchParams.delete('pbCrmPane');history.replaceState(history.state,'',u);}
 }
 window.pbCrmClose=close;
 window.pbCrmOpen=(portal,push=true,pane)=>{
  if(!['lab','photographer'].includes(portal))return;
  pane??=params().get('pbCrmPane')||(params().get('view')==='calendar'?'calendar':'customers');
  if(typeof window.pbCrmAllowedPane==='function'&&!window.pbCrmAllowedPane(portal,pane))return;
  // The desktop photographer already has a native CRM content panel.
  const native=portal==='photographer'&&document.querySelector('#pb1126ChromeHost [data-pb1126-kind="'+(pane==='calendar'?'calendar':'crm')+'"]');
  if(native&&shown(native)){close();native.click();return;}
  window.pbCrmActivePane=pane;window.pbCrmInnerView=pane==='calendar'?'calendar':'customers';notifyHeader();
  const url=window.pbCrmFrameUrl(portal,pane);
  if(!host){host=document.createElement('section');host.id='pbCrmTabContent';host.setAttribute('aria-label','مشتریان');host.hidden=true;document.body.append(host)}
  if(!frame||owner!==portal){
   owner=portal;lastHeaderBottom=0;frame=document.createElement('iframe');frame.title='مشتریان';frame.className='pbCrmTabFrame';
   frame.addEventListener('load',event=>{
    if(frame!==event.currentTarget)return;
    try{
     const target=new URL(frame.contentWindow.location.href);if(target.href==='about:blank')return;
     if(target.origin!==location.origin||target.pathname!=='/customer-crm.html'){location.assign(target.href);return;}
     if(target.href!==new URL(frameUrl,location.href).href)return;
     host.removeAttribute('aria-busy');
     try{frame.contentDocument?.querySelector('#nav')?.addEventListener('click',ev=>{const b=ev.target.closest('[data-view]');if(b){window.pbCrmInnerView=b.dataset.view;notifyHeader()}})}catch{}
     frame.contentWindow.addEventListener('click',event=>{
      const a=event.target.closest?.('a[href]');if(!a||a.target==='_blank')return;
      const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname!=='/customer-crm.html'){event.preventDefault();location.assign(u.href);}
     });
    }catch{}
   });
   frameUrl=null;host.replaceChildren(frame);
  }
  if(frameUrl!==url){
   host.setAttribute('aria-busy','true');
   frameUrl=url;frame.src=url;
  }
  host.hidden=false;document.documentElement.classList.add('pbCrmTabOpen');
  window.PBStorePhotographerHeaderCore?.refresh?.();
  for(const b of document.querySelectorAll('[data-pb1761-crm]')){
   const selected=b.classList.contains('pb1761CrmDesktopTab')||b.dataset.pbCrmPane===pane;
   b.classList.toggle('active',selected&&b.classList.contains('pb1761CrmDesktopTab'));
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  }
  if(push&&(params().get('pbCrmTab')!=='1'||params().get('pbCrmPane')!==pane)){
   const u=new URL(location.href);u.searchParams.set('pbCrmTab','1');u.searchParams.set('pbCrmPane',pane);
   history.pushState({pbCrmTab:true},'',u);
  }
  schedule();
 };
 // Ordinary portal tabs keep their own routing and close only the CRM content layer.
 window.addEventListener('click',event=>{
  if(!host||host.hidden)return;
  const target=event.target.closest?.('button,a');if(!target||target.matches('[data-pb1761-crm],[data-pb1126-kind="crm"]'))return;
  if(target.closest('.labBottomAppNav,.photographerBottomAppNav,#photographerStoreBottomNav,.pb1147LabNav,.photographerHeaderNav,.photographerHomeModeNav,.pb1126MainNav,#root .labSingleHeader,#photographerRoleHeaderV710,#photographerStoreRoleHeader,#pb1126DesktopHeader'))close(true);
 },true);
 window.addEventListener('popstate',()=>{if(params().get('pbCrmTab')==='1'&&owner)window.pbCrmOpen(owner,false);else close()});
 window.addEventListener('resize',schedule,{passive:true});window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('photobridge-auth-session-changed',()=>{close(true);host?.remove();host=null;frame=null;owner=null});
 // Gallery's canonical header and Store's account header mount outside
 // #root. Observe the portal DOM as a whole, without watching style changes
 // written by layout() (which would create a self-triggered update loop).
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
})();
