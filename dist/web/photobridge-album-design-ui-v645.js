(()=>{
  'use strict';
  const VERSION='0.17.645';
  function pathMode(){
    const p=location.pathname;
    if(p==='/instagram-post-design/start')return 'instagram';
    if(p==='/album-design/start')return 'album';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return 'album';
    const m=String(window.__PB_PUBLIC_DESIGN_MODE__||'');
    return m==='instagram'?'instagram':m==='album'?'album':'';
  }
  function installStyle(){
    if(document.getElementById('pb645-album-ui-style'))return;
    const s=document.createElement('style');s.id='pb645-album-ui-style';s.textContent=`
      body.pb645DesignDedicated .photographerAlbumDesignCatalog .albumProjectDock{display:none!important}
      body.pb645DesignDedicated .photographerAlbumDesignCatalog .pb645HiddenBatchAction{display:none!important}
      body.pb645DesignDedicated .photographerAlbumDesignCatalog .pb645HiddenSlideshow{display:none!important}
      body.pb645DesignDedicated .photographerAlbumDesignCatalog .albumDesignGroupButtons{display:none!important}
      body.pb645DesignDedicated .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.mode{display:none!important}
      body.pb645InstagramOnly .photographerAlbumDesignCatalog .albumDesignSizeButtons{display:none!important}
      body.pb645InstagramOnly .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.size{display:none!important}
      @media(min-width:821px){body.pb645DesignDedicated .photographerAlbumDesignCatalog .albumDesignCatalogFilters>button{display:none!important}body.pb645DesignDedicated .photographerAlbumDesignCatalog .albumDesignCompactPicker{grid-template-columns:1fr!important}}
    `;document.head.appendChild(s);
  }
  function groupButtons(root){return Array.from(root.querySelectorAll('.albumDesignGroupButtons button'))}
  function buttonKind(btn){const t=String(btn?.textContent||'').trim();return /اینستاگرام|instagram/i.test(t)?'instagram':/اسلایدشو|slideshow/i.test(t)?'slideshow':/آلبوم|album/i.test(t)?'album':''}
  function ensureDedicatedGroup(root,mode){
    if(!mode)return;
    const buttons=groupButtons(root),target=buttons.find(b=>buttonKind(b)===mode);
    for(const b of buttons){const k=buttonKind(b);b.classList.toggle('pb645HiddenSlideshow',k==='slideshow');if(k!==mode)b.style.display='none';else b.style.display=''}
    if(target&&!target.classList.contains('active')&&!target.dataset.pb645Switching){target.dataset.pb645Switching='1';target.click();setTimeout(()=>delete target.dataset.pb645Switching,80);return false}
    return true;
  }
  function cleanMobileSheets(mode){
    document.querySelectorAll('.albumDesignMobileCatalogPickerChoices button,.pb602MobilePickerChoices button').forEach(btn=>{
      const k=buttonKind(btn);if(k&&k!==mode)btn.style.display='none';if(k==='slideshow')btn.classList.add('pb645HiddenSlideshow');
    });
    if(mode==='instagram')document.querySelectorAll('.albumDesignMobileCatalogPickerSheet').forEach(sheet=>{const h=String(sheet.querySelector('header')?.textContent||'');if(/سایز/.test(h))sheet.closest('.albumDesignMobileCatalogPickerBackdrop')?.remove()});
  }
  function decorate(){
    const mode=pathMode();
    if(!mode){document.body?.classList.remove('pb645DesignDedicated','pb645InstagramOnly','pb645AlbumOnly');return}
    installStyle();document.body?.classList.add('pb645DesignDedicated');document.body?.classList.toggle('pb645InstagramOnly',mode==='instagram');document.body?.classList.toggle('pb645AlbumOnly',mode==='album');
    const root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    if(!ensureDedicatedGroup(root,mode)){setTimeout(decorate,90);return}
    root.querySelectorAll('button').forEach(btn=>{const text=String(btn.textContent||'').replace(/\s+/g,' ').trim();if(/افزودن به آلبوم|ذخیره تغییرات صفحه|پروژه جدید/.test(text))btn.classList.add('pb645HiddenBatchAction');if(/اسلایدشو|slideshow/i.test(text))btn.classList.add('pb645HiddenSlideshow')});
    root.querySelectorAll('option').forEach(opt=>{if(/اسلایدشو|slideshow/i.test(String(opt.textContent||'')))opt.hidden=true});
    const mobileTitle=root.querySelector('.albumDesignMobileCatalogHeader>span');if(mobileTitle)mobileTitle.textContent=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';
    if(mode==='instagram'){
      root.querySelectorAll('.albumDesignMobilePickerButton.size,.albumDesignSizeButtons').forEach(x=>x.style.display='none');
    }else{
      root.querySelectorAll('.albumDesignMobilePickerButton.size,.albumDesignSizeButtons').forEach(x=>x.style.removeProperty('display'));
    }
    cleanMobileSheets(mode);
    document.querySelectorAll('a[href^="/slideshow-design"]').forEach(a=>a.style.display='none');
  }
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(decorate,80)};
  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',schedule);document.addEventListener('click',()=>setTimeout(schedule,25),true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  console.info('[PhotoBridge] album design UI patch',VERSION);
})();
