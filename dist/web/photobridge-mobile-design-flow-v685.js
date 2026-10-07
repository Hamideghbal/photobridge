/* PhotoBridge v0.17.685 — deterministic Album/Instagram mode, zero delayed DOM switching. */
(()=>{
  'use strict';
  const VERSION='0.17.685';
  function normalizePath(p){p=String(p||'/').split('?')[0].replace(/\/+$/,'');return p||'/'}
  function routeMode(){
    const p=normalizePath(location.pathname),q=new URLSearchParams(location.search);
    const requested=String(q.get('pb_mode')||q.get('mode')||q.get('designKind')||'').toLowerCase();
    if(requested==='instagram')return 'instagram';
    if(requested==='album'||requested==='classic'||requested==='panorama')return 'album';
    if(p==='/instagram-post-design/start')return 'instagram';
    if(p==='/album-design/start'||/^\/photographer\/album-design(?:\/|$)/.test(p))return 'album';
    const globalMode=String(window.__PB_PUBLIC_DESIGN_MODE__||'').toLowerCase();
    return globalMode==='instagram'||globalMode==='album'?globalMode:'';
  }
  function installStyle(){
    if(document.getElementById('pb685-mobile-design-style'))return;
    const s=document.createElement('style');s.id='pb685-mobile-design-style';s.textContent=`
      body.pb685DesignDedicated .photographerAlbumDesignCatalog .albumProjectDock{display:none!important}
      body.pb685DesignDedicated .photographerAlbumDesignCatalog .albumSlideshowExportSwitch{display:none!important}
      body.pb685InstagramOnly .photographerAlbumDesignCatalog .albumDesignSizeButtons,
      body.pb685InstagramOnly .photographerAlbumDesignCatalog .albumDesignGroupButtons,
      body.pb685InstagramOnly .photographerAlbumDesignCatalog .albumDesignMobilePicker>label{display:none!important}
      @media(max-width:820px),(pointer:coarse){
        body.pb685AlbumOnly .photographerAlbumDesignCatalog .albumDesignMobilePicker>label:nth-child(2){display:none!important}
      }
    `;document.head.appendChild(s);
  }
  function sync(){
    installStyle();
    const mode=routeMode(),b=document.body;if(!b)return;
    b.classList.toggle('pb685DesignDedicated',!!mode);
    b.classList.toggle('pb685InstagramOnly',mode==='instagram');
    b.classList.toggle('pb685AlbumOnly',mode==='album');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  window.addEventListener('popstate',sync,{passive:true});
  window.addEventListener('pageshow',sync,{passive:true});
  console.info('[PhotoBridge] deterministic Album/Instagram mode',VERSION);
})();
