import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

const token = (v, n = 80) => String(v || '').replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0, n);
const scopeUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value||'')) ? String(value).toLowerCase() : '';
// Never store request bodies, cookies, signed URLs, query strings or raw errors.
export function classifyIncident(data) {
  const code=String(data.code||'');
  if(data.dependency==='database'||/^(?:57P0[123]|08[0-9A-Z]{3}|53300|53400|53100|53200)$/.test(code))return {channel:'database',diagnosis:'خطای ارتباط یا منابع دیتابیس؛ علت دقیق در کد اصلی ثبت شده است'};
  if(data.source==='upload'&&code==='upload_network_error')return {channel:'network_path',diagnosis:'اتصال مرورگر به مقصد قطع شده؛ اینترنت کاربر، مسیر شبکه یا مقصد نیاز به بررسی دارد'};
  if(/^(?:InsufficientStorage|QuotaExceeded|StorageFull|DiskFull)$/.test(code))return {channel:'storage_capacity',diagnosis:'سرویس ذخیره‌سازی محدودیت ظرفیت گزارش کرده است'};
  if(data.source==='upload'||/^(?:SlowDown|ServiceUnavailable|NoSuchBucket|AccessDenied|RequestTimeout|ExpiredToken|SignatureDoesNotMatch)$/.test(code))return {channel:'object_storage',diagnosis:data.status===503?'فضای ذخیره‌سازی یا درگاه آن پاسخ ۵۰۳ داده؛ علت داخلی هنوز مشخص نیست':'انتقال فایل به فضای ذخیره‌سازی ناموفق بوده است'};
  if(data.code==='network_error')return {channel:'network_path',diagnosis:'ارتباط مرورگر با برنامه ناموفق بوده؛ علت قطع ارتباط مشخص نیست'};
  if(data.stage==='browser')return {channel:'browser',diagnosis:'خطای اجرای کد در مرورگر'};
  return {channel:'application',diagnosis:'خطای برنامه یا وابستگی آن؛ برای تعیین علت به کد اصلی و زمان رخداد مراجعه کنید'};
}
export function cleanIncident(raw = {}) {
  const status = Number(raw.status);
  const route = String(raw.route || '/').split(/[?#]/)[0]
    .replace(/https?:\/\/[^/]+/g, '').replace(/[^a-zA-Z0-9_./:-]/g, '_')
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id').slice(0, 180);
  return { source: ['server', 'upload', 'browser', 'api'].includes(raw.source) ? raw.source : 'browser',
    stage: token(raw.stage), code: token(raw.code), route,
    status: Number.isInteger(status) && status >= 0 && status <= 599 ? status : 0,
    dependency: raw.dependency==='database'?'database':'', providerRequestId: token(raw.providerRequestId, 120), userId: token(raw.userId),
    labId:scopeUuid(raw.labId),photographerId:scopeUuid(raw.photographerId),
    reference: token(raw.reference, 40), revision: token(raw.revision, 100) };
}
export function createErrorMonitor({ directory, alert, shouldAlert = () => true, now = Date.now, cooldown = 600000, maxAlerts = 6, persistExternal, log = console }) {
  const incidents = new Map(), rate = new Map();
  let writes = Promise.resolve(), ready, alertTimes = [], activeAlert = false, draining = false;
  const pending = new Map(), external = new Map();
  let syncing = false;
  const file = path.join(directory, 'incidents.jsonl');
  async function load() {
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    try {
      const lines = (await fs.readFile(file, 'utf8')).split('\n').slice(-2001);
      for (const line of lines) { try { const row = JSON.parse(line); if (/^PB-[A-F0-9]{16}$/.test(row.id)) incidents.set(row.fingerprint, row); external.set(row.id,row); } catch {} }
      while (incidents.size > 500) incidents.delete(incidents.keys().next().value);
      while (external.size > 500)external.delete(external.keys().next().value);
      alertTimes = [...incidents.values()].map(r=>r.alertAttemptAt||0).filter(t=>now()-t<3600000);
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  ready = load().catch(e => { log.error('[error-monitor] storage unavailable', e.code || 'write_failed'); });
  function allow(key) {
    const at = now(), item = rate.get(key);
    if (!item || at - item.at > 60000) { rate.delete(key); rate.set(key, { at, count: 1 }); }
    else if (++item.count > 20) return false;
    while (rate.size > 2000) rate.delete(rate.keys().next().value);
    return true;
  }
  function persist(row) {
    pending.set(row.fingerprint, row);
    external.delete(row.id);external.set(row.id,row);
    while(external.size>500)external.delete(external.keys().next().value);
    if (draining) return;
    draining = true;
    writes = writes.then(async () => {
      await ready;
      while (pending.size) {
        const rows = [...pending.values()]; pending.clear();
        let stat; try { stat = await fs.stat(file); } catch {}
        if (stat?.size > 4 * 1024 * 1024) {
          await fs.rename(file, file + '.previous').catch(e => { if (e.code !== 'ENOENT') throw e; });
        }
        await fs.appendFile(file, rows.map(row=>JSON.stringify(row)).join('\n')+'\n', { mode: 0o600 });
      }
    }).catch(e => log.error('[error-monitor] persistence failed', e.code || 'write_failed')).finally(()=>{draining=false;if(pending.size)persist([...pending.values()][0]);});
  }
  function maybeAlert(row) {
    // Non-actionable client/network errors are still counted but never consume
    // the limited paid-SMS budget or block real download incidents.
    if(!shouldAlert(row)){
      if(row.alertState!=='suppressed'){
        row.alertState='suppressed'; row.alertError='not_actionable';
        persist({ ...row });
      }
      return;
    }
    const at = now(); alertTimes = alertTimes.filter(t => at - t < 3600000);
    // One SMS attempt per incident fingerprint in this runtime; the DB guard
    // blocks replays after process restarts or across Liara instances.
    if (['sent','suppressed','failed','pending'].includes(row.alertState) || activeAlert || (row.alertAttemptAt && at - row.alertAttemptAt < cooldown) || alertTimes.length >= maxAlerts) return;
    row.alertAttemptAt = at; row.alertState = 'pending'; activeAlert = true; alertTimes.push(at); persist({ ...row });
    Promise.resolve().then(() => alert({ ...row })).then(outcome => {
      row.alertState = outcome?.state === 'suppressed' ? 'suppressed' : 'sent';
      row.alertSentAt = now();
      if(outcome?.reason) row.alertError=token(outcome.reason);
    }, e => { row.alertState = 'failed'; row.alertError = token(e?.code || e?.message || 'sms_failed');
      log.error('[error-monitor] SMS failed', row.id, row.alertError);
    }).finally(() => { activeAlert = false; persist({ ...row }); });
  }
  async function record(raw) {
    await ready;
    const data = cleanIncident(raw), at = now();
    // Client supplied IDs cannot select or modify another user's incident.
    let fingerprint = createHash('sha256').update(JSON.stringify([data.source, data.stage, data.code, data.status, data.route, data.labId, data.photographerId])).digest('hex').slice(0, 24);
    const correlated=data.reference&&[...incidents.values()].find(r=>(r.references||[]).includes(data.reference));
    if(correlated)fingerprint=correlated.fingerprint;
    let row = incidents.get(fingerprint);
    if (!row) {
      row = { ...data, ...classifyIncident(data), id: 'PB-' + randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase(), fingerprint, firstAt: at, lastAt: at, count: 0, alertState: 'queued' };
      incidents.delete(fingerprint); incidents.set(fingerprint, row);
    }
    row.lastAt = at; if(!correlated)row.count++;
    if(data.userId)row.userId=data.userId;
    if(data.labId)row.labId=data.labId;
    if(data.photographerId)row.photographerId=data.photographerId;
    row.references = [...new Set([...(row.references||[]),data.reference].filter(Boolean))].slice(-20);
    while (incidents.size > 500) incidents.delete(incidents.keys().next().value);
    persist({ ...row });
    log.error('[PhotoBridge incident]', JSON.stringify({ ...row }));
    maybeAlert(row);
    return row.id;
  }
  async function sync() {
    if (!persistExternal || syncing) return;
    syncing=true;
    try { await ready; for(const [id,row] of [...external]) {await persistExternal(row);if(external.get(id)===row)external.delete(id);} }
    catch(e) { log.error('[error-monitor] database mirror pending', token(e?.code||'database_unavailable')); }
    finally { syncing=false; }
  }
  const mirror=setInterval(()=>{void sync();},15000);mirror.unref?.();
  const retry = setInterval(() => { for (const row of incidents.values()) if (row.alertState === 'queued' && now() - row.lastAt < 86400000) maybeAlert(row); }, 60000);
  retry.unref?.();
  return { record, allow, async list() { await ready; return [...incidents.values()].sort((a,b) => b.lastAt-a.lastAt).slice(0,200).map(r=>({...r})); },
    async flush() { await ready; await writes; }, sync, close() { clearInterval(retry); clearInterval(mirror); } };
}
