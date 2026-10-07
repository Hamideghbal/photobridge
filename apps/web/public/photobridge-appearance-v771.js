/* Platform appearance: three independent colors, visible from the Admin tabs. */
(()=>{
  'use strict';
  const defaults={topColor:'#dff2f6',headerColor:'#dff2f6',subbarColor:'#dff2f6',selectedColor:'#ffffff'},TOP_CACHE='photobridge:appearance:top';
  const valid=x=>/^#[0-9a-f]{6}$/i.test(String(x||''));
  let saved=(()=>{try{const c=JSON.parse(localStorage.getItem('photobridge:appearance:all')||'null');return c&&typeof c==='object'?{...defaults,...c}:{...defaults}}catch{return {...defaults}}})(),panel=null;
  function contrast(hex){
    const n=parseInt(hex.slice(1),16);
    const channel=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
    return .2126*channel(n>>16&255)+.7152*channel(n>>8&255)+.0722*channel(n&255)<.18?'#fff':'#101828';
  }
  function apply(colors){
    const v=Object.fromEntries(Object.keys(defaults).map(k=>[k,valid(colors[k])?colors[k]:defaults[k]]));
    const root=document.documentElement;
    root.style.setProperty('--pb771-top',v.topColor,'important');
    root.style.setProperty('--pb718-header',v.headerColor,'important');
    root.style.setProperty('--pb718-subbar',v.subbarColor,'important');
    root.style.setProperty('--pb718-subbar-text',contrast(v.subbarColor),'important');
    root.style.setProperty('--pb769-header-ink',contrast(v.headerColor),'important');
    root.style.setProperty('--pb769-subbar-ink',contrast(v.subbarColor),'important');
    root.style.setProperty('--pb876-selected',v.selectedColor,'important');
    root.style.setProperty('--pb876-selected-ink',contrast(v.selectedColor),'important');
    root.style.setProperty('background-color',v.topColor,'important');
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=v.topColor;try{localStorage.setItem(TOP_CACHE,v.topColor);localStorage.setItem('photobridge:appearance:all',JSON.stringify(v))}catch{}
  }
  async function load(){
    try{
      const r=await fetch('/api/public/appearance',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      const next={topColor:valid(d.topColor)?d.topColor:(valid(d.headerColor)?d.headerColor:defaults.topColor),
        headerColor:valid(d.headerColor)?d.headerColor:defaults.headerColor,
        subbarColor:valid(d.subbarColor)?d.subbarColor:defaults.subbarColor,
        selectedColor:valid(d.selectedColor)?d.selectedColor:defaults.selectedColor};
      const changed=Object.keys(defaults).some(k=>String(next[k]).toLowerCase()!==String(saved[k]).toLowerCase());
      saved=next;if(changed)apply(saved);
    }catch{}
  }
  function close(restore=true){if(restore)apply(saved);panel?.remove();panel=null}
  function open(){
    if(!document.querySelector('.adminPage'))return;
    if(panel)return;
    panel=document.createElement('div');panel.id='pb771AppearancePanel';
    panel.innerHTML=`<section class="pb771AppearanceCard" role="dialog" aria-modal="true" aria-labelledby="pb771AppearanceTitle">
      <header><div><h2 id="pb771AppearanceTitle">رنگ هدر و نوارها</h2><p>رنگ هر بخش را جداگانه انتخاب کنید؛ تغییرات پیش از ذخیره نمایش داده می‌شوند.</p></div><button type="button" data-close aria-label="بستن">×</button></header>
      <div class="pb771AppearancePreview"><span data-preview="topColor">بالای هدر / نوار گوشی</span><span data-preview="headerColor">هدر اصلی</span><span data-preview="subbarColor">نوار زیر هدر</span><span data-preview="selectedColor">باکس انتخاب‌شده</span></div>
      <label>بالای هدر و رنگ نوار گوشی <input type="color" data-color="topColor"></label>
      <label>هدر اصلی <input type="color" data-color="headerColor"></label>
      <label>نوار زیر هدر <input type="color" data-color="subbarColor"></label>
      <label>باکس انتخاب‌شده <input type="color" data-color="selectedColor"></label>
      <p class="pb771AppearanceStatus" role="status" aria-live="polite"></p>
      <footer><button type="button" data-reset>رنگ پیش‌فرض</button><button type="button" data-cancel>انصراف</button><button type="button" data-save>ذخیره رنگ‌ها</button></footer>
    </section>`;
    document.body.append(panel);
    const fields=Object.fromEntries(Object.keys(defaults).map(k=>[k,panel.querySelector(`[data-color="${k}"]`)]));
    const status=panel.querySelector('.pb771AppearanceStatus');
    const values=()=>Object.fromEntries(Object.keys(fields).map(k=>[k,fields[k].value]));
    function preview(){
      const v=values();apply(v);
      for(const key of Object.keys(v)){
        const sample=panel.querySelector(`[data-preview="${key}"]`);
        sample.style.backgroundColor=v[key];sample.style.color=contrast(v[key]);
      }
    }
    for(const key of Object.keys(fields)){fields[key].value=saved[key];fields[key].addEventListener('input',preview)}
    preview();
    panel.querySelector('[data-close]').onclick=()=>close();
    panel.querySelector('[data-cancel]').onclick=()=>close();
    panel.querySelector('[data-reset]').onclick=()=>{
      for(const key of Object.keys(fields))fields[key].value=defaults[key];preview();
    };
    panel.addEventListener('mousedown',e=>{if(e.target===panel)close()});
    panel.querySelector('[data-save]').onclick=async()=>{
      const button=panel.querySelector('[data-save]');button.disabled=true;status.textContent='در حال ذخیره…';
      try{
        const v=values(),r=await fetch('/api/admin/appearance',{method:'PUT',credentials:'include',
          headers:{'content-type':'application/json','x-photobridge-portal':'admin'},body:JSON.stringify(v)});
        if(!r.ok)throw new Error(r.status===403?'فقط ادمین پلتفرم می‌تواند رنگ‌ها را تغییر دهد.':'ذخیرهٔ رنگ‌ها انجام نشد.');
        saved=v;close(false);
      }catch(e){status.textContent=e.message;button.disabled=false}
    };
  }
  window.PB771OpenAppearance=open;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close()});
  apply(saved);void load();
})();
