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
      const trace = stage => window.pbDesktopEvents.downloadTrace?.({ orderId: id, stage, elapsedMs: Date.now() - at });
      trace('dispatch');
      const fetchDetail = async () => {
        try { return await Me(route); }
        catch (error) {
          const status = Number(error?.status || error?.data?.status || 0);
          const code = String(error?.data?.error || error?.code || error?.message || '');
          if ([401, 403].includes(status) || /^(?:login_required|lab_auth_required|account_changed)$/i.test(code)) throw error;
          if (!status || [404, 408, 429, 502, 503, 504].includes(status)) return null;
          throw error;
        }
      };
      const [account, automation, firstDetail] = await Promise.all([
        Me('/api/auth/me'), Me('/api/lab/automation'), fetchDetail(),
      ]);
      const settings = automation?.settings;
      if (session !== epoch || String(account?.lab?.id) !== lab || !settings?.autoDownloadEnabled) return;
      trace('detail_and_policy_ready');
      void window.pbDesktopEvents.orderProgress?.({
        labId: lab, orderId: id, phase: 'checking', stage: 'download',
      })?.catch(()=>{});
      let order, readyDetail;
      for (const delay of [0, 450, 1200, 3000, 6500]) {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        if (session !== epoch) return;
        const detail = delay ? await fetchDetail() : firstDetail;
        order = detail?.order;
        if (!order) { trace('manifest_not_ready'); continue; }
        if (String(order.id) !== id || (order.lab_id && String(order.lab_id) !== lab) ||
            !['sent', 'received'].includes(String(order.status)) || order.downloaded_at ||
            (order.settlement_mode === 'prepaid' && order.payment_status !== 'paid')) return;
        if (Array.isArray(detail.files) && detail.files.length > 0 &&
            detail.files.length === Number(order.file_count)) { readyDetail = detail; break; }
        order = null;
        trace('manifest_not_ready');
      }
      if (!order) return;
      trace('manifest_ready');
      // The patched worker coalesces calls for the same order. A background
      // list read or work on another order needn't block this exact order.
      if (!reuseDetail && pb1568Work.running) trace('worker_queue_wait');
      while (!reuseDetail && pb1568Work.running && session === epoch && Date.now() - at < 120000) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (session !== epoch || (!reuseDetail && pb1568Work.running) || Date.now() - at >= 120000 ||
          (pb1568Work.labId && String(pb1568Work.labId) !== lab)) return;
      if (!reuseDetail) pb1568Work.running = true;
      pb1568Work.labId = lab;
      trace('worker_acquired');
      try {
        if (typeof pb1568State === 'function' && typeof pb1568Save === 'function') {
          const task = pb1568State(lab, id);
          if (task?.phase === 'pending_download' && task.retryAt > Date.now() &&
              /^(download_manifest_incomplete|file_not_found)$/i.test(String(task.error || ''))) {
            pb1568Save(lab, id, { ...task, retryAt: 0 });
          }
        }
        trace('worker_scheduled');
        let firstByte = false, initialBytes;
        const seenStages = new Set();
        const progress = value => {
          if(value?.phase==='scanning'&&!seenStages.has('destination_scan')){seenStages.add('destination_scan');trace('destination_scan');}
          if(value?.phase==='downloading'&&!seenStages.has('response_headers')){seenStages.add('response_headers');trace('response_headers');}
          if(value?.phase==='complete')trace('disk_verified');
          if (value?.phase !== 'downloading') return;
          const bytes = Number(value.loadedBytes || 0);
          if (initialBytes === undefined) initialBytes = bytes;
          if (!firstByte && bytes > initialBytes) {
            firstByte = true;
            trace('first_byte');
          }
        };
        await pb1568ProcessOrder(lab, order, settings, {
          detail: reuseDetail ? readyDetail : null,
          progress,
        });
        trace('worker_finished');
      } finally {
        if (!reuseDetail) pb1568Work.running = false;
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
  const invoice = "pb1568Save(lab,id,{phase:'invoice_issued',invoiceId:data.invoice.id,attempts:0});";
  const lock = `
const pbNativeOrderWork = new Map();
function pb1568ProcessOrder(lab,order,settings,nativeNotice){
 const key = JSON.stringify([lab,order.id]);
 const active = pbNativeOrderWork.get(key);
 if(active) return active;
 const work = Promise.resolve().then(()=>pbNativeProcessOrder(lab,order,settings,nativeNotice));
 pbNativeOrderWork.set(key,work);
 return work.finally(()=>{if(pbNativeOrderWork.get(key)===work)pbNativeOrderWork.delete(key);});
}
`;
  let patched = lock + worker.replace(signature, 'async function pbNativeProcessOrder(lab,order,settings,nativeNotice){')
    .replace(read, "const detail=nativeNotice?.detail||await Me('/api/lab/orders/'+encodeURIComponent(id));")
    .replace(download, "pb1450Download(detail,nativeNotice?.progress||(()=>{}),{silent:true})")
    .replace(invoice, invoice + `
     if(!data.desktopPending&&!data.queued&&!data.offline&&window.pbDesktopEvents?.orderProgress){
      void window.pbDesktopEvents.orderProgress({labId:lab,orderId:id,number:order.number,
       orderCreatedAt:order.created_at,phase:'invoice_issued',stage:'invoice',downloadVerified:true}).catch(()=>{});
     }`);
  const downloadBody = source.slice(source.indexOf('async function pb1450Download('),source.indexOf('async function pb1450AllowStage('));
  if (/\broot\s*=\s*await\s+pb1450Root\(/.test(downloadBody)) {
    patched = patched.replace('await pb1450Root(false);','if(!nativeNotice?.detail)await pb1450Root(false);');
  }
  return { source: source.slice(0, start) + patched + source.slice(end), reused: true };
}

module.exports = { canBridge, connectNotificationDownload, reuseDownloadedDetails };
