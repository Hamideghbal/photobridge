"use strict";
function subscribeLabEvents({ request, getAccount, onEvent, onDisconnect = () => {}, retryMs = 2000 }) {
  let controller = null,
    timer = null,
    epoch = 0,
    stopped = false,
    busy = false,
    again = false;
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
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      try {
        while (current()) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer = (
            buffer + decoder.decode(chunk.value, { stream: true })
          ).replace(/\r\n/g, "\n");
          if (buffer.length > 1000000) throw Error("live_event_buffer_limit");
          let end;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            if (current() && /^data:/m.test(frame))
              void deliver().catch(() => {});
          }
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
    } catch {
    } finally {
      if (!stopped && generation === epoch) {
        onDisconnect();
        timer = setTimeout(connect, retryMs);
        timer.unref?.();
      }
    }
  };
  void connect();
  return {
    stop() {
      stopped = true;
      epoch++;
      clearTimeout(timer);
      controller?.abort();
    },
  };
}
module.exports = { subscribeLabEvents };
