/* PhotoBridge v0.17.625 — symmetric mobile menu motion + outer service arrows */
(function(){
  'use strict';

  var desktopItems=[
    ['/','خانه'],
    ['/album-design','طراحی آلبوم'],
    ['/instagram-post-design','طراحی اینستاگرام'],
    ['/photo-selection-gallery','گالری انتخاب عکس'],
    ['/photo-lab-print','چاپ لابراتوار'],
    ['/retouch-photo','روتوش عکس'],
    ['/equipment-rental','فروشگاه تجهیزات'],
    ['/guide','راهنما']
  ];
  var accountItems=[
    ['/photographer','ورود عکاس'],
    ['/lab','ورود لابراتوار'],
    ['/rental','ورود فروشگاه'],
    ['/trial','ثبت‌نام لابراتوار']
  ];
  var mobileAccountItems=[
    ['/','خانه','home']
  ];
  var mobileServiceItems=[
    ['/ai','روتوش عکس','retouch'],
    ['/album-design','آلبوم','album'],
    ['/instagram-post-design','اینستاگرام','instagram']
  ];

  function normalize(path){
    path=String(path||'/').split('?')[0].split('#')[0]||'/';
    if(path.length>1)path=path.replace(/\/+$/,'');
    return path;
  }
  function isPublicRoute(path){
    path=normalize(path);
    return path==='/'||path.indexOf('/ai')===0||path.indexOf('/retouch-photo')===0||path.indexOf('/album-design')===0||path.indexOf('/instagram-post-design')===0||path.indexOf('/slideshow-design')===0||path.indexOf('/photo-selection-gallery')===0||path.indexOf('/photo-lab-print')===0||path.indexOf('/equipment-rental')===0||path.indexOf('/guide')===0;
  }
  function isMobileDockRoute(path){
    path=normalize(path);
    return isPublicRoute(path)||path==='/photographer'||path==='/lab';
  }
  function isLandingRoute(path){
    path=normalize(path);
    if(path==='/'||path==='/equipment-rental'||path.indexOf('/retouch-photo')===0||path.indexOf('/photo-selection-gallery')===0||path.indexOf('/photo-lab-print')===0||path.indexOf('/guide')===0)return true;
    if(path.indexOf('/album-design')===0)return path.indexOf('/album-design/start')!==0;
    if(path.indexOf('/instagram-post-design')===0)return path.indexOf('/instagram-post-design/start')!==0;
    if(path.indexOf('/slideshow-design')===0)return path.indexOf('/slideshow-design/start')!==0;
    return false;
  }
  function activeRoot(path){
    path=normalize(path);
    if(path==='/')return '/';
    if(path==='/ai'||path.indexOf('/retouch-photo')===0)return '/retouch-photo';
    if(path.indexOf('/album-design')===0)return '/album-design';
    if(path.indexOf('/instagram-post-design')===0)return '/instagram-post-design';
    if(path.indexOf('/slideshow-design')===0)return '/slideshow-design';
    if(path.indexOf('/photo-selection-gallery')===0)return '/photo-selection-gallery';
    if(path.indexOf('/photo-lab-print')===0)return '/photo-lab-print';
    if(path.indexOf('/equipment-rental')===0)return '/equipment-rental';
    if(path.indexOf('/guide')===0)return '/guide';
    return '';
  }
  function makeLink(href,label,cls){
    var a=document.createElement('a');a.href=href;
    if(label){var span=document.createElement('span');span.className='pb760NavText';span.textContent=label;a.appendChild(span)}
    if(cls)a.className=cls;return a;
  }
  function mobileIconSvg(kind){
    var common='viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    if(kind==='photographer')return '<svg '+common+'><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
    if(kind==='lab')return '<svg '+common+'><path d="M7 8V4h10v4M7 17H5.5A2.5 2.5 0 0 1 3 14.5v-4A2.5 2.5 0 0 1 5.5 8h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5H17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14h10v6H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M17.2 11h.01" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>';
    if(kind==='guide')return '<svg '+common+'><path d="M9 7.5 16 12l-7 4.5v-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
    if(kind==='home')return '<svg '+common+'><path d="M3.8 10.6 12 4l8.2 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.2 9.2V20h11.6V9.2M9.5 20v-6h5v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    if(kind==='retouch')return '<svg '+common+'><path d="M7.2 8.7c.9-3 2.7-4.5 4.8-4.5s3.9 1.5 4.8 4.5c.5 1.7.4 4.7-.5 6.7-1 2.3-2.5 3.7-4.3 3.7s-3.3-1.4-4.3-3.7c-.9-2-1-5-.5-6.7Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m18.7 4.3.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5.5-1.4Z" fill="currentColor"/><path d="M9.2 12.4c1.8 1.2 3.8 1.2 5.6 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    if(kind==='album')return '<svg '+common+'><path d="M5 4.5h10.8A3.2 3.2 0 0 1 19 7.7V20H8.2A3.2 3.2 0 0 1 5 16.8V4.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 4.5v12.2c0 1.8.9 3.3 2.5 3.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m10.2 13.3 2.2-2.4 1.8 1.7 2.2-2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if(kind==='instagram')return '<svg '+common+'><rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>';
    return '<svg '+common+'><path d="M4 20V8l8-4 8 4v12M8 20v-5h8v5M12 7v5M9.5 9.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
  function requestMobileInstall(){
    try{
      if(typeof window.PB711InstallApp==='function')return window.PB711InstallApp();
      if(typeof window.PB710InstallApp==='function')return window.PB710InstallApp();
    }catch(e){}
    try{
      var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
      if(ios){alert('برای نصب PhotoBridge در iPhone/iPad: در Safari دکمه Share را بزنید و Add to Home Screen را انتخاب کنید.');return}
    }catch(e){}
    alert('برای نصب PhotoBridge، از منوی مرورگر گزینه Install app / نصب برنامه یا Add to Home screen / افزودن به صفحه اصلی را انتخاب کنید.');
  }
  function isInstalledApp(){
    try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true||document.documentElement.classList.contains('pb711Installed')}catch(e){return false}
  }
  function accountMobile(user){return String((user&&user.mobile)||'').trim()}
  function syncMobileSessionCard(menu){
    if(!menu)return;
    var card=menu.querySelector('.pb599MobileSessionCard');if(!card)return;
    fetch('/api/auth/me',{credentials:'same-origin',headers:{'x-photobridge-public-nav':'1'}}).then(function(r){return r.ok?r.json():null}).then(function(me){
      var user=me&&me.user,mobile=accountMobile(user);
      if(!user||!mobile){card.hidden=true;card.innerHTML='';return}
      card.hidden=false;
      card.innerHTML='<div class="pb599MobileSessionIdentity"><span class="pb599SessionDot" aria-hidden="true"></span><div><small>حساب PhotoBridge</small><b dir="ltr">'+esc(mobile)+'</b></div><em>فعال</em></div><div class="pb599MobileSessionLinks"><a href="/retouch-account">سفارش‌ها و فایل‌های روتوش</a><a href="/ai">روتوش جدید</a><a href="/album-design/start">طراحی آلبوم</a></div>';
    }).catch(function(){card.hidden=true;card.innerHTML=''})
  }

  function injectStyle(){
    if(document.getElementById('pbCanonicalHeaderV624Style'))return;
    var st=document.createElement('style');
    st.id='pbCanonicalHeaderV624Style';
    st.textContent=`
      body.pbCanonicalHeaderMounted #root .publicHeader,
      body.pbCanonicalHeaderMounted #root .publicSeoHeader,
      body.pbCanonicalHeaderMounted #root .publicGuideHeader,
      body.pbCanonicalHeaderMounted #root .publicAiHeader,
      body.pbCanonicalHeaderMounted #root .pbInjectedDesignHeader,
      body.pbCanonicalHeaderMounted #root .seoSafeHeader,
      body.pbCanonicalHeaderMounted > .seoSafeHeader:not(#pbCanonicalHeaderV624){display:none!important}
      body.pbCanonicalHeaderMounted > header.top{display:none!important}
      body.pbCanonicalHeaderMounted #root .publicHeaderSpacer{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}
      body.pbHomePublicRoute #root .publicHeroCopy .publicActions a[href="/photographer/signup"],
      body.pbHomePublicRoute #root .publicAudienceCard.photographer a[href="/photographer/signup"],
      body.pbInviteOnlyPhotographerLogin #root .authFooterLinks a[href="/photographer/signup"]{display:none!important}
      .pbInviteOnlyLoginNote{margin-top:2px;padding:9px 10px;border:1px solid #dbe7ff;border-radius:10px;background:#f5f9ff;color:#52627a;font-size:9.5px;line-height:1.8;text-align:right}

      #pbCanonicalHeaderV624{
        display:block!important;height:auto!important;min-height:0!important;padding:0!important;margin:0!important;
        position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:9000!important;width:100%!important;
        align-items:initial!important;justify-content:initial!important;overflow:visible!important;
        font-family:Vazirmatn,Tahoma,Arial,sans-serif;background:#fff!important;color:#101828;
        border:0!important;border-bottom:1px solid rgba(16,24,40,.07)!important;box-shadow:0 1px 12px rgba(16,24,40,.04)!important;
        isolation:isolate;transition:border-color .24s ease,box-shadow .24s ease!important
      }
      #pbCanonicalHeaderV624::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0;background:radial-gradient(circle at 13% -55%,rgba(255,255,255,.72) 0,rgba(255,255,255,.26) 20%,rgba(255,255,255,0) 43%),linear-gradient(128deg,#2f63f6 0%,#3e5eea 42%,#5047df 100%);transition:opacity .28s ease}
      #pbCanonicalHeaderV624.pbScrolled::before{opacity:1}
      #pbCanonicalHeaderV624.pbScrolled{border-bottom-color:rgba(255,255,255,.20)!important;box-shadow:0 12px 32px rgba(49,94,251,.24)!important}
      #pbCanonicalHeaderV624 *{box-sizing:border-box}
      #pbCanonicalHeaderV624 .pbCanonicalMain{width:min(1360px,calc(100% - 28px));height:72px!important;min-height:72px!important;margin:0 auto!important;padding:0!important;display:flex!important;align-items:center!important;gap:10px!important;direction:ltr!important;position:relative}
      #pbCanonicalHeaderV624 .pbCanonicalBrand{display:flex!important;align-items:center!important;gap:9px!important;text-decoration:none!important;color:#101828!important;direction:ltr!important;flex:0 0 auto!important;white-space:nowrap!important;order:0!important}
      #pbCanonicalHeaderV624 .pbCanonicalBrand img{width:43px!important;height:43px!important;border-radius:12px!important;box-shadow:0 5px 16px rgba(79,70,229,.12)!important;display:block!important;object-fit:cover!important;transition:filter .24s ease,box-shadow .24s ease,transform .24s ease!important}
      #pbCanonicalHeaderV624 .pbCanonicalBrand b{font-size:16px!important;line-height:1!important;font-weight:900!important;transition:color .24s ease!important}
      #pbCanonicalHeaderV624 .pbCanonicalDesktopCluster{flex:0 0 auto!important;min-width:0!important;width:max-content!important;margin-left:auto!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:0!important;direction:ltr!important;order:1!important}
      #pbCanonicalHeaderV624 .pbCanonicalAccounts{display:flex!important;align-items:center!important;gap:5px!important;direction:rtl!important;flex:0 0 auto!important;order:initial!important}
      #pbCanonicalHeaderV624 .pbCanonicalAccounts a{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:6px 8px!important;border:1px solid #cbdcff!important;border-radius:9px!important;background:#fff!important;color:#2452b8!important;text-decoration:none!important;font-size:9.4px!important;line-height:1.25!important;font-weight:900!important;white-space:nowrap!important;box-shadow:0 3px 10px rgba(49,94,251,.05)!important;transition:background .18s ease,border-color .18s ease,color .18s ease!important}
      #pbCanonicalHeaderV624 .pbCanonicalAccounts a:hover{background:#f7faff!important;border-color:#afc9ff!important;color:#183f9d!important}
      #pbCanonicalHeaderV624 .pbCanonicalAccountDivider{display:block!important;width:1px!important;height:31px!important;flex:0 0 1px!important;margin:0 5px 0 8px!important;background:linear-gradient(to bottom,transparent,#cbd5e1 18%,#cbd5e1 82%,transparent)!important;order:initial!important}
      #pbCanonicalHeaderV624 .pbCanonicalDesktopNav{flex:0 0 auto!important;min-width:0!important;width:max-content!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:2px!important;direction:rtl!important;overflow:hidden!important;order:initial!important}
      #pbCanonicalHeaderV624 .pbCanonicalDesktopNav a{direction:rtl!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:38px!important;padding:7px 7px!important;border:1px solid transparent!important;border-radius:10px!important;text-decoration:none!important;color:#475467!important;font-size:9.9px!important;line-height:1.3!important;font-weight:800!important;white-space:nowrap!important;transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease!important}
      #pbCanonicalHeaderV624 .pbCanonicalDesktopNav a:hover{background:#f8faff!important;border-color:#e0e7ff!important;color:#3730a3!important}
      #pbCanonicalHeaderV624 .pbCanonicalDesktopNav a.active{background:transparent!important;border-color:transparent!important;border-radius:0!important;color:#315efb!important;font-weight:950!important;box-shadow:none!important;position:relative!important}#pbCanonicalHeaderV624 .pbCanonicalDesktopNav a.active::after{content:"";position:absolute;left:18%;right:18%;bottom:2px;height:2px;border-radius:999px;background:currentColor}

      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalBrand,#pbCanonicalHeaderV624.pbScrolled .pbCanonicalBrand b,#pbCanonicalHeaderV624.pbScrolled .pbCanonicalDesktopNav a{color:#fff!important}
      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalBrand img{filter:brightness(0) invert(1) drop-shadow(0 2px 5px rgba(255,255,255,.18))!important;box-shadow:none!important}
      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalDesktopNav a:hover{background:rgba(255,255,255,.11)!important;border-color:rgba(255,255,255,.24)!important;color:#fff!important}
      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalDesktopNav a.active{background:transparent!important;border-color:transparent!important;border-radius:0!important;color:#fff!important;box-shadow:none!important}
      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalAccounts a{background:rgba(13,42,112,.46)!important;border-color:rgba(255,255,255,.34)!important;color:#fff!important;box-shadow:0 4px 13px rgba(7,27,82,.16)!important}
      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalAccounts a:hover{background:rgba(13,42,112,.66)!important;border-color:rgba(255,255,255,.60)!important;color:#fff!important}
      #pbCanonicalHeaderV624.pbScrolled .pbCanonicalAccountDivider{background:linear-gradient(to bottom,transparent,rgba(255,255,255,.5) 18%,rgba(255,255,255,.5) 82%,transparent)!important}

      #pbCanonicalHeaderV624 .pbCanonicalMobileControls,#pbCanonicalHeaderV624 .pbMobileMenu{display:none}
      #pbCanonicalHeaderSpacerV624{display:block!important;width:100%!important;height:72px;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
      .pbHomeMobileAccountBar{display:none}

      body.pbCanonicalFooterMounted #root .publicFooter,
      body.pbCanonicalFooterMounted #root .publicSeoFooter,
      body.pbCanonicalFooterMounted #root .publicGuideFooter,
      body.pbCanonicalFooterMounted > .seoSafeFooter{display:none!important}
      #pbCanonicalFooterV624{width:100%;margin:0!important;padding:0!important;background:#fff;border-top:1px solid #e4e7ec;font-family:Vazirmatn,Tahoma,Arial,sans-serif;color:#667085;position:relative;z-index:5;clear:both}
      #pbCanonicalFooterV624 *{box-sizing:border-box}
      #pbCanonicalFooterV624 .pbFooterInner{width:min(1180px,calc(100% - 36px));min-height:112px;margin:0 auto;padding:18px 0;display:grid;grid-template-columns:minmax(220px,1fr) minmax(320px,auto) minmax(110px,1fr);align-items:center;gap:22px;direction:rtl}
      #pbCanonicalFooterV624 .pbFooterBrand{min-width:0;display:grid;gap:4px;justify-items:start;text-align:right}
      #pbCanonicalFooterV624 .pbFooterBrand b{font-size:13px;color:#344054}.pbFooterBrand span{font-size:10px;line-height:1.8;color:#98a2b3}
      #pbCanonicalFooterV624 .pbFooterCenter{min-width:0;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
      #pbCanonicalFooterV624 .pbFooterCenter a{font-size:10px;color:#475467;text-decoration:none;white-space:nowrap}.pbFooterCenter a:hover{color:#315efb}
      #pbCanonicalFooterV624 .pbFooterTrust{justify-self:end;display:flex;align-items:center;justify-content:center;min-width:94px;min-height:76px;overflow:hidden}
      #pbCanonicalFooterV624 .pbFooterTrust a{width:82px;height:72px;display:flex;align-items:center;justify-content:center;padding:4px;border:1px solid #eef0f3;border-radius:13px;background:#fff;box-shadow:0 4px 16px rgba(16,24,40,.05);overflow:hidden;text-decoration:none;color:#667085;text-align:center}
      #pbCanonicalFooterV624 .pbFooterTrust img{display:block;max-width:70px;max-height:62px;width:auto;height:auto;object-fit:contain;font-size:0;color:transparent}
      #pbCanonicalFooterV624 .pbFooterTrust a.pbTrustFallback::after{content:"نماد اعتماد";font-size:9px;font-weight:800;color:#667085;line-height:1.6}
      #pbCanonicalFooterV624 .pbFooterContact{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;padding-top:10px;border-top:1px dashed #eef2f6;min-width:0}
      #pbCanonicalFooterV624 .pbFooterContact b,#pbCanonicalFooterV624 .pbFooterContact a,#pbCanonicalFooterV624 .pbFooterContact span{font-size:9px;color:#667085;text-decoration:none;line-height:1.7;max-width:100%;overflow-wrap:anywhere}

      /* v609 — /ai must stay in the same mobile viewport as the canonical header.
         The page itself was rendering, but a wide descendant could expand the RTL document
         and leave the real retouch content one horizontal screen away. */
      html.pbAiViewportLock,html.pbAiViewportLock body{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
      body.pbAiViewportLock{position:relative!important;margin-left:0!important;margin-right:0!important;overscroll-behavior-x:none!important}
      body.pbAiViewportLock #root{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:0!important;overflow-x:hidden!important;position:relative!important;left:auto!important;right:auto!important;float:none!important;transform:none!important;translate:none!important}
      body.pbAiViewportLock #root>.publicAiPage,body.pbAiViewportLock #root .publicAiPremiumPage{position:relative!important;inset:auto!important;inset-inline:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;margin-inline:0!important;padding-left:0!important;padding-right:0!important;float:none!important;overflow-x:hidden!important;transform:none!important;translate:none!important;contain:inline-size!important}
      body.pbAiViewportLock #root .publicAiPage>*{min-width:0!important;box-sizing:border-box!important}

      /* v599 — album picker/filter typography and direction are explicit, not browser defaults. */
      .albumDesignMobileCatalogPickerBackdrop,.albumDesignMobileCatalogPickerSheet,.albumDesignMobileCatalogPickerChoices,.albumDesignCatalogFilters{font-family:Vazirmatn,Tahoma,Arial,sans-serif!important;direction:rtl!important;text-align:right!important}
      .albumDesignMobileCatalogPickerSheet *,.albumDesignCatalogFilters *{font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
      .albumDesignMobileCatalogPickerSheet>header,.albumDesignMobileCatalogPickerSheet>header>div,.albumDesignMobileCatalogPickerChoices>button{direction:rtl!important;text-align:right!important}
      .albumDesignMobileCatalogPickerChoices>button{justify-items:start!important;align-content:center!important;pointer-events:auto!important}
      .albumDesignMobileCatalogPickerChoices>button b,.albumDesignMobileCatalogPickerChoices>button small{width:100%!important;text-align:right!important;direction:rtl!important}

        body.pbHomePublicRoute #root .pbMobileInstallHomeAction{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-height:44px!important;padding:10px 17px!important;border:1px solid #aebfff!important;border-radius:12px!important;background:linear-gradient(135deg,#315efb,#4f46e5)!important;color:#fff!important;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important;font-size:12px!important;font-weight:900!important;line-height:1.35!important;box-shadow:0 8px 22px rgba(49,94,251,.18)!important;cursor:pointer!important}
        body.pbHomePublicRoute #root .pbMobileInstallHomeAction::before{content:"↓";font-size:16px;line-height:1}
        html.pb711Installed .pbMobileInstallHomeAction,html.pb711Installed .pbMobileInstallMenuButton,html.pb710Installed .pbMobileInstallHomeAction,html.pb710Installed .pbMobileInstallMenuButton{display:none!important}
      @media(max-width:820px){
        html.pbAiViewportLock,html.pbAiViewportLock body,body.pbAiViewportLock #root,body.pbAiViewportLock #root>.publicAiPage{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important}
        body.pbAiViewportLock #root .publicAiHeroPremium,body.pbAiViewportLock #root .publicAiPricingSection,body.pbAiViewportLock #root .publicAiOriginalBanner,body.pbAiViewportLock #root .publicAiSamplesSection,body.pbAiViewportLock #root .publicAiBenefitStrip,body.pbAiViewportLock #root .publicAiHowSection,body.pbAiViewportLock #root .publicAiPremiumCheckout,body.pbAiViewportLock #root .publicAiFaqSection{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
        body.pbAiViewportLock #root .publicAiHeroPremium{width:100%!important;grid-template-columns:minmax(0,1fr)!important}
        body.pbAiViewportLock #root .publicAiHeroPremiumCopy,body.pbAiViewportLock #root .publicAiHeroPremiumVisual,body.pbAiViewportLock #root .skinRetouchCompareCard,body.pbAiViewportLock #root .skinRetouchCompareStage{min-width:0!important;max-width:100%!important;width:100%!important}
        body.pbAiViewportLock #root .publicAiPremiumCheckout{width:auto!important;margin-left:14px!important;margin-right:14px!important;max-width:calc(100% - 28px)!important}
        #pbCanonicalHeaderV624 .pbCanonicalMain{width:100%!important;height:61px!important;min-height:61px!important;padding:7px 11px!important;gap:10px!important;justify-content:flex-start!important;position:relative!important}
        /* v606: keep the logo in its original left slot; center only the PhotoBridge wordmark. */
        #pbCanonicalHeaderV624 .pbCanonicalBrand{position:static!important;left:auto!important;top:auto!important;transform:none!important;z-index:1!important;max-width:none!important;gap:0!important}
        #pbCanonicalHeaderV624 .pbCanonicalBrand img{width:38px!important;height:38px!important;border-radius:11px!important;position:absolute!important;left:11px!important;top:50%!important;transform:translateY(-50%)!important;z-index:2!important}
        #pbCanonicalHeaderV624 .pbCanonicalBrand b{display:block!important;font-size:15px!important;line-height:1!important;letter-spacing:-.15px!important;position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:1!important;pointer-events:none!important}
        #pbCanonicalHeaderV624 .pbCanonicalDesktopCluster{display:none!important}
        #pbCanonicalHeaderV624 .pbCanonicalMobileControls{margin-left:auto!important;display:flex!important;align-items:center!important;gap:7px!important;direction:rtl!important;order:1!important;position:relative!important;z-index:2!important}
        #pbCanonicalHeaderV624 .pbMobileMenuButton{min-width:45px!important;width:45px!important;height:45px!important;display:grid!important;place-items:center!important;border:1px solid #dfe3ea!important;border-radius:12px!important;background:#fff!important;color:#344054!important;-webkit-text-fill-color:currentColor!important;text-decoration:none!important;font-family:inherit!important;font-weight:900!important;font-size:21px!important;cursor:pointer!important;padding:0!important}
        #pbCanonicalHeaderV624.pbScrolled .pbMobileMenuButton{background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.30)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGlyph{width:24px!important;height:18px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;align-items:stretch!important;color:inherit!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGlyph i{display:block!important;width:100%!important;height:2.5px!important;border-radius:99px!important;background:currentColor!important;box-shadow:none!important}
        #pbCanonicalHeaderV624 .pbMobileMenuClose{display:grid!important;place-items:center!important;width:25px!important;height:25px!important;color:inherit!important;font-size:27px!important;line-height:1!important;font-weight:500!important}

        #pbCanonicalHeaderV624 .pbMobileMenu{position:absolute!important;top:calc(100% + 7px)!important;right:10px!important;left:10px!important;display:grid!important;gap:8px!important;padding:10px!important;border:1px solid #e4e7ec!important;border-radius:16px!important;background:rgba(255,255,255,.985)!important;box-shadow:0 18px 48px rgba(15,23,42,.18)!important;direction:rtl!important;z-index:2!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(-10px) scaleY(.78)!important;transform-origin:top center!important;clip-path:inset(0 0 100% 0 round 16px)!important;max-height:calc(100dvh - 78px)!important;overflow:hidden!important;will-change:transform,clip-path,opacity!important;transition:opacity .22s ease,transform .34s cubic-bezier(.4,0,.2,1),clip-path .34s cubic-bezier(.4,0,.2,1),visibility 0s linear .34s!important}
        #pbCanonicalHeaderV624 .pbMobileMenu.open{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translateY(0) scaleY(1)!important;clip-path:inset(0 0 0 0 round 16px)!important;max-height:calc(100dvh - 78px)!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;transition:opacity .22s ease,transform .34s cubic-bezier(.4,0,.2,1),clip-path .34s cubic-bezier(.4,0,.2,1),visibility 0s linear 0s!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroup{padding:7px 8px!important;border:1px solid #eef2f6!important;border-radius:13px!important;background:#f8fafc!important;overflow:hidden!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupToggle{width:100%!important;min-height:34px!important;display:grid!important;grid-template-columns:26px minmax(0,1fr)!important;align-items:center!important;gap:7px!important;padding:1px 2px!important;border:0!important;background:transparent!important;color:#475467!important;font:950 10.5px/1.4 Vazirmatn,Tahoma,Arial,sans-serif!important;cursor:pointer!important;direction:ltr!important;text-align:right!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupLabel{direction:rtl!important;text-align:right!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupArrow{display:grid!important;place-items:center!important;width:24px!important;height:24px!important;border-radius:8px!important;background:#fff!important;border:1px solid #e4e7ec!important;color:#667085!important;font-size:19px!important;line-height:1!important;transition:transform .22s ease,background .22s ease,color .22s ease!important;transform-origin:center!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroup.expanded .pbMobileMenuGroupArrow{transform:rotate(-90deg)!important;background:#eef2ff!important;color:#315efb!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupButtons{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;max-height:0!important;opacity:0!important;overflow:hidden!important;margin-top:0!important;transform:translateY(-4px)!important;transition:max-height .28s ease,opacity .2s ease,transform .24s ease,margin-top .24s ease!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroup.expanded .pbMobileMenuGroupButtons{max-height:180px!important;opacity:1!important;transform:translateY(0)!important;margin-top:7px!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupButtons a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;padding:8px 6px!important;border:1px solid #dfe5ed!important;border-radius:10px!important;background:#fff!important;color:#344054!important;text-decoration:none!important;font-size:10.6px!important;font-weight:900!important;text-align:center!important;line-height:1.45!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupButtons a.active{background:#eef2ff!important;border-color:#c7d2fe!important;color:#3730a3!important}
        #pbCanonicalHeaderV624 .pbMobileLoginGroup .pbMobileMenuGroupButtons a{border-color:#d6e1ff!important;color:#244fc7!important}
        #pbCanonicalHeaderV624 .pbMobileMembershipGroup .pbMobileMenuGroupButtons a{background:#f7faff!important;border-color:#dbe5ff!important;color:#3156b9!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks{display:grid!important;gap:0!important;padding:5px 9px!important;border:1px solid #edf0f4!important;border-radius:13px!important;background:#fff!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks>span{display:block!important;padding:4px 3px 6px!important;color:#98a2b3!important;font-size:9.4px!important;font-weight:900!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks a{display:flex!important;align-items:center!important;justify-content:flex-start!important;direction:rtl!important;min-height:34px!important;padding:7px 4px 7px 2px!important;border:0!important;border-bottom:1px solid #f0f2f5!important;border-radius:0!important;background:transparent!important;color:#475467!important;text-decoration:none!important;font-size:10.2px!important;font-weight:750!important;text-align:right!important;line-height:1.55!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks a:last-child{border-bottom:0!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks a::after{content:"‹";font-size:15px!important;line-height:1!important;color:#98a2b3!important;flex:0 0 auto!important;margin-right:auto!important;margin-left:0!important;transform:translateX(-1px)!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks a.active{color:#315efb!important;font-weight:900!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks .pbMobileInstallMenuButton{display:flex!important;align-items:center!important;justify-content:flex-start!important;direction:rtl!important;width:100%!important;min-height:38px!important;padding:8px 4px 8px 2px!important;border:0!important;border-bottom:1px solid #f0f2f5!important;border-radius:0!important;background:transparent!important;color:#315efb!important;font-family:inherit!important;font-size:10.4px!important;font-weight:900!important;text-align:right!important;line-height:1.55!important;cursor:pointer!important}
        #pbCanonicalHeaderV624 .pbMobileInfoLinks .pbMobileInstallMenuButton::after{content:"↓";display:grid;place-items:center;width:23px;height:23px;margin-right:auto!important;margin-left:0!important;border-radius:8px;background:#eef3ff;color:#315efb;font-size:14px;font-weight:900}
        #pbCanonicalHeaderV624 .pb599MobileSessionCard{display:grid!important;gap:7px!important;padding:9px!important;border:1px solid #dce6ff!important;border-radius:14px!important;background:linear-gradient(135deg,#f8fbff,#eef4ff)!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionCard[hidden]{display:none!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionIdentity{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;direction:rtl!important}
        #pbCanonicalHeaderV624 .pb599SessionDot{width:9px!important;height:9px!important;border-radius:999px!important;background:#16a34a!important;box-shadow:0 0 0 4px rgba(22,163,74,.10)!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionIdentity>div{display:grid!important;gap:1px!important;min-width:0!important;text-align:right!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionIdentity small{font-size:8px!important;color:#64748b!important;font-weight:750!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionIdentity b{font-size:11px!important;color:#172033!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-align:right!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionIdentity em{font-style:normal!important;padding:3px 7px!important;border-radius:999px!important;background:#dcfce7!important;color:#166534!important;font-size:8px!important;font-weight:950!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionLinks{display:grid!important;grid-template-columns:1.45fr .8fr .9fr!important;gap:5px!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionLinks a{min-height:36px!important;padding:6px 5px!important;font-size:8.5px!important;background:#fff!important;border-color:#dbe4f3!important;color:#344054!important}
        #pbCanonicalHeaderV624 .pb599MobileSessionLinks a:first-child{color:#244fc7!important;border-color:#c9d7ff!important;background:#f8faff!important}

        /* v599 — replace native mobile album selects with one clean filter launcher. */
        .albumDesignCatalogFilters.pb599AlbumFiltersEnhanced{grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:7px!important}
        .albumDesignCatalogFilters.pb599AlbumFiltersEnhanced>label{display:none!important}
        .pb599AlbumFilterButton{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-height:40px!important;width:100%!important;padding:7px 10px!important;border:1px solid #dce3eb!important;border-radius:11px!important;background:#fff!important;color:#172033!important;font:850 10px/1.4 Vazirmatn,Tahoma,Arial,sans-serif!important;text-align:right!important;direction:rtl!important}
        .pb599AlbumFilterButton>span{display:grid!important;gap:1px!important;text-align:right!important}
        .pb599AlbumFilterButton small{font-size:7.5px!important;color:#7b8798!important;font-weight:650!important}
        .pb599AlbumFilterButton b{font-size:9.5px!important;color:#24324a!important;font-weight:900!important}
        .pb599AlbumFilterButton>i{font-style:normal!important;font-size:14px!important;color:#667085!important}
        .albumDesignCatalogFilters.pb599AlbumFiltersEnhanced>b{margin:0!important;white-space:nowrap!important;align-self:center!important}
        .pb599AlbumFilterBackdrop{position:fixed!important;inset:0!important;z-index:2147483643!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;background:rgba(2,6,23,.55)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important;direction:rtl!important}
        .pb599AlbumFilterSheet{width:100%!important;max-height:76dvh!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:#fff!important;border-radius:20px 20px 0 0!important;box-shadow:0 -20px 55px rgba(2,6,23,.28)!important;text-align:right!important}
        .pb599AlbumFilterSheet>header{position:static!important;height:auto!important;min-height:56px!important;padding:10px 12px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;border:0!important;border-bottom:1px solid #edf0f4!important;box-shadow:none!important;background:#fff!important;direction:rtl!important}
        .pb599AlbumFilterSheet>header>div{display:grid!important;gap:2px!important;text-align:right!important}
        .pb599AlbumFilterSheet>header b{font-size:14.5px!important;line-height:1.5!important;color:#111827!important;font-weight:950!important}
        .pb599AlbumFilterSheet>header small{font-size:9.8px!important;color:#7b8798!important;line-height:1.6!important}
        .pb599AlbumFilterSheet>header button{width:36px!important;height:36px!important;min-width:36px!important;padding:0!important;border:1px solid #e4e7ec!important;border-radius:10px!important;background:#fff!important;color:#344054!important;font-size:20px!important}
        .pb599AlbumFilterBody{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding:11px 11px calc(18px + env(safe-area-inset-bottom))!important;display:grid!important;gap:13px!important;scroll-padding-block:12px!important}
        .pb599AlbumFilterGroup{display:grid!important;gap:7px!important;text-align:right!important}
        .pb599AlbumFilterGroup>span{font-size:10.5px!important;color:#667085!important;font-weight:900!important}
        .pb599AlbumFilterChoices{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
        .pb599AlbumFilterChoices button{min-height:44px!important;padding:8px 10px!important;border:1px solid #e0e6ed!important;border-radius:11px!important;background:#fff!important;color:#344054!important;font:850 10.4px/1.4 Vazirmatn,Tahoma,Arial,sans-serif!important;text-align:right!important;direction:rtl!important}
        .pb599AlbumFilterChoices button.active{border-color:#7267d8!important;background:#f6f5ff!important;color:#4038a4!important;box-shadow:0 0 0 2px rgba(114,103,216,.10)!important}
        .pb599AlbumFilterActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;direction:rtl!important}
        .pb599AlbumFilterReset,.pb599AlbumFilterApply{min-height:44px!important;border-radius:11px!important;font:850 10.2px/1.4 Vazirmatn,Tahoma,Arial,sans-serif!important}
        .pb599AlbumFilterReset{border:1px dashed #cbd5e1!important;background:#f8fafc!important;color:#475569!important}
        .pb599AlbumFilterApply{border:1px solid #315efb!important;background:#315efb!important;color:#fff!important}
        .albumDesignMobileCatalogPickerChoices{padding-top:14px!important;padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;scroll-padding-top:14px!important;scroll-padding-bottom:24px!important}
        .albumDesignMobileCatalogPickerChoices>button:first-child{margin-top:2px!important}
        .albumDesignMobileCatalogPickerChoices>button:last-child{margin-bottom:8px!important}
        #pbCanonicalHeaderSpacerV624{height:61px}
        body.pbPublicMobileDockMounted{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}
        body.pbAuthenticatedLabPortal.pbPublicMobileDockMounted,body.pbAuthenticatedPhotographerPortal.pbPublicMobileDockMounted{padding-bottom:0!important}
        body.pbAuthenticatedLabPortal .pbHomeMobileAccountBar,body.pbAuthenticatedPhotographerPortal .pbHomeMobileAccountBar{display:none!important}
        .pbHomeMobileAccountBar{position:fixed!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;align-items:stretch!important;gap:3px!important;left:6px!important;right:6px!important;bottom:max(6px,env(safe-area-inset-bottom,0px))!important;z-index:4800!important;min-height:66px!important;padding:6px!important;border:1px solid rgba(183,202,255,.72)!important;border-radius:20px!important;background:linear-gradient(135deg,rgba(238,244,255,.98) 0%,rgba(249,251,255,.98) 48%,rgba(240,244,255,.98) 100%)!important;box-shadow:0 14px 38px rgba(49,94,251,.16),0 3px 12px rgba(15,23,42,.10)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;direction:rtl!important}
        .pbMobilePrimaryActions,.pbMobileAccountActions{display:contents!important}
        .pbHomeMobileAccountBar a{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;min-width:0!important;min-height:54px!important;padding:4px 2px!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#334155!important;text-decoration:none!important;font-size:9px!important;font-weight:900!important;line-height:1.15!important;text-align:center!important;box-shadow:none!important;transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease!important}
        .pbHomeMobileAccountBar a:active{transform:translateY(1px)!important;background:rgba(255,255,255,.72)!important}
        .pbHomeMobileAccountBar a b{width:25px!important;height:25px!important;display:grid!important;place-items:center!important;font-size:0!important;line-height:1!important;color:#315efb!important}
        .pbHomeMobileAccountBar a b svg{width:22px!important;height:22px!important;display:block!important}
        .pbHomeMobileAccountBar a.active{background:linear-gradient(135deg,#315efb,#4f46e5)!important;border-color:#315efb!important;color:#fff!important;box-shadow:0 6px 16px rgba(49,94,251,.22)!important}
        .pbHomeMobileAccountBar a.active b{color:#fff!important}
        body.pbPublicMobileDockMounted .pb592PublicMiniDock{bottom:calc(82px + env(safe-area-inset-bottom,0px))!important}


        /* v605: exact public dock geometry parity with photographer/lab. */
        body.pbPublicMobileDockMounted{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}
        .pbHomeMobileAccountBar{left:0!important;right:0!important;bottom:0!important;width:100%!important;min-height:0!important;margin:0!important;padding:7px 8px calc(7px + env(safe-area-inset-bottom,0px))!important;gap:4px!important;border:0!important;border-top:1px solid rgba(148,163,184,.28)!important;border-radius:18px 18px 0 0!important;background:rgba(255,255,255,.96)!important;box-shadow:0 -8px 28px rgba(15,23,42,.11)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important}
        .pbHomeMobileAccountBar a{height:52px!important;min-height:52px!important;padding:4px 2px 3px!important;border:0!important;border-radius:13px!important;font-size:8.8px!important;line-height:1.25!important;gap:2px!important;color:#667085!important}
        .pbHomeMobileAccountBar a b{width:26px!important;height:25px!important;border-radius:9px!important;background:#f1f5f9!important;color:#475467!important}
        .pbHomeMobileAccountBar a b svg{width:21px!important;height:21px!important}
        .pbHomeMobileAccountBar a.active{background:#eef3ff!important;color:#244fcf!important;border-color:transparent!important;box-shadow:none!important}
        .pbHomeMobileAccountBar a.active b{background:#315efb!important;color:#fff!important}
        body.pbPublicMobileDockMounted .pb592PublicMiniDock{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}

        /* v597: album mobile catalog controls use the same PhotoBridge/Vazirmatn typography. */
        .albumDesignMobilePicker,.albumDesignMobilePicker *,
        .albumDesignMobileCatalogPickerBackdrop,.albumDesignMobileCatalogPickerBackdrop *,
        .albumDesignMobileCatalogPickerSheet,.albumDesignMobileCatalogPickerSheet *,
        .albumDesignCatalogFilters,.albumDesignCatalogFilters *{font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
        .albumDesignMobilePickerButton b,.albumDesignMobileCatalogPickerChoices b{font-weight:850!important}
        .albumDesignMobilePickerButton small,.albumDesignMobileCatalogPickerChoices small,.albumDesignCatalogFilters span{font-weight:650!important}

        /* v596: keep homepage mobile CTAs in one calm PhotoBridge palette. */
        body.pbHomePublicRoute #root .publicActions a,
        body.pbHomePublicRoute #root .publicAudienceCard .audienceActions a,
        body.pbHomePublicRoute #root .publicAudienceCard .audienceActions button{background:#f3f6ff!important;border:1px solid #cbd8ff!important;color:#244fc7!important;box-shadow:none!important}
        body.pbHomePublicRoute #root .publicActions a:active,
        body.pbHomePublicRoute #root .publicAudienceCard .audienceActions a:active,
        body.pbHomePublicRoute #root .publicAudienceCard .audienceActions button:active{background:#e9efff!important;border-color:#aebfff!important;color:#1e429f!important}

        #pbCanonicalFooterV624 .pbFooterInner{width:calc(100% - 24px);min-height:0;padding:18px 0 22px;display:flex;flex-direction:column;gap:14px;text-align:center}
        #pbCanonicalFooterV624 .pbFooterBrand{justify-items:center;text-align:center;order:1}
        #pbCanonicalFooterV624 .pbFooterCenter{order:2;gap:9px}
        #pbCanonicalFooterV624 .pbFooterTrust{order:3;justify-self:auto}
        #pbCanonicalFooterV624 .pbFooterContact{order:4;width:100%;padding-top:10px}
      }
      @media(max-width:420px){
        #pbCanonicalHeaderV624 .pbCanonicalBrand b{display:block!important;font-size:14px!important}
        #pbCanonicalHeaderV624 .pbCanonicalBrand{gap:0!important}
        #pbCanonicalHeaderV624 .pbCanonicalBrand img{width:39px!important;height:39px!important}
        #pbCanonicalHeaderV624 .pbMobileMenuGroupButtons{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      }
    `;
    document.head.appendChild(st);
  }

  function authenticatedPortalActive(){
    if(document.body&&(document.body.classList.contains('pbAuthenticatedLabPortal')||document.body.classList.contains('pbAuthenticatedPhotographerPortal')))return true;
    /* Current v603 runtime bundle does not yet emit the role body classes. Detect the
       mounted legacy role navigation as the authoritative authenticated UI signal. */
    return !!document.querySelector('.labRoleWorkspace,.labMobileUtilityRail,.photographerBottomAppNav,.photographerMobileUtilityRail');
  }
  function removeMobileDock(){
    document.querySelectorAll('.pbHomeMobileAccountBar').forEach(function(node){node.remove()});
    if(document.body)document.body.classList.remove('pbPublicMobileDockMounted');
  }
  function buildMobileDock(){
    if(authenticatedPortalActive()||!isMobileDockRoute(location.pathname))return;
    if(document.querySelector('.pbHomeMobileAccountBar'))return;
    injectStyle();
    var bottom=document.createElement('nav');bottom.className='pbHomeMobileAccountBar';bottom.setAttribute('aria-label','دسترسی سریع PhotoBridge');
    var primary=document.createElement('div');primary.className='pbMobilePrimaryActions';
    var path=normalize(location.pathname),root=activeRoot(path);
    mobileServiceItems.forEach(function(it){var a=makeLink(it[0],'','');a.innerHTML='<b>'+mobileIconSvg(it[2])+'</b><span>'+it[1]+'</span>';if((it[0]==='/ai'&&root==='/retouch-photo')||(it[0]==='/album-design'&&root==='/album-design')||(it[0]==='/instagram-post-design'&&root==='/instagram-post-design'))a.classList.add('active');primary.appendChild(a)});
    var utility=document.createElement('div');utility.className='pbMobileAccountActions';
    mobileAccountItems.forEach(function(it){var a=makeLink(it[0],'','');a.innerHTML='<b>'+mobileIconSvg(it[2])+'</b><span>'+it[1]+'</span>';if(normalize(it[0])===path)a.classList.add('active');utility.appendChild(a)});
    /* v598: utility group renders first in RTL grid so Home is the physical right-most item. */
    bottom.appendChild(utility);bottom.appendChild(primary);document.body.appendChild(bottom);document.body.classList.add('pbPublicMobileDockMounted');
  }
  function syncMobileDock(){
    if(authenticatedPortalActive()||!isMobileDockRoute(location.pathname)){removeMobileDock();return}
    buildMobileDock();
  }

  function buildHeader(){
    if(!isPublicRoute(location.pathname))return;
    if(document.getElementById('pbCanonicalHeaderV624'))return;
    injectStyle();
    var home=normalize(location.pathname)==='/';
    document.body.classList.add('pbCanonicalHeaderMounted');
    document.body.classList.toggle('pbHomePublicRoute',home);

    var header=document.createElement('header');header.id='pbCanonicalHeaderV624';header.setAttribute('dir','rtl');
    var main=document.createElement('div');main.className='pbCanonicalMain';
    var brand=document.createElement('a');brand.className='pbCanonicalBrand';brand.href='/';brand.innerHTML='<img src="/photobridge-favicon-v0140.png" alt=""><b>PhotoBridge</b>';
    var nav=document.createElement('nav');nav.className='pbCanonicalDesktopNav';nav.setAttribute('aria-label','منوی اصلی PhotoBridge');
    desktopItems.forEach(function(it){nav.appendChild(makeLink(it[0],it[1],'pbCanonicalNavLink'))});
    var mobile=document.createElement('div');mobile.className='pbCanonicalMobileControls';
    var menuBtn=document.createElement('button');menuBtn.type='button';menuBtn.className='pbMobileMenuButton';menuBtn.innerHTML='<span class="pbMobileMenuGlyph" aria-hidden="true"><i></i><i></i><i></i></span>';menuBtn.setAttribute('aria-label','باز کردن منو');menuBtn.setAttribute('aria-expanded','false');
    mobile.appendChild(menuBtn);
    var accounts=document.createElement('div');accounts.className='pbCanonicalAccounts';accounts.setAttribute('aria-label','ورود و عضویت');
    accountItems.forEach(function(it){accounts.appendChild(makeLink(it[0],it[1],''))});
    var divider=document.createElement('span');divider.className='pbCanonicalAccountDivider';divider.setAttribute('aria-hidden','true');
    var desktopCluster=document.createElement('div');desktopCluster.className='pbCanonicalDesktopCluster';desktopCluster.appendChild(accounts);desktopCluster.appendChild(divider);desktopCluster.appendChild(nav);
    main.appendChild(brand);main.appendChild(desktopCluster);main.appendChild(mobile);header.appendChild(main);

    var mm=document.createElement('div');mm.className='pbMobileMenu';mm.setAttribute('aria-hidden','true');
    var sessionCard=document.createElement('section');sessionCard.className='pb599MobileSessionCard';sessionCard.hidden=true;sessionCard.setAttribute('aria-label','حساب فعال PhotoBridge');mm.appendChild(sessionCard);
    function makeMobileMenuGroup(label,className,links){
      var group=document.createElement('section');group.className='pbMobileMenuGroup '+className;
      var toggle=document.createElement('button');toggle.type='button';toggle.className='pbMobileMenuGroupToggle';toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<span class="pbMobileMenuGroupArrow" aria-hidden="true">‹</span><span class="pbMobileMenuGroupLabel">'+label+'</span>';
      var buttons=document.createElement('div');buttons.className='pbMobileMenuGroupButtons';
      links.forEach(function(it){buttons.appendChild(makeLink(it[0],it[1],''))});
      toggle.addEventListener('click',function(e){e.stopPropagation();var expanded=!group.classList.contains('expanded');group.classList.toggle('expanded',expanded);toggle.setAttribute('aria-expanded',expanded?'true':'false')});
      group.appendChild(toggle);group.appendChild(buttons);return group;
    }
    var loginGroup=makeMobileMenuGroup('ورودها','pbMobileLoginGroup',[['/photographer','ورود عکاس'],['/lab','ورود لابراتوار'],['/rental','ورود فروشگاه']]);mm.appendChild(loginGroup);
    var membershipGroup=makeMobileMenuGroup('عضویت‌ها','pbMobileMembershipGroup',[['/ai','عضویت آزاد'],['/trial','عضویت لابراتوار'],['/equipment-rental/register','عضویت فروشگاه']]);mm.appendChild(membershipGroup);
    var info=document.createElement('nav');info.className='pbMobileInfoLinks';info.setAttribute('aria-label','صفحات اطلاعاتی PhotoBridge');info.innerHTML='<span>خدمات و راهنما</span>';
    var installMenuBtn=document.createElement('button');installMenuBtn.type='button';installMenuBtn.className='pbMobileInstallMenuButton';installMenuBtn.textContent='نصب برنامه موبایل';installMenuBtn.setAttribute('aria-label','نصب برنامه موبایل PhotoBridge');info.appendChild(installMenuBtn);
    [['/album-design','طراحی آلبوم'],['/instagram-post-design','طراحی اینستاگرام'],['/photo-selection-gallery','گالری انتخاب عکس'],['/photo-lab-print','چاپ لابراتوار'],['/retouch-photo','روتوش عکس'],['/equipment-rental','اجاره تجهیزات'],['/guide','راهنما']].forEach(function(it){info.appendChild(makeLink(it[0],it[1],''))});mm.appendChild(info);header.appendChild(mm);

    var spacer=document.createElement('div');spacer.id='pbCanonicalHeaderSpacerV624';spacer.setAttribute('aria-hidden','true');
    document.body.insertBefore(header,document.body.firstChild);
    if(header.nextSibling)document.body.insertBefore(spacer,header.nextSibling);else document.body.appendChild(spacer);

    syncMobileDock();
    syncMobileSessionCard(mm);

    function setMenu(open){mm.classList.toggle('open',open);mm.setAttribute('aria-hidden',open?'false':'true');menuBtn.setAttribute('aria-expanded',open?'true':'false');menuBtn.setAttribute('aria-label',open?'بستن منو':'باز کردن منو');menuBtn.innerHTML=open?'<span class="pbMobileMenuClose" aria-hidden="true">×</span>':'<span class="pbMobileMenuGlyph" aria-hidden="true"><i></i><i></i><i></i></span>'}
    installMenuBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();setMenu(false);requestMobileInstall()});
    menuBtn.addEventListener('click',function(e){e.stopPropagation();syncMobileSessionCard(mm);setMenu(!mm.classList.contains('open'))});
    window.addEventListener('focus',function(){syncMobileSessionCard(mm)},{passive:true});
    mm.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('a'))setMenu(false)});
    document.addEventListener('click',function(e){if(mm.classList.contains('open')&&!header.contains(e.target))setMenu(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});

    function measure(){var h=Math.max(1,Math.ceil(header.getBoundingClientRect().height));spacer.style.height=h+'px'}
    measure();setTimeout(measure,0);setTimeout(measure,250);addEventListener('resize',measure,{passive:true});
    if(typeof ResizeObserver!=='undefined'){try{new ResizeObserver(measure).observe(header)}catch(e){}}
    syncActive();syncScroll();
  }

  function buildFooter(){
    if(!isLandingRoute(location.pathname))return;
    if(document.getElementById('pbCanonicalFooterV624'))return;
    injectStyle();
    document.body.classList.add('pbCanonicalFooterMounted');
    var footer=document.createElement('footer');footer.id='pbCanonicalFooterV624';footer.setAttribute('dir','rtl');
    footer.innerHTML='<div class="pbFooterInner"><div class="pbFooterBrand"><b>PhotoBridge</b><span>ارتباط عکاس، مشتری و لابراتوار</span></div><nav class="pbFooterCenter" aria-label="پیوندهای پایین صفحه"><a href="/photographer">ورود عکاس</a><a href="/photo-lab-print">چاپ عکس لابراتوار</a><a href="/album-design">طراحی آلبوم</a><a href="/guide">راهنما</a></nav><div class="pbFooterTrust"><a class="pbTrustLink" target="_blank" rel="noopener noreferrer" referrerpolicy="origin" href="https://trustseal.enamad.ir/?id=773966&Code=owEPT5kB5GSI2K8SDYvvjAFdufhCOW0X" aria-label="نماد اعتماد الکترونیکی"><img alt="" referrerpolicy="origin" src="https://trustseal.enamad.ir/logo.aspx?id=773966&Code=owEPT5kB5GSI2K8SDYvvjAFdufhCOW0X"></a></div></div>';
    var trust=footer.querySelector('.pbTrustLink'),img=footer.querySelector('.pbFooterTrust img');
    if(img&&trust){img.addEventListener('error',function(){img.style.display='none';trust.classList.add('pbTrustFallback')});setTimeout(function(){if(!img.complete||!img.naturalWidth){img.style.display='none';trust.classList.add('pbTrustFallback')}},2500)}
    document.body.appendChild(footer);
    try{
      fetch('/api/public/contact',{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){
        var s=d&&d.settings;if(!s||s.enabled===false)return;var items=[];
        if(s.phone&&s.phone.enabled&&s.phone.value)items.push('<a dir="ltr" href="tel:'+String(s.phone.value).replace(/\s/g,'')+'">'+String(s.phone.value)+'</a>');
        if(s.email&&s.email.enabled&&s.email.value)items.push('<a dir="ltr" href="mailto:'+String(s.email.value)+'">'+String(s.email.value)+'</a>');
        if(s.whatsapp&&s.whatsapp.enabled&&s.whatsapp.value){var w=String(s.whatsapp.value),wh=w.indexOf('http')===0?w:'https://wa.me/'+w.replace(/\D/g,'').replace(/^0/,'98');items.push('<a target="_blank" rel="noreferrer" href="'+wh+'">واتساپ</a>')}
        if(s.instagram&&s.instagram.enabled&&s.instagram.value){var ig=String(s.instagram.value),ih=ig.indexOf('http')===0?ig:'https://instagram.com/'+ig.replace(/^@/,'');items.push('<a target="_blank" rel="noreferrer" href="'+ih+'">اینستاگرام</a>')}
        if(s.address&&s.address.enabled&&s.address.value)items.push('<span>'+String(s.address.value)+'</span>');
        if(!items.length)return;var inner=footer.querySelector('.pbFooterInner');var c=document.createElement('div');c.className='pbFooterContact';c.innerHTML='<b>ارتباط با ما</b>'+items.join('');inner.appendChild(c);
      }).catch(function(){});
    }catch(e){}
  }

  function polishHomePhotographerAccess(){
    if(normalize(location.pathname)!=='/')return;
    var root=document.getElementById('root');if(!root)return;
    var heroActions=root.querySelector('.publicHeroCopy .publicActions');
    if(heroActions&&!heroActions.querySelector('.pbMobileInstallHomeAction')){
      var installHomeBtn=document.createElement('button');installHomeBtn.type='button';installHomeBtn.className='pbMobileInstallHomeAction';installHomeBtn.textContent='نصب برنامه موبایل';installHomeBtn.setAttribute('aria-label','نصب برنامه موبایل PhotoBridge');installHomeBtn.addEventListener('click',function(e){e.preventDefault();requestMobileInstall()});heroActions.appendChild(installHomeBtn);
    }
    root.querySelectorAll('a[href="/photographer/signup"]').forEach(function(a){
      if(a.closest('.publicHeroCopy .publicActions')||a.closest('.publicAudienceCard.photographer'))a.remove();
    });
    var card=root.querySelector('.publicAudienceCard.photographer');
    if(card){
      var h=card.querySelector('h3');if(h&&h.textContent!=='ورود به حساب عکاسی PhotoBridge')h.textContent='ورود به حساب عکاسی PhotoBridge';
      var p=card.querySelector('p');var copy='عضویت عکاس در PhotoBridge فقط از طریق لینک دعوت انجام می‌شود. اگر دعوتنامه دریافت کرده‌ای، فعال‌سازی را از همان لینک انجام بده؛ حساب‌های فعال از اینجا وارد می‌شوند.';if(p&&p.textContent!==copy)p.textContent=copy;
      var login=card.querySelector('.audienceActions a[href="/photographer"]');if(login){if(login.textContent!=='ورود به حساب عکاس')login.textContent='ورود به حساب عکاس';login.classList.add('primary')}
    }
    if(heroActions&&document.getElementById('pbCanonicalHeaderV624'))document.documentElement.classList.remove('pb1330HomePending');
  }
  function observeHomePhotographerAccess(){
    if(normalize(location.pathname)!=='/'||typeof MutationObserver==='undefined')return;
    var root=document.getElementById('root');if(!root)return;
    var queued=false;
    var obs=new MutationObserver(function(){if(queued)return;queued=true;setTimeout(function(){queued=false;polishHomePhotographerAccess()},0)});
    try{obs.observe(root,{childList:true,subtree:true})}catch(e){}
    polishHomePhotographerAccess();
  }
  function polishPhotographerLoginInviteOnly(){
    if(normalize(location.pathname)!=='/photographer')return;
    document.body.classList.add('pbInviteOnlyPhotographerLogin');
    var root=document.getElementById('root');if(!root)return;
    root.querySelectorAll('.authFooterLinks a[href="/photographer/signup"]').forEach(function(a){a.remove()});
    var form=root.querySelector('form.memberLogin');if(!form)return;
    if(!form.querySelector('.pbInviteOnlyLoginNote')){
      var links=form.querySelector('.authFooterLinks');var note=document.createElement('div');note.className='pbInviteOnlyLoginNote';note.textContent='عضویت عکاس فقط از طریق لینک دعوت انجام می‌شود. اگر دعوتنامه داری، همان لینک پیامک‌شده را برای فعال‌سازی حساب باز کن.';
      if(links)form.insertBefore(note,links);else form.appendChild(note);
    }
  }
  function observeInviteOnlyPublicAccess(){
    var path=normalize(location.pathname);if(path!=='/'&&path!=='/photographer'||typeof MutationObserver==='undefined')return;
    var root=document.getElementById('root');if(!root)return;
    var queued=false;var obs=new MutationObserver(function(){if(queued)return;queued=true;setTimeout(function(){queued=false;polishHomePhotographerAccess();polishPhotographerLoginInviteOnly()},0)});
    try{obs.observe(root,{childList:true,subtree:true})}catch(e){}
    polishHomePhotographerAccess();polishPhotographerLoginInviteOnly();
  }

  function syncActive(){
    var root=activeRoot(location.pathname);
    document.querySelectorAll('#pbCanonicalHeaderV624 a[href]').forEach(function(a){
      var href=normalize(a.getAttribute('href')||'');var active=href===root;
      a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }
  var pbInternalScrolled=false;
  function syncScroll(){
    var h=document.getElementById('pbCanonicalHeaderV624');if(!h)return;
    var scrolled=((window.scrollY||document.documentElement.scrollTop||0)>18)||pbInternalScrolled;
    h.classList.toggle('pbScrolled',scrolled);
  }
  function syncInternalScroll(ev){
    var t=ev&&ev.target;if(!t||t===document||t===document.documentElement||t===document.body)return;
    var top=Number(t.scrollTop||0);
    if(top>18)pbInternalScrolled=true;else if(top<=2)pbInternalScrolled=false;
    syncScroll();
  }
  function syncRouteViewportClass(){var ai=normalize(location.pathname)==='/ai';document.documentElement.classList.toggle('pbAiViewportLock',ai);if(document.body)document.body.classList.toggle('pbAiViewportLock',ai);if(ai&&window.innerWidth<=820){try{document.documentElement.scrollLeft=0;document.body.scrollLeft=0}catch(e){}}}
  function cleanupLegacyPublicNav(){try{['pbCanonicalHeaderV584','pbCanonicalHeaderSpacerV584','pbCanonicalFooterV584','pbCanonicalHeaderV584Style','pbCanonicalHeaderV623','pbCanonicalHeaderSpacerV623','pbCanonicalFooterV623','pbCanonicalHeaderV623Style'].forEach(function(id){var n=document.getElementById(id);if(n)n.remove()});document.querySelectorAll('.pbHomeMobileAccountBar').forEach(function(n){n.remove()});document.body&&document.body.classList.remove('pbCanonicalHeaderMounted','pbCanonicalFooterMounted','pbPublicMobileDockMounted')}catch(e){}}
  function boot(){cleanupLegacyPublicNav();syncRouteViewportClass();injectStyle();buildHeader();syncMobileDock();buildFooter();polishHomePhotographerAccess();observeInviteOnlyPublicAccess();syncActive();syncScroll();setTimeout(function(){polishHomePhotographerAccess();polishPhotographerLoginInviteOnly();syncMobileDock()},350);setTimeout(function(){polishHomePhotographerAccess();polishPhotographerLoginInviteOnly();syncMobileDock()},1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  addEventListener('scroll',syncScroll,{passive:true});document.addEventListener('scroll',syncInternalScroll,true);
  addEventListener('popstate',function(){syncRouteViewportClass();syncActive();syncScroll();syncMobileDock()});addEventListener('hashchange',function(){syncRouteViewportClass();syncActive();syncScroll();syncMobileDock()});window.addEventListener('photobridge-auth-session-changed',syncMobileDock);
})();
