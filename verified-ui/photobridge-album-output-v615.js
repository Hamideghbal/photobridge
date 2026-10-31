/* PhotoBridge v0.17.615 — album family sizing + mobile legacy editor workspace */
(function(){
  'use strict';
  var raf=0;
  var familyMap={
    classic:{label:'آلبوم کلاسیک',sizes:['۳۰ × ۴۵','۴۰ × ۶۰','۵۰ × ۷۰'],hint:'شامل سایزهای ۳۰ × ۴۵، ۴۰ × ۶۰ و ۵۰ × ۷۰'},
    panorama:{label:'آلبوم کشیده',sizes:['۳۰ × ۶۰','۴۰ × ۸۰'],hint:'شامل سایزهای ۳۰ × ۶۰ و ۴۰ × ۸۰'}
  };
  function txt(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim()}
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
  function catalog(){return document.querySelector('.photographerAlbumDesignCatalog')}
  function groupKey(){
    var root=catalog(); if(!root)return '';
    var sel=root.querySelector('.albumDesignMobilePicker select');
    var val=String(sel&&sel.value||'').toLowerCase();
    if(val==='classic'||val==='panorama'||val==='instagram'||val==='slideshow')return val;
    var active=root.querySelector('.albumDesignGroupButtons button.active'),t=txt(active);
    if(t.indexOf('کلاسیک')>=0)return 'classic';
    if(t.indexOf('کشیده')>=0||t.indexOf('پانوراما')>=0)return 'panorama';
    if(t.indexOf('اینستاگرام')>=0)return 'instagram';
    if(t.indexOf('اسلاید')>=0)return 'slideshow';
    if(t.indexOf('آلبوم')>=0)return 'classic';
    return val;
  }
  function activePhysicalSize(){
    var root=catalog(); if(!root)return '';
    var b=root.querySelector('.albumDesignSizeButtons button.active');
    if(b)return txt(b);
    var labels=root.querySelectorAll('.albumDesignMobilePicker label');
    if(labels.length>1){var s=labels[1].querySelector('select');if(s)return String(s.value||'')}
    return '';
  }
  function selectPhysicalSize(size){
    var root=catalog(); if(!root)return false;
    var wanted=norm(size),buttons=root.querySelectorAll('.albumDesignSizeButtons button');
    for(var i=0;i<buttons.length;i++)if(norm(txt(buttons[i]))===wanted){buttons[i].click();schedule();return true}
    var labels=root.querySelectorAll('.albumDesignMobilePicker label');
    if(labels.length>1){var select=labels[1].querySelector('select');if(select){select.value=size;select.dispatchEvent(new Event('change',{bubbles:true}));schedule();return true}}
    return false;
  }
  function decorateCatalog(){
    var root=catalog();if(!root)return;
    var key=groupKey(),fam=familyMap[key],isAlbum=!!fam;
    root.classList.toggle('pb615AlbumPhysicalSizeDeferred',isAlbum);
    if(root.getAttribute('data-pb615-album-family')!==(key||''))root.setAttribute('data-pb615-album-family',key||'');
    var note=root.querySelector('.pb615AlbumFamilyInfo');
    if(isAlbum){
      if(!note){note=document.createElement('div');note.className='pb615AlbumFamilyInfo';var anchor=root.querySelector('.albumDesignMobilePicker')||root.querySelector('.albumDesignCompactPicker');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(note,anchor.nextSibling);else root.prepend(note)}
      if(note.getAttribute('data-family')!==key){note.setAttribute('data-family',key);note.innerHTML='<b>'+fam.label+'</b><span>'+fam.hint+'</span><small>فایل طراحی برای این خانواده یکی است؛ سایز دقیق فقط هنگام گرفتن خروجی انتخاب می‌شود.</small>';}
    }else if(note){note.remove()}
  }
  function makeSizePicker(modal,key){
    var fam=familyMap[key];if(!fam)return;
    var picker=modal.querySelector('.pb615CheckoutSizePicker');
    if(!picker){
      picker=document.createElement('div');picker.className='pb615CheckoutSizePicker';
      var header=modal.querySelector('header'),balance=modal.querySelector('.albumDesignCheckoutBalance');
      if(balance&&balance.parentNode)balance.parentNode.insertBefore(picker,balance);
      else if(header&&header.parentNode)header.parentNode.insertBefore(picker,header.nextSibling);
      else modal.prepend(picker);
    }
    var current=activePhysicalSize(),signature=key+'|'+norm(current);
    if(picker.getAttribute('data-signature')===signature)return;
    picker.setAttribute('data-signature',signature);
    picker.innerHTML='<div class="pb615CheckoutSizeCopy"><b>سایز خروجی چاپ</b><small>'+fam.label+' · فایل طراحی مشترک است و فقط اندازه خروجی در این مرحله تعیین می‌شود.</small></div><div class="pb615CheckoutSizeChoices"></div>';
    var host=picker.querySelector('.pb615CheckoutSizeChoices');
    fam.sizes.forEach(function(size){
      var b=document.createElement('button');b.type='button';b.textContent=size;b.className=norm(current)===norm(size)?'active':'';
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();selectPhysicalSize(size)});
      host.appendChild(b);
    });
  }
  function decorateCheckout(){
    var modal=document.querySelector('.albumDesignCheckoutModal');if(!modal)return;
    var key=groupKey();
    if(familyMap[key])makeSizePicker(modal,key);else{var old=modal.querySelector('.pb615CheckoutSizePicker');if(old)old.remove()}
  }
  function decorateEditor(){
    var modal=document.querySelector('.albumDesignFullscreenModal.albumDesignCanvasFirst');if(!modal)return;
    var key=groupKey(),legacy=key==='instagram'||key==='slideshow';
    modal.classList.toggle('pb615LegacyMobileEditor',legacy);
  }
  function run(){raf=0;decorateCatalog();decorateCheckout();decorateEditor()}
  function schedule(){if(raf)return;raf=requestAnimationFrame(run)}
  var obs=new MutationObserver(schedule);obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','value']});
  document.addEventListener('click',function(){setTimeout(schedule,0)},true);
  document.addEventListener('change',function(){setTimeout(schedule,0)},true);
  window.addEventListener('pageshow',schedule);window.addEventListener('resize',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
})();
