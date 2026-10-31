/* Mobile admin navigation delegates to the existing admin tab actions. */
(()=>{
 'use strict';
 const ids=new WeakMap();let serial=0,scheduled=false,nav=null,select=null,signature='',started=false;
 function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}
 function mount(){
  if(!location.pathname.startsWith('/admin'))return;
  const page=document.querySelector('.adminPage:not(.adminAlbumDesignFocusPage)'),tabs=page?.querySelector(':scope > .adminTabs');
  if(!page||!tabs)return;
  if(!nav||nav.parentElement!==page){
   nav=document.createElement('label');nav.id='pb1100AdminNav';nav.innerHTML='<span>بخش مدیریت</span><select aria-label="انتخاب بخش مدیریت"></select>';select=nav.querySelector('select');
   select.addEventListener('change',()=>{const target=[...tabs.querySelectorAll(':scope > button')].find(button=>ids.get(button)===select.value);target?.click();queue()});
   page.insertBefore(nav,tabs);signature='';
  }
  tabs.dataset.pb1100MobileNav='1';
  const buttons=[...tabs.querySelectorAll(':scope > button')];
  for(const button of buttons)if(!ids.has(button))ids.set(button,String(++serial));
  const next=buttons.map(button=>ids.get(button)+':'+button.textContent.trim()+':'+button.disabled).join('|');
  if(next!==signature){
   select.replaceChildren(...buttons.map(button=>{const option=document.createElement('option');option.value=ids.get(button);option.textContent=button.textContent.trim();option.disabled=button.disabled;return option}));signature=next;
  }
  const active=buttons.find(button=>button.classList.contains('active'));
  if(active)select.value=ids.get(active);
  const header=document.querySelector('#root > header');
  const height=header?.getBoundingClientRect().height;
  if(height>0&&page.style.getPropertyValue('--pb1100-header-height')!==height+'px')page.style.setProperty('--pb1100-header-height',height+'px');
 }
 function init(){
  if(started||!location.pathname.startsWith('/admin'))return;started=true;
  const style=document.createElement('style');style.textContent='#pb1100AdminNav{display:none!important}@media(max-width:820px){html body #root>header .topPowerLogout{width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;touch-action:manipulation}html body #root>header .topPowerLogout svg{pointer-events:none}}@media(max-width:820px){html body #root .adminPage:not(.adminAlbumDesignFocusPage){height:calc(100dvh - var(--pb1100-header-height,68px))!important;max-height:calc(100dvh - var(--pb1100-header-height,68px))!important;min-width:0!important}html body #root .adminPage>#pb1100AdminNav{display:flex!important;flex:0 0 auto;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:10px 12px;margin:0 0 8px;background:#fff;border:1px solid #e1e7f2;border-radius:12px;direction:rtl;position:relative;z-index:26}#pb1100AdminNav>span{font-size:13px;font-weight:700;white-space:nowrap;color:#667085}#pb1100AdminNav select{min-width:0;flex:1;height:42px!important;min-height:42px!important;padding:0 10px!important;font-family:inherit;font-weight:700;font-size:16px!important;background:#f5f8ff;color:#24334d;border:1px solid #cbd8f6;border-radius:9px;direction:rtl}html body #root .adminPage>.adminTabs[data-pb1100-mobile-nav]{display:none!important}}';document.head.append(style);
  mount();const root=document.querySelector('#root')||document.body;new MutationObserver(queue).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const header=document.querySelector('#root > header');if(header)new ResizeObserver(queue).observe(header);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.addEventListener('resize',queue);window.addEventListener('popstate',()=>{init();queue()});
})();
