'use strict';

function canBridge(source) {
  return source.includes('/* PB1892:') &&
    source.includes('async function pb1568ProcessOrder(lab,order,settings)') &&
    source.includes('pb1568Work.running') &&
    source.includes('function pb1586WakeDownloads(');
}

function connectNotificationDownload() {
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
      const [account, automation] = await Promise.all([Me('/api/auth/me'), Me('/api/lab/automation')]);
      const settings = automation?.settings;
      if (session !== epoch || String(account?.lab?.id) !== lab || !settings?.autoDownloadEnabled) return;
      let order;
      for (const delay of [0, 450, 1200, 3000, 6500]) {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        if (session !== epoch) return;
        const detail = await Me('/api/lab/orders/' + encodeURIComponent(id));
        order = detail?.order;
        if (String(order?.id) !== id || String(order.lab_id) !== lab ||
            !['sent', 'received'].includes(String(order.status)) || order.downloaded_at ||
            (order.settlement_mode === 'prepaid' && order.payment_status !== 'paid')) return;
        if (Array.isArray(detail.files) && detail.files.length > 0 &&
            detail.files.length === Number(order.file_count)) break;
        order = null;
      }
      if (!order) return;
      // Share the existing automatic worker lock. A second path must never
      // acknowledge or invoice the same order while that worker is active.
      while (pb1568Work.running && session === epoch && Date.now() - at < 120000) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (session !== epoch || pb1568Work.running || Date.now() - at >= 120000 ||
          (pb1568Work.labId && String(pb1568Work.labId) !== lab)) return;
      pb1568Work.running = true;
      pb1568Work.labId = lab;
      try {
        await pb1568ProcessOrder(lab, order, settings);
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

module.exports = { canBridge, connectNotificationDownload };
