/* PhotoBridge v877 — authoritative Store appearance runtime. */
(()=>{
  'use strict';
  if(window.__PB877_STORE_APPEARANCE__)return;
  window.__PB877_STORE_APPEARANCE__=true;
  const valid=x=>/^#[0-9a-f]{6}$/i.test(String(x||''));
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const contrast=hex=>{const n=parseInt(String(hex).slice(1),16),c=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};return .2126*c(n>>16&255)+.7152*c(n>>8&255)+.0722*c(n&255)<.18?'#fff':'#101828'};
  let appearance=null,raf=0,loading=null;

  function normalize(d={}){
    const header=valid(d.headerColor)?String(d.headerColor).toLowerCase():'#dff2f6';
    return {
      topColor:valid(d.topColor)?String(d.topColor).toLowerCase():header,
      headerColor:header,
      subbarColor:valid(d.subbarColor)?String(d.subbarColor).toLowerCase():header,
      selectedColor:valid(d.selectedColor)?String(d.selectedColor).toLowerCase():'#ffffff'
    };
  }
  function apply(d){
    appearance=normalize(d||appearance||{});
    const a=appearance,r=document.documentElement,body=document.body;
    r.style.setProperty('--pb771-top',a.topColor,'important');
    r.style.setProperty('--pb718-header',a.headerColor,'important');
    r.style.setProperty('--pb718-subbar',a.subbarColor,'important');
    r.style.setProperty('--pb718-subbar-text',contrast(a.subbarColor),'important');
    r.style.setProperty('--pb769-header-ink',contrast(a.headerColor),'important');
    r.style.setProperty('--pb769-subbar-ink',contrast(a.subbarColor),'important');
    r.style.setProperty('--pb876-selected',a.selectedColor,'important');
    r.style.setProperty('--pb876-selected-ink',contrast(a.selectedColor),'important');
    r.style.setProperty('--pb877-selected',a.selectedColor,'important');
    r.style.setProperty('--pb877-selected-ink',contrast(a.selectedColor),'important');
    r.style.setProperty('background-color',a.topColor,'important');
    body?.style.setProperty('background-color',a.topColor,'important');
    qsa('meta[name="theme-color"]').forEach(m=>m.setAttribute('content',a.topColor));
    let meta=qs('meta[name="theme-color"]');
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';meta.content=a.topColor;document.head.appendChild(meta)}

    const header=qs('#photographerStoreRoleHeader');
    if(header instanceof HTMLElement){header.style.setProperty('background',a.headerColor,'important');header.style.setProperty('background-color',a.headerColor,'important');header.style.setProperty('color',contrast(a.headerColor),'important')}

    /* Brand/store identity row is intentionally neutral, never subbarColor. */
    const identity=qs('#photographerStoreIdentityBar');
    if(identity instanceof HTMLElement){identity.style.setProperty('background','#ffffff','important');identity.style.setProperty('background-color','#ffffff','important');identity.style.setProperty('color','#182230','important')}

    /* R100F24: primary Store tabs use stable CSS-owned colors; avoid inline repaints/flicker. */

    /* Only category rows receive subbarColor; any brand row stays white. */
    for(const row of qsa('#itemCategoryFilters,#saleCategoryFilters'))if(row instanceof HTMLElement){row.style.setProperty('background',a.subbarColor,'important');row.style.setProperty('background-color',a.subbarColor,'important');row.style.setProperty('color',contrast(a.subbarColor),'important')}
    for(const row of qsa('.storeBrandRow,.brandFilters,[id*="BrandFilters"],[id*="brandFilters"]'))if(row instanceof HTMLElement){row.style.setProperty('background','#ffffff','important');row.style.setProperty('background-color','#ffffff','important');row.style.setProperty('color','#263445','important')}

    const clearSelected=el=>{if(!(el instanceof HTMLElement))return;el.style.removeProperty('background');el.style.removeProperty('background-color');el.style.removeProperty('color')};
    const setSelected=el=>{if(!(el instanceof HTMLElement))return;el.style.setProperty('background',a.selectedColor,'important');el.style.setProperty('background-color',a.selectedColor,'important');el.style.setProperty('color',contrast(a.selectedColor),'important')};
    /* Selected-color is an ephemeral state, not a permanent inline paint.
       Clear every candidate first so a previously selected store tab cannot
       keep the admin-selected background after its .active class moves. */
    const selectionGroups=[
      '#financePanel .financeTabsV811>button',
      '#financePanel .financeTabsV813>button',
      '#itemCategoryFilters .categoryChip',
      '#saleCategoryFilters .categoryChip'
    ];
    selectionGroups.forEach(sel=>qsa(sel).forEach(clearSelected));
    qsa('#financePanel .financeTabsV811>button.active,#financePanel .financeTabsV813>button.active,#itemCategoryFilters .categoryChip.active,#saleCategoryFilters .categoryChip.active').forEach(setSelected);

    try{localStorage.setItem('photobridge:appearance:all',JSON.stringify(a));localStorage.setItem('photobridge:appearance:top',a.topColor)}catch{}
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(appearance)apply(appearance)})}
  async function sync(){
    let cached=null;try{cached=JSON.parse(localStorage.getItem('photobridge:appearance:all')||'null')}catch{}
    if(cached)apply(cached);
    if(loading)return loading;
    loading=fetch('/api/public/appearance',{credentials:'same-origin',cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error('appearance');const d=await r.json();apply(d)}).catch(()=>{}).finally(()=>{loading=null});
    return loading;
  }
  const start=()=>{
    void sync();
    const root=qs('#storePhotographerWorkspace')||document.body;
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-current']});
    document.addEventListener('click',schedule,true);
    document.addEventListener('change',schedule,true);
    addEventListener('pageshow',()=>void sync(),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void sync()});
    [50,180,500,1200].forEach(ms=>setTimeout(schedule,ms));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
