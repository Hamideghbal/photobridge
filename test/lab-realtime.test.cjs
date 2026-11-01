const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { subscribeLabEvents } = require("../lab-realtime.cjs");
const flush = () => new Promise((r) => setImmediate(r));
test("authenticated SSE invalidates immediately, parses split frames and aborts on stop", async () => {
  let controller,
    account = "A",
    events = 0,
    signal;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });
  const sub = subscribeLabEvents({
    getAccount: () => account,
    request: async (url, options) => {
      assert.equal(url, "/api/lab/events");
      assert.equal(options.headers.Accept, "text/event-stream");
      signal = options.signal;
      return new Response(stream);
    },
    onEvent: async () => {
      events++;
    },
    retryMs: 10000,
  });
  try {
    await flush();
    controller.enqueue(
      new TextEncoder().encode("event: document.changed\ndata: {"),
    );
    await flush();
    assert.equal(events, 0);
    controller.enqueue(new TextEncoder().encode("}\n\n"));
    await flush();
    assert.equal(events, 1);
    account = "B";
    controller.enqueue(new TextEncoder().encode("data: {}\n\n"));
    await flush();
    assert.equal(events, 1);
    sub.stop();
    assert(signal.aborted);
  } finally {
    sub.stop();
  }
});
