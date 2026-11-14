(function () {
  if (window.PB1850) return;
  var portal=/^\/photographer(?:\/|$)/.test(location.pathname)?'photographer':/^\/lab(?:\/|$)/.test(location.pathname)?'lab':/^\/admin(?:\/|$)/.test(location.pathname)?'admin':/^\/(?:rental|equipment-rental)(?:\/|$)/.test(location.pathname)?'rental':'default';
  var originalFetch = window.fetch.bind(window), queue = [], busy = false, references = {};
  var labels = { upload: 'انتقال فایل به فضای ذخیره‌سازی', presign: 'آماده‌سازی ارسال فایل', complete: 'تأیید دریافت فایل', submit: 'ثبت نهایی سفارش', api: 'ارتباط با سرور' };
  function safeRoute(value) { try { return new URL(value, location.href).pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id'); } catch (_) { return '/'; } }
  function stage(url) { return /presign/.test(url) ? 'presign' : /uploads\/complete|uploads\/status/.test(url) ? 'complete' : /\/submit/.test(url) ? 'submit' : 'api'; }
  try { queue = JSON.parse(sessionStorage.getItem('pb1850-errors') || '[]').slice(-20); } catch (_) {}
  function save() { try { sessionStorage.setItem('pb1850-errors', JSON.stringify(queue.slice(-20))); } catch (_) {} }
  async function flush() {
    if (busy || !queue.length || navigator.onLine === false) return;
    busy = true;
    try {
      while (queue.length) {
        var item = queue[0], response = await originalFetch('/api/diagnostics/errors', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-photobridge-portal': portal }, body: JSON.stringify(item), signal: AbortSignal.timeout(8000) });
        if (!response.ok) break;
        var result = await response.json(); queue.shift(); save();
        if (result.incidentId) window.dispatchEvent(new CustomEvent('photobridge-error-recorded', { detail: { incidentId: result.incidentId, reference: item.code } }));
      }
    } catch (_) {} finally { busy = false; }
  }
  function report(item) {
    // Only deliberately selected fields leave this browser. No file names or response bodies.
    var row = { source: item.source || 'browser', stage: item.stage || 'api', code: String(item.code || 'request_failed').replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0,80), status: Number(item.status) || 0, route: safeRoute(item.route || location.pathname), reference: String(item.reference||'').replace(/[^A-Z0-9-]/g,'').slice(0,40), providerRequestId: String(item.providerRequestId || '').replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0,120) };
    var last = queue[queue.length-1]; if (!last || JSON.stringify(last) !== JSON.stringify(row)) queue.push(row);
    queue = queue.slice(-20); save(); void flush();
  }
  function describe(error) {
    var label = labels[error?.pbStage] || 'ارسال سفارش';
    var name = error?.pbFile ? ' «' + String(error.pbFile).slice(0,120) + '»' : '';
    var code = error?.status ? '؛ کد ' + error.status : '';
    var ref = error?.pbReference ? '؛ شناسهٔ سرویس: ' + error.pbReference : '';
    return 'خطا در ' + label + name + code + ref + '؛ کد پیگیری: '+(error?.pbLocalReference||'در حال ثبت')+'. فایل‌های انتخاب‌شده را نگه دارید.';
  }
  window.PB1850 = { report: report, describe: describe, reference: function(stage) { var item=references[stage]; return item&&Date.now()-item.at<5000?item.id:''; } };
  window.fetch = async function (input, init) {
    var url = typeof input === 'string' ? input : input?.url || '', local;
    try { local = new URL(url, location.href); } catch (_) { return originalFetch(input,init); }
    var watched = local.origin === location.origin && local.pathname.startsWith('/api/') && !local.pathname.startsWith('/api/diagnostics/');
    try { var result = await originalFetch(input,init); if (watched && result.status >= 500) { references[stage(local.pathname)]={id:result.headers.get('x-photobridge-error-reference')||('PB-'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase()),at:Date.now()}; report({source:'api',stage:stage(local.pathname),status:result.status,code:'http_'+result.status,route:local.pathname,reference:references[stage(local.pathname)].id}); } return result; }
    catch (error) { if (watched && error?.name !== 'AbortError') { references[stage(local.pathname)]={id:'PB-'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),at:Date.now()}; report({source:'api',stage:stage(local.pathname),code:'network_error',route:local.pathname,reference:references[stage(local.pathname)].id}); } throw error; }
  };
  addEventListener('error', function (event) { if (event.error) report({code:event.error.name || 'javascript_error',stage:'browser'}); });
  addEventListener('unhandledrejection', function (event) { if (event.reason?.name !== 'AbortError') report({code:event.reason?.name || 'unhandled_promise',stage:'browser'}); });
  if(portal==='admin'&&location.pathname!=='/admin/error-monitor') {
    var addAdminLink=function(){if(document.getElementById('pb1850-admin-link'))return;var nav=document.createElement('nav');nav.id='pb1850-admin-link';nav.dir='rtl';nav.style.cssText='padding:10px 18px;background:#eef4ff;border-bottom:1px solid #ccd8ee;font:14px Tahoma,sans-serif';var link=document.createElement('a');link.href='/admin/error-monitor';link.textContent='خطاها و آمار ارسال';nav.append(link);document.body.prepend(nav);};
    if(document.readyState==='loading')addEventListener('DOMContentLoaded',addAdminLink,{once:true});else addAdminLink();
  }
  addEventListener('online',flush); setInterval(flush,30000); void flush();
})();
