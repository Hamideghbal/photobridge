"use strict";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NEW_ORDER_EVENTS=new Set(['order_submitted','order_created','order_received','new_order','photo_order_created','photo_order_submitted']);
// A trusted authenticated lab SSE frame may contain the exact new order UUID.
// Extract only a fresh order event for the connected lab; all other frames
// continue through the original notification/sync fallback.
function parseFreshOrderId(frame,account,now=Date.now()){
 try{
  const data=frame.split(/\n/).filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trimStart()).join('\n');
  if(!data||data.length>10000)return null;
  const obj=JSON.parse(data);if(!obj||typeof obj!=='object')return null;
  const eventLine=frame.split(/\n/).find(x=>x.startsWith('event:'))||'';
  const type=String(obj.event_key||obj.eventKey||obj.type||obj.event||eventLine.slice(6).trim()).toLowerCase();
  if(!NEW_ORDER_EVENTS.has(type))return null;
  const lab=String(obj.lab_id||obj.labId||obj.lab?.id||'');
  if(lab&&lab!==String(account))return null;
  const id=String(obj.order_id||obj.orderId||obj.order?.id||'');
  if(!UUID.test(id))return null;
  const at=Date.parse(obj.created_at||obj.createdAt||'');
  if(Number.isFinite(at)&&(now-at>10*60*1000||at-now>2*60*1000))return null;
  return id;
 }catch{return null}
}
function subscribeLabEvents({ request, getAccount, onEvent, onOrderId = () => {}, onDisconnect = () => {}, retryMs = 2000, now = Date.now }) {
  let controller = null,
    timer = null,
    epoch = 0,
    stopped = false,
    busy = false,
    again = false,
    connectedAt = null,
    lastActivity = null,
    retryDelay = retryMs;
  const deliver = async () => {
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    try {
      do {
        again = false;
        await onEvent();
      } while (again && !stopped);
    } finally {
      busy = false;
    }
  };
  const connect = async () => {
    if (stopped) return;
    const account = getAccount(),
      generation = epoch;
    if (!account) {
      timer = setTimeout(connect, retryMs);
      timer.unref?.();
      return;
    }
    controller = new AbortController();
    const current = () =>
      !stopped && generation === epoch && getAccount() === account;
    try {
      const response = await request("/api/lab/events", {
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (!response.ok || !response.body)
        throw Error("live_events_unavailable");
      if (!current()) return;
      connectedAt = lastActivity = now();
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      try {
        while (current()) {
          const chunk = await reader.read();
          if (chunk.done) break;
          lastActivity = now();
          buffer = (
            buffer + decoder.decode(chunk.value, { stream: true })
          ).replace(/\r\n/g, "\n");
          if (buffer.length > 1000000) throw Error("live_event_buffer_limit");
          let end;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            if (current() && /^data:/m.test(frame)) {
              const id=parseFreshOrderId(frame,account);
              if(id)try{onOrderId(id,account)}catch{/* safe fallback below */}
              void deliver().catch(() => {});
            }
          }
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
    } catch {
    } finally {
      if (!stopped && generation === epoch) {
        if (connectedAt !== null && now() - connectedAt >= 30000) retryDelay = retryMs;
        connectedAt = lastActivity = null;
        onDisconnect();
        timer = setTimeout(connect, retryDelay);
        retryDelay = Math.max(retryMs, Math.min(retryDelay * 2, 60000));
        timer.unref?.();
      }
    }
  };
  void connect();
  return {
    isHealthy: () => !stopped && lastActivity !== null && now() - lastActivity <= 45000,
    stop() {
      stopped = true;
      epoch++;
      clearTimeout(timer);
      controller?.abort();
    },
  };
}
module.exports = { subscribeLabEvents, parseFreshOrderId };
