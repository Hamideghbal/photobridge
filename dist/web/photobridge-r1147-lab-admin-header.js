(()=>{'use strict';if(window.pb1147LabHeader)return;window.pb1147LabHeader=true;
const media=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)'),categories=[['عمومی','/lab/settings',['general','hours']],['عکاسان و همکاری','/lab/settings/customers',['customers','walkin']],['مالی و تعرفه‌ها','/lab/settings/prices',['prices','album','payment','wallet','subscription']],['اعلان و ارتباط','/lab/settings/sms',['sms']],['سیستم و ارسال','/lab/settings/windowsAlert',['windowsAlert','local','snappbox']]];
let scheduled=false,avatar='',manager='',loaded=false,loading=false,epoch=0;
const request=(url,options)=>window.pbLabLocalIntakeStorage.request(url,options);
function paintIdentity(h){const identity=h.querySelector('.labHeaderIdentity');if(!identity)return;let photo=identity.querySelector('.pb1148LabAvatar');if(!photo){photo=document.createElement('button');photo.type='button';photo.className='pb1148LabAvatar';photo.setAttribute('aria-label','انتخاب تصویر لابراتوار');photo.onclick=()=>{let input=document.getElementById('pb1148LabAvatarInput');if(!input){input=document.createElement('input');input.id='pb1148LabAvatarInput';input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;document.body.append(input);input.onchange=async()=>{const file=input.files[0];input.value='';if(!file)return;const snapshot=epoch,url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();if(snapshot!==epoch)return;const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const context=canvas.getContext('2d');const side=Math.min(image.width,image.height);context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,192,192);const saved=await request('/api/lab/profile-image',{method:'PUT',body:JSON.stringify({imageData:canvas.toDataURL('image/jpeg',.86)})});if(snapshot===epoch){avatar=saved.imageData;schedule();}}catch{photo.title='ذخیره تصویر انجام نشد؛ دوباره تلاش کن.';}finally{URL.revokeObjectURL(url);}};}input.click();};identity.prepend(photo);}
 const signature=avatar||identity.querySelector('h1')?.textContent||'ل';if(photo.dataset.image!==signature){photo.replaceChildren();if(avatar){const image=document.createElement('img');image.src=avatar;image.alt='تصویر لابراتوار';photo.append(image);}else photo.textContent=signature.charAt(0);photo.dataset.image=signature;}
 let role=identity.querySelector('.pb1148Manager');if(!role){role=document.createElement('small');role.className='pb1148Manager';identity.querySelector('.workspaceIdentityCopy')?.append(role);}const label='مدیر لابراتوار'+(manager?' · '+manager:'');if(role.textContent!==label)role.textContent=label;
 if(!loaded&&!loading&&window.pbLabLocalIntakeStorage){loading=true;const snapshot=epoch;Promise.all([request('/api/lab/profile-image'),request('/api/auth/me')]).then(([image,me])=>{if(snapshot!==epoch)return;avatar=image.imageData||'';manager=me.user?.name||'';loaded=true;}).catch(()=>{if(snapshot===epoch)loaded=true;}).finally(()=>{if(snapshot===epoch){loading=false;schedule();}});}
}
function secondary(h){let row=h.parentElement.querySelector(':scope>.pb1148SecondaryHeader');const source=document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs')||document.querySelector('.mainQueueFilters');if(!source){row?.remove();h.parentElement.classList.remove('pb1148HasSecondary');return;}if(!row){row=document.createElement('nav');row.className='pb1148SecondaryHeader';row.setAttribute('aria-label','بخش‌های تنظیمات لابراتوار');h.after(row);}h.parentElement.classList.add('pb1148HasSecondary');source.classList.add('pb1148SecondarySource');const signature=[...source.querySelectorAll(':scope>button')].map(x=>x.textContent+':'+x.className+':'+x.disabled).join('|');if(row._source!==source||row.dataset.signature!==signature){row._source=source;row.setAttribute('aria-label',source.getAttribute('aria-label')||'زیرگزینه‌های صفحه');row.replaceChildren();[...source.querySelectorAll(':scope>button')].forEach((original,index)=>{const button=document.createElement('button');button.type='button';button.textContent=original.textContent;button.className=original.className;button.disabled=original.disabled;button.onclick=()=>{source.querySelectorAll(':scope>button')[index]?.click();schedule();};row.append(button);});row.dataset.signature=signature;}}

// Mark the whole optional shortcut card, not only its links, so no empty
// quick-access slot remains above the print or album orders on Windows.
function retireQuickAccess(){
 const root=document.querySelector('.labRoleWorkspace');
 if(!root)return;
 const isQueue=/^\\/lab\\/(?:orders(?:\\/|$)|album(?:s|[-/]|$)|print(?:\\/|$))/.test(location.pathname);
 for(const el of root.querySelectorAll('.pb1172RetiredQuickAccess')){
  if(!isQueue)el.classList.remove('pb1172RetiredQuickAccess');
 }
 if(!isQueue)return;
 const known='.labQueueQuickAccessV464,.labQueueQuickIntroV464';
 for(const el of root.querySelectorAll(known)){
  el.classList.add('pb1172RetiredQuickAccess');
  // A wrapper containing only the retired shortcut heading and links can
  // otherwise keep its padding/min-height when the children are hidden.
  const parent=el.parentElement;
  if(parent&&parent!==root&&parent.children.length<=3){
   const others=[...parent.children].filter(node=>!node.matches(known));
   if(others.every(node=>/^دسترسی سریع(?:\\s|$)/.test(node.textContent.trim())&&node.querySelectorAll('button,a').length<=8)){
    parent.classList.add('pb1172RetiredQuickAccess');
   }
  }
 }
 // Older order/album views render a different shortcut card with only this
 // exact heading. Find a compact dedicated card, never the order list itself.
 for(const title of root.querySelectorAll('h2,h3,h4,h5,h6,legend,summary,strong')){
  if(title.textContent.replace(/\\s+/g,' ').trim()!=='دسترسی سریع')continue;
  let candidate=null,depth=0;
  for(let parent=title.parentElement;parent&&parent!==root&&depth++<5;parent=parent.parentElement){
   const text=parent.textContent.replace(/\\s+/g,' ').trim();
   const actions=parent.querySelectorAll('button,a').length;
   if(text.startsWith('دسترسی سریع')&&text.length<=420&&actions>0&&actions<=8){
    candidate=parent;
   }else if(candidate)break;
  }
  (candidate||title).classList.add('pb1172RetiredQuickAccess');
 }
}
function navigate(path){if(location.pathname===path)return;history.pushState(null,'',path);dispatchEvent(new PopStateEvent('popstate'));}
function clearDesktop(){document.querySelectorAll('.labRoleWorkspace .pb1172RetiredQuickAccess').forEach(x=>x.classList.remove('pb1172RetiredQuickAccess'));document.querySelectorAll('.labRoleWorkspace .pb1147LabNav,.labRoleWorkspace .pb1148SecondaryHeader,.labRoleWorkspace .pb1148LabAvatar,.labRoleWorkspace .pb1148Manager').forEach(x=>x.remove());document.querySelectorAll('.pb1148HasSecondary,.pb1148SecondarySource,.pb1147LabAdminHeader').forEach(x=>x.classList.remove('pb1148HasSecondary','pb1148SecondarySource','pb1147LabAdminHeader'));}
function render(){scheduled=false;if(!media.matches){clearDesktop();return;}if(!location.pathname.startsWith('/lab'))return;const h=document.querySelector('.labRoleWorkspace .labSingleHeader');if(!h||!h.querySelector('.settingsIconBtn,.mobileHeaderSettings'))return;h.classList.add('pb1147LabAdminHeader');paintIdentity(h);secondary(h);retireQuickAccess();
 let nav=h.querySelector('.pb1147LabNav');if(!nav){nav=document.createElement('nav');nav.className='pb1147LabNav';nav.setAttribute('aria-label','سفارش‌ها و تنظیمات لابراتوار');
  for(const [title,selector]of [['سفارش چاپ','.labPrintTopNav'],['سفارش آلبوم','.albumTopNav'],['آرشیو','.labArchiveHeaderBtn'],['مالی','.labFinanceHeaderBtn']]){if(!h.querySelector(selector))continue;if(selector==='.labArchiveHeaderBtn'&&nav.children.length){const line=document.createElement('span');line.className='pb1147Divider';line.setAttribute('aria-hidden','true');nav.append(line);}const button=document.createElement('button');button.type='button';const label=document.createElement('span');label.className='pb1149NavLabel';label.textContent=title;button.append(label);button.dataset.source=selector;button.onclick=()=>h.querySelector(selector)?.click();nav.append(button);}
  const divider=document.createElement('span');divider.className='pb1147Divider';divider.setAttribute('aria-hidden','true');nav.append(divider);
  categories.forEach(([title,path],index)=>{const button=document.createElement('button');button.type='button';const label=document.createElement('span');label.className='pb1149NavLabel';label.textContent=title;button.append(label);button.dataset.category=index;button.onclick=()=>{const original=document.querySelectorAll('.labSettingsCategoryTabs>button')[index];if(original)original.click();else navigate(path);};nav.append(button);});
  nav.addEventListener('click',e=>{if(!e.target.closest('button')||matchMedia('(prefers-reduced-motion:reduce)').matches)return;document.querySelector('.labRolePageScrollArea')?.animate([{opacity:.7,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});});h.append(nav);
 }
 const section=location.pathname.split('/')[3]||'general';nav.querySelectorAll('button').forEach(button=>{const original=button.dataset.source&&h.querySelector(button.dataset.source);const active=original?original.classList.contains('active'):button.dataset.category!==undefined&&(location.pathname.startsWith('/lab/settings')||location.pathname==='/lab/wallet')&&categories[Number(button.dataset.category)][2].includes(location.pathname==='/lab/wallet'?'wallet':section);button.classList.toggle('active',!!active);button.setAttribute('aria-current',active?'page':'false');});
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render)}
function start(){schedule();new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,characterData:true});addEventListener('popstate',schedule);addEventListener('photobridge-auth-session-changed',()=>{epoch++;loaded=false;loading=false;avatar='';manager='';schedule();});media.addEventListener('change',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();
