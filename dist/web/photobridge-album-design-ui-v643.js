(()=>{
  'use strict';
  const VERSION='0.17.643';
  function isPhotographerAlbum(){return /^\/photographer\/album-design(?:\/|$)/.test(location.pathname)}
  function installStyle(){
    if(document.getElementById('pb643-album-ui-style'))return;
    const s=document.createElement('style');s.id='pb643-album-ui-style';s.textContent=`
      body.pb643PhotographerAlbumSinglePage .photographerAlbumDesignCatalog .albumProjectDock{display:none!important}
      body.pb643PhotographerAlbumSinglePage .photographerAlbumDesignCatalog .pb643HiddenBatchAction{display:none!important}
      body.pb643PhotographerAlbumSinglePage .photographerAlbumDesignCatalog .pb643HiddenSlideshow{display:none!important}
    `;document.head.appendChild(s);
  }
  function decorate(){
    if(!isPhotographerAlbum()){document.body?.classList.remove('pb643PhotographerAlbumSinglePage');return}
    installStyle();document.body?.classList.add('pb643PhotographerAlbumSinglePage');
    const root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    root.querySelectorAll('button').forEach(btn=>{
      const text=String(btn.textContent||'').replace(/\s+/g,' ').trim();
      if(/افزودن به آلبوم|ذخیره تغییرات صفحه|پروژه جدید/.test(text))btn.classList.add('pb643HiddenBatchAction');
      if(/اسلایدشو|slideshow/i.test(text))btn.classList.add('pb643HiddenSlideshow');
    });
    root.querySelectorAll('option').forEach(opt=>{if(/اسلایدشو|slideshow/i.test(String(opt.textContent||'')))opt.hidden=true});
    const activeSlideshow=[...root.querySelectorAll('button.active')].find(b=>/اسلایدشو|slideshow/i.test(String(b.textContent||'')));
    if(activeSlideshow){const album=[...root.querySelectorAll('button')].find(b=>/آلبوم حرفه‌ای|^\s*آلبوم\s*$/i.test(String(b.textContent||''))&&!b.classList.contains('pb643HiddenSlideshow'));album?.click()}
  }
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(decorate,90)};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',schedule);document.addEventListener('click',()=>setTimeout(schedule,30),true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  console.info('[PhotoBridge] album design UI patch',VERSION);
})();
