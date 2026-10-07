/* PhotoBridge R100F25 — photographer header menu + persistent account avatar. */
(()=>{
  'use strict';
  if(window.__PB_R100F25_HEADER_MENU_AVATAR__)return;
  window.__PB_R100F25_HEADER_MENU_AVATAR__=true;
  const $=s=>document.querySelector(s);
  let me=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function initials(){
    const name=String(me?.user?.photographerName||me?.user?.name||$('#storePhotographerName')?.textContent||'ع').replace(/^عکاسی\s*/, '').trim();
    return (name||'ع').slice(0,1);
  }
  function syncBadge(){
    const src=$('#storeNotificationBadgeMobile')||$('#storeNotificationBadgeDesktop'), dst=$('#pbR100F25MenuBadge');
    if(!dst)return;
    const hidden=!src||src.hidden||!String(src.textContent||'').trim();
    dst.hidden=hidden; if(!hidden)dst.textContent=src.textContent;
  }
  function renderAvatar(data){
    const b=$('#pbR100F25AvatarBtn');if(!b)return;
    if(data){b.innerHTML=`<img src="${esc(data)}" alt="عکس پروفایل عکاس">`;}
    else b.innerHTML=`<span class="pbF25AvatarFallback">${esc(initials())}</span>`;
  }
  function resizeAvatar(file){
    return new Promise((resolve,reject)=>{
      if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))return reject(new Error('invalid_image'));
      if(file.size>8*1024*1024)return reject(new Error('too_large'));
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('read_failed'));
      reader.onload=()=>{
        const img=new Image();
        img.onerror=()=>reject(new Error('decode_failed'));
        img.onload=()=>{
          const side=Math.max(1,Math.min(img.naturalWidth,img.naturalHeight)),sx=Math.max(0,(img.naturalWidth-side)/2),sy=Math.max(0,(img.naturalHeight-side)/2);
          const c=document.createElement('canvas');c.width=192;c.height=192;
          const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,192,192);x.drawImage(img,sx,sy,side,side,0,0,192,192);
          resolve(c.toDataURL('image/jpeg',.84));
        };
        img.src=String(reader.result||'');
      };
      reader.readAsDataURL(file);
    });
  }
  async function saveAvatar(data){
    const r=await fetch('/api/photographer/profile/avatar',{method:'PUT',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({imageData:data})});
    const out=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(out.error||'avatar_save_failed'),{status:r.status});
    return out;
  }
  function trigger(id){
    const el=document.getElementById(id);if(el){el.click();return true}return false;
  }
  function closeMenu(){const p=$('#pbR100F25MenuPanel'),b=$('#pbR100F25MenuBtn');p?.classList.remove('open');b?.setAttribute('aria-expanded','false')}
  function toggleMenu(){const p=$('#pbR100F25MenuPanel'),b=$('#pbR100F25MenuBtn');if(!p||!b)return;const open=!p.classList.contains('open');p.classList.toggle('open',open);b.setAttribute('aria-expanded',open?'true':'false')}
  function ensureStoreBottomLabel(){
    const btn=$('#photographerStoreBottomNav [data-store-home]');if(!btn)return;let em=btn.querySelector('em');if(!em){em=document.createElement('em');btn.appendChild(em)}if(em.textContent!=='فروشگاه')em.textContent='فروشگاه';
  }
  function build(){
    const header=$('#photographerStoreRoleHeader'),identity=header?.querySelector('.photographerHeaderIdentity');if(!header||!identity)return false;
    ensureStoreBottomLabel();
    if(!$('#pbR100F25AvatarBtn')){
      const avatar=document.createElement('button');avatar.id='pbR100F25AvatarBtn';avatar.type='button';avatar.title='انتخاب عکس پروفایل';avatar.setAttribute('aria-label','انتخاب عکس پروفایل');
      const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;input.id='pbR100F25AvatarInput';
      avatar.addEventListener('click',()=>input.click());
      input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file)return;avatar.disabled=true;try{const data=await resizeAvatar(file);renderAvatar(data);await saveAvatar(data);if(me?.user)me.user.photographerAvatarData=data}catch(e){alert(e.message==='too_large'?'حجم عکس زیاد است.':'ذخیره عکس پروفایل انجام نشد.')}finally{avatar.disabled=false}});
      identity.prepend(avatar);header.appendChild(input);
    }
    if(!$('#pbR100F25MenuBtn')){
      const btn=document.createElement('button');btn.id='pbR100F25MenuBtn';btn.type='button';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','pbR100F25MenuPanel');btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg><span>منو</span><i id="pbR100F25MenuBadge" class="pbF25MenuBadge" hidden></i>';
      btn.addEventListener('click',e=>{e.stopPropagation();toggleMenu()});header.appendChild(btn);
      const panel=document.createElement('div');panel.id='pbR100F25MenuPanel';panel.setAttribute('role','menu');
      const items=[
        ['اعلان‌ها','پیام‌ها و وضعیت‌ها','🔔','storeNotificationBtn',''],
        ['اعتبار خدمات','کیف پول PhotoBridge','◫','storeWalletBtn',''],
        ['تنظیمات عکاسی','پروفایل و موقعیت','⚙','storeSettingsBtn',''],
        ['دعوت همکار','مدیریت دعوت‌ها','＋','storeInviteBtn',''],
        ['نصب برنامه','نسخه موبایل PhotoBridge','↧','storeInstallBtn',''],
        ['خروج از حساب','','⏻','storeLogoutBtn','danger']
      ];
      panel.innerHTML=items.map(([t,s,i,id,c])=>`<button type="button" role="menuitem" data-pbf25-target="${id}" class="${c}"><span class="pbF25MenuIcon">${i}</span><span class="pbF25MenuText"><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('');
      panel.addEventListener('click',e=>{const b=e.target.closest('[data-pbf25-target]');if(!b)return;closeMenu();trigger(b.dataset.pbf25Target)});document.body.appendChild(panel);
      document.addEventListener('click',e=>{if(!e.target.closest('#pbR100F25MenuPanel,#pbR100F25MenuBtn'))closeMenu()},true);
      document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
    }
    renderAvatar(me?.user?.photographerAvatarData||'');syncBadge();ensureStoreBottomLabel();
    const bottom=$('#photographerStoreBottomNav');if(bottom&&!bottom.__pbf25Observed){bottom.__pbf25Observed=true;new MutationObserver(ensureStoreBottomLabel).observe(bottom,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})}
    const badge=$('#storeNotificationBadgeMobile')||$('#storeNotificationBadgeDesktop');if(badge&&!badge.__pbf25Observed){badge.__pbf25Observed=true;new MutationObserver(syncBadge).observe(badge,{attributes:true,childList:true,characterData:true,subtree:true})}
    return true;
  }
  async function init(){
    try{const r=await fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok)me=await r.json()}catch{}
    if(build())return;
    const mo=new MutationObserver(()=>{if(build())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>{build();mo.disconnect()},3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
