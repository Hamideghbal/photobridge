/* PhotoBridge v0.17.648 — mobile Album menu hard isolation */
(()=>{
  'use strict';
  const VERSION='0.17.648';
  const upstreamFetch=window.fetch.bind(window);
  let timer=0, observer=null;
  const nativeOptionCache=new WeakMap();

  function normalizePath(p){p=String(p||'/').split('?')[0].replace(/\/+$/,'');return p||'/'}
  function routeMode(){
    const p=normalizePath(location.pathname),q=new URLSearchParams(location.search);
    const requested=String(q.get('mode')||q.get('designKind')||'').toLowerCase();
    if(requested==='instagram')return 'instagram';
    if(requested==='album'||requested==='classic'||requested==='panorama')return 'album';
    if(p==='/instagram-post-design/start')return 'instagram';
    if(p==='/album-design/start'||/^\/photographer\/album-design(?:\/|$)/.test(p))return 'album';
    const globalMode=String(window.__PB_PUBLIC_DESIGN_MODE__||'').toLowerCase();
    return globalMode==='instagram'?'instagram':globalMode==='album'?'album':'';
  }
  function kindOfTemplate(t){
    const raw=String(t?.designKind||'album').toLowerCase(),cat=String(t?.category||'').toLowerCase();
    if(raw==='slideshow')return 'slideshow';
    if(raw==='instagram'||cat.includes('instagram')||cat.includes('اینستاگرام'))return 'instagram';
    return 'album';
  }
  function cleanTemplatePayload(data){
    if(!data||!Array.isArray(data.templates))return data;
    const mode=routeMode();
    return {...data,templates:data.templates.filter(t=>{
      if(t?._pbVirtualInstagram||String(t?.category||'').toLowerCase()==='instagram-from-slideshow')return false;
      const kind=kindOfTemplate(t);
      if(kind==='slideshow')return false;
      if(mode==='album')return kind==='album';
      if(mode==='instagram')return kind==='instagram';
      return true;
    })};
  }
  window.fetch=async function(input,init){
    const response=await upstreamFetch(input,init);
    let u;try{u=new URL(typeof input==='string'?input:(input?.url||''),location.href)}catch{return response}
    const method=String(init?.method||'GET').toUpperCase();
    if(method!=='GET'||u.origin!==location.origin||!['/api/customer/album-design/templates','/api/public/album-design/templates'].includes(u.pathname)||!response.ok)return response;
    try{
      const data=cleanTemplatePayload(await response.clone().json());
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };

  function installStyle(){
    if(document.getElementById('pb647-mobile-design-style'))return;
    const s=document.createElement('style');s.id='pb647-mobile-design-style';s.textContent=`
      .pb647Hidden{display:none!important}
      body.pb647DesignDedicated .photographerAlbumDesignCatalog .albumProjectDock{display:none!important}
      body.pb647DesignDedicated .photographerAlbumDesignCatalog .pb647BatchAction{display:none!important}
      body.pb647DesignDedicated .photographerAlbumDesignCatalog .albumSlideshowExportSwitch{display:none!important}
      body.pb647InstagramOnly .photographerAlbumDesignCatalog .albumDesignSizeButtons{display:none!important}
      body.pb647InstagramOnly .photographerAlbumDesignCatalog .albumDesignGroupButtons{display:none!important}
      @media(max-width:820px), (pointer:coarse){
        body.pb647InstagramOnly .photographerAlbumDesignCatalog .albumDesignMobilePicker>label{display:none!important}
        body.pb647InstagramOnly .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.mode,
        body.pb647InstagramOnly .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.size{display:none!important}
        body.pb647AlbumOnly .photographerAlbumDesignCatalog .albumDesignMobilePicker>label.pb647SizeLabel,
        body.pb647AlbumOnly .photographerAlbumDesignCatalog .albumDesignMobilePicker>label.pb647ModelLabel{display:flex!important}
        body.pb647AlbumOnly .photographerAlbumDesignCatalog .albumDesignMobilePickerButton.mode{display:none!important}
      }
      @media(min-width:821px){
        body.pb647AlbumOnly .photographerAlbumDesignCatalog .albumDesignGroupButtons button.pb647InstagramChoice{display:none!important}
        body.pb647DesignDedicated .photographerAlbumDesignCatalog .albumDesignGroupButtons button.pb647SlideshowChoice{display:none!important}
        body.pb647DesignDedicated .photographerAlbumDesignCatalog .albumDesignCatalogFilters>.pb599AlbumFilterButton{display:none!important}
        body.pb647DesignDedicated .photographerAlbumDesignCatalog .albumDesignCatalogFilters>[data-pb604-filter-proxy="1"]{display:none!important}
      }
    `;document.head.appendChild(s);
  }
  function text(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim()}
  function buttonKind(node){const t=text(node);return /اسلایدشو|slideshow/i.test(t)?'slideshow':/اینستاگرام|instagram/i.test(t)?'instagram':/کشیده|panorama/i.test(t)?'panorama':/آلبوم|album|کلاسیک/i.test(t)?'classic':''}
  function modelLabel(root){
    const picker=root.querySelector('.albumDesignMobilePicker');if(!picker)return null;
    const labels=[...picker.querySelectorAll(':scope > label')];
    const label=labels.find(x=>/مدل|نوع طراحی/.test(text(x.querySelector('span')||x)))||labels[0]||null;
    label?.classList.add('pb647ModelLabel');return label;
  }
  function sizeLabel(root){
    const picker=root.querySelector('.albumDesignMobilePicker');if(!picker)return null;
    const labels=[...picker.querySelectorAll(':scope > label')];
    const label=labels.find(x=>/سایز/.test(text(x.querySelector('span')||x)))||labels[1]||null;
    label?.classList.add('pb647SizeLabel');return label;
  }
  function setSelect(select,value){
    if(!select||String(select.value)===String(value))return false;
    const option=[...(select.options||[])].find(o=>String(o.value)===String(value)&&!o.disabled);
    if(!option)return false;
    try{const d=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');d?.set?d.set.call(select,value):select.value=value}catch{select.value=value}
    select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  function isAlbumValue(v){return ['album','classic','panorama'].includes(String(v||'').toLowerCase())}
  function originalOptions(select){
    let cached=nativeOptionCache.get(select);
    if(!cached){
      cached=[...(select.options||[])].map(o=>({value:String(o.value||''),text:String(o.textContent||''),disabled:Boolean(o.disabled)}));
      nativeOptionCache.set(select,cached);
    }
    return cached;
  }
  function restoreNativeOptions(select){
    const cached=originalOptions(select);
    const existing=new Map([...(select.options||[])].map(o=>[String(o.value||''),o]));
    for(const meta of cached){
      if(existing.has(meta.value))continue;
      const opt=document.createElement('option');opt.value=meta.value;opt.textContent=meta.text;opt.disabled=meta.disabled;select.appendChild(opt);
    }
  }
  function configureNativeModelSelect(root,mode){
    const label=modelLabel(root),select=label?.querySelector('select');if(!select)return true;
    restoreNativeOptions(select);
    const options=[...(select.options||[])];
    const allowed=(opt)=>{
      const k=buttonKind(opt),v=String(opt.value||'').toLowerCase();
      const albumChoice=isAlbumValue(v)||k==='classic'||k==='panorama';
      return mode==='instagram'?(v==='instagram'||k==='instagram'):albumChoice;
    };
    // Mobile native pickers on iOS/Android may still show hidden/disabled <option>s.
    // Remove wrong design types from the DOM so Album can never expose Instagram/Slideshow.
    for(const opt of options){if(!allowed(opt))opt.remove()}
    const remaining=[...(select.options||[])];
    if(mode==='instagram'){
      const target=remaining.find(o=>String(o.value||'').toLowerCase()==='instagram'||buttonKind(o)==='instagram');
      if(target&&String(select.value)!==String(target.value))return !setSelect(select,String(target.value));
      return true;
    }
    if(remaining.some(o=>String(o.value)===String(select.value)))return true;
    const preferred=remaining.find(o=>String(o.value)==='classic'||String(o.value)==='album')||remaining[0];
    return preferred?!setSelect(select,String(preferred.value)):true;
  }
  function configureButtons(root,mode){
    const buttons=[...root.querySelectorAll('.albumDesignGroupButtons button')];
    buttons.forEach(btn=>{
      const k=buttonKind(btn);btn.classList.toggle('pb647SlideshowChoice',k==='slideshow');btn.classList.toggle('pb647InstagramChoice',k==='instagram');
      if(k==='slideshow')btn.classList.add('pb647Hidden');
      else if(mode==='album'&&k==='instagram')btn.classList.add('pb647Hidden');
      else if(mode==='instagram'&&k!=='instagram')btn.classList.add('pb647Hidden');
      else btn.classList.remove('pb647Hidden');
    });
    const active=buttons.find(b=>b.classList.contains('active')&&!b.classList.contains('pb647Hidden'));
    if(active)return true;
    const target=mode==='instagram'?buttons.find(b=>buttonKind(b)==='instagram'):buttons.find(b=>['classic','panorama'].includes(buttonKind(b)))||buttons.find(b=>buttonKind(b)==='classic');
    if(target&&target.dataset.pb647Switching!=='1'){
      target.dataset.pb647Switching='1';target.click();setTimeout(()=>delete target.dataset.pb647Switching,120);return false;
    }
    return true;
  }
  function closeWrongSheets(mode){
    document.querySelectorAll('.albumDesignMobileCatalogPickerBackdrop,.pb602MobilePickerBackdrop').forEach(backdrop=>{
      const t=text(backdrop);
      if(/اسلایدشو|slideshow/i.test(t)||(mode==='instagram'&&(/سایز|مدل|نوع طراحی/.test(t)))){backdrop.remove();return}
      if(mode==='album'&&/نوع طراحی|مدل/.test(t)){
        backdrop.querySelectorAll('button').forEach(btn=>{const k=buttonKind(btn);if(k==='instagram'||k==='slideshow')btn.remove()});
      }
    });
  }
  function pruneAlbumOnlyMenus(mode){
    if(mode!=='album')return;
    // Dedicated album route: any design-type menu must contain album choices only.
    document.querySelectorAll('.photographerAlbumDesignCatalog .albumDesignMobileCatalogPickerChoices button,.photographerAlbumDesignCatalog .pb602MobilePickerSheet button').forEach(btn=>{
      const k=buttonKind(btn);if(k==='instagram'||k==='slideshow')btn.remove();
    });
    // The global hamburger menu can stay available, but do not repeat Instagram/Slideshow
    // while the photographer is inside the dedicated Album workspace.
    document.querySelectorAll('#pbCanonicalHeaderV624 .pbMobileInfoLinks a').forEach(a=>{
      const href=String(a.getAttribute('href')||'');
      if(href.startsWith('/instagram-post-design')||href.startsWith('/slideshow-design'))a.classList.add('pb647Hidden');
    });
  }
  function rewriteMobileEntryLinks(){
    document.querySelectorAll('.pbHomeMobileAccountBar a[href="/album-design"]').forEach(a=>a.setAttribute('href','/album-design/start'));
    document.querySelectorAll('.pbHomeMobileAccountBar a[href="/instagram-post-design"]').forEach(a=>a.setAttribute('href','/instagram-post-design/start'));
    document.querySelectorAll('a[href^="/slideshow-design"]').forEach(a=>a.classList.add('pb647Hidden'));
  }
  function decorate(){
    timer=0;installStyle();rewriteMobileEntryLinks();
    const mode=routeMode(),body=document.body;if(!body)return;
    body.classList.toggle('pb647DesignDedicated',!!mode);body.classList.toggle('pb647InstagramOnly',mode==='instagram');body.classList.toggle('pb647AlbumOnly',mode==='album');
    if(!mode)return;
    const root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;
    root.querySelectorAll('button').forEach(btn=>{const t=text(btn);if(/افزودن به آلبوم|ذخیره تغییرات صفحه|پروژه جدید/.test(t))btn.classList.add('pb647BatchAction');if(/اسلایدشو|slideshow/i.test(t))btn.classList.add('pb647Hidden')});
    const ml=modelLabel(root),sl=sizeLabel(root);
    if(ml)ml.style.setProperty('display',mode==='instagram'?'none':'flex','important');
    if(sl)sl.style.setProperty('display',mode==='instagram'?'none':'flex','important');
    root.querySelectorAll('.albumDesignMobilePickerButton.mode').forEach(x=>x.style.setProperty('display','none','important'));
    root.querySelectorAll('.albumDesignMobilePickerButton.size').forEach(x=>x.style.setProperty('display',mode==='instagram'?'none':'','important'));
    if(!configureNativeModelSelect(root,mode)||!configureButtons(root,mode)){schedule(90);return}
    if(mode==='instagram')root.querySelectorAll('.albumDesignSizeButtons').forEach(x=>x.style.setProperty('display','none','important'));
    else root.querySelectorAll('.albumDesignSizeButtons').forEach(x=>x.style.removeProperty('display'));
    closeWrongSheets(mode);
    pruneAlbumOnlyMenus(mode);
  }
  function schedule(delay=50){clearTimeout(timer);timer=setTimeout(decorate,delay)}
  function start(){
    installStyle();schedule(10);
    if(!observer){observer=new MutationObserver(list=>{if(list.some(m=>m.type==='childList'))schedule(55)});observer.observe(document.getElementById('root')||document.documentElement,{subtree:true,childList:true})}
    addEventListener('popstate',()=>schedule(10));addEventListener('hashchange',()=>schedule(10));addEventListener('resize',()=>schedule(40),{passive:true});
    document.addEventListener('click',()=>schedule(35),true);
    console.info('[PhotoBridge] mobile album menu hard isolation',VERSION);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
