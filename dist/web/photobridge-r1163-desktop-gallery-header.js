/* R1163 — desktop photographer tools in primary header, manager filters beneath it. */
(()=>{
 'use strict';
 if(!window.matchMedia('(min-width:821px)').matches)return;
 const svgPower='<svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M6.5 5.8a9 9 0 1 0 11 0"/></svg>';
 let frame=0;
 const find=(root,selector)=>root?.querySelector(selector)||null;
 const title=el=>[el?.getAttribute('title'),el?.getAttribute('aria-label'),el?.textContent].filter(Boolean).join(' ');
 const nativeHeader=()=>document.getElementById('photographerRoleHeaderV710');
 const chooseSource=(sources,key)=>{
  if(key==='settings')return sources.find(b=>b.classList.contains('settingsIconBtn')||/تنظیمات/.test(title(b)));
  if(key==='invite')return sources.find(b=>b.classList.contains('photographerInviteHeaderBtn')||/دعوت همکار/.test(title(b)));
  return sources.find(b=>/اعلان|اطلاع|زنگوله/.test(title(b))||/notif|bell/i.test(b.className));
 };
 function syncAvatar(identity){
  let button=find(identity,'.pb1163ProfileButton');
  if(!button){
   button=document.createElement('button');button.type='button';button.className='pb1163ProfileButton';
   button.title='عکس پروفایل';button.setAttribute('aria-label','انتخاب عکس پروفایل عکاسی');
   button.addEventListener('click',()=>{
    const avatar=document.getElementById('pbF37AvatarBtn');
    const input=document.getElementById('pbF37AvatarInput');
    if(avatar)avatar.click();
    else if(input)input.click();
   });
   identity.prepend(button);
  }
  const native=document.getElementById('pbF37AvatarBtn');
  const source=native?.querySelector('img')||nativeHeader()?.querySelector('.pb1124Avatar img');
  const image=source?.getAttribute('src')||'';
  if(button.dataset.image===image)return;
  button.dataset.image=image;
  button.replaceChildren();
  if(image){const img=document.createElement('img');img.src=image;img.alt='عکس پروفایل';button.append(img);}
  else{
   const initial=(native?.textContent||identity.querySelector('h1')?.textContent||'ع').trim().charAt(0)||'ع';
   button.textContent=initial;
  }
 }
 function sync(){
  frame=0;
  const chrome=document.getElementById('pb1126DesktopHeader');
  if(!chrome)return;
  const identity=find(chrome,'.photographerHeaderIdentity'),primary=find(chrome,'.pb1124PrimaryActions'),row=find(chrome,'.pb1126Secondary');
  if(!identity||!primary||!row)return;
  syncAvatar(identity);
  const exit=find(primary,'.pb1124Exit');
  if(exit&&exit.dataset.pb1163Power!=='1'){
   exit.dataset.pb1163Power='1';exit.type='button';exit.title='خروج';exit.setAttribute('aria-label','خروج');
   exit.innerHTML=svgPower;
  }
  let actions=find(primary,'.pb1163HeaderTools');
  if(!actions){actions=document.createElement('div');actions.className='pb1163HeaderTools';const wallet=find(primary,'.pb1124Wallet');wallet?.after(actions);}
  const native=nativeHeader();
  const sources=[...native?.querySelectorAll('.roleHeaderToolButtons button')||[]].filter(b=>!b.classList.contains('headerLogoutBtn')&&!b.classList.contains('headerWalletBadge'));
  const selected=['settings','notifications'].map(k=>[k,chooseSource(sources,k)]).filter(([,b])=>!!b);
  const signature=selected.map(([k,b])=>k+':'+b.outerHTML).join('|');
  if(actions.dataset.source!==signature){
   actions.replaceChildren();
   for(const [kind,original] of selected){
    const button=document.createElement('button');button.type='button';button.className='pb1163HeaderTool pb1163-'+kind;
    button.title=kind==='settings'?'تنظیمات عکاسی':'اعلان‌ها';
    button.setAttribute('aria-label',button.title);
    button.textContent=kind==='settings'?'⚙':'🔔';
    button.addEventListener('click',()=>{if(kind==='settings'&&typeof window.pb1126OpenPhotographerWindow==='function'){window.pb1126OpenPhotographerWindow('settings');return;}const live=chooseSource([...nativeHeader()?.querySelectorAll('.roleHeaderToolButtons button')||[]],kind);if(live?.isConnected)live.click();});
    actions.append(button);
   }
   actions.dataset.source=signature;
  }
  const active=find(chrome,'.pb1126MainNav>button.active')?.dataset.pb1126Kind;
  const manager=active==='gallery'?find(document,'.clientGalleryManager'):null;
  const managing=!!manager;
  chrome.classList.toggle('pb1163GalleryManager',managing);
  // The secondary row is reserved for gallery navigation while a gallery is open.
  if(managing){
   const originals=find(manager,'.clientGalleryManagerViewTabs');
   const back=find(manager,'.clientGalleryManagerTop .backBtn');
   const tabs=[...originals?.querySelectorAll('button')||[]];
   if(back&&tabs.length===2){
    let bar=find(row,'.pb1163ManagerRow');
    if(!bar){row.replaceChildren();bar=document.createElement('div');bar.className='pb1163ManagerRow';row.append(bar);}
    if(bar.querySelectorAll(':scope > button').length!==3){
     bar.replaceChildren();
     const make=(source,role)=>{
      const b=document.createElement('button');b.type='button';b.className='pb1163ManagerAction';
      b.dataset.kind=role;b.addEventListener('click',()=>{
        const live=find(document,'.clientGalleryManager');
        const target=role==='back'?find(live,'.clientGalleryManagerTop .backBtn'):
          [...find(live,'.clientGalleryManagerViewTabs')?.querySelectorAll('button')||[]][role==='all'?0:1];
        if(!target?.isConnected)return;
        const changed=role!=='back'&&!target.classList.contains('active');
        const animate=changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
        // The same press + content-reveal pairing used by the desktop Store tabs.
        // Animate the mounted button before React swaps the filtered gallery.
        if(animate){
          b.animate?.([{transform:'translateY(3px) scale(.96)',opacity:.7},{transform:'translateY(-1px) scale(1.015)',opacity:1},{transform:'translateY(0) scale(1)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
        }
        target.click();
        if(animate&&window.__PB_ALLOW_WHOLE_PAGE_MOTION__===true){
          // React commits the selected/all view on the next frame; animate the
          // visible gallery section rather than querying a nonexistent grid.
          requestAnimationFrame(()=>requestAnimationFrame(()=>{
            const current=find(document,'.clientGalleryManager');
            const content=find(current,'.clientGalleryMediaPanel')||find(current,'.clientGalleryMediaGrid')||find(current,'.clientGalleryManagerGrid')||current;
            content?.animate?.([{opacity:.85},{opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
          }));
        }
       });
      bar.append(b);
      return b;
     };
     make(back,'back');make(tabs[0],'all');make(tabs[1],'selected');
    }
    const controls=[back,...tabs];
    [...bar.querySelectorAll(':scope > button')].forEach((button,i)=>{
     const source=controls[i];
     if(i===0){const text=source.textContent.trim();if(button.textContent!==text)button.textContent=text;}
     else{
       const label=source.querySelector('span')?.textContent?.trim()||source.textContent.trim();
       const count=source.querySelector('b')?.textContent?.trim()||'۰';
       if(button.dataset.label!==label||button.dataset.count!==count){
         const name=document.createElement('span');name.className='pb1164TabLabel';name.textContent=label;
         const badge=document.createElement('b');badge.className='pb1164TabCount';badge.textContent=count;
         button.replaceChildren(name,badge);button.dataset.label=label;button.dataset.count=count;
       }
       button.setAttribute('aria-label',label+' · '+count);
     }
     button.classList.toggle('active',i>0&&source.classList.contains('active'));
     if(i>0)button.setAttribute('aria-selected',source.getAttribute('aria-selected')||'false');
    });
    let indicator=find(bar,'.pb1164MovingIndicator');
    if(!indicator){
      indicator=document.createElement('span');indicator.className='pb1164MovingIndicator';indicator.setAttribute('aria-hidden','true');bar.append(indicator);
    }
    const activeButton=find(bar,'button.active');
    if(activeButton){
      const base=bar.getBoundingClientRect(),rect=activeButton.getBoundingClientRect();
      const width=Math.max(18,rect.width-16)+'px',offset=Math.round(rect.left-base.left+8)+'px';
      if(!indicator.dataset.ready)indicator.style.transition='none';
      if(indicator.style.width!==width)indicator.style.width=width;
      const position='translateX('+offset+')';
      if(indicator.style.transform!==position)indicator.style.transform=position;
      if(indicator.style.opacity!=='1')indicator.style.opacity='1';
      if(!indicator.dataset.ready){indicator.dataset.ready='1';requestAnimationFrame(()=>indicator.isConnected&&indicator.style.removeProperty('transition'));}
    }
   }
   row.classList.add('pb1163GalleryManagerRow');
  }else{
   row.classList.remove('pb1163GalleryManagerRow');
   if(row.querySelector('.pb1163ManagerRow'))row.replaceChildren();
   // Keep the actual Print/Store navigation untouched. Gallery utility buttons now live upstairs.
   if(active==='gallery'){
    for(const button of [...row.querySelectorAll(':scope>button')]){
     if(['settings','notifications','invite'].some(k=>chooseSource([button],k)))button.style.setProperty('display','none','important');
    }
   }
  }
 }
 const schedule=()=>{if(frame)return;frame=requestAnimationFrame(sync);};
 const boot=()=>{
  schedule();
  const root=document.getElementById('root')||document.body;
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-selected']});
  new MutationObserver(schedule).observe(document.body,{subtree:false,childList:true});
  const check=setInterval(()=>{if(document.getElementById('pb1126DesktopHeader')){clearInterval(check);const chrome=document.getElementById('pb1126DesktopHeader');new MutationObserver(schedule).observe(chrome,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-selected']});schedule();}},150);
  window.addEventListener('popstate',schedule);window.addEventListener('pageshow',schedule);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();
