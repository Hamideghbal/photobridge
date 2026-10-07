/* PhotoBridge v0.17.578 — dedicated public design modes + vertical slideshow reuse */
(function(){
  'use strict';
  var path=location.pathname;
  var mode=path==='/instagram-post-design/start'?'instagram':path==='/album-design/start'?'album':path==='/slideshow-design/start'?'slideshow':'';
  window.__PB_PUBLIC_DESIGN_MODE__=mode;
  var nativeFetch=window.fetch.bind(window), popup=null, paymentPromise=null;
  var paidTokens={album_export:'',instagram_export:''}, allowInstagramOnce=false, checkoutInfo=null;

  function jsonResponse(data,status){return new Response(JSON.stringify(data),{status:status||200,headers:{'content-type':'application/json; charset=utf-8'}})}
  function readKind(t){var raw=String((t&&t.designKind)||'album').toLowerCase();if(raw==='slideshow')return 'slideshow';if(raw==='instagram')return 'instagram';var cat=String((t&&t.category)||'').toLowerCase();if(cat.indexOf('instagram')>=0||cat.indexOf('اینستاگرام')>=0)return 'instagram';return 'album'}
  function withVirtualSlides(data){
    if(!data||!Array.isArray(data.templates))return data;
    var existing={};data.templates.forEach(function(t){existing[String(t&&t.id||'')]=1});
    var extra=[];
    data.templates.forEach(function(t){
      if(readKind(t)!=='instagram'||t&&t._pbVirtualSlideshow)return;
      var id='pb-slide-instagram-'+String(t.id||'');if(existing[id])return;
      extra.push(Object.assign({},t,{id:id,designKind:'slideshow',orientation:'portrait',category:'slideshow-portrait',name:String(t.name||'طرح اینستاگرام')+' · اسلایدشو عمودی',_pbVirtualSlideshow:true,_pbSourceInstagramId:String(t.id||'')}));
    });
    if(extra.length)data=Object.assign({},data,{templates:data.templates.concat(extra)});
    return data;
  }
  async function readJson(resp){var d={};try{d=await resp.clone().json()}catch(e){}if(!resp.ok){var err=new Error(d.display||d.message||d.error||'request_failed');err.data=d;err.status=resp.status;throw err}return d}

  /* Always enhance the authenticated designer too: Instagram templates are also available
     as high-quality vertical slideshow templates, without changing the original templates. */
  window.fetch=async function(input,init){
    var raw=typeof input==='string'?input:(input&&input.url)||'';
    var u;try{u=new URL(raw,location.href)}catch(e){return nativeFetch(input,init)}
    if(u.origin!==location.origin)return nativeFetch(input,init);
    var method=String((init&&init.method)||'GET').toUpperCase();
    if(!mode&&u.pathname==='/api/customer/album-design/templates'&&method==='GET'){
      var base=await nativeFetch(input,init),copy=base.clone();
      try{var d=withVirtualSlides(await copy.json());return jsonResponse(d,base.status)}catch(e){return base}
    }
    if(!mode)return nativeFetch(input,init);
    if(u.pathname==='/api/customer/album-design/templates'&&method==='GET')return nativeFetch('/api/public/album-design/templates?service='+encodeURIComponent(mode)+u.search.replace(/^\?/,'&'),{credentials:'same-origin'});
    if(u.pathname==='/api/customer/album-design/checkout'&&method==='GET')return nativeFetch('/api/public/album-design/checkout?service='+encodeURIComponent(mode),{credentials:'same-origin'});
    if(u.pathname==='/api/customer/ai-studio/skin-retouch'&&method==='GET')return jsonResponse({configured:false,service:{enabled:false},publicGuest:true},200);
    if(u.pathname==='/api/customer/album-design/projects'&&method==='GET')return jsonResponse({projects:[]},200);
    if(u.pathname==='/api/customer/album-design/checkout/pay'&&method==='POST'){
      var meta={};try{meta=JSON.parse(String(init&&init.body||'{}'))||{}}catch(e){}
      try{
        var token=await ensurePaid('album_export',meta);
        var cr=await nativeFetch('/api/public/album-design/orders/consume',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({token:token,serviceKey:'album_export',metadata:meta})});
        var cd=await readJson(cr);paidTokens.album_export='';
        return jsonResponse({ok:true,chargedAmount:Number(cd.amount||0),balanceAfter:0,checkoutId:meta.checkoutId||token,publicGuest:true},200);
      }catch(err){try{popup&&popup.close()}catch(e){}return jsonResponse({error:'public_design_payment_failed',message:String(err&&err.message||err)},402)}
    }
    return nativeFetch(input,init);
  };

  if(!mode){
    var authObs=new MutationObserver(function(){syncSlideshowOrientation()});
    authObs.observe(document.documentElement,{subtree:true,childList:true});
    document.addEventListener('click',function(){setTimeout(syncSlideshowOrientation,0)},true);
    window.addEventListener('DOMContentLoaded',syncSlideshowOrientation);
    if(document.readyState!=='loading')syncSlideshowOrientation();
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
      var b=buttons[i],tx=(b.textContent||'').trim(),allowed=mode==='album'?(tx.indexOf('آلبوم')>=0):(tx.indexOf(groupNeedle())>=0);
      b.style.display=allowed?'':'none';
      if(allowed&&!firstAllowed)firstAllowed=b;
      if(allowed&&b.classList.contains('active'))activeAllowed=true;
    }
    if(!activeAllowed&&firstAllowed)firstAllowed.click();
    var desktopGroups=root.querySelector('.albumDesignGroupButtons');
    if(desktopGroups)desktopGroups.style.display=(mode==='album'?'flex':'none');
    var mobileMode=root.querySelector('.albumDesignMobilePickerButton.mode');
    if(mobileMode)mobileMode.style.display=(mode==='album'?'':'none');
    if(mode==='album')document.querySelectorAll('.albumDesignMobileCatalogPickerChoices button').forEach(function(b){var tx=(b.textContent||'').trim();b.style.display=(tx.indexOf('آلبوم')>=0?'':'none')});
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
  function decorate(){
    document.body&&document.body.classList.add('pbPublicDesignGuest','pbPublicDesignMode-'+mode);enforceDedicatedMode();syncSlideshowOrientation();
    var root=document.querySelector('.photographerAlbumDesignCatalog');
    if(root&&!root.querySelector('.pb574PublicDesignBanner')){var b=document.createElement('div');b.className='pb574PublicDesignBanner';b.innerHTML='<div><b>'+modeTitle()+' بدون عضویت</b><span>برای عموم: پرداخت مستقیم هر خروجی · برای عکاسان عضو: تعرفه حرفه‌ای پایین‌تر</span></div><a href="/photographer">ورود عکاس</a>';root.insertBefore(b,root.firstChild)}
    document.querySelectorAll('.albumProjectDock').forEach(function(el){el.style.display='none'});
    document.querySelectorAll('.albumDesignFullscreenHeader button').forEach(function(el){var tx=(el.textContent||'').trim();if(tx.indexOf('افزودن به آلبوم')>=0||tx.indexOf('ذخیره تغییرات صفحه')>=0)el.style.display='none'});
    var modal=document.querySelector('.albumDesignCheckoutModal');if(modal){var balance=modal.querySelector('.albumDesignCheckoutBalance');if(balance){var sp=balance.querySelector('span'),bb=balance.querySelector('b');if(sp)sp.textContent='استفاده عمومی';if(bb)bb.textContent='بدون عضویت · پرداخت آنلاین'}var ig=modal.querySelector('.instagramFree');if(ig){var st=ig.querySelector('strong'),bt=ig.querySelector('button');if(st)st.textContent=(publicPrice('instagram_export')?money(publicPrice('instagram_export')):'رایگان')+' · خروجی شبکه اجتماعی';if(bt&&!bt.disabled)bt.textContent=publicPrice('instagram_export')?'پرداخت و دریافت':'دریافت خروجی'}var pr=modal.querySelector('.printSlideshow');if(pr){var ps=pr.querySelector('strong');if(ps)ps.textContent=money(publicPrice('album_export'))+' · خروجی کیفیت کامل'}var rt=modal.querySelector('.retouch');if(rt)rt.style.display='none';var ft=modal.querySelector('footer');if(ft)ft.textContent='نسخه عمومی نیاز به عضویت ندارد و هزینه هر خروجی مستقیم از درگاه پرداخت می‌شود. عکاسان عضو از تعرفه حرفه‌ای استفاده می‌کنند.'}
  }
  document.addEventListener('click',function(ev){var target=ev.target&&ev.target.closest?ev.target.closest('button'):null;if(!target)return;if(target.classList.contains('albumDesignMobileBack')){ev.preventDefault();ev.stopImmediatePropagation();location.href=mode==='instagram'?'/instagram-post-design':mode==='slideshow'?'/slideshow-design':'/album-design';return}var modal=target.closest('.albumDesignCheckoutModal');if(!modal)return;var ig=target.closest('.instagramFree');if(ig){if(allowInstagramOnce){allowInstagramOnce=false;setTimeout(function(){var tok=paidTokens.instagram_export;if(tok){nativeFetch('/api/public/album-design/orders/consume',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:tok,serviceKey:'instagram_export'})}).catch(function(){});paidTokens.instagram_export=''}},0);return}ev.preventDefault();ev.stopImmediatePropagation();preparePopup();ensurePaid('instagram_export',{mode:mode}).then(function(){allowInstagramOnce=true;target.click()}).catch(function(err){try{popup&&popup.close()}catch(e){}alert(String(err&&err.message||'پرداخت انجام نشد.'))});return}if(target.closest('.printSlideshow')){preparePopup();return}if(target.closest('.retouch')){ev.preventDefault();ev.stopImmediatePropagation();location.href='/ai'}},true);
  var obs=new MutationObserver(function(){decorate()});obs.observe(document.documentElement,{subtree:true,childList:true});document.addEventListener('click',function(){setTimeout(syncSlideshowOrientation,0)},true);window.addEventListener('DOMContentLoaded',function(){loadCheckout();decorate();syncSlideshowOrientation()});if(document.readyState!=='loading'){loadCheckout();decorate();syncSlideshowOrientation()}
})();
