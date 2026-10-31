(()=>{
  if(!location.pathname.startsWith('/admin'))return;
  if(window.__PB_R100F10_ADMIN_PHOTO_GROUPS__)return;window.__PB_R100F10_ADMIN_PHOTO_GROUPS__=true;
  const state={rows:[],loading:false,stamp:0};
  const typeTitle=t=>({site:'عضویت مستقیم از سایت',photographer:'دعوت‌شده توسط عکاسی',lab:'دعوت‌شده توسط لابراتوار',rental:'دعوت‌شده توسط فروشگاه',admin:'عضویت ادمین PhotoBridge'}[t]||'سایر عضویت‌ها');
  async function load(){if(state.loading)return;state.loading=true;try{const r=await fetch('/api/admin/photographers',{credentials:'same-origin',cache:'no-store'});const j=await r.json().catch(()=>({}));if(r.ok&&Array.isArray(j.photographers)){state.rows=j.photographers;state.stamp=Date.now()}}catch{}finally{state.loading=false}}
  function active(){return [...document.querySelectorAll('.adminTabs button.active')].some(b=>String(b.textContent||'').trim()==='عکاس‌ها')}
  function decorate(){
    if(!active())return;
    const table=document.querySelector('.adminPhotographersTable table');if(!table)return;
    const th=table.querySelector('thead th:nth-child(3)');if(th&&th.textContent!=='منشأ عضویت')th.textContent='منشأ عضویت';
    const rows=[...table.querySelectorAll('tbody>tr')].filter(r=>r.children.length>=6);
    if(!rows.length)return;
    if(state.rows.length!==rows.length){load().then(()=>requestAnimationFrame(decorate));return;}
    let prev='';
    rows.forEach((tr,i)=>{
      const p=state.rows[i]||{},type=String(p.membership_source_type||'site'),label=String(p.membership_source_label||p.lab_names||'سایت');
      tr.dataset.pbMembershipSource=type;
      if(type!==prev){tr.dataset.pbSourceStart='1';tr.dataset.pbSourceTitle=typeTitle(type);prev=type}else{delete tr.dataset.pbSourceStart;delete tr.dataset.pbSourceTitle}
      const cell=tr.children[2];if(cell){cell.classList.add('pbR100F10OriginCell');const b=cell.querySelector('b');if(b&&b.textContent!==label)b.textContent=label;const small=cell.querySelector('small');if(small){const connected=String(p.connected_lab_names||'').trim(),next=connected?`اتصال فعلی: ${connected}`:'منشأ عضویت اولیه';if(small.textContent!==next)small.textContent=next;}}
    });
  }
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{decorate();if(active()&&!state.rows.length)load().then(decorate)},60)};
  document.addEventListener('click',e=>{if(e.target.closest?.('.adminTabs button'))schedule()},true);
  const root=document.getElementById('root')||document.body;new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  addEventListener('DOMContentLoaded',()=>{load().then(decorate)},{once:true});schedule();
})();
