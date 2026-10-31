/* PhotoBridge R72 — platform-admin uploader for the Lab Windows installer. */
(() => {
  'use strict';
  if (!location.pathname.startsWith('/admin')) return;
  const $ = (q, r = document) => r.querySelector(q);
  const testToken = () => { try { return sessionStorage.getItem('lablink_test_session') || ''; } catch { return ''; } };
  function authHeaders(json = true) {
    const t = testToken();
    return { ...(json ? { 'content-type': 'application/json' } : {}), 'x-photobridge-portal': 'admin', ...(t ? { authorization: `Bearer ${t}` } : {}) };
  }
  async function api(path, opts = {}) {
    const r = await fetch(path, { credentials: 'include', cache: 'no-store', ...opts, headers: { ...authHeaders(opts.body !== undefined), ...(opts.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || 'request_failed'); e.data = d; throw e; }
    return d;
  }
  function upload(url, file, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('PUT', url);
      if (file.type) x.setRequestHeader('content-type', file.type);
      x.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100)); };
      x.onload = () => x.status >= 200 && x.status < 300 ? resolve() : reject(new Error('upload_failed'));
      x.onerror = () => reject(new Error('upload_failed'));
      x.send(file);
    });
  }
  const fa = n => Number(n || 0).toLocaleString('fa-IR');
  const bytes = n => { n = Number(n || 0); return n ? `${Number(n / 1024 / 1024).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت` : '—'; };
  const date = v => { try { return v ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(v)) : '—'; } catch { return '—'; } };
  function installStyle() {
    if ($('#pbR72LabDesktopStyle')) return;
    const s = document.createElement('style');
    s.id = 'pbR72LabDesktopStyle';
    s.textContent = `.pbR72LabDesktop{direction:rtl;margin:12px 0 4px;padding:18px;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 7px 24px rgba(15,23,42,.055);font-family:inherit}.pbR72LabHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.pbR72LabHead h3{margin:0 0 5px;font-size:16px}.pbR72LabHead p{margin:0;color:#667085;font-size:11px;line-height:1.9}.pbR72LabBadge{white-space:nowrap;border:1px solid #d1fadf;background:#ecfdf3;color:#067647;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:800}.pbR72LabStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.pbR72LabStat{border:1px solid #edf0f4;background:#f8fafc;border-radius:12px;padding:9px 10px;min-width:0}.pbR72LabStat small{display:block;color:#98a2b3;font-size:9px;margin-bottom:4px}.pbR72LabStat b{font-size:11px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pbR72LabForm{display:grid;grid-template-columns:minmax(220px,1fr) 140px auto;gap:9px;align-items:end}.pbR72LabForm label{display:flex;flex-direction:column;gap:5px;font-size:9px;color:#667085;font-weight:700}.pbR72LabForm input{height:38px;border:1px solid #d0d5dd;border-radius:10px;padding:0 10px;font:inherit;font-size:10px;background:#fff}.pbR72LabForm button{height:38px;border:0;border-radius:10px;padding:0 16px;background:#0f766e;color:#fff;font:inherit;font-size:10px;font-weight:800;cursor:pointer}.pbR72LabForm button:disabled{opacity:.5;cursor:not-allowed}.pbR72LabProgress{display:none;margin-top:10px;height:7px;background:#edf2f7;border-radius:99px;overflow:hidden}.pbR72LabProgress.on{display:block}.pbR72LabProgress i{display:block;height:100%;width:0;background:#0f766e}.pbR72LabMsg{margin-top:9px;padding:9px 11px;border-radius:10px;background:#f8fafc;color:#475467;font-size:10px;line-height:1.8}.pbR72LabMsg.ok{background:#ecfdf3;color:#067647}.pbR72LabMsg.err{background:#fef3f2;color:#b42318}@media(max-width:760px){.pbR72LabStats{grid-template-columns:1fr 1fr}.pbR72LabForm{grid-template-columns:1fr}.pbR72LabHead{display:block}.pbR72LabBadge{display:inline-block;margin-top:8px}}`;
    document.head.append(s);
  }
  function setMessage(box, text, kind = '') {
    const m = $('[data-msg]', box);
    if (!m) return;
    m.className = `pbR72LabMsg ${kind}`;
    m.textContent = text;
  }
  async function render() {
    const panel = $('.adminGuidePanel');
    if (!panel || !$('.adminGuideHead', panel)) return;
    let box = $('.pbR72LabDesktop', panel);
    if (!box) {
      installStyle();
      box = document.createElement('section');
      box.className = 'pbR72LabDesktop';
      const store = $('.pbR62DesktopRelease', panel);
      (store || $('.adminGuideHead', panel)).insertAdjacentElement('afterend', box);
    }
    try {
      const d = await api('/api/admin/lab-desktop-release');
      const r = d.release || null;
      box.innerHTML = `<div class="pbR72LabHead"><div><h3>برنامه ویندوز لابراتوار</h3><p>فایل EXE و فایل تأیید JSON همان نسخه را از پوشهٔ release انتخاب کنید؛ برنامهٔ مشتری نسخهٔ جدید را دریافت می‌کند.</p></div><span class="pbR72LabBadge">Lab Desktop</span></div><div class="pbR72LabStats"><div class="pbR72LabStat"><small>نسخه فعال</small><b dir="ltr">${r?.version || 'ثبت نشده'}</b></div><div class="pbR72LabStat"><small>فایل</small><b>${r?.name || '—'}</b></div><div class="pbR72LabStat"><small>حجم</small><b>${bytes(r?.bytes)}</b></div><div class="pbR72LabStat"><small>آخرین بارگذاری</small><b>${date(r?.uploadedAt)}</b></div></div><div class="pbR72LabForm"><label>فایل نصب لابراتوار (.exe)<input data-file type="file" accept=".exe,application/x-msdownload,application/vnd.microsoft.portable-executable,application/octet-stream"></label><label>فایل تأیید آپدیت (.json)<input data-update-manifest type="file" accept=".json,application/json"></label><label>شماره نسخه<input data-version value="${r?.version || '1.0.0'}" dir="ltr" inputmode="decimal"></label><button data-upload type="button" ${d.storageAvailable ? '' : 'disabled'}>${r ? 'جایگزینی برنامه' : 'بارگذاری برنامه'}</button></div><div class="pbR72LabProgress"><i></i></div><div class="pbR72LabMsg" data-msg>${d.storageAvailable ? 'آماده بارگذاری نسخه جدید لابراتوار.' : 'Object Storage برای آپلود Installer فعال نیست.'}</div>`;
      const updateFile=$('[data-update-manifest]',box);
      updateFile.onchange=async()=>{try{const value=JSON.parse(await updateFile.files[0].text());$('[data-version]',box).value=value.version;setMessage(box,'فایل تأیید آپدیت انتخاب شد؛ فایل EXE همین نسخه را هم انتخاب کنید.');}catch{setMessage(box,'فایل تأیید آپدیت معتبر نیست.','err');}};
      const file = $('[data-file]', box), ver = $('[data-version]', box), btn = $('[data-upload]', box), prog = $('.pbR72LabProgress', box), bar = $('i', prog);
      file?.addEventListener('change', () => {
        const m = /([0-9]+\.[0-9]+\.[0-9]+)/.exec(file.files?.[0]?.name || '');
        if (m && (!ver.value || ver.value === '1.0.0')) ver.value = m[1];
      });
      btn?.addEventListener('click', async () => {
        const f = file.files?.[0], v = String(ver.value || '').trim();
        if (!f) return setMessage(box, 'اول فایل EXE را انتخاب کن.', 'err');
        if (!/\.exe$/i.test(f.name)) return setMessage(box, 'فایل باید EXE باشد.', 'err');
        if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9._-]+)?$/.test(v)) return setMessage(box, 'نسخه را مثل 1.0.0 وارد کن.', 'err');
        let updateManifest=null;try{if(updateFile.files?.[0]){if(updateFile.files[0].size>16384)throw Error();updateManifest=JSON.parse(await updateFile.files[0].text());if(updateManifest.version!==v||updateManifest.size!==f.size)throw Error();}}catch{return setMessage(box,'فایل تأیید با نسخه یا حجم EXE مطابقت ندارد.','err');}
        btn.disabled = file.disabled = ver.disabled = updateFile.disabled = true;
        prog.classList.add('on');
        try {
          const start = await api('/api/admin/lab-desktop-release/upload', { method: 'POST', body: JSON.stringify({ name: f.name, version: v, contentType: f.type || 'application/octet-stream', bytes: f.size }) });
          await upload(start.uploadUrl, f, n => { bar.style.width = `${n}%`; setMessage(box, `در حال آپلود · ${fa(n)}٪`); });
          await api('/api/admin/lab-desktop-release/upload/complete', { method: 'POST', body: JSON.stringify({ uploadId: start.uploadId,updateManifest }) });
          setMessage(box,updateManifest?'نسخهٔ جدید برای دانلود و به‌روزرسانی داخل برنامه منتشر شد.':'فایل نصب منتشر شد؛ برای آپدیت خودکار، فایل تأیید JSON خروجی ساخت را هم بارگذاری کنید.','ok');
          setTimeout(render, 600);
        } catch (e) {
          setMessage(box, e?.data?.error || e.message || 'آپلود انجام نشد.', 'err');
          btn.disabled = file.disabled = ver.disabled = updateFile.disabled = false;
        }
      });
    } catch (e) {
      box.innerHTML = `<div class="pbR72LabMsg err">بارگذاری مدیریت برنامه لابراتوار انجام نشد: ${e.message}</div>`;
    }
  }
  let timer = null;
  const queue = () => { clearTimeout(timer); timer = setTimeout(render, 120); };
  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('popstate', queue);
  queue();
})();

/* PB1471 update release upload */
