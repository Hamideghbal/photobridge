/* PhotoBridge v0.17.580 — fixed canonical public header + stable spacing + canonical public footer */
(function(){
  'use strict';

  var desktopItems=[
    ['/','خانه'],
    ['/album-design','طراحی آلبوم'],
    ['/instagram-post-design','طراحی اینستاگرام'],
    ['/slideshow-design','طراحی اسلایدشو'],
    ['/photo-selection-gallery','گالری انتخاب عکس'],
    ['/photo-lab-print','چاپ لابراتوار'],
    ['/retouch-photo','روتوش عکس'],
    ['/guide','راهنما']
  ];
  var accountItems=[
    ['/photographer','ورود عکاس','ورود'],
    ['/photographer/signup','عضویت عکاس','عضویت'],
    ['/lab','ورود لابراتوار','لابراتوار'],
    ['/trial','ثبت‌نام لابراتوار','ثبت لاب']
  ];

  function normalize(path){
    path=String(path||'/').split('?')[0].split('#')[0]||'/';
    if(path.length>1)path=path.replace(/\/+$/,'');
    return path;
  }
  function isPublicRoute(path){
    path=normalize(path);
    return path==='/'||path==='/ai'||path.indexOf('/retouch-photo')===0||path.indexOf('/album-design')===0||path.indexOf('/instagram-post-design')===0||path.indexOf('/slideshow-design')===0||path.indexOf('/photo-selection-gallery')===0||path.indexOf('/photo-lab-print')===0||path.indexOf('/guide')===0;
  }
  function isLandingRoute(path){
    path=normalize(path);
    if(path==='/'||path.indexOf('/retouch-photo')===0||path.indexOf('/photo-selection-gallery')===0||path.indexOf('/photo-lab-print')===0||path.indexOf('/guide')===0)return true;
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
    if(path.indexOf('/guide')===0)return '/guide';
    return '';
  }
  function makeLink(href,label,cls){
    var a=document.createElement('a');a.href=href;a.textContent=label;if(cls)a.className=cls;return a;
  }

  function injectStyle(){
    if(document.getElementById('pbCanonicalHeaderV580Style'))return;
    var st=document.createElement('style');
    st.id='pbCanonicalHeaderV580Style';
    st.textContent=`
      body.pbCanonicalHeaderMounted #root .publicHeader,
      body.pbCanonicalHeaderMounted #root .publicSeoHeader,
      body.pbCanonicalHeaderMounted #root .publicGuideHeader,
      body.pbCanonicalHeaderMounted #root .publicAiHeader,
      body.pbCanonicalHeaderMounted #root .pbInjectedDesignHeader,
      body.pbCanonicalHeaderMounted #root .seoSafeHeader,
      body.pbCanonicalHeaderMounted > .seoSafeHeader:not(#pbCanonicalHeaderV580){display:none!important}
      body.pbCanonicalHeaderMounted #root .publicHeaderSpacer{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}

      #pbCanonicalHeaderV580{
        display:block!important;height:auto!important;min-height:0!important;padding:0!important;margin:0!important;
        position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:9000!important;width:100%!important;
        align-items:initial!important;justify-content:initial!important;overflow:visible!important;
        font-family:Vazirmatn,Tahoma,Arial,sans-serif;background:#fff!important;color:#101828;
        border:0!important;border-bottom:1px solid rgba(16,24,40,.07)!important;box-shadow:0 1px 12px rgba(16,24,40,.04)!important;
        isolation:isolate;transition:border-color .24s ease,box-shadow .24s ease!important
      }
      #pbCanonicalHeaderV580::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0;background:radial-gradient(circle at 13% -55%,rgba(255,255,255,.72) 0,rgba(255,255,255,.26) 20%,rgba(255,255,255,0) 43%),linear-gradient(128deg,#2f63f6 0%,#3e5eea 42%,#5047df 100%);transition:opacity .28s ease}
      #pbCanonicalHeaderV580.pbScrolled::before{opacity:1}
      #pbCanonicalHeaderV580.pbScrolled{border-bottom-color:rgba(255,255,255,.20)!important;box-shadow:0 12px 32px rgba(49,94,251,.24)!important}
      #pbCanonicalHeaderV580 *{box-sizing:border-box}
      #pbCanonicalHeaderV580 .pbCanonicalMain{width:min(1360px,calc(100% - 28px));height:72px!important;min-height:72px!important;margin:0 auto!important;padding:0!important;display:flex!important;align-items:center!important;gap:18px!important;direction:ltr!important;position:relative}
      #pbCanonicalHeaderV580 .pbCanonicalBrand{display:flex!important;align-items:center!important;gap:9px!important;text-decoration:none!important;color:#101828!important;direction:ltr!important;flex:0 0 auto!important;white-space:nowrap!important;order:0!important}
      #pbCanonicalHeaderV580 .pbCanonicalBrand img{width:43px!important;height:43px!important;border-radius:12px!important;box-shadow:0 5px 16px rgba(79,70,229,.12)!important;display:block!important;object-fit:cover!important;transition:filter .24s ease,box-shadow .24s ease,transform .24s ease!important}
      #pbCanonicalHeaderV580 .pbCanonicalBrand b{font-size:16px!important;line-height:1!important;font-weight:900!important;transition:color .24s ease!important}
      #pbCanonicalHeaderV580 .pbCanonicalDesktopNav{flex:1 1 auto!important;min-width:0!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:4px!important;direction:rtl!important;overflow:hidden!important;order:1!important}
      #pbCanonicalHeaderV580 .pbCanonicalDesktopNav a{direction:rtl!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:38px!important;padding:8px 9px!important;border:1px solid transparent!important;border-radius:10px!important;text-decoration:none!important;color:#475467!important;font-size:10.7px!important;line-height:1.3!important;font-weight:800!important;white-space:nowrap!important;transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease!important}
      #pbCanonicalHeaderV580 .pbCanonicalDesktopNav a:hover{background:#f8faff!important;border-color:#e0e7ff!important;color:#3730a3!important}
      #pbCanonicalHeaderV580 .pbCanonicalDesktopNav a.active{background:#eef2ff!important;border-color:#c7d2fe!important;color:#3730a3!important;font-weight:950!important;box-shadow:0 3px 12px rgba(49,94,251,.08)!important}

      #pbCanonicalHeaderV580 .pbAccountStrip{display:block!important;width:100%!important;height:auto!important;min-height:49px!important;padding:0!important;margin:0!important;border:0!important;border-top:1px solid #eef2f6!important;background:#f8fafc!important;transition:background .24s ease,border-color .24s ease!important}
      #pbCanonicalHeaderV580 .pbAccountStripInner{width:min(1360px,calc(100% - 28px));min-height:49px!important;margin:0 auto!important;padding:6px 0!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:7px!important;direction:rtl!important}
      #pbCanonicalHeaderV580 .pbAccountStrip a{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:7px 11px!important;border:1px solid #dde3ec!important;border-radius:9px!important;background:#fff!important;color:#344054!important;text-decoration:none!important;font-size:10.3px!important;font-weight:850!important;white-space:nowrap!important}
      #pbCanonicalHeaderV580 .pbAccountStrip a[href="/photographer/signup"]{background:#eef2ff!important;border-color:#c7d2fe!important;color:#4338ca!important}
      #pbCanonicalHeaderV580 .pbAccountStrip a[href="/lab"]{background:#101828!important;border-color:#101828!important;color:#fff!important}

      #pbCanonicalHeaderV580.pbScrolled .pbCanonicalBrand,#pbCanonicalHeaderV580.pbScrolled .pbCanonicalBrand b,#pbCanonicalHeaderV580.pbScrolled .pbCanonicalDesktopNav a{color:#fff!important}
      #pbCanonicalHeaderV580.pbScrolled .pbCanonicalBrand img{filter:brightness(0) invert(1) drop-shadow(0 2px 5px rgba(255,255,255,.18))!important;box-shadow:none!important}
      #pbCanonicalHeaderV580.pbScrolled .pbCanonicalDesktopNav a:hover{background:rgba(255,255,255,.11)!important;border-color:rgba(255,255,255,.24)!important;color:#fff!important}
      #pbCanonicalHeaderV580.pbScrolled .pbCanonicalDesktopNav a.active{background:#fff!important;border-color:#fff!important;color:#315efb!important;box-shadow:0 5px 16px rgba(15,23,42,.12)!important}
      #pbCanonicalHeaderV580.pbScrolled .pbAccountStrip{background:rgba(23,37,91,.18)!important;border-top-color:rgba(255,255,255,.16)!important}
      #pbCanonicalHeaderV580.pbScrolled .pbAccountStrip a{background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.28)!important;color:#fff!important}
      #pbCanonicalHeaderV580.pbScrolled .pbAccountStrip a[href="/photographer/signup"]{background:#fff!important;color:#315efb!important;border-color:#fff!important}
      #pbCanonicalHeaderV580.pbScrolled .pbAccountStrip a[href="/lab"]{background:rgba(16,24,40,.35)!important;color:#fff!important}

      #pbCanonicalHeaderV580 .pbCanonicalMobileControls,#pbCanonicalHeaderV580 .pbMobileMenu{display:none}
      #pbCanonicalHeaderSpacerV580{display:block!important;width:100%!important;height:72px;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
      .pbHomeMobileAccountBar{display:none}

      body.pbCanonicalFooterMounted #root .publicFooter,
      body.pbCanonicalFooterMounted #root .publicSeoFooter,
      body.pbCanonicalFooterMounted #root .publicGuideFooter,
      body.pbCanonicalFooterMounted > .seoSafeFooter{display:none!important}
      #pbCanonicalFooterV580{width:100%;margin:0!important;padding:0!important;background:#fff;border-top:1px solid #e4e7ec;font-family:Vazirmatn,Tahoma,Arial,sans-serif;color:#667085;position:relative;z-index:5;clear:both}
      #pbCanonicalFooterV580 *{box-sizing:border-box}
      #pbCanonicalFooterV580 .pbFooterInner{width:min(1180px,calc(100% - 36px));min-height:112px;margin:0 auto;padding:18px 0;display:grid;grid-template-columns:minmax(220px,1fr) minmax(320px,auto) minmax(110px,1fr);align-items:center;gap:22px;direction:rtl}
      #pbCanonicalFooterV580 .pbFooterBrand{min-width:0;display:grid;gap:4px;justify-items:start;text-align:right}
      #pbCanonicalFooterV580 .pbFooterBrand b{font-size:13px;color:#344054}.pbFooterBrand span{font-size:10px;line-height:1.8;color:#98a2b3}
      #pbCanonicalFooterV580 .pbFooterCenter{min-width:0;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
      #pbCanonicalFooterV580 .pbFooterCenter a{font-size:10px;color:#475467;text-decoration:none;white-space:nowrap}.pbFooterCenter a:hover{color:#315efb}
      #pbCanonicalFooterV580 .pbFooterTrust{justify-self:end;display:flex;align-items:center;justify-content:center;min-width:94px;min-height:76px;overflow:hidden}
      #pbCanonicalFooterV580 .pbFooterTrust a{width:82px;height:72px;display:flex;align-items:center;justify-content:center;padding:4px;border:1px solid #eef0f3;border-radius:13px;background:#fff;box-shadow:0 4px 16px rgba(16,24,40,.05);overflow:hidden;text-decoration:none;color:#667085;text-align:center}
      #pbCanonicalFooterV580 .pbFooterTrust img{display:block;max-width:70px;max-height:62px;width:auto;height:auto;object-fit:contain;font-size:0;color:transparent}
      #pbCanonicalFooterV580 .pbFooterTrust a.pbTrustFallback::after{content:"نماد اعتماد";font-size:9px;font-weight:800;color:#667085;line-height:1.6}
      #pbCanonicalFooterV580 .pbFooterContact{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;padding-top:10px;border-top:1px dashed #eef2f6;min-width:0}
      #pbCanonicalFooterV580 .pbFooterContact b,#pbCanonicalFooterV580 .pbFooterContact a,#pbCanonicalFooterV580 .pbFooterContact span{font-size:9px;color:#667085;text-decoration:none;line-height:1.7;max-width:100%;overflow-wrap:anywhere}

      @media(max-width:820px){
        #pbCanonicalHeaderV580 .pbCanonicalMain{width:100%!important;height:61px!important;min-height:61px!important;padding:7px 11px!important;gap:10px!important}
        #pbCanonicalHeaderV580 .pbCanonicalBrand img{width:38px!important;height:38px!important;border-radius:11px!important}
        #pbCanonicalHeaderV580 .pbCanonicalBrand b{font-size:14px!important}
        #pbCanonicalHeaderV580 .pbCanonicalDesktopNav,#pbCanonicalHeaderV580 .pbAccountStrip{display:none!important}
        #pbCanonicalHeaderV580 .pbCanonicalMobileControls{margin-left:auto!important;display:flex!important;align-items:center!important;gap:7px!important;direction:rtl!important;order:1!important}
        #pbCanonicalHeaderV580 .pbMobileHome,#pbCanonicalHeaderV580 .pbMobileMenuButton{min-width:41px!important;height:41px!important;display:grid!important;place-items:center!important;border:1px solid #dfe3ea!important;border-radius:11px!important;background:#fff!important;color:#344054!important;text-decoration:none!important;font-family:inherit!important;font-weight:900!important;font-size:18px!important;cursor:pointer!important;padding:0!important}
        #pbCanonicalHeaderV580 .pbMobileHome{font-size:17px!important}
        #pbCanonicalHeaderV580.pbScrolled .pbMobileHome,#pbCanonicalHeaderV580.pbScrolled .pbMobileMenuButton{background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.30)!important;color:#fff!important}
        #pbCanonicalHeaderV580 .pbMobileMenu{position:absolute!important;top:calc(100% + 7px)!important;right:10px!important;left:10px!important;display:none!important;padding:10px!important;border:1px solid #e4e7ec!important;border-radius:16px!important;background:rgba(255,255,255,.985)!important;box-shadow:0 18px 48px rgba(15,23,42,.18)!important;direction:rtl!important;z-index:2!important}
        #pbCanonicalHeaderV580 .pbMobileMenu.open{display:grid!important;gap:7px!important}
        #pbCanonicalHeaderV580 .pbMobileMenuDesign{padding:8px!important;border:1px solid #eef2f6!important;border-radius:13px!important;background:#f8fafc!important}
        #pbCanonicalHeaderV580 .pbMobileMenuDesign>span{display:block!important;padding:2px 4px 7px!important;color:#667085!important;font-size:9px!important;font-weight:900!important}
        #pbCanonicalHeaderV580 .pbMobileDesignLinks{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
        #pbCanonicalHeaderV580 .pbMobileMenu a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:40px!important;padding:8px 7px!important;border:1px solid #e4e7ec!important;border-radius:10px!important;background:#fff!important;color:#344054!important;text-decoration:none!important;font-size:10.2px!important;font-weight:850!important;text-align:center!important;line-height:1.45!important}
        #pbCanonicalHeaderV580 .pbMobileMenu a.active{background:#eef2ff!important;border-color:#c7d2fe!important;color:#3730a3!important}
        #pbCanonicalHeaderV580 .pbMobileOtherLinks{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}
        #pbCanonicalHeaderSpacerV580{height:61px}
        body.pbHomePublicRoute{padding-bottom:72px!important}
        .pbHomeMobileAccountBar{position:fixed!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;left:8px!important;right:8px!important;bottom:8px!important;z-index:9200!important;min-height:58px!important;padding:5px!important;border:1px solid rgba(215,221,232,.92)!important;border-radius:17px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 14px 38px rgba(15,23,42,.18)!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;direction:rtl!important}
        .pbHomeMobileAccountBar a{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;min-width:0!important;border-radius:12px!important;text-decoration:none!important;color:#475467!important;font-size:8.2px!important;font-weight:850!important;line-height:1.25!important;text-align:center!important}
        .pbHomeMobileAccountBar a b{font-size:15px!important;line-height:1!important;color:#315efb!important}

        #pbCanonicalFooterV580 .pbFooterInner{width:calc(100% - 24px);min-height:0;padding:18px 0 22px;display:flex;flex-direction:column;gap:14px;text-align:center}
        #pbCanonicalFooterV580 .pbFooterBrand{justify-items:center;text-align:center;order:1}
        #pbCanonicalFooterV580 .pbFooterCenter{order:2;gap:9px}
        #pbCanonicalFooterV580 .pbFooterTrust{order:3;justify-self:auto}
        #pbCanonicalFooterV580 .pbFooterContact{order:4;width:100%;padding-top:10px}
      }
      @media(max-width:420px){
        #pbCanonicalHeaderV580 .pbCanonicalBrand b{display:none!important}
        #pbCanonicalHeaderV580 .pbMobileDesignLinks{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(st);
  }

  function buildHeader(){
    if(!isPublicRoute(location.pathname))return;
    if(document.getElementById('pbCanonicalHeaderV580'))return;
    injectStyle();
    var home=normalize(location.pathname)==='/';
    document.body.classList.add('pbCanonicalHeaderMounted');
    document.body.classList.toggle('pbHomePublicRoute',home);

    var header=document.createElement('header');header.id='pbCanonicalHeaderV580';header.setAttribute('dir','rtl');
    var main=document.createElement('div');main.className='pbCanonicalMain';
    var brand=document.createElement('a');brand.className='pbCanonicalBrand';brand.href='/';brand.innerHTML='<img src="/photobridge-favicon-v0140.png" alt=""><b>PhotoBridge</b>';
    var nav=document.createElement('nav');nav.className='pbCanonicalDesktopNav';nav.setAttribute('aria-label','منوی اصلی PhotoBridge');
    desktopItems.forEach(function(it){nav.appendChild(makeLink(it[0],it[1],'pbCanonicalNavLink'))});
    var mobile=document.createElement('div');mobile.className='pbCanonicalMobileControls';
    var mobileHome=makeLink('/','⌂','pbMobileHome');mobileHome.setAttribute('aria-label','خانه');mobileHome.title='خانه';
    var menuBtn=document.createElement('button');menuBtn.type='button';menuBtn.className='pbMobileMenuButton';menuBtn.textContent='☰';menuBtn.setAttribute('aria-label','باز کردن منو');menuBtn.setAttribute('aria-expanded','false');
    mobile.appendChild(mobileHome);mobile.appendChild(menuBtn);
    main.appendChild(brand);main.appendChild(nav);main.appendChild(mobile);header.appendChild(main);

    if(home){
      var strip=document.createElement('div');strip.className='pbAccountStrip';var inner=document.createElement('div');inner.className='pbAccountStripInner';
      accountItems.forEach(function(it){inner.appendChild(makeLink(it[0],it[1],''))});strip.appendChild(inner);header.appendChild(strip);
    }

    var mm=document.createElement('div');mm.className='pbMobileMenu';mm.setAttribute('aria-hidden','true');
    var design=document.createElement('div');design.className='pbMobileMenuDesign';design.innerHTML='<span>طراحی</span>';
    var designLinks=document.createElement('div');designLinks.className='pbMobileDesignLinks';
    [['/album-design','آلبوم'],['/instagram-post-design','اینستاگرام'],['/slideshow-design','اسلایدشو']].forEach(function(it){designLinks.appendChild(makeLink(it[0],it[1],''))});design.appendChild(designLinks);mm.appendChild(design);
    var others=document.createElement('div');others.className='pbMobileOtherLinks';
    [['/photo-selection-gallery','گالری انتخاب'],['/photo-lab-print','چاپ'],['/retouch-photo','روتوش'],['/guide','راهنما']].forEach(function(it){others.appendChild(makeLink(it[0],it[1],''))});mm.appendChild(others);header.appendChild(mm);

    var spacer=document.createElement('div');spacer.id='pbCanonicalHeaderSpacerV580';spacer.setAttribute('aria-hidden','true');
    document.body.insertBefore(header,document.body.firstChild);
    if(header.nextSibling)document.body.insertBefore(spacer,header.nextSibling);else document.body.appendChild(spacer);

    if(home){
      var bottom=document.createElement('nav');bottom.className='pbHomeMobileAccountBar';bottom.setAttribute('aria-label','دسترسی سریع حساب‌ها');
      var icons=['◉','＋','▣','＋'];
      accountItems.forEach(function(it,i){var a=makeLink(it[0],'','');a.innerHTML='<b>'+icons[i]+'</b><span>'+it[2]+'</span>';bottom.appendChild(a)});
      document.body.appendChild(bottom);
    }

    function setMenu(open){mm.classList.toggle('open',open);mm.setAttribute('aria-hidden',open?'false':'true');menuBtn.setAttribute('aria-expanded',open?'true':'false');menuBtn.textContent=open?'×':'☰'}
    menuBtn.addEventListener('click',function(e){e.stopPropagation();setMenu(!mm.classList.contains('open'))});
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
    if(document.getElementById('pbCanonicalFooterV580'))return;
    injectStyle();
    document.body.classList.add('pbCanonicalFooterMounted');
    var footer=document.createElement('footer');footer.id='pbCanonicalFooterV580';footer.setAttribute('dir','rtl');
    footer.innerHTML='<div class="pbFooterInner"><div class="pbFooterBrand"><b>PhotoBridge</b><span>ارتباط عکاس، مشتری و لابراتوار</span></div><nav class="pbFooterCenter" aria-label="پیوندهای پایین صفحه"><a href="/photographer/signup">عضویت عکاس</a><a href="/photo-lab-print">چاپ عکس لابراتوار</a><a href="/album-design">طراحی آلبوم</a><a href="/guide">راهنما</a></nav><div class="pbFooterTrust"><a class="pbTrustLink" target="_blank" rel="noopener noreferrer" referrerpolicy="origin" href="https://trustseal.enamad.ir/?id=773966&Code=owEPT5kB5GSI2K8SDYvvjAFdufhCOW0X" aria-label="نماد اعتماد الکترونیکی"><img alt="" referrerpolicy="origin" src="https://trustseal.enamad.ir/logo.aspx?id=773966&Code=owEPT5kB5GSI2K8SDYvvjAFdufhCOW0X"></a></div></div>';
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

  function syncActive(){
    var root=activeRoot(location.pathname);
    document.querySelectorAll('#pbCanonicalHeaderV580 a[href]').forEach(function(a){
      var href=normalize(a.getAttribute('href')||'');var active=href===root;
      a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }
  var pbInternalScrolled=false;
  function syncScroll(){
    var h=document.getElementById('pbCanonicalHeaderV580');if(!h)return;
    var scrolled=((window.scrollY||document.documentElement.scrollTop||0)>18)||pbInternalScrolled;
    h.classList.toggle('pbScrolled',scrolled);
  }
  function syncInternalScroll(ev){
    var t=ev&&ev.target;if(!t||t===document||t===document.documentElement||t===document.body)return;
    var top=Number(t.scrollTop||0);
    if(top>18)pbInternalScrolled=true;else if(top<=2)pbInternalScrolled=false;
    syncScroll();
  }
  function boot(){injectStyle();buildHeader();buildFooter();syncActive();syncScroll()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  addEventListener('scroll',syncScroll,{passive:true});document.addEventListener('scroll',syncInternalScroll,true);
  addEventListener('popstate',function(){syncActive();syncScroll()});addEventListener('hashchange',function(){syncActive();syncScroll()});
})();
