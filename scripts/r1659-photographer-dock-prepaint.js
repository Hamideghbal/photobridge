/* R1659: deterministic mobile dock ownership before React first paint. */
(function(){
'use strict';
if(window.__pb1659Boot)return;window.__pb1659Boot=true;
const html=document.documentElement,phone=window.matchMedia('(max-width:820px)');
const route=()=>/^\/photographer(?:\/|$)/.test(location.pathname)&&!/^\/photographer\/(?:login|signup|register|invite)(?:\/|$)/.test(location.pathname);
function sync(){
 const enabled=phone.matches&&route()&&!window.pbNativeStorage;
 html.classList.toggle('pb1659PhotographerDock',enabled);
 if(!enabled)return;
 const navs=[...document.querySelectorAll('nav.photographerBottomAppNav')];
 const valid=navs.filter(n=>n.closest('#root')&&!n.classList.contains('labBottomAppNav'));
 const primary=valid.filter(n=>n.getAttribute('aria-label')==='ناوبری اصلی عکاس').at(-1)||valid.at(-1);
 navs.forEach(n=>{
  if(n===primary){if(n.getAttribute('data-pb1659-primary')!=='1')n.setAttribute('data-pb1659-primary','1')}
  else if(n.hasAttribute('data-pb1659-primary'))n.removeAttribute('data-pb1659-primary');
 });
}
html.classList.toggle('pb1659PhotographerDock',phone.matches&&route());
new MutationObserver(sync).observe(html,{subtree:true,childList:true});
window.addEventListener('pageshow',sync);window.addEventListener('popstate',sync);
if(phone.addEventListener)phone.addEventListener('change',sync);else if(phone.addListener)phone.addListener(sync);
sync();
})();