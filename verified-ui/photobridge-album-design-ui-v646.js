(()=>{
  'use strict';
  const VERSION='0.17.646';
  let timer=0;
  let observer=null;

  function pathMode(){
    const p=location.pathname;
    if(p==='/instagram-post-design/start') return 'instagram';
    if(p==='/album-design/start') return 'album';
    const q=new URLSearchParams(location.search);
    const qm=String(q.get('mode')||q.get('designKind')||'').toLowerCase();
    if(qm==='instagram') return 'instagram';
    if(qm==='album') return 'album';
    const m=String(window.__PB_PUBLIC_DESIGN_MODE__||'').toLowerCase();
    if(m==='instagram'||m==='album') return m;
    if(/^\/photographer\/album-design(?:\/|$)/.test(p)) return 'album';
    return '';
  }

  function installStyle(){
    if(document.getElementById('pb646-album-ui-style')) return;
    const s=document.createElement('style');
    s.id='pb646-album-ui-style';
    s.textContent=`
      body.pb646DesignDedicated .photographerAlbumDesignCatalog .albumProjectDock{display:none!important}
      body.pb646DesignDedicated .photographerAlbumDesignCatalog .pb646HiddenBatchAction{display:none!important}
      body.pb646DesignDedicated .photographerAlbumDesignCatalog .pb646HiddenSlideshow{display:none!important}
      body.pb646DesignDedicated .photographerAlbumDesignCatalog .albumDesignGroupButtons{display:none!important}
      body.pb646InstagramOnly .photographerAlbumDesignCatalog .albumDesignSizeButtons{display:none!important}
      body.pb646InstagramOnly .photographerAlbumDesignCatalog .albumDesignMobilePicker label.pb646SizeLabel{display:none!important}
      body.pb646DesignDedicated .photographerAlbumDesignCatalog .albumDesignMobilePicker label.pb646ModelLabel{display:none!important}
      body.pb646DesignDedicated .photographerAlbumDesignCatalog .albumSlideshowExportSwitch{display:none!important}
      @media(min-width:821px){
        body.pb646DesignDedicated .photographerAlbumDesignCatalog .albumDesignCatalogFilters>.pb599AlbumFilterButton{display:none!important}
        body.pb646DesignDedicated .photographerAlbumDesignCatalog .albumDesignCatalogFilters>[data-pb604-filter-proxy="1"]{display:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  function buttonKind(btn){
    const t=String(btn?.textContent||'').replace(/\s+/g,' ').trim();
    return /اینستاگرام|instagram/i.test(t)?'instagram':/اسلایدشو|slideshow/i.test(t)?'slideshow':/آلبوم|album/i.test(t)?'album':'';
  }

  function findModelSelect(root){
    const picker=root.querySelector('.albumDesignMobilePicker');
    if(!picker) return null;
    const labels=Array.from(picker.querySelectorAll(':scope > label'));
    let label=labels.find(x=>/مدل/.test(String(x.querySelector('span')?.textContent||x.textContent||'')));
    if(!label) label=labels[0]||null;
    if(label) label.classList.add('pb646ModelLabel');
    return label?.querySelector('select')||null;
  }

  function findSizeLabel(root){
    const picker=root.querySelector('.albumDesignMobilePicker');
    if(!picker) return null;
    const labels=Array.from(picker.querySelectorAll(':scope > label'));
    let label=labels.find(x=>/سایز/.test(String(x.querySelector('span')?.textContent||x.textContent||'')));
    if(!label) label=labels[1]||null;
    if(label) label.classList.add('pb646SizeLabel');
    return label;
  }

  function setNativeSelectValue(select,value){
    if(!select || String(select.value)===String(value)) return false;
    const option=Array.from(select.options||[]).find(o=>String(o.value)===String(value));
    if(!option) return false;
    try{
      const d=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
      if(d?.set) d.set.call(select,value); else select.value=value;
    }catch{select.value=value}
    select.dispatchEvent(new Event('input',{bubbles:true}));
    select.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function enforceReactMode(root,mode){
    const select=findModelSelect(root);
    if(select && String(select.value)!==mode){
      if(setNativeSelectValue(select,mode)) return false;
    }
    const buttons=Array.from(root.querySelectorAll('.albumDesignGroupButtons button'));
    const target=buttons.find(b=>buttonKind(b)===mode);
    if(target && !target.classList.contains('active') && target.dataset.pb646Switching!=='1'){
      target.dataset.pb646Switching='1';
      target.click();
      setTimeout(()=>delete target.dataset.pb646Switching,100);
      return false;
    }
    return true;
  }

  function markBatchAndSlideshow(root){
    root.querySelectorAll('button').forEach(btn=>{
      const text=String(btn.textContent||'').replace(/\s+/g,' ').trim();
      if(/افزودن به آلبوم|ذخیره تغییرات صفحه|پروژه جدید/.test(text)) btn.classList.add('pb646HiddenBatchAction');
      if(/اسلایدشو|slideshow/i.test(text)) btn.classList.add('pb646HiddenSlideshow');
    });
    root.querySelectorAll('option').forEach(opt=>{
      const t=String(opt.textContent||'');
      if(/اسلایدشو|slideshow/i.test(t)) opt.hidden=true;
    });
    document.querySelectorAll('a[href^="/slideshow-design"]').forEach(a=>a.classList.add('pb646HiddenSlideshow'));
  }

  function closeWrongMobileSheets(mode){
    document.querySelectorAll('.albumDesignMobileCatalogPickerBackdrop,.pb602MobilePickerBackdrop').forEach(backdrop=>{
      const text=String(backdrop.textContent||'');
      if(/اسلایدشو|slideshow/i.test(text) || (mode==='instagram' && /سایز/.test(text))) backdrop.remove();
    });
    document.querySelectorAll('.albumDesignMobileCatalogPickerChoices button,.pb602MobilePickerChoices button').forEach(btn=>{
      const kind=buttonKind(btn);
      if(kind && kind!==mode) btn.style.display='none';
      if(kind==='slideshow') btn.classList.add('pb646HiddenSlideshow');
    });
  }

  function decorate(){
    timer=0;
    const mode=pathMode();
    const body=document.body;
    if(!body) return;
    if(!mode){
      body.classList.remove('pb646DesignDedicated','pb646InstagramOnly','pb646AlbumOnly');
      return;
    }
    installStyle();
    body.classList.add('pb646DesignDedicated');
    body.classList.toggle('pb646InstagramOnly',mode==='instagram');
    body.classList.toggle('pb646AlbumOnly',mode==='album');

    const root=document.querySelector('.photographerAlbumDesignCatalog');
    if(!root) return;

    markBatchAndSlideshow(root);
    const sizeLabel=findSizeLabel(root);
    if(sizeLabel) sizeLabel.style.display=mode==='instagram'?'none':'';
    root.querySelectorAll('.albumDesignSizeButtons').forEach(x=>x.style.display=mode==='instagram'?'none':'');

    if(!enforceReactMode(root,mode)){
      schedule(90);
      return;
    }

    const title=root.querySelector('.albumDesignMobileCatalogHeader>span');
    if(title) title.textContent=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';

    // The old public patch adds an extra filter button as the first item in the desktop filter row.
    // Keep its mobile proxy intact, but remove the desktop duplicate completely.
    if(window.matchMedia('(min-width:821px)').matches){
      root.querySelectorAll('.albumDesignCatalogFilters>.pb599AlbumFilterButton').forEach(btn=>btn.remove());
    }

    closeWrongMobileSheets(mode);
  }

  function schedule(delay=70){
    clearTimeout(timer);
    timer=setTimeout(decorate,delay);
  }

  function start(){
    installStyle();
    schedule(20);
    if(!observer){
      const root=document.getElementById('root')||document.documentElement;
      observer=new MutationObserver(mutations=>{
        if(mutations.some(m=>m.type==='childList')) schedule(80);
      });
      observer.observe(root,{subtree:true,childList:true});
    }
    window.addEventListener('popstate',()=>schedule(10));
    window.addEventListener('resize',()=>schedule(40),{passive:true});
    document.addEventListener('click',()=>schedule(40),true);
    console.info('[PhotoBridge] album design UI patch',VERSION);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
