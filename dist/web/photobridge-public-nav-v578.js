/* PhotoBridge v0.17.578 — canonical public header + dedicated design entries + scroll state */
(function(){
  'use strict';
  var items=[
    ['/album-design','طراحی آلبوم'],
    ['/instagram-post-design','طراحی اینستاگرام'],
    ['/slideshow-design','طراحی اسلایدشو'],
    ['/photo-selection-gallery','گالری انتخاب عکس'],
    ['/photo-lab-print','چاپ لابراتوار'],
    ['/retouch-photo','روتوش عکس'],
    ['/guide','راهنما']
  ];
  function normalize(path){path=String(path||'/').split('?')[0].split('#')[0]||'/';if(path.length>1)path=path.replace(/\/+$/,'');return path}
  function activeRoot(path){
    path=normalize(path);
    if(path==='/ai'||path.indexOf('/retouch-photo')===0)return '/retouch-photo';
    if(path.indexOf('/album-design')===0)return '/album-design';
    if(path.indexOf('/instagram-post-design')===0)return '/instagram-post-design';
    if(path.indexOf('/slideshow-design')===0)return '/slideshow-design';
    if(path.indexOf('/photo-selection-gallery')===0)return '/photo-selection-gallery';
    if(path.indexOf('/photo-lab-print')===0)return '/photo-lab-print';
    if(path.indexOf('/guide')===0)return '/guide';
    return '';
  }
  function injectStyle(){
    if(document.getElementById('pbPublicHeaderV578Style'))return;
    var st=document.createElement('style');st.id='pbPublicHeaderV578Style';st.textContent=`
      .publicSeoHeader,.seoSafeHeader{position:sticky!important;top:0!important;z-index:1000!important;direction:ltr!important;background:rgba(255,255,255,.97)!important;border-bottom:1px solid rgba(16,24,40,.07)!important;box-shadow:0 1px 10px rgba(16,24,40,.035)!important;transition:background .24s ease,border-color .24s ease,box-shadow .24s ease!important}
      .publicSeoHeader .publicBrand,.seoSafeHeader .seoSafeBrand{direction:ltr!important;flex:0 0 auto!important;order:0!important}
      .publicSeoHeader nav,.seoSafeHeader .seoSafeHeaderRight,.seoSafeHeader .seoSafeNav{direction:rtl!important}
      .publicSeoHeader nav{margin-left:auto!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:6px!important;overflow-x:auto!important;scrollbar-width:none!important;order:1!important}
      .publicSeoHeader nav::-webkit-scrollbar,.seoSafeNav::-webkit-scrollbar{display:none!important}
      .seoSafeHeader{min-height:72px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:22px!important;padding:8px max(18px,calc((100vw - 1180px)/2))!important}
      .seoSafeBrand{display:flex!important;align-items:center!important;gap:9px!important;text-decoration:none!important;color:#101828!important;font-size:17px!important}
      .seoSafeBrand img{width:42px!important;height:42px!important;border-radius:12px!important;box-shadow:0 5px 16px rgba(79,70,229,.12)!important}
      .seoSafeHeader .seoSafeHeaderRight{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:1 1 auto!important;min-width:0!important;gap:10px!important}
      .seoSafeHeader .seoSafeNav{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:6px!important;min-width:0!important;overflow-x:auto!important}
      .publicSeoHeader nav a,.seoSafeNav a{white-space:nowrap!important;text-decoration:none!important}
      .seoSafeNav a{color:#475467!important;font-weight:750!important;font-size:12px!important;padding:9px 11px!important;border:1px solid transparent!important;border-radius:10px!important}
      .seoSafeNav a:hover{background:#f8faff!important;border-color:#e0e7ff!important;color:#3730a3!important}
      .seoSafeNav a.pbPublicNavActive,.seoSafeNav a.active{background:#eef2ff!important;border-color:#c7d2fe!important;color:#3730a3!important;font-weight:900!important}
      .seoSafeLogin{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:40px!important;padding:8px 12px!important;border:1px solid #dfe3ea!important;border-radius:10px!important;background:#fff!important;color:#344054!important;text-decoration:none!important;font-size:11.5px!important;font-weight:850!important;white-space:nowrap!important}
      .publicSeoHeader.pbPublicHeaderScrolled,.seoSafeHeader.pbPublicHeaderScrolled{background:linear-gradient(135deg,#315efb 0%,#4f46e5 100%)!important;border-bottom-color:rgba(255,255,255,.18)!important;box-shadow:0 10px 28px rgba(49,94,251,.22)!important;backdrop-filter:saturate(140%) blur(14px)!important;-webkit-backdrop-filter:saturate(140%) blur(14px)!important}
      .publicSeoHeader.pbPublicHeaderScrolled .publicBrand,.publicSeoHeader.pbPublicHeaderScrolled .publicBrand b,.publicSeoHeader.pbPublicHeaderScrolled nav a,.seoSafeHeader.pbPublicHeaderScrolled .seoSafeBrand,.seoSafeHeader.pbPublicHeaderScrolled .seoSafeBrand b,.seoSafeHeader.pbPublicHeaderScrolled .seoSafeNav a{color:#fff!important}
      .publicSeoHeader.pbPublicHeaderScrolled nav a.pbPublicNavActive,.seoSafeHeader.pbPublicHeaderScrolled .seoSafeNav a.pbPublicNavActive{background:#fff!important;border-color:#fff!important;color:#315efb!important}
      .seoSafeHeader.pbPublicHeaderScrolled .seoSafeLogin{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.25)!important;color:#fff!important}
      .pbInjectedDesignHeader+ #root .photographerAlbumDesignCatalog{padding-top:14px!important}
      @media(max-width:980px){.publicSeoHeader,.seoSafeHeader{align-items:flex-start!important;gap:7px!important}.publicSeoHeader{flex-direction:column!important}.publicSeoHeader nav{width:100%!important;margin-left:0!important}.seoSafeHeader{flex-direction:column!important;padding:9px 14px!important}.seoSafeHeader .seoSafeHeaderRight{width:100%!important}.seoSafeHeader .seoSafeNav{width:100%!important}.seoSafeHeader .seoSafeLogin{display:none!important}}
    `;document.head.appendChild(st);
  }
  function makeLink(href,label,cls){var a=document.createElement('a');a.href=href;a.textContent=label;if(cls)a.className=cls;return a}
  function coreHrefs(nav){return Array.from(nav.querySelectorAll(':scope > a')).map(function(a){return normalize(a.getAttribute('href')||'')}).filter(function(h){return items.some(function(it){return it[0]===h})})}
  function canonicalizeSimple(nav){
    var expected=items.map(function(it){return it[0]}),current=coreHrefs(nav);
    if(current.join('|')===expected.join('|'))return;
    var extras=Array.from(nav.children).filter(function(n){return n.tagName!=='A'||!items.some(function(it){return normalize(n.getAttribute('href')||'')===it[0]})});
    while(nav.firstChild)nav.removeChild(nav.firstChild);
    items.forEach(function(it){nav.appendChild(makeLink(it[0],it[1],''))});
    extras.forEach(function(n){nav.appendChild(n)});
  }
  function canonicalizeHome(nav){
    var desired=(nav.querySelector('a[href="#for-who"]')?['#for-who']:[]).concat(items.map(function(it){return it[0]}));
    var current=Array.from(nav.querySelectorAll(':scope > a.publicFeatureLink')).map(function(a){var h=a.getAttribute('href')||'';return h.charAt(0)==='#'?h:normalize(h)});
    if(current.join('|')===desired.join('|'))return;
    var forWho=nav.querySelector('a[href="#for-who"]'),actions=Array.from(nav.querySelectorAll(':scope > a.headerAction'));
    Array.from(nav.querySelectorAll(':scope > a.publicFeatureLink')).forEach(function(a){if(a!==forWho)a.remove()});
    var anchor=actions[0]||null;
    items.forEach(function(it){var cls='publicFeatureLink'+(it[0]==='/guide'?' publicGuideNavLink':'');nav.insertBefore(makeLink(it[0],it[1],cls),anchor)});
  }
  function injectDesignHeader(){
    var p=normalize(location.pathname);if(!['/album-design/start','/instagram-post-design/start','/slideshow-design/start'].includes(p))return;
    if(document.querySelector('.publicHeader,.publicSeoHeader,.seoSafeHeader'))return;
    var h=document.createElement('header');h.className='seoSafeHeader pbInjectedDesignHeader';
    var brand=document.createElement('a');brand.className='seoSafeBrand';brand.href='/';brand.innerHTML='<img src="/photobridge-favicon-v0140.png" alt="لوگوی PhotoBridge"><b>PhotoBridge</b>';
    var right=document.createElement('div');right.className='seoSafeHeaderRight';var nav=document.createElement('nav');nav.className='seoSafeNav';nav.setAttribute('aria-label','منوی اصلی');items.forEach(function(it){nav.appendChild(makeLink(it[0],it[1],''))});var login=makeLink('/photographer','ورود عکاس','seoSafeLogin');right.appendChild(nav);right.appendChild(login);h.appendChild(brand);h.appendChild(right);
    var root=document.getElementById('root');if(root&&root.parentNode)root.parentNode.insertBefore(h,root);else document.body.insertBefore(h,document.body.firstChild);
  }
  function ensureMenus(){injectDesignHeader();document.querySelectorAll('.publicSeoHeader nav,.seoSafeNav').forEach(canonicalizeSimple);document.querySelectorAll('.publicNavLinks').forEach(canonicalizeHome)}
  function syncScroll(){var scrolled=(window.scrollY||document.documentElement.scrollTop||0)>18;document.querySelectorAll('.seoSafeHeader,.publicSeoHeader').forEach(function(h){h.classList.toggle('pbPublicHeaderScrolled',scrolled)})}
  function sync(){injectStyle();ensureMenus();var root=activeRoot(location.pathname);document.querySelectorAll('.publicNavLinks a.publicFeatureLink,.publicSeoHeader nav a,.seoSafeNav a').forEach(function(a){a.classList.remove('publicRetouchNavHighlight');var href=normalize(a.getAttribute('href')||''),active=!!root&&href===root;a.classList.toggle('pbPublicNavActive',active);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});syncScroll()}
  var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;sync()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  try{new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true})}catch(_){}
  addEventListener('popstate',sync);addEventListener('hashchange',sync);addEventListener('scroll',syncScroll,{passive:true});
})();
