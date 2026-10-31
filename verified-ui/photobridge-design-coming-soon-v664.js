/* PhotoBridge v783 — Album / Instagram Coming Soon gate; in-app photographer pages keep app chrome/navigation. */
(function(){
  'use strict';
  var accessState={checked:false,allowed:false,comingSoon:true,promise:null};
  function pathClean(){return location.pathname.replace(/\/+$/,'')||'/'}
  function isPhotographerDesignPath(){var p=pathClean();return /^\/photographer\/(?:album-design|instagram-post-design)(?:\/|$)/.test(p)}
  function isDesignPath(){var p=pathClean();return p==='/album-design'||p==='/album-design/start'||p==='/instagram-post-design'||p==='/instagram-post-design/start'||isPhotographerDesignPath()}
  function isHome(){return pathClean()==='/'}
  function addStyle(){
    if(document.getElementById('pb664ComingSoonStyle'))return;
    var s=document.createElement('style');s.id='pb664ComingSoonStyle';s.textContent=`
      #pb664ComingSoon{position:fixed;inset:0;z-index:2147483646;background:radial-gradient(circle at 50% 0,#26344d 0,#111827 46%,#080d16 100%);display:grid;place-items:center;padding:20px;font-family:Vazirmatn,Vazir,Tahoma,Arial,sans-serif;direction:rtl;color:#fff}
      #pb664ComingSoon .c{width:min(480px,100%);text-align:center;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.075);backdrop-filter:blur(14px);border-radius:26px;padding:34px 24px 28px;box-shadow:0 28px 80px rgba(0,0,0,.3)}
      #pb664ComingSoon img{width:68px;height:68px;border-radius:20px;box-shadow:0 13px 30px rgba(0,0,0,.26)}
      #pb664ComingSoon h1{font-size:24px;margin:16px 0 8px}
      #pb664ComingSoon p{margin:0;color:#d3dbe8;font-size:12px;line-height:2}
      #pb664ComingSoon .bar{height:4px;width:190px;margin:22px auto;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden}
      #pb664ComingSoon .bar:after{content:"";display:block;width:45%;height:100%;background:#60a5fa;border-radius:99px;animation:pb664move 1.35s ease-in-out infinite alternate}
      @keyframes pb664move{to{transform:translateX(-120px)}}
      #pb664ComingSoon a{display:inline-flex;text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.2);padding:9px 16px;border-radius:11px;font-size:11px;font-weight:800;background:rgba(255,255,255,.08)}
      .pb664HomeComingSoon{position:relative!important;overflow:hidden!important;cursor:not-allowed!important}
      .pb664HomeComingSoon:after{content:"Coming Soon";position:absolute;top:10px;left:10px;z-index:3;padding:5px 8px;border-radius:999px;background:#101828;color:#fff;font-size:8.5px;font-weight:950;letter-spacing:.15px;box-shadow:0 5px 14px rgba(15,23,42,.18)}
      .pb664HomeComingSoon>i{color:#667085!important}
      .pb664HomeComingSoon>i:before{content:"";display:none}
      @media(max-width:700px){.pb664HomeComingSoon:after{top:8px;left:8px;font-size:8px;padding:4px 7px}}
    `;document.head.appendChild(s)
  }
  function show(){
    if(document.getElementById('pb664ComingSoon'))return;
    addStyle();
    var d=document.createElement('div');d.id='pb664ComingSoon';
    d.innerHTML='<main class="c"><img src="/photobridge-favicon-v0140.png" alt="PhotoBridge"><h1>این بخش به‌زودی آماده می‌شود</h1><p>طراحی آلبوم و پست اینستاگرام در حال تکمیل و تست نهایی است.<br>فعلاً فقط حساب ادمین PhotoBridge به نسخه تست دسترسی دارد.</p><div class="bar"></div><a href="/">بازگشت به صفحه اصلی</a></main>';
    document.body.appendChild(d);document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden'
  }
  function getAccess(force){
    if(accessState.promise&&!force)return accessState.promise;
    if(accessState.checked&&!force)return Promise.resolve(accessState);
    accessState.promise=fetch('/api/public/design-preview-access?_='+Date.now(),{credentials:'include',cache:'no-store'})
      .then(function(r){return r.json().catch(function(){return {}}).then(function(d){accessState.checked=true;accessState.allowed=Boolean(r.ok&&d&&d.allowed);accessState.comingSoon=Boolean(!d||d.comingSoon!==false);return accessState})})
      .catch(function(){accessState.checked=true;accessState.allowed=false;accessState.comingSoon=true;return accessState})
      .finally(function(){accessState.promise=null});
    return accessState.promise
  }
  function decorateHome(){
    if(!isHome()||accessState.allowed||!accessState.comingSoon)return;
    addStyle();
    document.querySelectorAll('.publicSeoHomeCards a[href="/album-design/start"],.publicSeoHomeCards a[href="/instagram-post-design/start"]').forEach(function(a){
      if(a.classList.contains('pb664HomeComingSoon'))return;
      a.classList.add('pb664HomeComingSoon');a.setAttribute('aria-disabled','true');a.setAttribute('title','Coming Soon');
      var i=a.querySelector('i');if(i)i.textContent='Coming Soon';
      a.addEventListener('click',function(ev){if(accessState.allowed)return;ev.preventDefault();ev.stopImmediatePropagation();show()},true)
    })
  }
  function undecorateHome(){
    document.querySelectorAll('.pb664HomeComingSoon').forEach(function(a){a.classList.remove('pb664HomeComingSoon');a.removeAttribute('aria-disabled');a.removeAttribute('title')})
  }
  function apply(){
    getAccess(false).then(function(){
      if(isDesignPath()&&accessState.comingSoon&&!accessState.allowed){if(!isPhotographerDesignPath())show();return}
      if(isHome()){if(accessState.comingSoon&&!accessState.allowed)decorateHome();else undecorateHome()}
    })
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  var observer=new MutationObserver(function(){if(isHome()&&accessState.checked&&!accessState.allowed)decorateHome()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',function(){apply()},{passive:true});
  window.addEventListener('focus',function(){accessState.checked=false;getAccess(true).then(apply)},{passive:true});
})();
