'use strict';

function canBridge(source) {
  return source.includes('/* PB1892:') &&
    source.includes('async function pb1568ProcessOrder(lab,order,settings)') &&
    source.includes('pb1568Work.running') &&
    source.includes('function pb1586WakeDownloads(');
}

function connectNotificationDownload(reuseDetail = false) {
  if (!window.pbNativeStorage || !window.pbDesktopEvents?.onOrderArrived) return;

  const pending = new Set();
  let session = 0;
  addEventListener('photobridge-auth-session-changed', () => { session++; pending.clear(); });

  window.pbDesktopEvents.onOrderArrived(async signal => {
    const lab = String(signal?.labId || '');
    const id = String(signal?.orderId || '');
    const at = Number(signal?.notifiedAt);
    if (!lab || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id) ||
        !Number.isFinite(at) || Date.now() - at > 120000 || at - Date.now() > 10000) return;
    const epoch = session;
    const key = epoch + ':' + lab + ':' + id;
    if (pending.has(key) || pending.size >= 200) return;
    pending.add(key);

    try {
      const route = '/api/lab/orders/' + encodeURIComponent(id);
      const [account, automation, firstDetail] = await Promise.all([
        Me('/api/auth/me'), Me('/api/lab/automation'), Me(route),
      ]);
      const settings = automation?.settings;
      if (session !== epoch || String(account?.lab?.id) !== lab || !settings?.autoDownloadEnabled) return;
      let order, readyDetail;
      for (const delay of [0, 450, 1200, 3000, 6500]) {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        if (session !== epoch) return;
        const detail = delay ? await Me(route) : firstDetail;
        order = detail?.order;
        if (String(order?.id) !== id || String(order.lab_id) !== lab ||
            !['sent', 'received'].includes(String(order.status)) || order.downloaded_at ||
            (order.settlement_mode === 'prepaid' && order.payment_status !== 'paid')) return;
        if (Array.isArray(detail.files) && detail.files.length > 0 &&
            detail.files.length === Number(order.file_count)) { readyDetail = detail; break; }
        order = null;
      }
      if (!order) return;
      // Share the existing automatic worker lock. A second path must never
      // acknowledge or invoice the same order while that worker is active.
      const waited = pb1568Work.running;
      while (pb1568Work.running && session === epoch && Date.now() - at < 120000) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (session !== epoch || pb1568Work.running || Date.now() - at >= 120000 ||
          (pb1568Work.labId && String(pb1568Work.labId) !== lab)) return;
      pb1568Work.running = true;
      pb1568Work.labId = lab;
      try {
        const trace = stage => window.pbDesktopEvents.downloadTrace?.({ orderId: id, stage, elapsedMs: Date.now() - at });
        trace('worker_scheduled');
        let firstByte = false, initialBytes;
        const progress = value => {
          if (value?.phase !== 'downloading') return;
          const bytes = Number(value.loadedBytes || 0);
          if (initialBytes === undefined) initialBytes = bytes;
          if (!firstByte && bytes > initialBytes) {
            firstByte = true;
            trace('first_byte');
          }
        };
        await pb1568ProcessOrder(lab, order, settings, {
          detail: reuseDetail && !waited ? readyDetail : null,
          progress,
        });
        trace('worker_finished');
      } finally {
        pb1568Work.running = false;
      }
    } catch {
      if (session === epoch) pb1586WakeDownloads();
    } finally {
      pending.delete(key);
    }
  });
}

function reuseDownloadedDetails(source) {
  const signature = 'async function pb1568ProcessOrder(lab,order,settings){';
  const start = source.indexOf(signature);
  const end = source.indexOf('async function pb1568AutoTick(', start);
  const worker = start >= 0 && end > start ? source.slice(start, end) : '';
  const read = "const detail=await Me('/api/lab/orders/'+encodeURIComponent(id));";
  const download = "pb1450Download(detail,()=>{},{silent:true})";
  if (!worker.includes(read) || !worker.includes(download)) return { source, reused: false };
  const patched = worker.replace(signature, 'async function pb1568ProcessOrder(lab,order,settings,nativeNotice){')
    .replace(read, "const detail=nativeNotice?.detail||await Me('/api/lab/orders/'+encodeURIComponent(id));")
    .replace(download, "pb1450Download(detail,nativeNotice?.progress||(()=>{}),{silent:true})");
  return { source: source.slice(0, start) + patched + source.slice(end), reused: true };
}

module.exports = { canBridge, connectNotificationDownload, reuseDownloadedDetails };
