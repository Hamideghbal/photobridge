/* PhotoBridge v769: platform-admin mobile header and subbar appearance. */
(()=>{
  'use strict';
  const defaults={headerColor:'#dff2f6',subbarColor:'#dff2f6'};
  const valid=x=>/^#[0-9a-f]{6}$/i.test(String(x||''));
  let saved={...defaults},modal=null;
  function ink(hex){
    const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    const channel=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
    return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)<.18?'#ffffff':'#101828';
  }
  function apply(value){
    const headerColor=valid(value.headerColor)?value.headerColor:defaults.headerColor;
    const subbarColor=valid(value.subbarColor)?value.subbarColor:defaults.subbarColor;
    const root=document.documentElement;
    root.style.setProperty('--pb718-header',headerColor,'important');
    root.style.setProperty('--pb718-subbar',subbarColor,'important');
    root.style.setProperty('--pb718-subbar-text',ink(subbarColor),'important');
    root.style.setProperty('--pb769-header-ink',ink(headerColor),'important');
    root.style.setProperty('--pb769-subbar-ink',ink(subbarColor),'important');
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=headerColor;
  }
  async function load(){
    try{
      const r=await fetch('/api/public/appearance',{cache:'no-store',credentials:'same-origin'});
      if(!r.ok)return;
      const data=await r.json();
      if(valid(data.headerColor)&&valid(data.subbarColor)){saved={headerColor:data.headerColor,subbarColor:data.subbarColor};apply(saved)}
    }catch{}
  }
  function close(restore=true){if(restore)apply(saved);modal?.remove();modal=null}
  function open(){
    if(modal)return;
    modal=document.createElement('div');modal.id='pb769ThemeModal';
    modal.innerHTML=`<div class="pb769ThemeCard" role="dialog" aria-modal="true" aria-label="رنگ هدر و نوار زیر هدر">
      <header><div><strong>رنگ هدر عکاسی</strong><small>پیش‌نمایش تغییرات را ببینید و سپس ذخیره کنید.</small></div><button type="button" data-close aria-label="بستن">×</button></header>
      <div class="pb769ThemeSamples"><span data-head>هدر اصلی</span><span data-bar>نوار زیر هدر</span></div>
      <label>رنگ هدر اصلی <input type="color" data-color="headerColor"></label>
      <label>رنگ نوار زیر هدر <input type="color" data-color="subbarColor"></label>
      <p class="pb769ThemeMessage" role="status" aria-live="polite"></p>
      <footer><button type="button" data-reset>رنگ پیش‌فرض</button><button type="button" data-cancel>انصراف</button><button type="button" data-save>ذخیره رنگ‌ها</button></footer>
    </div>`;
    document.body.append(modal);
    const fields={headerColor:modal.querySelector('[data-color="headerColor"]'),subbarColor:modal.querySelector('[data-color="subbarColor"]')};
    const status=modal.querySelector('.pb769ThemeMessage');
    function preview(){const v={headerColor:fields.headerColor.value,subbarColor:fields.subbarColor.value};
      apply(v);for(const [attr,key] of [['data-head','headerColor'],['data-bar','subbarColor']]){
        const item=modal.querySelector(`[${attr}]`);item.style.background=v[key];item.style.color=ink(v[key]);
      }
    }
    for(const key of Object.keys(fields)){fields[key].value=saved[key];fields[key].addEventListener('input',preview)}
    preview();
    modal.querySelector('[data-close]').onclick=()=>close();modal.querySelector('[data-cancel]').onclick=()=>close();
    modal.addEventListener('mousedown',e=>{if(e.target===modal)close()});
    modal.querySelector('[data-reset]').onclick=()=>{fields.headerColor.value=defaults.headerColor;fields.subbarColor.value=defaults.subbarColor;preview()};
    modal.querySelector('[data-save]').onclick=async()=>{
      const button=modal.querySelector('[data-save]');button.disabled=true;status.textContent='در حال ذخیره…';
      try{
        const r=await fetch('/api/admin/appearance',{method:'PUT',credentials:'include',
          headers:{'content-type':'application/json','x-photobridge-portal':'admin'},
          body:JSON.stringify({headerColor:fields.headerColor.value,subbarColor:fields.subbarColor.value})});
        if(!r.ok)throw new Error(r.status===403?'برای تغییر رنگ باید با حساب ادمین پلتفرم وارد شوید.':'ذخیره رنگ انجام نشد.');
        saved={headerColor:fields.headerColor.value,subbarColor:fields.subbarColor.value};close(false);
      }catch(e){status.textContent=e.message;button.disabled=false}
    };
  }
  function mount(){
    if(location.pathname.startsWith('/photographer'))for(const add of document.querySelectorAll('.albumRecordAddClean')){
      if(add.textContent==='افزودن فایل')add.textContent='افزودن برگ';
    }
    const show=location.pathname.startsWith('/admin')&&!!document.querySelector('.adminPage');
    let button=document.getElementById('pb769ThemeButton');
    if(!show){button?.remove();if(modal)close();return}
    if(!button){button=document.createElement('button');button.id='pb769ThemeButton';button.type='button';
      button.textContent='◉ رنگ هدر';button.onclick=open;document.body.append(button)}
  }
  load();mount();setInterval(mount,1100);
})();
