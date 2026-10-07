(()=>{
  if(!location.pathname.startsWith('/photographer/signup'))return;
  const html=document.documentElement;
  html.classList.add('pb904r18InviteScroll');
  const style=document.createElement('style');
  style.id='pb904r18InviteScrollStyle';
  style.textContent=`
    html.pb904r18InviteScroll,html.pb904r18InviteScroll body{height:auto!important;min-height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important}
    html.pb904r18InviteScroll body{position:static!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}
    html.pb904r18InviteScroll body #root{height:auto!important;min-height:100dvh!important;max-height:none!important;overflow:visible!important;position:static!important;touch-action:pan-y!important}
    html.pb904r18InviteScroll body #root .photographerSignupPage{height:auto!important;min-height:100dvh!important;max-height:none!important;overflow:visible!important;position:relative!important;inset:auto!important;touch-action:pan-y!important;padding-bottom:max(32px,env(safe-area-inset-bottom))!important}
    html.pb904r18InviteScroll body #root .photographerSignupShell{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;position:relative!important;touch-action:pan-y!important}
    @media(max-width:850px){html.pb904r18InviteScroll body #root .photographerSignupPage{display:block!important;overflow-y:visible!important}html.pb904r18InviteScroll body #root .photographerSignupShell{display:grid!important;margin-bottom:24px!important}}
  `;
  document.head.appendChild(style);

  const qs=new URLSearchParams(location.search),invite=String(qs.get('invite')||'').trim(),mobile=String(qs.get('mobile')||'').trim(),mb=String(qs.get('mb')||'').trim();
  if(!invite||!mobile)return;
  let context=null,observer=null;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const fetchContext=async()=>{
    const u=new URL('/api/public/photographer-signup/context',location.origin);
    u.searchParams.set('invite',invite);u.searchParams.set('mobile',mobile);if(mb)u.searchParams.set('mb',mb);
    let last=null;
    for(let i=0;i<3;i++){
      try{const r=await fetch(u,{credentials:'same-origin',cache:'no-store'}),j=await r.json().catch(()=>({}));if(r.ok)return j;last={status:r.status,...j};if(r.status>=400&&r.status<500&&r.status!==409)break}catch(e){last=e}
      await sleep(280*(i+1));
    }
    throw last||new Error('context_failed');
  };
  const rewrite=()=>{
    if(!context?.invite||context.invite.issuerType!=='rental')return;
    const page=document.querySelector('.photographerSignupPage');if(!page)return;
    const shop=String(context.invite.issuerRentalShopName||context.invite.issuerName||'فروشگاه تجهیزات').trim();
    page.dataset.pbRentalInvite='1';
    const intro=page.querySelector('.photographerSignupIntro');
    const h1=intro?.querySelector('h1');if(h1&&h1.textContent!==`دعوت از طرف فروشگاه «${shop}»`)h1.textContent=`دعوت از طرف فروشگاه «${shop}»`;
    const paras=Array.from(page.querySelectorAll('p,small,span'));
    for(const el of paras){
      const t=String(el.textContent||'').trim();if(!t)continue;
      if(t.includes('حساب شما شناسایی شده است')){el.textContent=context.existingAccount?`حساب عکاسی شما شناسایی شد. فقط اتصال به فروشگاه «${shop}» را با کد پیامکی تأیید کنید.`:`دعوت عضویت شما از طرف فروشگاه «${shop}» است.`;continue}
      if(t.includes('دعوت')&&t.includes('لابراتوار'))el.textContent=t.replace(/لابراتوار/g,'فروشگاه تجهیزات');
    }
    // Rental invitations must never present the inviter as the admin/studio that happened to send the SMS.
    Array.from(page.querySelectorAll('*')).filter(el=>el.children.length===0).forEach(el=>{
      const t=String(el.textContent||'').trim();
      if(/^از طرف\s+/.test(t)&&!t.includes(shop))el.textContent=`از طرف ${shop}`;
    });
  };
  const watch=()=>{
    if(observer)return;observer=new MutationObserver(()=>rewrite());observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true,characterData:true});rewrite();
  };
  fetchContext().then(ctx=>{
    context=ctx;watch();
    const bad=Array.from(document.querySelectorAll('.photographerSignupPage *')).some(el=>String(el.textContent||'').includes('بررسی حساب فعلی انجام نشد'));
    if(bad){const key=`pb904r18InviteReload:${invite}:${mobile}`;if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');setTimeout(()=>location.reload(),120)}}
  }).catch(()=>{watch()});
})();
