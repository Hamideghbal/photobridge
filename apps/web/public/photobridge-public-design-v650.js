/* PhotoBridge v0.17.660 — public Album/Instagram payment + compact mobile controls */
(function(){
  'use strict';
  var path=location.pathname;
  if(path==='/slideshow-design/start'){location.replace('/album-design');return;}
  var mode=path==='/instagram-post-design/start'?'instagram':path==='/album-design/start'?'album':'';
  window.__PB_PUBLIC_DESIGN_MODE__=mode;
  var nativeFetch=window.fetch.bind(window), popup=null, paymentPromise=null;
  var paidTokens={album_export:'',instagram_export:''}, allowInstagramOnce=false, allowAlbumOnce=false, checkoutInfo=null;
  var decorateScheduled=false,decorating=false;
  function setNodeText(node,text){if(!node)return;var next=String(text==null?'':text);if(node.textContent!==next)node.textContent=next}
  function isInsideManagedFilter(node){return !!(node&&node.nodeType===1&&node.closest&&node.closest('.pb599AlbumFilterBackdrop'))}
  function installAlbumPickerFinalStyle(){
    if(document.getElementById('pb602AlbumPickerStyle'))return;
    var st=document.createElement('style');st.id='pb602AlbumPickerStyle';st.textContent=`
      @keyframes pb603BackdropIn{from{opacity:0}to{opacity:1}}
      @keyframes pb603SheetUp{from{transform:translate3d(0,100%,0);opacity:.92}to{transform:translate3d(0,0,0);opacity:1}}
      @keyframes pb604BackdropOut{from{opacity:1}to{opacity:0}}
      @keyframes pb604SheetDown{from{transform:translate3d(0,0,0);opacity:1}to{transform:translate3d(0,100%,0);opacity:.94}}
      .albumDesignMobileCatalogPickerBackdrop,.pb602MobilePickerBackdrop,.pb599AlbumFilterBackdrop{animation:pb603BackdropIn .20s ease-out both!important}
      .albumDesignMobileCatalogPickerSheet,.pb602MobilePickerSheet,.pb599AlbumFilterSheet{animation:pb603SheetUp .30s cubic-bezier(.22,1,.36,1) both!important;transform-origin:bottom center!important;will-change:transform,opacity!important}
      .albumDesignMobileCatalogPickerBackdrop.pb603Closing,.pb602MobilePickerBackdrop.pb603Closing,.pb599AlbumFilterBackdrop.pb603Closing{animation:pb604BackdropOut .22s ease-in both!important;pointer-events:auto!important;touch-action:none!important}
      .albumDesignMobileCatalogPickerBackdrop.pb603Closing>.albumDesignMobileCatalogPickerSheet,.pb602MobilePickerBackdrop.pb603Closing>.pb602MobilePickerSheet,.pb599AlbumFilterBackdrop.pb603Closing>.pb599AlbumFilterSheet{animation:pb604SheetDown .26s cubic-bezier(.4,0,1,1) both!important}
      @media(prefers-reduced-motion:reduce){.albumDesignMobileCatalogPickerBackdrop,.pb602MobilePickerBackdrop,.pb599AlbumFilterBackdrop,.albumDesignMobileCatalogPickerSheet,.pb602MobilePickerSheet,.pb599AlbumFilterSheet,.albumDesignMobileCatalogPickerBackdrop.pb603Closing,.pb602MobilePickerBackdrop.pb603Closing,.pb599AlbumFilterBackdrop.pb603Closing{animation:none!important}}
      @media(max-width:820px), (pointer:coarse){body.pbPublicDesignMode-instagram .photographerAlbumDesignCatalog .albumDesignMobilePicker>label,body.pbPublicDesignMode-instagram .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.mode,body.pbPublicDesignMode-instagram .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.size{display:none!important}}
      .albumDesignMobileCatalogPickerBackdrop,.albumDesignMobileCatalogPickerBackdrop *,
      .albumDesignMobileCatalogPickerSheet,.albumDesignMobileCatalogPickerSheet *,
      .albumDesignMobileCatalogPickerChoices,.albumDesignMobileCatalogPickerChoices *,
      .albumDesignMobilePicker,.albumDesignMobilePicker *,
      .pb602MobilePickerBackdrop,.pb602MobilePickerBackdrop *,
      .pb599AlbumFilterBackdrop,.pb599AlbumFilterBackdrop *{font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
      .albumDesignMobileCatalogPickerBackdrop,.albumDesignMobileCatalogPickerSheet,.albumDesignMobileCatalogPickerChoices,
      .pb602MobilePickerBackdrop,.pb602MobilePickerSheet,.pb602MobilePickerChoices,
      .pb599AlbumFilterBackdrop,.pb599AlbumFilterSheet{direction:rtl!important;text-align:right!important}
      @media(max-width:820px),(pointer:coarse){
        .albumDesignMobilePicker label{position:relative!important;direction:rtl!important;text-align:right!important}
        .albumDesignMobilePicker label>span{display:block!important;text-align:right!important;direction:rtl!important;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
        .albumDesignMobilePicker select{appearance:none!important;-webkit-appearance:none!important;width:100%!important;direction:rtl!important;text-align:right!important;text-align-last:right!important;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important;font-weight:850!important;padding-inline:28px 9px!important;background:#fff!important;color:#172033!important;touch-action:manipulation!important}
        .albumDesignMobilePicker label:after{content:'⌄';position:absolute!important;left:9px!important;bottom:8px!important;color:#667085!important;font-size:14px!important;font-weight:900!important;pointer-events:none!important}
        .albumDesignCatalogFilters.pb599AlbumFiltersEnhanced.pb603FilterIconMode{display:none!important}
        .albumDesignCatalogFilters.pb599AlbumFiltersEnhanced>label{display:none!important}
        .albumDesignCatalogFilters.pb599AlbumFiltersEnhanced>b{margin:0!important;white-space:nowrap!important;align-self:center!important;color:#667085!important;font:800 9px/1.3 Vazirmatn,Tahoma,Arial,sans-serif!important}
        .pb599AlbumFilterButton.pb603FilterIcon{position:relative!important;display:grid!important;align-items:center!important;justify-items:center!important;place-content:center!important;flex:0 0 40px!important;width:40px!important;min-width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;margin:0!important;border:1px solid #d8e0ea!important;border-radius:12px!important;background:#fff!important;color:#344054!important;box-shadow:0 2px 8px rgba(15,23,42,.06)!important;touch-action:manipulation!important;line-height:0!important;box-sizing:border-box!important}
        .pb599AlbumFilterButton.pb603FilterIcon>span,.pb599AlbumFilterButton.pb603FilterIcon>i{display:none!important}
        .pb599AlbumFilterButton.pb603FilterIcon svg{width:21px!important;height:21px!important;display:block!important;stroke:currentColor!important;margin:auto!important;transform:none!important;place-self:center!important}
        .pb599AlbumFilterButton.pb603FilterIcon.pb603FilterActive{border-color:#9db2ff!important;background:#f4f7ff!important;color:#315efb!important}
        .pb603FilterDot{position:absolute!important;top:6px!important;left:6px!important;width:7px!important;height:7px!important;border-radius:999px!important;background:#315efb!important;box-shadow:0 0 0 2px #fff!important}
        .albumDesignMobilePickerButton.size b{max-width:100%!important;font-size:8.2px!important;line-height:1.2!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;letter-spacing:-.14px!important}
        .albumDesignMobilePickerButton.size.pb603InstagramSize b{font-size:7.15px!important;line-height:1.12!important;letter-spacing:-.28px!important;font-weight:850!important}
        .albumDesignMobileCatalogPickerSheet{max-height:min(78dvh,680px)!important;overflow:hidden!important}
        .albumDesignMobileCatalogPickerSheet>header{direction:rtl!important;text-align:right!important;flex:0 0 auto!important}
        .albumDesignMobileCatalogPickerSheet>header>div{direction:rtl!important;text-align:right!important;justify-items:start!important}
        .albumDesignMobileCatalogPickerChoices{direction:rtl!important;text-align:right!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding:18px 12px calc(46px + env(safe-area-inset-bottom))!important;scroll-padding-top:18px!important;scroll-padding-bottom:46px!important}
        .albumDesignMobileCatalogPickerChoices>button{position:relative!important;z-index:2!important;width:100%!important;min-height:64px!important;padding:11px 12px!important;direction:rtl!important;text-align:right!important;justify-items:start!important;align-content:center!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
        .albumDesignMobileCatalogPickerChoices>button b,.albumDesignMobileCatalogPickerChoices>button small{display:block!important;width:100%!important;direction:rtl!important;text-align:right!important;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
        .albumDesignMobileCatalogPickerChoices>button b{font-size:12px!important;line-height:1.55!important;font-weight:900!important}
        .albumDesignMobileCatalogPickerChoices>button small{font-size:9px!important;line-height:1.65!important}
        .albumDesignMobileCatalogPickerChoices>button:first-child{margin-top:4px!important}
        .albumDesignMobileCatalogPickerChoices>button:last-child{margin-bottom:14px!important}
        .pb602MobilePickerBackdrop{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;background:rgba(2,6,23,.55)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}
        .pb602MobilePickerSheet{width:100%!important;max-height:min(76dvh,640px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#fff!important;border-radius:20px 20px 0 0!important;box-shadow:0 -20px 55px rgba(2,6,23,.28)!important}
        .pb602MobilePickerSheet>header{position:static!important;min-height:58px!important;height:auto!important;padding:10px 12px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;background:#fff!important;border:0!important;border-bottom:1px solid #edf0f4!important;box-shadow:none!important;direction:rtl!important;text-align:right!important}
        .pb602MobilePickerSheet>header>div{display:grid!important;gap:2px!important;text-align:right!important;direction:rtl!important;justify-items:start!important}
        .pb602MobilePickerSheet>header b{font-size:13px!important;line-height:1.5!important;color:#111827!important;font-weight:950!important}
        .pb602MobilePickerSheet>header small{font-size:8.5px!important;line-height:1.55!important;color:#7b8798!important;font-weight:650!important}
        .pb602MobilePickerSheet>header button{width:36px!important;height:36px!important;min-width:36px!important;padding:0!important;border:1px solid #e4e7ec!important;border-radius:10px!important;background:#fff!important;color:#344054!important;font-size:20px!important}
        .pb602MobilePickerChoices{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding:12px 11px calc(28px + env(safe-area-inset-bottom))!important;display:grid!important;gap:7px!important;scroll-padding-top:12px!important;scroll-padding-bottom:28px!important}
        .pb602MobilePickerChoice{width:100%!important;min-height:54px!important;padding:9px 11px!important;border:1px solid #e0e6ed!important;border-radius:12px!important;background:#fff!important;color:#253047!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;direction:rtl!important;text-align:right!important;font:900 11px/1.55 Vazirmatn,Tahoma,Arial,sans-serif!important;touch-action:manipulation!important}
        .pb602MobilePickerChoice .pb602Radio{width:22px!important;height:22px!important;flex:0 0 22px!important;border:2px solid #667085!important;border-radius:999px!important;display:grid!important;place-items:center!important;background:#fff!important}
        .pb602MobilePickerChoice.active{border-color:#6d63d8!important;background:#f7f6ff!important;color:#4038a4!important;box-shadow:0 0 0 2px rgba(109,99,216,.08)!important}
        .pb602MobilePickerChoice.active .pb602Radio{border-color:#2463d4!important;box-shadow:inset 0 0 0 5px #fff!important;background:#2463d4!important}
        .pb602MobilePickerChoice:first-child{margin-top:2px!important}.pb602MobilePickerChoice:last-child{margin-bottom:10px!important}
        .pb599AlbumFilterBackdrop{position:fixed!important;inset:0!important;z-index:2147483645!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;background:rgba(2,6,23,.55)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}
        .pb599AlbumFilterSheet{width:100%!important;max-height:76dvh!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:#fff!important;border-radius:20px 20px 0 0!important;box-shadow:0 -20px 55px rgba(2,6,23,.28)!important}
        .pb599AlbumFilterSheet>header{position:static!important;min-height:56px!important;height:auto!important;padding:10px 12px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;border:0!important;border-bottom:1px solid #edf0f4!important;background:#fff!important;direction:rtl!important;text-align:right!important}
        .pb599AlbumFilterSheet>header>div{display:grid!important;gap:2px!important;text-align:right!important;direction:rtl!important}.pb599AlbumFilterSheet>header b{font-size:14.5px!important;line-height:1.5!important;font-weight:950!important}.pb599AlbumFilterSheet>header small{font-size:9.8px!important;line-height:1.6!important;color:#7b8798!important}.pb599AlbumFilterSheet>header button{width:36px!important;height:36px!important;padding:0!important;border:1px solid #e4e7ec!important;border-radius:10px!important;background:#fff!important;font-size:20px!important}
        .pb599AlbumFilterBody{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;padding:12px 10px calc(18px + env(safe-area-inset-bottom))!important;display:grid!important;gap:11px!important}
        .pb602AlbumFilterRow{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:center!important;gap:8px!important;direction:rtl!important}
        .pb602AlbumFilterRow>strong{font-size:10.5px!important;line-height:1.5!important;font-weight:950!important;color:#475467!important;white-space:nowrap!important;text-align:right!important}
        .pb602AlbumFilterRow .pb599AlbumFilterChoices{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:5px!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;direction:rtl!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important;padding:2px 1px!important}
        .pb602AlbumFilterRow .pb599AlbumFilterChoices::-webkit-scrollbar{display:none!important}
        .pb602AlbumFilterRow .pb599AlbumFilterChoices button{flex:0 0 auto!important;min-height:40px!important;min-width:0!important;padding:7px 10px!important;border:1px solid #e0e6ed!important;border-radius:11px!important;background:#fff!important;color:#344054!important;font:850 10.4px/1.35 Vazirmatn,Tahoma,Arial,sans-serif!important;white-space:nowrap!important;direction:rtl!important}
        .pb602AlbumFilterRow .pb599AlbumFilterChoices button.active{border-color:#7267d8!important;background:#f6f5ff!important;color:#4038a4!important;box-shadow:0 0 0 2px rgba(114,103,216,.08)!important}
        .pb599AlbumFilterActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin-top:4px!important}.pb599AlbumFilterReset,.pb599AlbumFilterApply{min-height:44px!important;border-radius:11px!important;font:850 10.2px Vazirmatn,Tahoma,Arial,sans-serif!important}.pb599AlbumFilterReset{border:1px dashed #cbd5e1!important;background:#f8fafc!important;color:#475569!important}.pb599AlbumFilterApply{border:1px solid #315efb!important;background:#315efb!important;color:#fff!important}
      }
    `;document.head.appendChild(st);
  }
  function polishAlbumPickerSheetsFinal(){
    installAlbumPickerFinalStyle();
    document.querySelectorAll('.albumDesignMobileCatalogPickerSheet').forEach(function(sheet){sheet.setAttribute('dir','rtl');sheet.style.direction='rtl';sheet.style.textAlign='right'});
    document.querySelectorAll('.albumDesignMobileCatalogPickerChoices').forEach(function(host){host.setAttribute('dir','rtl');host.style.direction='rtl';host.style.textAlign='right'});
    document.querySelectorAll('.albumDesignMobileCatalogPickerChoices>button').forEach(function(btn){
      btn.style.direction='rtl';btn.style.textAlign='right';btn.style.pointerEvents='auto';btn.style.touchAction='manipulation';
      if(mode==='album')btn.style.removeProperty('display');
    });
  }

  var pb604OutsideCloseInstalled=false;
  function installAlbumOutsideCloseAnimation(){
    if(pb604OutsideCloseInstalled)return;pb604OutsideCloseInstalled=true;
    document.addEventListener('pointerdown',function(ev){
      var target=ev.target,back=target&&target.closest?target.closest('.albumDesignMobileCatalogPickerBackdrop'):null;
      if(!back||target!==back||back.classList.contains('pb603Closing')||back.getAttribute('data-pb-native-close-animation')==='1'||reducedMotion())return;
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      back.classList.add('pb603Closing');
      setTimeout(function(){if(!back||!back.isConnected)return;var close=back.querySelector('header button');if(close)close.click();else back.remove()},270);
    },true);
  }
  function pb604FilterIcon(active){
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'+(active?'<span class="pb603FilterDot" aria-hidden="true"></span>':'');
  }
  function directChildCountLabel(filters){
    if(!filters)return null;var kids=filters.children||[];for(var i=0;i<kids.length;i++)if(kids[i].tagName==='B')return kids[i];return null
  }
  function syncAlbumMobileControlPlacement(){
    var root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    var top=root.querySelector('.albumDesignMobilePickerButtons')||root.querySelector('.albumDesignMobilePicker'),filters=root.querySelector('.albumDesignCatalogFilters'),modelGrid=root.querySelector('.albumDesignModelGrid');
    if(!top||!filters)return;top.classList.add('albumDesignMobilePickerButtons');
    /* Physical size is deferred to output; never show a Size selector in the Album catalog. */
    root.querySelectorAll('.albumDesignMobilePickerButton.size,.albumDesignMobilePicker>label').forEach(function(el){if(/سایز/.test(String(el.textContent||''))||el.classList.contains('size'))el.style.setProperty('display','none','important')});
    root.querySelectorAll('.albumDesignSizeButtons').forEach(function(el){el.style.setProperty('display','none','important')});
    var selects=filters.querySelectorAll('select'),active=selects.length>1&&(String(selects[0].value||'all')!=='all'||String(selects[1].value||'all')!=='all');
    var originalFilter=filters.querySelector('.pb599AlbumFilterButton');
    var sourceGrid=top.querySelector('.albumDesignMobileGridToggle:not([data-pb604-grid-proxy])');if(sourceGrid)sourceGrid.classList.add('pb604SourceGridToggle');
    var nativeToolbar=root.querySelector('.albumDesignModelViewToolbar:not([data-pb604-toolbar-proxy])'),toolbar=root.querySelector('[data-pb604-toolbar-proxy]');
    if(!nativeToolbar&&sourceGrid&&modelGrid){
      if(!toolbar){toolbar=document.createElement('div');toolbar.className='albumDesignModelViewToolbar';toolbar.setAttribute('data-pb604-toolbar-proxy','1');toolbar.innerHTML='<button type="button" class="albumDesignMobileTopFilter pb599AlbumFilterButton pb603FilterIcon" data-pb604-filter-proxy="1" aria-label="فیلتر مدل‌ها" title="فیلتر مدل‌ها"></button><b></b><div class="albumDesignMobileGridToggle" data-pb604-grid-proxy="1" aria-label="تعداد ستون نمایش طرح‌ها"><button type="button" data-index="0" title="دو ستونه" aria-label="نمایش دو ستونه">▦</button><button type="button" data-index="1" title="تک ستونه" aria-label="نمایش تک ستونه">▤</button></div>';modelGrid.parentNode&&modelGrid.parentNode.insertBefore(toolbar,modelGrid);toolbar.querySelectorAll('[data-pb604-grid-proxy] button').forEach(function(btn){btn.addEventListener('click',function(){var index=Number(btn.getAttribute('data-index')||0),source=sourceGrid.querySelectorAll('button')[index];if(source){source.click();setTimeout(syncAlbumMobileControlPlacement,0)}})})}
    }
    var existingToolbar=nativeToolbar||toolbar;if(!existingToolbar)return;
    var filterProxy=existingToolbar.querySelector('[data-pb604-filter-proxy]')||existingToolbar.querySelector('.albumDesignMobileTopFilter');
    if(!filterProxy){filterProxy=document.createElement('button');filterProxy.type='button';filterProxy.className='albumDesignMobileTopFilter pb599AlbumFilterButton pb603FilterIcon';filterProxy.setAttribute('data-pb604-filter-proxy','1');filterProxy.setAttribute('aria-label','فیلتر مدل‌ها');filterProxy.setAttribute('title','فیلتر مدل‌ها');var gridTarget=existingToolbar.querySelector('.albumDesignMobileGridToggle');gridTarget?existingToolbar.insertBefore(filterProxy,gridTarget):existingToolbar.appendChild(filterProxy)}
    filterProxy.onclick=function(ev){ev.preventDefault();ev.stopPropagation();var source=filters.querySelector('.pb599AlbumFilterButton');if(source&&source!==filterProxy)source.click();else openAlbumFilterSheet(filters)};filterProxy.classList.toggle('pb603FilterActive',!!active);filterProxy.innerHTML=pb604FilterIcon(!!active);
    /* Any older filter button that lived on its own row is hidden after the toolbar proxy exists. */
    top.querySelectorAll('[data-pb604-filter-proxy],.albumDesignMobileTopFilter').forEach(function(btn){if(btn!==filterProxy)btn.style.setProperty('display','none','important')});
    var countSource=directChildCountLabel(filters),countTarget=existingToolbar.querySelector(':scope>b');if(countTarget&&countSource)countTarget.textContent=String(countSource.textContent||'');
    if(sourceGrid){var sourceButtons=sourceGrid.querySelectorAll('button'),proxyButtons=existingToolbar.querySelectorAll('[data-pb604-grid-proxy] button');proxyButtons.forEach(function(btn,index){btn.classList.toggle('active',!!(sourceButtons[index]&&sourceButtons[index].classList.contains('active')))})}
  }

  function jsonResponse(data,status){return new Response(JSON.stringify(data),{status:status||200,headers:{'content-type':'application/json; charset=utf-8'}})}
  function readKind(t){var raw=String((t&&t.designKind)||'album').toLowerCase();if(raw==='slideshow')return 'slideshow';if(raw==='instagram')return 'instagram';var cat=String((t&&t.category)||'').toLowerCase();if(cat.indexOf('instagram')>=0||cat.indexOf('اینستاگرام')>=0)return 'instagram';return 'album'}
  function orientationOf(t){var o=String((t&&t.orientation)||'').toLowerCase();if(o==='portrait'||o==='landscape')return o;var w=Number(t&&t.width||0),h=Math.max(1,Number(t&&t.height||1));return w<h?'portrait':'landscape'}
  function cloneVerticalSlidesIntoInstagram(data){
    if(!data||!Array.isArray(data.templates))return data;
    var existing={};data.templates.forEach(function(t){existing[String(t&&t.id||'')]=1});
    var extra=[];
    data.templates.forEach(function(t){
      if(readKind(t)!=='slideshow'||orientationOf(t)!=='portrait'||t&&t._pbVirtualInstagram)return;
      var id='pb-instagram-slide-'+String(t.id||'');if(existing[id])return;
      extra.push(Object.assign({},t,{id:id,designKind:'instagram',orientation:'portrait',category:'instagram-from-slideshow',name:String(t.name||'طرح عمودی')+' · اینستاگرام',_pbVirtualInstagram:true,_pbSourceSlideshowId:String(t.id||''),_pbInstagramOutputWidth:1080,_pbInstagramOutputHeight:1920}));
    });
    if(extra.length)data=Object.assign({},data,{templates:data.templates.concat(extra)});
    return data;
  }
  function publicTemplatesForMode(data,which){
    if(!data||!Array.isArray(data.templates))return data;
    var rows=data.templates.slice();
    if(which==='album')rows=rows.filter(function(t){return readKind(t)==='album'});
    else if(which==='slideshow')rows=rows.filter(function(t){return readKind(t)==='slideshow'});
    else if(which==='instagram')rows=rows.filter(function(t){return readKind(t)==='instagram'});
    return Object.assign({},data,{templates:rows});
  }
  async function readJson(resp){var d={};try{d=await resp.clone().json()}catch(e){}if(!resp.ok){var err=new Error(d.display||d.message||d.error||'request_failed');err.data=d;err.status=resp.status;throw err}return d}

  /* Always enhance the authenticated designer too: every real vertical slideshow template
     is also exposed in the Instagram catalog. The original slideshow item stays untouched. */
  window.fetch=async function(input,init){
    var raw=typeof input==='string'?input:(input&&input.url)||'';
    var u;try{u=new URL(raw,location.href)}catch(e){return nativeFetch(input,init)}
    if(u.origin!==location.origin)return nativeFetch(input,init);
    var method=String((init&&init.method)||'GET').toUpperCase();
    if(!mode&&u.pathname==='/api/customer/album-design/templates'&&method==='GET'){
      var base=await nativeFetch(input,init),copy=base.clone();
      try{var d=cloneVerticalSlidesIntoInstagram(await copy.json());return jsonResponse(d,base.status)}catch(e){return base}
    }
    if(!mode)return nativeFetch(input,init);
    if(u.pathname==='/api/customer/album-design/templates'&&method==='GET'){
      return nativeFetch('/api/public/album-design/templates?service='+encodeURIComponent(mode)+u.search.replace(/^\?/,'&'),{credentials:'same-origin'});
    }
    if(u.pathname==='/api/customer/album-design/checkout'&&method==='GET')return nativeFetch('/api/public/album-design/checkout?service='+encodeURIComponent(mode),{credentials:'same-origin'});
    if(u.pathname==='/api/customer/ai-studio/skin-retouch'&&method==='GET')return jsonResponse({configured:false,service:{enabled:false},publicGuest:true},200);
    if(u.pathname==='/api/customer/album-design/projects'&&method==='GET')return jsonResponse({projects:[]},200);
    if(u.pathname==='/api/customer/album-design/checkout/pay'&&method==='POST'){
      var meta={};try{meta=JSON.parse(String(init&&init.body||'{}'))||{}}catch(e){}
      try{
        var serviceKey=mode==='instagram'?'instagram_export':'album_export';
        var token=await ensurePaid(serviceKey,meta);
        var cr=await nativeFetch('/api/public/album-design/orders/consume',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({token:token,serviceKey:serviceKey,metadata:meta})});
        var cd=await readJson(cr);paidTokens[serviceKey]='';
        return jsonResponse({ok:true,chargedAmount:Number(cd.amount||0),balanceAfter:0,checkoutId:meta.checkoutId||token,publicGuest:true},200);
      }catch(err){try{popup&&popup.close()}catch(e){}return jsonResponse({error:'public_design_payment_failed',message:String(err&&err.message||err)},402)}
    }
    return nativeFetch(input,init);
  };

  installAlbumOutsideCloseAnimation();
  if(!mode){
    installAlbumPickerFinalStyle();
    var authPickerScheduled=false;
    function authPolish(){if(authPickerScheduled)return;authPickerScheduled=true;var run=function(){authPickerScheduled=false;syncSlideshowOrientation();polishAlbumPickerSheetsFinal();decorateAlbumFilters();syncAlbumMobileControlPlacement()};if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,16)}
    var authObs=new MutationObserver(function(records){for(var i=0;i<records.length;i++){if(isInsideManagedFilter(records[i].target))continue;authPolish();break}});
    authObs.observe(document.documentElement,{subtree:true,childList:true});
    /* The deployed v603 React bundle still uses native selects. Intercept them on mobile
       so model/size use the same animated PhotoBridge bottom sheet as the new source. */
    document.addEventListener('pointerdown',interceptNativeAlbumSelect,true);
    document.addEventListener('mousedown',interceptNativeAlbumSelect,true);
    document.addEventListener('click',function(ev){
      var select=mobileCatalogSelectFromTarget(ev.target);
      if(select){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();return}
      setTimeout(authPolish,0);
    },true);
    window.addEventListener('pagehide',function(){closeAlbumFilterSheet(true);closeMobileAlbumPicker(true)});
    window.addEventListener('pageshow',function(){closeAlbumFilterSheet(true);closeMobileAlbumPicker(true);authPolish()});
    window.addEventListener('DOMContentLoaded',authPolish);
    if(document.readyState!=='loading')authPolish();
    return;
  }
  document.documentElement.classList.add('pbPublicDesignGuest','pbPublicDesignMode-'+mode);
  document.body&&document.body.classList.add('pbPublicDesignGuest','pbPublicDesignMode-'+mode);
  window.__PB_PUBLIC_DESIGN_MODE__=mode;

  function popupStatus(text){
    if(!popup||popup.closed)return;
    try{popup.document.open();popup.document.write('<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>پرداخت PhotoBridge</title><body style="font-family:Tahoma,sans-serif;background:#f7f8fb;display:grid;place-items:center;min-height:100vh;margin:0;color:#172033"><div style="background:white;border:1px solid #e5e7eb;border-radius:18px;padding:28px;max-width:390px;text-align:center;box-shadow:0 18px 50px #0f172a14"><b style="font-size:20px">PhotoBridge</b><p style="line-height:1.9">'+String(text||'در حال آماده‌سازی پرداخت…')+'</p></div></body></html>');popup.document.close()}catch(e){}
  }
  function preparePopup(){if(popup&&!popup.closed)return popup;try{popup=window.open('about:blank','PhotoBridgePublicDesignPayment','width=520,height=720,noopener=no')}catch(e){popup=null}popupStatus('در حال آماده‌سازی پرداخت…');return popup}
  async function loadCheckout(){try{var r=await nativeFetch('/api/public/album-design/checkout?service='+encodeURIComponent(mode),{credentials:'same-origin'});checkoutInfo=await readJson(r);decorate()}catch(e){}}
  function money(n){try{return Number(n||0).toLocaleString('fa-IR')+' تومان'}catch(e){return String(n||0)+' تومان'}}
  function publicPrice(service){if(!checkoutInfo)return 0;return Number(service==='instagram_export'?checkoutInfo.publicInstagramPriceToman:checkoutInfo.publicExportPriceToman)||0}
  async function ensurePaid(service,meta){
    if(paidTokens[service])return paidTokens[service];if(paymentPromise)return paymentPromise;
    paymentPromise=(async function(){preparePopup();var r=await nativeFetch('/api/public/album-design/orders',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({serviceKey:service,mode:mode,metadata:meta||{}})});var d=await readJson(r),token=String(d.token||'');if(!token)throw new Error('توکن پرداخت ساخته نشد.');if(d.status==='paid'||Number(d.amount||0)<=0){paidTokens[service]=token;try{popup&&popup.close()}catch(e){}return token}if(!d.paymentUrl)throw new Error('درگاه پرداخت آماده نشد.');if(!popup||popup.closed)throw new Error('مرورگر پنجره پرداخت را مسدود کرده است. لطفاً Pop-up را برای PhotoBridge مجاز کن.');try{popup.location.href=d.paymentUrl}catch(e){throw new Error('بازکردن درگاه پرداخت انجام نشد.')}for(var i=0;i<180;i++){await new Promise(function(resolve){setTimeout(resolve,2000)});var sr=await nativeFetch('/api/public/album-design/orders/'+encodeURIComponent(token),{credentials:'same-origin'}),sv=await readJson(sr),status=String((sv.order||{}).status||'');if(status==='paid'||status==='consumed'){paidTokens[service]=token;try{popup&&popup.close()}catch(e){}return token}if(status==='payment_failed'||status==='cancelled')throw new Error('پرداخت کامل نشد.')}throw new Error('زمان انتظار برای تأیید پرداخت تمام شد.');})();
    try{return await paymentPromise}finally{paymentPromise=null}
  }
  function modeTitle(){return mode==='instagram'?'طراحی پست اینستاگرام':mode==='slideshow'?'طراحی اسلایدشو':'طراحی آلبوم'}
  function groupNeedle(){return mode==='instagram'?'اینستاگرام':mode==='slideshow'?'اسلایدشو':'آلبوم'}
  function enforceDedicatedMode(){
    var root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    var buttons=root.querySelectorAll('.albumDesignGroupButtons button'),firstAllowed=null,activeAllowed=false;
    for(var i=0;i<buttons.length;i++){
      var b=buttons[i],tx=(b.textContent||'').trim(),allowed=tx.indexOf(groupNeedle())>=0;
      b.style.display=allowed?'':'none';
      if(allowed&&!firstAllowed)firstAllowed=b;
      if(allowed&&b.classList.contains('active'))activeAllowed=true;
    }
    if(!activeAllowed&&firstAllowed)firstAllowed.click();
    var desktopGroups=root.querySelector('.albumDesignGroupButtons');
    if(desktopGroups)desktopGroups.style.display='none';
    var mobileMode=root.querySelector('.albumDesignMobilePickerButton.mode');
    if(mobileMode)mobileMode.style.display='none';
  }
  function syncSlideshowOrientation(){
    var root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    var grid=root.querySelector('.albumDesignSlideshowGrid');if(!grid)return;
    var active=root.querySelector('.albumDesignSizeButtons button.active');
    var sizeText=(active&&active.textContent||'').trim();
    if(!sizeText){var mobile=root.querySelector('.albumDesignMobilePickerButton.size b');sizeText=(mobile&&mobile.textContent||'').trim()}
    var want=sizeText.indexOf('عمودی')>=0?'portrait':sizeText.indexOf('افقی')>=0?'landscape':'';
    grid.querySelectorAll('.albumDesignModelCard').forEach(function(card){
      if(!want){card.style.removeProperty('display');return}
      var prev=card.querySelector('.albumDesignModelPreview'),ratio=NaN;
      if(prev){ratio=parseFloat(String(prev.style.aspectRatio||''));if(!isFinite(ratio)||ratio<=0){var r=prev.getBoundingClientRect();ratio=r.height>0?r.width/r.height:NaN}}
      if(!isFinite(ratio)||ratio<=0){card.style.removeProperty('display');return}
      var portrait=ratio<1;card.style.display=(want==='portrait'?portrait:!portrait)?'':'none';
    });
  }
  function albumFilterLabel(photo,text){
    var p={all:'همه تعدادها','1':'۱ عکس','2':'۲ عکس','3':'۳ عکس',gt3:'بیشتر از ۳ عکس'}[photo]||'همه تعدادها';
    var t={all:'همه نوشته‌ها',with:'دارای نوشته',without:'بدون نوشته'}[text]||'همه نوشته‌ها';
    return p+' · '+t;
  }
  function applyReactSelect(select,value){
    if(!select)return;var proto=window.HTMLSelectElement&&HTMLSelectElement.prototype,desc=proto&&Object.getOwnPropertyDescriptor(proto,'value');
    try{if(desc&&desc.set)desc.set.call(select,value);else select.value=value}catch(e){select.value=value}
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function mobileAlbumUi(){try{return window.matchMedia('(max-width:820px),(pointer:coarse)').matches}catch(e){return innerWidth<=820}}
  function reducedMotion(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
  function closeManagedBackdrop(selector,force){
    document.querySelectorAll(selector).forEach(function(back){
      if(force||reducedMotion()){back.remove();return}
      if(back.classList.contains('pb603Closing'))return;
      back.classList.add('pb603Closing');
      setTimeout(function(){if(back&&back.isConnected)back.remove()},285);
    });
  }
  function closeMobileAlbumPicker(force){closeManagedBackdrop('.pb602MobilePickerBackdrop',!!force)}
  function pb650PickerLabel(select){var label=select&&select.closest?select.closest('label'):null;return ((label&&label.querySelector('span')&&label.querySelector('span').textContent)||'انتخاب').trim()}
  function pb650IsDesignTypePicker(select){var name=pb650PickerLabel(select);return /مدل|نوع طراحی|نوع آلبوم/.test(name)}
  function pb650OptionAllowed(opt,select){
    var value=String(opt&&opt.value||'').toLowerCase(),label=String(opt&&(opt.textContent||opt.label)||'').trim();
    if(mode==='instagram')return false;
    if(mode==='album'&&pb650IsDesignTypePicker(select))return !/instagram|اینستاگرام|slideshow|اسلایدشو/i.test(value+' '+label);
    return !/slideshow|اسلایدشو/i.test(value+' '+label);
  }
  function openMobileAlbumPicker(select){
    if(!select||!mobileAlbumUi())return;
    // Instagram is a dedicated workspace: no model/size menu is allowed at all.
    if(mode==='instagram')return;
    var existing=document.querySelector('.pb602MobilePickerBackdrop');if(existing){closeMobileAlbumPicker(false);return}closeMobileAlbumPicker(true);
    var name=pb650PickerLabel(select);
    var back=document.createElement('div');back.className='pb602MobilePickerBackdrop';back.dir='rtl';
    var sheet=document.createElement('section');sheet.className='pb602MobilePickerSheet';sheet.dir='rtl';sheet.innerHTML='<header><div><b>'+String(name==='مدل'||name==='نوع آلبوم'?'نوع آلبوم':name==='سایز'?'سایز آلبوم':name)+'</b><small>گزینه موردنظر را انتخاب کن.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb602MobilePickerChoices"></div>';
    var host=sheet.querySelector('.pb602MobilePickerChoices'),current=String(select.value||'');
    Array.prototype.forEach.call(select.options||[],function(opt){if(!pb650OptionAllowed(opt,select))return;var b=document.createElement('button');b.type='button';b.className='pb602MobilePickerChoice'+(String(opt.value)===current?' active':'');b.setAttribute('data-value',String(opt.value));b.innerHTML='<span class="pb602Radio" aria-hidden="true"></span><b></b>';b.querySelector('b').textContent=String(opt.textContent||opt.label||opt.value||'');b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();applyReactSelect(select,String(opt.value));closeMobileAlbumPicker();setTimeout(function(){polishAlbumPickerSheetsFinal();syncInstagramPortraitEditor()},0)};host.appendChild(b)});
    if(!host.children.length)return;
    sheet.querySelector('header button').onclick=function(){closeMobileAlbumPicker()};back.appendChild(sheet);document.body.appendChild(back);back.addEventListener('pointerdown',function(e){if(e.target===back)closeMobileAlbumPicker()});
  }
  function mobileCatalogSelectFromTarget(target){var s=target&&target.closest?target.closest('.albumDesignMobilePicker select'):null;if(!s||!mobileAlbumUi())return null;if(mode==='instagram')return null;return s}
  function interceptNativeAlbumSelect(ev){var select=mobileCatalogSelectFromTarget(ev.target);if(!select)return;ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();openMobileAlbumPicker(select)}
  function selectedAlbumGroup(){var s=document.querySelector('.photographerAlbumDesignCatalog .albumDesignMobilePicker select');return String(s&&s.value||'')}
  function syncInstagramPortraitEditor(){
    var instagram=mobileAlbumUi()&&(mode==='instagram'||selectedAlbumGroup()==='instagram')&&!!document.querySelector('.albumDesignFullscreenModal:not(.minimized)');
    if(document.body)document.body.classList.toggle('pb602InstagramPortraitEditor',instagram);
  }
  function closeAlbumFilterSheet(force){closeManagedBackdrop('.pb599AlbumFilterBackdrop',!!force)}
  function openAlbumFilterSheet(filters){
    if(!filters)return;var existing=document.querySelector('.pb599AlbumFilterBackdrop');if(existing){closeAlbumFilterSheet(false);return}closeAlbumFilterSheet(true);
    var selects=filters.querySelectorAll('select'),photo=selects[0],text=selects[1];if(!photo||!text)return;
    var back=document.createElement('div');back.className='pb599AlbumFilterBackdrop';back.dir='rtl';
    var sheet=document.createElement('section');sheet.className='pb599AlbumFilterSheet';sheet.innerHTML='<header><div><b>فیلتر مدل‌های آلبوم</b><small>هر گروه در یک ردیف؛ انتخاب‌ها همان لحظه اعمال می‌شوند.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb599AlbumFilterBody"><div class="pb602AlbumFilterRow" data-kind="photo"><strong>تعداد عکس</strong><div class="pb599AlbumFilterChoices"></div></div><div class="pb602AlbumFilterRow" data-kind="text"><strong>نوشته آلبوم</strong><div class="pb599AlbumFilterChoices"></div></div><div class="pb599AlbumFilterActions"><button type="button" class="pb599AlbumFilterReset">پاک کردن فیلترها</button><button type="button" class="pb599AlbumFilterApply">اعمال و بستن</button></div></div>';
    back.appendChild(sheet);document.body.appendChild(back);
    function currentSelect(kind){var now=filters.querySelectorAll('select');return kind==='photo'?now[0]:now[1]}
    function refresh(){['photo','text'].forEach(function(kind){var select=currentSelect(kind),value=String(select&&select.value||'all');sheet.querySelectorAll('[data-kind="'+kind+'"] .pb599AlbumFilterChoices button').forEach(function(b){b.classList.toggle('active',String(b.getAttribute('data-value'))===value)})});decorateAlbumFilters()}
    function fill(kind,items){var host=sheet.querySelector('[data-kind="'+kind+'"] .pb599AlbumFilterChoices'),select=currentSelect(kind);items.forEach(function(it){var b=document.createElement('button');b.type='button';b.textContent=it[1];b.setAttribute('data-value',it[0]);if(String(select&&select.value||'all')===it[0])b.classList.add('active');b.onclick=function(){applyReactSelect(currentSelect(kind),it[0]);setTimeout(refresh,0)};host.appendChild(b)})}
    fill('photo',[['all','همه'],['1','۱ عکس'],['2','۲ عکس'],['3','۳ عکس'],['gt3','بیشتر از ۳ عکس']]);
    fill('text',[['all','همه'],['with','دارای نوشته'],['without','بدون نوشته']]);
    sheet.querySelector('header button').onclick=function(){closeAlbumFilterSheet()};
    sheet.querySelector('.pb599AlbumFilterReset').onclick=function(){applyReactSelect(currentSelect('photo'),'all');setTimeout(function(){applyReactSelect(currentSelect('text'),'all');setTimeout(refresh,0)},0)};
    sheet.querySelector('.pb599AlbumFilterApply').onclick=function(){closeAlbumFilterSheet()};
    back.addEventListener('pointerdown',function(e){if(e.target===back)closeAlbumFilterSheet()});
  }
  function decorateAlbumFilters(){
    var root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    var filters=root.querySelector('.albumDesignCatalogFilters');if(!filters)return;
    filters.classList.add('pb599AlbumFiltersEnhanced','pb603FilterIconMode');
    var selects=filters.querySelectorAll('select');if(selects.length<2)return;
    var nativeTop=root.querySelector('.albumDesignMobileTopFilter:not([data-pb604-filter-proxy])');
    var btn=nativeTop||filters.querySelector('.pb599AlbumFilterButton');
    /* On the deployed v603 bundle keep a real hidden source button inside the React
       filter row. React may discard injected children on state changes, so recreate it. */
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='pb599AlbumFilterButton';filters.insertBefore(btn,filters.firstChild);btn.onclick=function(){openAlbumFilterSheet(filters)}}
    btn.classList.add('pb603FilterIcon');btn.setAttribute('aria-label','فیلتر مدل‌ها');btn.setAttribute('title','فیلتر مدل‌ها');
    var active=String(selects[0].value||'all')!=='all'||String(selects[1].value||'all')!=='all';btn.classList.toggle('pb603FilterActive',active);
    var icon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'+(active?'<span class="pb603FilterDot" aria-hidden="true"></span>':'');
    if(btn.getAttribute('data-pb603-icon')!==String(active)||!btn.querySelector('svg')){btn.innerHTML=icon;btn.setAttribute('data-pb603-icon',String(active))}
    var sizeButton=root.querySelector('.albumDesignMobilePickerButton.size'),sizeValue=sizeButton&&sizeButton.querySelector('b'),sizeText=String(sizeValue&&sizeValue.textContent||'');if(sizeButton)sizeButton.classList.toggle('pb603InstagramSize',/instagram|اینستاگرام/i.test(sizeText));
  }
  function polishAlbumPickerSheets(){polishAlbumPickerSheetsFinal()}

  function decorate(){
    document.body&&document.body.classList.add('pbPublicDesignGuest','pbPublicDesignMode-'+mode);enforceDedicatedMode();syncSlideshowOrientation();
    var root=document.querySelector('.photographerAlbumDesignCatalog');
    if(root&&!root.querySelector('.pb574PublicDesignBanner')){var b=document.createElement('div');b.className='pb574PublicDesignBanner pb580PublicDesignBanner'+(mode==='instagram'?' pb657InstagramCompactBanner':'');b.innerHTML=mode==='instagram'?'<div><b>طراحی پست اینستاگرام</b></div>':'<div><b>'+modeTitle()+' بدون عضویت</b><span>شروع مستقیم و پرداخت آنلاین هر خروجی؛ بدون نیاز به ورود عکاس.</span></div>';root.insertBefore(b,root.firstChild)}
    if(root)root.querySelectorAll('.pb574PublicDesignBanner a[href="/photographer"]').forEach(function(a){a.remove()});
    decorateAlbumFilters();polishAlbumPickerSheets();syncAlbumMobileControlPlacement();
    document.querySelectorAll('.albumProjectDock').forEach(function(el){el.style.display='none'});
    document.querySelectorAll('.albumDesignFullscreenHeader button').forEach(function(el){var tx=(el.textContent||'').trim();if(tx.indexOf('افزودن به آلبوم')>=0||tx.indexOf('ذخیره تغییرات صفحه')>=0)el.style.display='none'});
    var modal=document.querySelector('.albumDesignCheckoutModal');if(modal){modal.classList.add('pb659CompactCheckout');var balance=modal.querySelector('.albumDesignCheckoutBalance');if(balance)balance.style.display='none';var headSmall=modal.querySelector('header small');if(headSmall)headSmall.style.display='none';var headSpan=modal.querySelector('header span');setNodeText(headSpan,'دریافت خروجی');var headTitle=modal.querySelector('header h3');setNodeText(headTitle,mode==='instagram'?'خروجی پست اینستاگرام':'خروجی طراحی آلبوم');var ig=modal.querySelector('.instagramFree');if(ig){var st=ig.querySelector('strong'),bt=ig.querySelector('button'),ip=ig.querySelector('p');if(ip)ip.style.display='none';setNodeText(st,'رایگان');if(bt&&!bt.disabled)setNodeText(bt,'دانلود رایگان')}var pr=modal.querySelector('.printSlideshow');if(pr){var ps=pr.querySelector('strong'),pp=pr.querySelector('p'),pb=pr.querySelector('button'),svc=mode==='instagram'?'instagram_export':'album_export';if(pp)pp.style.display='none';setNodeText(ps,money(publicPrice(svc)));if(pb&&!pb.disabled)setNodeText(pb,publicPrice(svc)>0?'پرداخت و دانلود':'دانلود باکیفیت')}var rt=modal.querySelector('.retouch');if(rt)rt.style.display='none';var ft=modal.querySelector('footer');if(ft)ft.style.display='none'}
  }
  function scheduleDecorate(){
    if(decorateScheduled)return;decorateScheduled=true;
    var run=function(){decorateScheduled=false;if(decorating)return;decorating=true;try{decorate()}finally{decorating=false}};
    if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(run);else setTimeout(run,16);
  }
  document.addEventListener('click',function(ev){var target=ev.target&&ev.target.closest?ev.target.closest('button'):null;if(!target)return;if(target.classList.contains('albumDesignMobileBack')){if(target.closest('.albumDesignFullscreenModal')){return}ev.preventDefault();ev.stopImmediatePropagation();location.href=mode==='instagram'?'/instagram-post-design':mode==='slideshow'?'/slideshow-design':'/album-design';return}var modal=target.closest('.albumDesignCheckoutModal');if(!modal)return;var ig=target.closest('.instagramFree');if(ig){return}if(target.closest('.printSlideshow')){if(allowAlbumOnce){allowAlbumOnce=false;return}ev.preventDefault();ev.stopImmediatePropagation();var svc=mode==='instagram'?'instagram_export':'album_export';preparePopup();ensurePaid(svc,{mode:mode}).then(function(){allowAlbumOnce=true;target.click()}).catch(function(err){try{popup&&popup.close()}catch(e){}alert(String(err&&err.message||'پرداخت انجام نشد.'))});return}if(target.closest('.retouch')){ev.preventDefault();ev.stopImmediatePropagation();location.href='/ai'}},true);
  document.addEventListener('pointerdown',interceptNativeAlbumSelect,true);
  document.addEventListener('mousedown',interceptNativeAlbumSelect,true);
  document.addEventListener('click',function(ev){var select=mobileCatalogSelectFromTarget(ev.target);if(select){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();return}setTimeout(function(){syncSlideshowOrientation();decorateAlbumFilters();polishAlbumPickerSheets();syncInstagramPortraitEditor()},0)},true);
  document.addEventListener('fullscreenchange',function(){setTimeout(syncInstagramPortraitEditor,120)});
  var obs=new MutationObserver(function(records){for(var i=0;i<records.length;i++){if(isInsideManagedFilter(records[i].target))continue;scheduleDecorate();setTimeout(syncInstagramPortraitEditor,0);break}});obs.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('pagehide',function(){closeAlbumFilterSheet(true);closeMobileAlbumPicker(true)});
  window.addEventListener('pageshow',function(){closeAlbumFilterSheet(true);closeMobileAlbumPicker(true);scheduleDecorate();syncInstagramPortraitEditor()});
  window.addEventListener('DOMContentLoaded',function(){closeAlbumFilterSheet(true);closeMobileAlbumPicker(true);loadCheckout();decorate();syncSlideshowOrientation();decorateAlbumFilters();polishAlbumPickerSheets();syncInstagramPortraitEditor()});
  if(document.readyState!=='loading'){closeAlbumFilterSheet(true);closeMobileAlbumPicker(true);loadCheckout();decorate();syncSlideshowOrientation();decorateAlbumFilters();polishAlbumPickerSheets();syncInstagramPortraitEditor()}
})();
