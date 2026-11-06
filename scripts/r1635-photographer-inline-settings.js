/* Desktop-only settings navigation; preserve the existing settings pages and handlers. */
(()=>{
 if(!matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches||new URLSearchParams(location.search).get('pbDesktopContent')==='1')return;
 let panel=null,selected='',scheduled=false;
 const options=[['prices','تعرفه‌های لابراتوار'],['location','موقعیت عکاسی'],['invites','دعوت همکار']];
 function close(){panel?.remove();panel=null;selected='';document.documentElement.classList.remove('pb1635SettingsOpen');sync();}
 function open(key){
  if(selected===key&&panel)return;
  panel?.remove();selected=key;
  panel=document.createElement('section');panel.id='pb1635SettingsPanel';panel.setAttribute('aria-label',options.find(x=>x[0]===key)[1]);
  const frame=document.createElement('iframe');frame.title=panel.getAttribute('aria-label');
  frame.addEventListener('load',()=>{try{
   const doc=frame.contentDocument;if(!doc?.body)return;
   if(!frame.contentWindow.location.pathname.startsWith('/photographer/settings')){close();return;}
   const style=doc.createElement('style');style.textContent='.photographerSettingsTabs{display:none!important}.photographerSettings{display:block!important}.settingsBody{width:100%!important;min-width:0!important}';doc.head.append(style);
  }catch{close();}});
  frame.src='/photographer/settings/'+key+'?pbDesktopContent=1';panel.append(frame);document.body.append(panel);document.documentElement.classList.add('pb1635SettingsOpen');sync();
 }
 function sync(){
  scheduled=false;const header=document.querySelector('#pb1126DesktopHeader'),row=header?.querySelector('.pb1126Secondary');if(!row)return;
  header.querySelectorAll('.pb1163-settings,.settingsIconBtn,.photographerSettingsHeaderBtn,button[title="تنظیمات"],button[aria-label="تنظیمات"]').forEach(el=>el.remove());
  let nav=row.querySelector('.pb1635SettingsNav');if(!nav){nav=document.createElement('nav');nav.className='pb1635SettingsNav';nav.setAttribute('aria-label','تنظیمات عکاسی');for(const [key,label] of options){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.settings=key;button.onclick=()=>open(key);nav.append(button)}row.append(nav)}
  for(const button of nav.children){const active=button.dataset.settings===selected;if(button.classList.contains('active')!==active)button.classList.toggle('active',active);if(active&&button.getAttribute('aria-current')!=='page')button.setAttribute('aria-current','page');else if(!active&&button.hasAttribute('aria-current'))button.removeAttribute('aria-current');}
 }
 document.addEventListener('click',event=>{if(panel&&event.target.closest('#pb1126DesktopHeader button')&&!event.target.closest('.pb1635SettingsNav'))close();},true);
 window.addEventListener('popstate',close);
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(sync)}});observer.observe(document.documentElement,{childList:true,subtree:true});sync();
})();
