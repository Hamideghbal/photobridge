/* PhotoBridge v0.17.579 — one canonical public header everywhere + compact mobile navigation */
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
    if(document.getElementById('pbCanonicalHeaderV579Style'))return;
    var st=document.createElement('style');
    st.id='pbCanonicalHeaderV579Style';
    st.textContent=`
      body.pbCanonicalHeaderMounted #root .publicHeader,
      body.pbCanonicalHeaderMounted #root .publicSeoHeader,
      body.pbCanonicalHeaderMounted #root .publicGuideHeader,
      body.pbCanonicalHeaderMounted #root .publicAiHeader,
      body.pbCanonicalHeaderMounted #root .pbInjectedDesignHeader,
      body.pbCanonicalHeaderMounted #root .seoSafeHeader,
      body.pbCanonicalHeaderMounted > .seoSafeHeader:not(#pbCanonicalHeaderV579){display:none!important}
      body.pbCanonicalHeaderMounted #root .publicHeaderSpacer{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}

      #pbCanonicalHeaderV579{position:sticky;top:0;z-index:9000;width:100%;font-family:Vazirmatn,Tahoma,Arial,sans-serif;background:rgba(255,255,255,.97);border-bottom:1px solid rgba(16,24,40,.07);box-shadow:0 1px 12px rgba(16,24,40,.04);transition:background .22s ease,border-color .22s ease,box-shadow .22s ease;color:#101828}
      #pbCanonicalHeaderV579 *{box-sizing:border-box}
      #pbCanonicalHeaderV579 .pbCanonicalMain{width:min(1360px,calc(100% - 28px));min-height:72px;margin:0 auto;display:flex;align-items:center;gap:18px;direction:ltr}
      #pbCanonicalHeaderV579 .pbCanonicalBrand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#101828;direction:ltr;flex:0 0 auto;white-space:nowrap}
      #pbCanonicalHeaderV579 .pbCanonicalBrand img{width:43px;height:43px;border-radius:12px;box-shadow:0 5px 16px rgba(79,70,229,.12);display:block}
      #pbCanonicalHeaderV579 .pbCanonicalBrand b{font-size:16px;line-height:1;font-weight:900}
      #pbCanonicalHeaderV579 .pbCanonicalDesktopNav{flex:1 1 auto;min-width:0;display:flex;flex-direction:row-reverse;align-items:center;justify-content:flex-start;gap:4px;direction:ltr;overflow:hidden}
      #pbCanonicalHeaderV579 .pbCanonicalDesktopNav a{direction:rtl}
      #pbCanonicalHeaderV579 .pbCanonicalDesktopNav a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 9px;border:1px solid transparent;border-radius:10px;text-decoration:none;color:#475467;font-size:10.7px;line-height:1.3;font-weight:800;white-space:nowrap;transition:.16s ease}
      #pbCanonicalHeaderV579 .pbCanonicalDesktopNav a:hover{background:#f8faff;border-color:#e0e7ff;color:#3730a3}
      #pbCanonicalHeaderV579 .pbCanonicalDesktopNav a.active{background:#eef2ff;border-color:#c7d2fe;color:#3730a3;font-weight:950;box-shadow:0 3px 12px rgba(49,94,251,.08)}

      #pbCanonicalHeaderV579 .pbAccountStrip{border-top:1px solid #eef2f6;background:#f8fafc}
      #pbCanonicalHeaderV579 .pbAccountStripInner{width:min(1360px,calc(100% - 28px));min-height:49px;margin:0 auto;display:flex;align-items:center;justify-content:flex-start;gap:7px;direction:rtl}
      #pbCanonicalHeaderV579 .pbAccountStrip a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 11px;border:1px solid #dde3ec;border-radius:9px;background:#fff;color:#344054;text-decoration:none;font-size:10.3px;font-weight:850;white-space:nowrap}
      #pbCanonicalHeaderV579 .pbAccountStrip a[href="/photographer/signup"]{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
      #pbCanonicalHeaderV579 .pbAccountStrip a[href="/lab"]{background:#101828;border-color:#101828;color:#fff}

      #pbCanonicalHeaderV579.pbScrolled{background:linear-gradient(135deg,#315efb 0%,#4f46e5 100%);border-bottom-color:rgba(255,255,255,.18);box-shadow:0 10px 28px rgba(49,94,251,.22);backdrop-filter:saturate(140%) blur(14px);-webkit-backdrop-filter:saturate(140%) blur(14px)}
      #pbCanonicalHeaderV579.pbScrolled .pbCanonicalBrand,#pbCanonicalHeaderV579.pbScrolled .pbCanonicalBrand b,#pbCanonicalHeaderV579.pbScrolled .pbCanonicalDesktopNav a{color:#fff}
      #pbCanonicalHeaderV579.pbScrolled .pbCanonicalDesktopNav a:hover{background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.22);color:#fff}
      #pbCanonicalHeaderV579.pbScrolled .pbCanonicalDesktopNav a.active{background:#fff;border-color:#fff;color:#315efb}
      #pbCanonicalHeaderV579.pbScrolled .pbAccountStrip{background:rgba(22,31,61,.16);border-top-color:rgba(255,255,255,.14)}
      #pbCanonicalHeaderV579.pbScrolled .pbAccountStrip a{background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.22);color:#fff}
      #pbCanonicalHeaderV579.pbScrolled .pbAccountStrip a[href="/photographer/signup"]{background:#fff;color:#315efb;border-color:#fff}
      #pbCanonicalHeaderV579.pbScrolled .pbAccountStrip a[href="/lab"]{background:rgba(16,24,40,.42);color:#fff}

      #pbCanonicalHeaderV579 .pbCanonicalMobileControls,#pbCanonicalHeaderV579 .pbMobileMenu{display:none}
      .pbHomeMobileAccountBar{display:none}

      @media(max-width:820px){
        #pbCanonicalHeaderV579 .pbCanonicalMain{width:100%;min-height:61px;padding:7px 11px;gap:10px}
        #pbCanonicalHeaderV579 .pbCanonicalBrand img{width:38px;height:38px;border-radius:11px}
        #pbCanonicalHeaderV579 .pbCanonicalBrand b{font-size:14px}
        #pbCanonicalHeaderV579 .pbCanonicalDesktopNav,#pbCanonicalHeaderV579 .pbAccountStrip{display:none!important}
        #pbCanonicalHeaderV579 .pbCanonicalMobileControls{margin-left:auto;display:flex;align-items:center;gap:7px;direction:rtl}
        #pbCanonicalHeaderV579 .pbMobileHome,#pbCanonicalHeaderV579 .pbMobileMenuButton{min-width:41px;height:41px;display:grid;place-items:center;border:1px solid #dfe3ea;border-radius:11px;background:#fff;color:#344054;text-decoration:none;font-family:inherit;font-weight:900;font-size:18px;cursor:pointer}
        #pbCanonicalHeaderV579 .pbMobileHome{font-size:17px}
        #pbCanonicalHeaderV579.pbScrolled .pbMobileHome,#pbCanonicalHeaderV579.pbScrolled .pbMobileMenuButton{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.28);color:#fff}
        #pbCanonicalHeaderV579 .pbMobileMenu{position:absolute;top:calc(100% + 7px);right:10px;left:10px;display:none;padding:10px;border:1px solid #e4e7ec;border-radius:16px;background:rgba(255,255,255,.985);box-shadow:0 18px 48px rgba(15,23,42,.18);direction:rtl;z-index:2}
        #pbCanonicalHeaderV579 .pbMobileMenu.open{display:grid;gap:7px}
        #pbCanonicalHeaderV579 .pbMobileMenuDesign{padding:8px;border:1px solid #eef2f6;border-radius:13px;background:#f8fafc}
        #pbCanonicalHeaderV579 .pbMobileMenuDesign>span{display:block;padding:2px 4px 7px;color:#667085;font-size:9px;font-weight:900}
        #pbCanonicalHeaderV579 .pbMobileDesignLinks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
        #pbCanonicalHeaderV579 .pbMobileMenu a{display:flex;align-items:center;justify-content:center;min-height:40px;padding:8px 7px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;color:#344054;text-decoration:none;font-size:10.2px;font-weight:850;text-align:center;line-height:1.45}
        #pbCanonicalHeaderV579 .pbMobileMenu a.active{background:#eef2ff;border-color:#c7d2fe;color:#3730a3}
        #pbCanonicalHeaderV579 .pbMobileOtherLinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
        body.pbHomePublicRoute{padding-bottom:72px!important}
        .pbHomeMobileAccountBar{position:fixed;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));left:8px;right:8px;bottom:8px;z-index:9200;min-height:58px;padding:5px;border:1px solid rgba(215,221,232,.92);border-radius:17px;background:rgba(255,255,255,.96);box-shadow:0 14px 38px rgba(15,23,42,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);direction:rtl}
        .pbHomeMobileAccountBar a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0;border-radius:12px;text-decoration:none;color:#475467;font-size:8.2px;font-weight:850;line-height:1.25;text-align:center}
        .pbHomeMobileAccountBar a b{font-size:15px;line-height:1;color:#315efb}
        .pbHomeMobileAccountBar a:nth-child(3) b{color:#101828}
        .pbHomeMobileAccountBar a:active{background:#eef2ff}
      }
      @media(max-width:390px){
        #pbCanonicalHeaderV579 .pbCanonicalBrand b{display:none}
        #pbCanonicalHeaderV579 .pbMobileDesignLinks{grid-template-columns:1fr}
        .pbHomeMobileAccountBar a{font-size:7.6px}
      }
    `;
    document.head.appendChild(st);
  }

  function buildHeader(){
    if(!isPublicRoute(location.pathname))return;
    if(document.getElementById('pbCanonicalHeaderV579'))return;
    injectStyle();
    var home=normalize(location.pathname)==='/';
    document.body.classList.add('pbCanonicalHeaderMounted');
    document.body.classList.toggle('pbHomePublicRoute',home);

    var header=document.createElement('header');header.id='pbCanonicalHeaderV579';header.setAttribute('dir','rtl');
    var main=document.createElement('div');main.className='pbCanonicalMain';
    var brand=document.createElement('a');brand.className='pbCanonicalBrand';brand.href='/';brand.innerHTML='<img src="/photobridge-favicon-v0140.png" alt="لوگوی PhotoBridge"><b>PhotoBridge</b>';
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

    document.body.insertBefore(header,document.body.firstChild);

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
    syncActive();syncScroll();
  }

  function syncActive(){
    var root=activeRoot(location.pathname);
    document.querySelectorAll('#pbCanonicalHeaderV579 a[href]').forEach(function(a){
      var href=normalize(a.getAttribute('href')||'');var active=href===root;
      a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }
  var pbInternalScrolled=false;
  function syncScroll(){
    var h=document.getElementById('pbCanonicalHeaderV579');if(!h)return;
    h.classList.toggle('pbScrolled',((window.scrollY||document.documentElement.scrollTop||0)>18)||pbInternalScrolled);
  }
  function syncInternalScroll(ev){
    var t=ev&&ev.target;if(!t||t===document||t===document.documentElement||t===document.body)return;
    var top=Number(t.scrollTop||0);
    if(top>18)pbInternalScrolled=true;else if(top<=2)pbInternalScrolled=false;
    syncScroll();
  }
  function boot(){injectStyle();buildHeader();syncActive();syncScroll()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  addEventListener('scroll',syncScroll,{passive:true});document.addEventListener('scroll',syncInternalScroll,true);addEventListener('popstate',function(){syncActive()});addEventListener('hashchange',syncActive);
})();
