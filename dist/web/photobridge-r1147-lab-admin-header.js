(()=>{'use strict';if(window.pb1147LabHeader)return;window.pb1147LabHeader=true;
const media=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)'),categories=[['عمومی','/lab/settings',['general','hours','sms','windowsAlert','snappbox']],['عکاسان و همکاری','/lab/settings/customers',['customers','walkin']],['مالی و تعرفه‌ها','/lab/settings/prices',['prices','album','payment','wallet','subscription']],['مسیر ذخیره روی هارد','/lab/settings/local',['local']],['سایت اختصاصی','/lab/settings/site',['site']]];
let scheduled=false,avatar='',manager='',loaded=false,loading=false,epoch=0;
const request=(url,options)=>window.pbLabLocalIntakeStorage.request(url,options);
function paintIdentity(h){const identity=h.querySelector('.labHeaderIdentity');if(!identity)return;let photo=identity.querySelector('.pb1148LabAvatar');if(!photo){photo=document.createElement('button');photo.type='button';photo.className='pb1148LabAvatar';photo.setAttribute('aria-label','انتخاب تصویر لابراتوار');photo.onclick=()=>{let input=document.getElementById('pb1148LabAvatarInput');if(!input){input=document.createElement('input');input.id='pb1148LabAvatarInput';input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;document.body.append(input);input.onchange=async()=>{const file=input.files[0];input.value='';if(!file)return;const snapshot=epoch,url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();if(snapshot!==epoch)return;const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const context=canvas.getContext('2d');const side=Math.min(image.width,image.height);context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,192,192);const saved=await request('/api/lab/profile-image',{method:'PUT',body:JSON.stringify({imageData:canvas.toDataURL('image/jpeg',.86)})});if(snapshot===epoch){avatar=saved.imageData;schedule();}}catch{photo.title='ذخیره تصویر انجام نشد؛ دوباره تلاش کن.';}finally{URL.revokeObjectURL(url);}};}input.click();};identity.prepend(photo);}
 const signature=avatar||identity.querySelector('h1')?.textContent||'ل';if(photo.dataset.image!==signature){photo.replaceChildren();if(avatar){const image=document.createElement('img');image.src=avatar;image.alt='تصویر لابراتوار';photo.append(image);}else photo.textContent=signature.charAt(0);photo.dataset.image=signature;}
 let role=identity.querySelector('.pb1148Manager');if(!role){role=document.createElement('small');role.className='pb1148Manager';identity.querySelector('.workspaceIdentityCopy')?.append(role);}const label='مدیر لابراتوار'+(manager?' · '+manager:'');if(role.textContent!==label)role.textContent=label;
 if(!loaded&&!loading&&window.pbLabLocalIntakeStorage){loading=true;const snapshot=epoch;Promise.all([request('/api/lab/profile-image'),request('/api/auth/me')]).then(([image,me])=>{if(snapshot!==epoch)return;avatar=image.imageData||'';manager=me.user?.name||'';loaded=true;}).catch(()=>{if(snapshot===epoch)loaded=true;}).finally(()=>{if(snapshot===epoch){loading=false;schedule();}});}
}
function secondary(h){
 let row=h.parentElement.querySelector(':scope>.pb1148SecondaryHeader');
 const source=document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs')||document.querySelector('.mainQueueFilters');
 if(!source){row?.remove();h.parentElement.querySelector(':scope>.pb1175HeaderFade')?.remove();h.parentElement.classList.remove('pb1148HasSecondary');return;}
 if(!row){row=document.createElement('nav');row.className='pb1148SecondaryHeader';row.setAttribute('aria-label','زیرگزینه‌های لابراتوار');h.after(row);}
 let fade=h.parentElement.querySelector(':scope>.pb1175HeaderFade');if(!fade){fade=document.createElement('div');fade.className='pb1175HeaderFade';fade.setAttribute('aria-hidden','true');row.after(fade);}
 h.parentElement.classList.add('pb1148HasSecondary');
 source.classList.add('pb1148SecondarySource');
 const originals=[...source.querySelectorAll(':scope>button')];
 const buttons=()=>[...row.querySelectorAll(':scope>button[data-pb1173-index]')];
 // Rebuild only when the source/number of tabs changes: an active-state
 // change must retain the underline and its previous position to slide.
 if(row._source!==source||buttons().length!==originals.length){
  row._source=source;
  row.replaceChildren();
  originals.forEach((original,index)=>{
   const button=document.createElement('button');button.type='button';
   button.dataset.pb1173Index=String(index);
   button.addEventListener('click',()=>{
    const live=row._source?.querySelectorAll(':scope>button')[index];
    if(!live||live.disabled)return;
    const changed=!button.classList.contains('active');
    if(changed&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
     button.animate?.([{transform:'translateY(3px) scale(.96)',opacity:.7},{transform:'translateY(-1px) scale(1.015)',opacity:1},{transform:'translateY(0) scale(1)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    live.click();
    if(changed&&!location.pathname.startsWith('/lab/settings')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const panel=document.querySelector('.labRolePageScrollArea .stageQueueWorkspace,.labRolePageScrollArea .settingsBody,.labRolePageScrollArea .financePage')||document.querySelector('.labRolePageScrollArea');
      panel?.animate?.([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
     }));
    }
    schedule();
   });
   row.append(button);
  });
  const indicator=document.createElement('span');
  indicator.className='pb1173MovingIndicator';indicator.setAttribute('aria-hidden','true');
  row.append(indicator);
 }
 const isQueue=source.classList.contains('mainQueueFilters')&&/^\/lab\/(?:orders(?:\/|$)|album(?:s|[-/]|$)|print(?:\/|$))/.test(location.pathname);
 row.classList.toggle('pb1174QueueNav',isQueue);
 // The original registered-device launch button is the ONLY one; move it,
 // retaining its native click handler and not inserting a second proxy.
 const intake=document.getElementById('pb1137LocalIntakeButton');
 if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake);
 row.querySelector(':scope>.pb1174QueueLaunch')?.remove();
 row.setAttribute('aria-label',source.getAttribute('aria-label')||'زیرگزینه‌های صفحه');
 buttons().forEach((button,index)=>{
  const original=originals[index];if(!original)return;
  const raw=original.textContent.trim();
  const strong=original.querySelector('b');
  const suffix=raw.match(/([0-9۰-۹٠-٩]+)\s*$/);
  const count=strong?.textContent.trim()||suffix?.[1]||'';
  const label=count&&raw.endsWith(count)?raw.slice(0,raw.length-count.length).trim():raw;
  if(button.dataset.label!==label||button.dataset.count!==count){
   const name=document.createElement('span');name.className='pb1173TabLabel';name.textContent=label;
   button.replaceChildren(name);
   if(count){const badge=document.createElement('b');badge.className='pb1173TabCount';badge.textContent=count;button.append(badge);}
   button.dataset.label=label;button.dataset.count=count;
  }
  const active=original.classList.contains('active')||original.getAttribute('aria-selected')==='true';
  button.classList.toggle('active',active);
  button.setAttribute('aria-selected',String(active));
  button.disabled=original.disabled;
 });
 const indicator=row.querySelector(':scope>.pb1173MovingIndicator');
 requestAnimationFrame(()=>{
  if(!row.isConnected||!indicator)return;
  const active=row.classList.contains('pb1174QueueNav')?null:row.querySelector(':scope>button[data-pb1173-index].active');
  if(!active){indicator.style.opacity='0';return;}
  const base=row.getBoundingClientRect(),rect=active.getBoundingClientRect();
  const width=Math.max(18,rect.width-8)+'px';
  const offset=Math.round(rect.left-base.left+4+row.scrollLeft)+'px';
  if(!indicator.dataset.ready)indicator.style.transition='none';
  indicator.style.width=width;
  indicator.style.transform='translateX('+offset+')';
  indicator.style.opacity='1';
  if(!indicator.dataset.ready){
   indicator.dataset.ready='1';
   requestAnimationFrame(()=>indicator.isConnected&&indicator.style.removeProperty('transition'));
  }
 });
}

// Mark the whole optional shortcut card, not only its links, so no empty
// quick-access slot remains above the print or album orders on Windows.
function retireQuickAccess(){
 const root=document.querySelector('.labRoleWorkspace');
 if(!root)return;
 const isQueue=/^\/lab\/(?:orders(?:\/|$)|album(?:s|[-/]|$)|print(?:\/|$))/.test(location.pathname);
 for(const el of root.querySelectorAll('.pb1172RetiredQuickAccess')){
  if(!isQueue)el.classList.remove('pb1172RetiredQuickAccess');
 }
 root.classList.toggle('pb1173QueueClean',isQueue);
 if(!isQueue)return;
 const known='.labQueueQuickAccessV464,.labQueueQuickIntroV464';
 for(const el of root.querySelectorAll(known)){
  el.classList.add('pb1172RetiredQuickAccess');
  // A wrapper containing only the retired shortcut heading and links can
  // otherwise keep its padding/min-height when the children are hidden.
  const parent=el.parentElement;
  if(parent&&parent!==root&&parent.children.length<=3){
   const others=[...parent.children].filter(node=>!node.matches(known));
   if(others.every(node=>/^دسترسی سریع(?:\s|$)/.test(node.textContent.trim())&&node.querySelectorAll('button,a').length<=8)){
    parent.classList.add('pb1172RetiredQuickAccess');
   }
  }
 }
 // Older order/album views render a different shortcut card with only this
 // exact heading. Find a compact dedicated card, never the order list itself.
 for(const title of root.querySelectorAll('h2,h3,h4,h5,h6,legend,summary,strong')){
  if(title.textContent.replace(/\s+/g,' ').trim()!=='دسترسی سریع')continue;
  let candidate=null,depth=0;
  for(let parent=title.parentElement;parent&&parent!==root&&depth++<5;parent=parent.parentElement){
   const text=parent.textContent.replace(/\s+/g,' ').trim();
   const actions=parent.querySelectorAll('button,a').length;
   if(text.startsWith('دسترسی سریع')&&text.length<=420&&actions>0&&actions<=8){
    candidate=parent;
   }else if(candidate)break;
  }
  (candidate||title).classList.add('pb1172RetiredQuickAccess');
 }
}
function navigate(path){if(location.pathname===path)return;history.pushState(null,'',path);dispatchEvent(new PopStateEvent('popstate'));}
function clearDesktop(){document.querySelectorAll('.labRoleWorkspace .pb1175HeaderFade').forEach(x=>x.remove());document.querySelector('.labRoleWorkspace')?.classList.remove('pb1173QueueClean');document.querySelectorAll('.labRoleWorkspace .pb1172RetiredQuickAccess').forEach(x=>x.classList.remove('pb1172RetiredQuickAccess'));document.querySelectorAll('.labRoleWorkspace .pb1147LabNav,.labRoleWorkspace .pb1148SecondaryHeader,.labRoleWorkspace .pb1148LabAvatar,.labRoleWorkspace .pb1148Manager').forEach(x=>x.remove());document.querySelectorAll('.pb1148HasSecondary,.pb1148SecondarySource,.pb1147LabAdminHeader').forEach(x=>x.classList.remove('pb1148HasSecondary','pb1148SecondarySource','pb1147LabAdminHeader'));}
function render(){scheduled=false;if(!media.matches){clearDesktop();return;}if(!location.pathname.startsWith('/lab'))return;const h=document.querySelector('.labRoleWorkspace .labSingleHeader');if(!h||!h.querySelector('.settingsIconBtn,.mobileHeaderSettings'))return;h.classList.add('pb1147LabAdminHeader');paintIdentity(h);secondary(h);retireQuickAccess();
 let nav=h.querySelector('.pb1147LabNav');if(!nav){nav=document.createElement('nav');nav.className='pb1147LabNav';nav.setAttribute('aria-label','سفارش‌ها و تنظیمات لابراتوار');
  for(const [title,selector]of [['سفارش چاپ','.labPrintTopNav'],['سفارش آلبوم','.albumTopNav'],['آرشیو','.labArchiveHeaderBtn'],['مالی','.labFinanceHeaderBtn']]){if(!h.querySelector(selector))continue;if(selector==='.labArchiveHeaderBtn'&&nav.children.length){const line=document.createElement('span');line.className='pb1147Divider';line.setAttribute('aria-hidden','true');nav.append(line);}const button=document.createElement('button');button.type='button';const label=document.createElement('span');label.className='pb1149NavLabel';label.textContent=title;button.append(label);button.dataset.source=selector;button.onclick=()=>h.querySelector(selector)?.click();nav.append(button);}
  const divider=document.createElement('span');divider.className='pb1147Divider';divider.setAttribute('aria-hidden','true');nav.append(divider);
  categories.forEach(([title,path],index)=>{const button=document.createElement('button');button.type='button';const label=document.createElement('span');label.className='pb1149NavLabel';label.textContent=title;button.append(label);button.dataset.category=index;button.onclick=()=>navigate(path);nav.append(button);});
  h.append(nav);
 }
 const section=location.pathname.split('/')[3]||'general';nav.querySelectorAll('button').forEach(button=>{const original=button.dataset.source&&h.querySelector(button.dataset.source);const active=original?original.classList.contains('active'):button.dataset.category!==undefined&&(location.pathname.startsWith('/lab/settings')||location.pathname==='/lab/wallet')&&categories[Number(button.dataset.category)][2].includes(location.pathname==='/lab/wallet'?'wallet':section);button.classList.toggle('active',!!active);button.setAttribute('aria-current',active?'page':'false');});
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render)}
function start(){schedule();new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,characterData:true});addEventListener('popstate',schedule);addEventListener('photobridge-auth-session-changed',()=>{epoch++;loaded=false;loading=false;avatar='';manager='';schedule();});media.addEventListener('change',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();

