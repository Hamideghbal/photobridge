/* PhotoBridge R62 — platform-admin uploader for the Store Windows installer.
   Uses the same Object Storage upload model as training videos, so web deploys stay lean. */
(()=>{
  'use strict';
  if(!location.pathname.startsWith('/admin')) return;
  const VERSION='R62';
  let rendering=false, queued=false;
  const $=(q,r=document)=>r.querySelector(q);
  const token=()=>{try{return sessionStorage.getItem('lablink_test_session')||''}catch{return ''}};
  const headers=(json=true)=>{const t=token();return {...(json?{'content-type':'application/json'}:{}), 'x-photobridge-portal':'admin', ...(t?{authorization:`Bearer ${t}`}:{})}};
  async function api(path,opts={}){
    const r=await fetch(path,{credentials:'include',cache:'no-store',...opts,headers:{...headers(opts.body!==undefined),...(opts.headers||{})}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(d.error||'request_failed');e.data=d;e.status=r.status;throw e}
    return d;
  }
  function uploadFile(url,file,onProgress){
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();xhr.open('PUT',url);xhr.withCredentials=url.startsWith('/');
      if(url.startsWith('/')){const t=token();if(t)xhr.setRequestHeader('authorization',`Bearer ${t}`)}
      if(file.type)xhr.setRequestHeader('content-type',file.type);
      xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress?.(Math.max(1,Math.min(100,Math.round(e.loaded/e.total*100))))};
      xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('upload_failed'));
      xhr.onerror=()=>reject(new Error('upload_failed'));xhr.send(file);
    });
  }
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const bytes=n=>{n=Number(n||0);if(!n)return '—';if(n<1024*1024)return `${fa(Math.round(n/1024))} کیلوبایت`;return `${Number(n/1024/1024).toLocaleString('fa-IR',{maximumFractionDigits:1})} مگابایت`};
  const date=v=>{if(!v)return '—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(v))}catch{return '—'}};
  function installStyle(){
    if($('#pbR62DesktopStyle'))return;
    const s=document.createElement('style');s.id='pbR62DesktopStyle';s.textContent=`
      .pbR62DesktopRelease{direction:rtl;margin:18px 0 4px;padding:18px;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 7px 24px rgba(15,23,42,.055);font-family:inherit}
      .pbR62DesktopHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}.pbR62DesktopHead h3{margin:2px 0 5px;font-size:16px;color:#111827}.pbR62DesktopHead p{margin:0;color:#667085;font-size:11px;line-height:1.9}.pbR62DesktopBadge{white-space:nowrap;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:800}
      .pbR62DesktopCurrent{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:13px}.pbR62DesktopStat{border:1px solid #edf0f4;background:#f8fafc;border-radius:12px;padding:9px 10px;min-width:0}.pbR62DesktopStat small{display:block;color:#98a2b3;font-size:9px;margin-bottom:4px}.pbR62DesktopStat b{display:block;color:#1f2937;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .pbR62DesktopUpload{display:grid;grid-template-columns:minmax(210px,1fr) 145px auto;gap:9px;align-items:end}.pbR62DesktopField{display:flex;flex-direction:column;gap:5px}.pbR62DesktopField>span{font-size:9px;color:#667085;font-weight:700}.pbR62DesktopFile{height:38px;border:1px solid #d0d5dd;border-radius:10px;padding:7px 9px;background:#fff;font:inherit;font-size:10px;max-width:100%}.pbR62DesktopVersion{height:38px;border:1px solid #d0d5dd;border-radius:10px;padding:0 10px;font:inherit;font-size:11px;direction:ltr;text-align:center;background:#fff}.pbR62DesktopButton{height:38px;border:0;border-radius:10px;padding:0 16px;background:#2563eb;color:#fff;font:inherit;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}.pbR62DesktopButton:disabled{opacity:.48;cursor:not-allowed}
      .pbR62DesktopProgress{display:none;height:8px;background:#edf2f7;border-radius:99px;overflow:hidden;margin-top:12px;position:relative}.pbR62DesktopProgress.active{display:block}.pbR62DesktopProgress i{display:block;height:100%;width:0;background:#2563eb;border-radius:inherit;transition:width .12s linear}.pbR62DesktopProgress span{position:absolute;inset:0;display:grid;place-items:center;font-size:7px;color:#111827;font-weight:800}
      .pbR62DesktopMessage{margin-top:10px;padding:9px 11px;border-radius:10px;background:#f8fafc;color:#475467;font-size:10px;line-height:1.8}.pbR62DesktopMessage.ok{background:#ecfdf3;color:#067647}.pbR62DesktopMessage.err{background:#fef3f2;color:#b42318}.pbR62DesktopWarn{margin-top:10px;padding:10px 12px;border:1px solid #fedf89;background:#fffaeb;color:#93370d;border-radius:10px;font-size:10px;line-height:1.8}
      @media(max-width:760px){.pbR62DesktopRelease{padding:14px}.pbR62DesktopHead{display:block}.pbR62DesktopBadge{display:inline-block;margin-top:8px}.pbR62DesktopCurrent{grid-template-columns:1fr 1fr}.pbR62DesktopUpload{grid-template-columns:1fr}.pbR62DesktopButton{width:100%}}
    `;document.head.append(s);
  }
  function shell(panel){
    let box=$('.pbR62DesktopRelease',panel);if(box)return box;
    installStyle();box=document.createElement('section');box.className='pbR62DesktopRelease';box.dataset.version=VERSION;
    const anchor=$('.pb567WorkflowGuideManager',panel)||$('.adminGuideHead',panel);
    anchor?.insertAdjacentElement('afterend',box);if(!box.isConnected)panel.append(box);return box;
  }
  async function render(){
    if(rendering)return;const panel=$('.adminGuidePanel');if(!panel)return;if(!$('.adminGuideHead',panel))return;
    rendering=true;const box=shell(panel);box.innerHTML='<div class="pbR62DesktopMessage">در حال دریافت نسخه برنامه ویندوز…</div>';
    try{
      const d=await api('/api/admin/store-desktop-release'),r=d.release||null;
      box.innerHTML=`
        <div class="pbR62DesktopHead"><div><h3>برنامه ویندوز فروشگاه تجهیزات</h3><p>نسخه نصب‌شونده را از همین‌جا بارگذاری یا جایگزین کن. بعد از آپلود، دکمه «نصب برنامه» در فروشگاه خودکار از همین فایل استفاده می‌کند و دیگر لازم نیست Installer داخل ZIP دیپلوی سایت باشد.</p></div><span class="pbR62DesktopBadge">مدیریت Installer</span></div>
        <div class="pbR62DesktopCurrent">
          <div class="pbR62DesktopStat"><small>نسخه فعال</small><b dir="ltr">${r?.version||'ثبت نشده'}</b></div>
          <div class="pbR62DesktopStat"><small>فایل</small><b title="${r?.name||''}">${r?.name||'—'}</b></div>
          <div class="pbR62DesktopStat"><small>حجم</small><b>${bytes(r?.bytes)}</b></div>
          <div class="pbR62DesktopStat"><small>آخرین بارگذاری</small><b>${date(r?.uploadedAt)}</b></div>
        </div>
        <div class="pbR62DesktopUpload">
          <label class="pbR62DesktopField"><span>فایل نصب ویندوز (.exe)</span><input class="pbR62DesktopFile" data-file type="file" accept=".exe,application/x-msdownload,application/vnd.microsoft.portable-executable,application/octet-stream"></label>
          <label class="pbR62DesktopField"><span>شماره نسخه</span><input class="pbR62DesktopVersion" data-version value="${r?.version||'1.0.0'}" placeholder="1.0.0" inputmode="decimal"></label>
          <button class="pbR62DesktopButton" data-upload type="button" ${d.storageAvailable?'':'disabled'}>${r?'جایگزینی برنامه':'بارگذاری برنامه'}</button>
        </div>
        <div class="pbR62DesktopProgress"><i></i><span></span></div>
        <div class="pbR62DesktopMessage" data-status>آماده بارگذاری برنامه.</div>
        <div class="pbR62DesktopMessage">برای نسخه جدید فقط فایل EXE و شماره نسخه را انتخاب کن. فایل قبلی بعد از ثبت موفق نسخه جدید به‌صورت خودکار جایگزین می‌شود.</div>
        ${d.storageAvailable?'':'<div class="pbR62DesktopWarn">Object Storage فعال نیست. برای بارگذاری Installer، همان فضای ذخیره‌سازی که ویدیوهای آموزشی استفاده می‌کنند باید فعال باشد.</div>'}`;
      const fileInput=$('[data-file]',box),verInput=$('[data-version]',box),btn=$('[data-upload]',box),prog=$('.pbR62DesktopProgress',box),bar=$('i',prog),pct=$('span',prog),msg=$('[data-status]',box);
      fileInput?.addEventListener('change',()=>{const f=fileInput.files?.[0];if(!f)return;const m=/([0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9._-]+)?)/.exec(f.name);if(m&&(!verInput.value||verInput.value==='1.0.0'))verInput.value=m[1]});
      btn?.addEventListener('click',async()=>{
        const file=fileInput.files?.[0],version=String(verInput.value||'').trim();
        if(!file)return setMessage(box,'اول فایل EXE برنامه را انتخاب کن.','err');
        if(!/\.exe$/i.test(file.name))return setMessage(box,'فایل برنامه باید با پسوند EXE باشد.','err');
        if(!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9._-]+)?$/.test(version))return setMessage(box,'شماره نسخه را مثل 1.0.0 وارد کن.','err');
        btn.disabled=true;fileInput.disabled=true;verInput.disabled=true;prog.classList.add('active');bar.style.width='0%';pct.textContent='۰٪';setMessage(box,'در حال آماده‌سازی آپلود…','');
        try{
          const start=await api('/api/admin/store-desktop-release/upload',{method:'POST',body:JSON.stringify({name:file.name,version,contentType:file.type||'application/octet-stream',bytes:file.size})});
          await uploadFile(start.uploadUrl,file,n=>{bar.style.width=`${n}%`;pct.textContent=`${fa(n)}٪`;setMessage(box,`در حال آپلود برنامه · ${fa(n)}٪`,'')});
          await api('/api/admin/store-desktop-release/upload/complete',{method:'POST',body:JSON.stringify({uploadId:start.uploadId})});
          setMessage(box,'برنامه با موفقیت بارگذاری شد و از این لحظه نسخه فعال سایت است.','ok');setTimeout(()=>render(),650);
        }catch(e){const c=e?.data?.error;setMessage(box,c==='upload_not_configured'?'فضای Object Storage برای آپلود برنامه فعال نیست.':c==='installer_type_not_allowed'?'فقط فایل EXE برنامه ویندوز قابل بارگذاری است.':c==='file_too_large'?'حجم فایل بیشتر از حد مجاز است.':c==='invalid_version'?'شماره نسخه معتبر نیست.':'آپلود برنامه انجام نشد. دوباره تلاش کن.','err')}
        finally{btn.disabled=!d.storageAvailable;fileInput.disabled=false;verInput.disabled=false;prog.classList.remove('active')}
      });
    }catch(e){box.innerHTML='<div class="pbR62DesktopMessage err">دریافت وضعیت برنامه ویندوز انجام نشد.</div>'}
    finally{rendering=false}
  }
  function setMessage(box,text,kind=''){let m=$('[data-status]',box);if(!m){m=document.createElement('div');m.className='pbR62DesktopMessage';m.dataset.status='1';box.append(m)}m.className='pbR62DesktopMessage'+(kind?` ${kind}`:'');m.textContent=text}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  const root=$('#root')||document.body;new MutationObserver(queue).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.adminTabs button'))setTimeout(queue,80)},true);
})();
