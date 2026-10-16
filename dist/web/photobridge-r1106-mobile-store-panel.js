/* A persistent photographer dock hosts the legacy Store/Print documents as content panels. */
(()=>{
'use strict';
if(!matchMedia('(max-width:820px)').matches||window.pb1134MobilePanelMounted)return;
window.pb1134MobilePanelMounted=true;
const initialQuery=new URLSearchParams(location.search),embedded=initialQuery.get('pbEmbeddedStore')==='1';
const route=/^\/photographer(?:\/|$)/.test(location.pathname)&&!/^\/photographer\/(signup|login|invite|register)(?:\/|$)/.test(location.pathname);
if(embedded){
 document.documentElement.dataset.pb1106Embedded='1';
 const style=document.createElement('style');style.textContent='html[data-pb1106-embedded] body #photographerStoreBottomNav#photographerStoreBottomNav,html[data-pb1106-embedded] body .photographerBottomAppNav.photographerBottomAppNav{display:none!important}html[data-pb1106-embedded] body{padding-bottom:0!important}';document.head.append(style);
 // Legacy route styles must not restore a second dock inside the content frame.
 const hideEmbeddedDock=()=>document.querySelectorAll('#photographerStoreBottomNav,.photographerBottomAppNav').forEach(nav=>{if(nav.style.getPropertyValue('display')!=='none'||nav.style.getPropertyPriority('display')!=='important')nav.style.setProperty('display','none','important');});
 const watchEmbeddedDock=()=>{hideEmbeddedDock();new MutationObserver(hideEmbeddedDock).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchEmbeddedDock,{once:true});else watchEmbeddedDock();
 return;
}
if(location.pathname==='/equipment-rental/book'&&window===window.top){
 const q=new URLSearchParams({pbStorePanel:'store',pbStoreQuery:location.search});location.replace('/photographer/gallery?'+q);return;
}
if(!route)return;
let dock,dockObserver,selected=null,authenticated=false;const panels=new Map(),dockState=new Map();
const style=document.createElement('style');
style.textContent='.pb1106ContentPanel{position:fixed;inset:0 0 var(--pb1106-dock-height,84px);z-index:2147483000!important;background:#f7f8fc}.pb1106ContentPanel[hidden]{display:none}.pb1106ContentPanel iframe{width:100%;height:100%;border:0;display:block;background:#f7f8fc}.pb1106ContentLoading{position:absolute;inset:0;display:grid;place-items:center;background:#f7f8fc;color:#52617a;font:inherit}.pb1106ContentLoading[hidden]{display:none}html body.pb1106PanelOpen .photographerBottomAppNav{z-index:2147483100!important}';
document.head.append(style);
function feature(el){const name=el?.getAttribute('aria-label')||el?.textContent||'';return /فروشگاه/.test(name)||el?.classList.contains('photographerStoreEntry')?'store':/^چاپ$/.test(name.trim())?'print':null}
function restoreKind(){const key=new URLSearchParams(location.search).get('pbStorePanel');return key==='1'?'store':['store','print'].includes(key)?key:null}
function size(){if(dock){const height=dock.getBoundingClientRect().height;if(height>0)document.documentElement.style.setProperty('--pb1106-dock-height',height+'px')}}
function sync(){
 const nav=document.querySelector('.photographerBottomAppNav');if(!nav)return;
 if(nav!==dock){
  dockObserver?.disconnect();dock=nav;new ResizeObserver(size).observe(nav);
  dockObserver=new MutationObserver(()=>{if(selected)mark()});
  dockObserver.observe(nav,{subtree:true,attributes:true,attributeFilter:['class','aria-current']});
 }size();
 const kind=restoreKind();if(kind&&!selected)open(kind,false);if(selected)mark();
}
function mark(){
 for(const b of dock?.querySelectorAll('button,a')||[]){
  const key=b.getAttribute('aria-label')||b.textContent;
  if(selected){
   if(!dockState.has(key))dockState.set(key,{active:b.classList.contains('active'),current:b.getAttribute('aria-current')});
   const active=feature(b)===selected;
   if(b.classList.contains('active')!==active)b.classList.toggle('active',active);
   if(active){if(!b.hasAttribute('data-pb1106-selected'))b.dataset.pb1106Selected='1';if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page')}
   else{if(b.hasAttribute('data-pb1106-selected'))delete b.dataset.pb1106Selected;if(b.hasAttribute('aria-current'))b.removeAttribute('aria-current')}
  }else{
   const saved=dockState.get(key);
   if(saved){b.classList.toggle('active',saved.active);if(saved.current===null)b.removeAttribute('aria-current');else b.setAttribute('aria-current',saved.current)}
   if(b.hasAttribute('data-pb1106-selected'))delete b.dataset.pb1106Selected;
  }
 }
 if(!selected)dockState.clear();
}
function showChooser(panel){const frame=panel?.querySelector('iframe');if(!frame)return;const show=()=>{try{const button=frame.contentDocument?.querySelector('[data-store-home]');if(button){button.click();return true;}}catch{}return false;};if(!show())frame.addEventListener('load',show,{once:true});}
function open(kind,push=true,choose=false){
 if(selected===kind){if(choose&&kind==='store')showChooser(panels.get(kind));return;}
 for(const p of panels.values())p.hidden=true;
 let panel=panels.get(kind);
 if(!panel){
  panel=document.createElement('section');panel.id=kind==='store'?'pb1106StorePanel':'pb1106PrintPanel';panel.className='pb1106ContentPanel';panel.setAttribute('aria-label',kind==='store'?'فروشگاه':'چاپ');
  const loading=document.createElement('div');loading.id=kind==='store'?'pb1106StoreLoading':'pb1106PrintLoading';loading.className='pb1106ContentLoading';loading.setAttribute('role','status');loading.textContent=kind==='store'?'در حال دریافت فروشگاه…':'در حال دریافت چاپ…';
  const frame=document.createElement('iframe');frame.title=kind==='store'?'فروشگاه تجهیزات':'چاپ';
  frame.addEventListener('load',()=>{try{const url=new URL(frame.contentWindow.location.href);if(url.href==='about:blank')return;if(url.origin!==location.origin||/^\/photographer\/(login|signup|register)/.test(url.pathname)||!/^\/(equipment-rental|photographer)(\/|$)/.test(url.pathname)){location.assign(url.href);return}}catch{return}loading.hidden=true});
  panel.append(frame,loading);panels.set(kind,panel);document.body.append(panel);
  const q=new URLSearchParams(kind==='store'?(choose?'':initialQuery.get('pbStoreQuery')||''):'workspace=print&pbLabChooser=1');q.set('pbEmbeddedStore','1');frame.src=(kind==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;
 }
 if(choose&&kind==='store')showChooser(panel);panel.hidden=false;selected=kind;document.body.classList.add('pb1106PanelOpen');mark();
 if(push){const u=new URL(location.href);u.searchParams.set('pbStorePanel',kind);history.pushState({pb1106Panel:kind},'',u)}size();
}
function close(){
 for(const panel of panels.values())panel.hidden=true;selected=null;document.body.classList.remove('pb1106PanelOpen');mark();
 const u=new URL(location.href);if(u.searchParams.has('pbStorePanel')){u.searchParams.delete('pbStorePanel');u.searchParams.delete('pbStoreQuery');history.replaceState(history.state,'',u)}
}
// Head registration precedes both old full-document Store and Print click handlers.
window.addEventListener('click',e=>{
 const el=e.target?.closest?.('.photographerBottomAppNav button,.photographerBottomAppNav a,.photographerHomeModeNav button,.photographerStoreEntry,.photographerStoreMobileNav');if(!el)return;
 const kind=feature(el);if(kind){e.preventDefault();e.stopImmediatePropagation();open(kind,true,kind==='store');return}
 if(selected)close(); // Other sections keep their normal React navigation.
},true);
window.addEventListener('popstate',()=>{const kind=restoreKind();if(kind)open(kind,false);else close()});
window.addEventListener('photobridge-auth-session-changed',e=>{if(e.detail?.labRole==='customer'){authenticated=true;return}if(!authenticated)return;authenticated=false;close();for(const p of panels.values())p.remove();panels.clear()});
function init(){sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
