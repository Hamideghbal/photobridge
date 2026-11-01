"use strict";
async function streamLabEvents({ req, res, store, request, lab }) {
  const controller = new AbortController();
  let reader;
  const close = () => {
    controller.abort();
    void reader?.cancel().catch(() => {});
  };
  res.once("close", close);
  try {
    const up = await request(req.url, {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    });
    if (store.get("labId") !== lab || !store.get("auth")) {
      res.writeHead(401);
      res.end();
      return;
    }
    if (!up.ok || !up.body) {
      res.writeHead(up.status || 503);
      res.end();
      return;
    }
    reader = up.body.getReader();
    if (res.destroyed) {
      await reader.cancel();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
    while (!res.destroyed) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (store.get("labId") !== lab || !store.get("auth")) break;
      if (!res.write(Buffer.from(chunk.value)))
        await new Promise((resolve) => {
          res.once("drain", resolve);
          res.once("close", resolve);
        });
    }
    if (!res.destroyed) res.end();
  } catch {
    if (!res.headersSent) res.writeHead(503);
    if (!res.destroyed) res.end();
  } finally {
    res.removeListener("close", close);
    await reader?.cancel().catch(() => {});
  }
}
module.exports = { streamLabEvents };
