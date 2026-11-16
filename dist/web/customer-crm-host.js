/* CRM is content inside the authenticated portal, sharing its header and navigation. */
(()=>{
 'use strict';
 if(window.self!==window.top||window.pbCrmOpen)return;
 const REV='r1867-crm-delivery';
 let host=null,frame=null,owner=null,pending=false;
 const params=()=>new URLSearchParams(location.search);
 window.pbCrmFrameUrl=portal=>{
  const q=new URLSearchParams({portal,pbDesktopContent:'1',pbCrmEmbedded:'1',crmRev:REV});
  const source=params();if(source.get('view')==='calendar'){q.set('view','calendar');if(/^\d{4}-\d{2}-\d{2}$/.test(source.get('date')||''))q.set('date',source.get('date'));}
  return '/customer-crm.html?'+q;
 };
 const shown=node=>node&&node.getBoundingClientRect().height>0&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden';
 function layout(){
  pending=false;if(!host||host.hidden)return;
  const headers=[...document.querySelectorAll('#root .labSingleHeader,#photographerRoleHeaderV710,#photographerStoreRoleHeader,#pb1126DesktopHeader')].filter(shown);
  const top=Math.max(0,...headers.map(node=>Math.min(node.getBoundingClientRect().bottom,innerHeight-120)));
  const docks=matchMedia('(max-width:820px)').matches?[...document.querySelectorAll('#root .labBottomAppNav,#root .photographerBottomAppNav,#photographerStoreBottomNav')].filter(shown):[];
  const bottom=Math.max(0,...docks.map(node=>innerHeight-node.getBoundingClientRect().top));
  host.style.top=top+'px';host.style.bottom=bottom+'px';
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(layout)}}
 function close(update=false){
  if(host)host.hidden=true;document.documentElement.classList.remove('pbCrmTabOpen');
  for(const b of document.querySelectorAll('[data-pb1761-crm]')){b.classList.remove('active');b.removeAttribute('aria-current')}
  if(update&&params().get('pbCrmTab')==='1'){const u=new URL(location.href);u.searchParams.delete('pbCrmTab');history.replaceState(history.state,'',u);}
 }
 window.pbCrmClose=close;
 window.pbCrmOpen=(portal,push=true)=>{
  if(!['lab','photographer'].includes(portal))return;
  // The desktop photographer already has a native CRM content panel.
  const native=portal==='photographer'&&document.querySelector('#pb1126ChromeHost [data-pb1126-kind="crm"]');
  if(native&&shown(native)){close();native.click();return;}
  if(!host){host=document.createElement('section');host.id='pbCrmTabContent';host.setAttribute('aria-label','مشتریان');host.hidden=true;document.body.append(host)}
  if(!frame||owner!==portal){
   owner=portal;frame=document.createElement('iframe');frame.title='مشتریان';frame.className='pbCrmTabFrame';
   frame.addEventListener('load',()=>{
    try{
     const target=new URL(frame.contentWindow.location.href);if(target.href==='about:blank')return;
     if(target.origin!==location.origin||target.pathname!=='/customer-crm.html'){location.assign(target.href);return;}
     frame.contentWindow.addEventListener('click',event=>{
      const a=event.target.closest?.('a[href]');if(!a||a.target==='_blank')return;
      const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname!=='/customer-crm.html'){event.preventDefault();location.assign(u.href);}
     });
    }catch{}
   });
   frame.src=window.pbCrmFrameUrl(portal);host.replaceChildren(frame);
  }
  host.hidden=false;document.documentElement.classList.add('pbCrmTabOpen');
  for(const b of document.querySelectorAll('[data-pb1761-crm]')){b.classList.add('active');b.setAttribute('aria-current','page')}
  if(push&&params().get('pbCrmTab')!=='1'){const u=new URL(location.href);u.searchParams.set('pbCrmTab','1');history.pushState({pbCrmTab:true},'',u);}
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
 new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
})();
