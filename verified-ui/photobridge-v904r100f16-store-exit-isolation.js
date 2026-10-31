/* PhotoBridge R100F16 — store exits always use a clean full-page photographer navigation. */
(()=>{
  'use strict';
  if(window.__PB_R100F16_STORE_EXIT_ISOLATION__)return;
  window.__PB_R100F16_STORE_EXIT_ISOLATION__=true;
  if(!/^\/equipment-rental\/book(?:\/|$)/.test(location.pathname))return;

  const clean=raw=>{
    const u=new URL(raw,location.href);
    if(u.origin===location.origin&&/^\/photographer(?:\/|$)/.test(u.pathname)){
      const isPrint=new URLSearchParams(u.search).get('workspace')==='print'||/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(u.pathname);
      if(!isPrint){u.searchParams.delete('workspace');u.searchParams.delete('pbLabChooser');u.searchParams.delete('pbEntryDone')}
    }
    return u.href;
  };
  document.addEventListener('click',e=>{
    const el=e.target?.closest?.('[data-main-href]');if(!el)return;
    const href=String(el.dataset.mainHref||'').trim();if(!href)return;
    const u=new URL(href,location.href);if(u.origin!==location.origin||!/^\/photographer(?:\/|$)/.test(u.pathname))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
    document.body.classList.remove('pbR96ChoosingStore');
    document.documentElement.classList.remove('pbR67SheetOpen');
    location.assign(clean(u.href));
  },true);
})();
