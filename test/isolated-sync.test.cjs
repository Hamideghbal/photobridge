const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  { LabStore } = require("../store.cjs"),
  { LocalBusiness } = require("../local-business.cjs"),
  { applyPolicy, routePolicy } = require("../document-policy.cjs"),
  { syncIsolated } = require("../isolated-sync.cjs");
function fixture() {
  const store = new LabStore(":memory:"),
    customer = crypto.randomUUID();
  store.set("labId", "A");
  store.set("auth", { user: {} });
  store.cache(
    "/api/lab/finance/summary",
    200,
    "application/json",
    Buffer.from(
      JSON.stringify({
        summary: {},
        customers: [{ id: customer, name: "مشتری", balance: 0 }],
      }),
    ).toString("base64"),
  );
  applyPolicy(store);
  const engine = new LocalBusiness(store);
  return {
    store,
    engine,
    customer,
    create: () =>
      engine.handle(
        "POST",
        "/api/lab/invoices/manual",
        {
          customerId: customer,
          issuedAt: "2026-10-01T09:00:00.000Z",
          items: [
            { description: "مبلغ قطعی آفلاین", quantity: 2, unitPrice: 100 },
          ],
        },
        crypto.randomUUID(),
        { isolated: true, offline: true },
      ).invoice,
  };
}
test("lost import reply freezes the exact snapshot; replay imports once and then the document is shared", async () => {
  const f = fixture(),
    invoice = f.create(),
    server = new Map(),
    payloads = [];
  let lost = true;
  const request = async (url, options = {}) => {
    if (!options.method) return Response.json({ version: 1 });
    const p = JSON.parse(options.body);
    payloads.push(options.body);
    let result = server.get(p.documentId);
    if (!result) {
      const id = crypto.randomUUID();
      result = {
        ok: true,
        shared: true,
        documentId: p.documentId,
        reference: p.reference,
        customerId: f.customer,
        maps: { [invoice.id]: id },
        invoices: [{ id, number: 901, total: 200 }],
      };
      server.set(p.documentId, result);
    }
    if (lost) {
      lost = false;
      throw Error("reply_lost");
    }
    return Response.json(result);
  };
  try {
    await syncIsolated(f.store, request);
    assert.equal(server.size, 1);
    assert(f.engine.state().invoices[invoice.id].importFrozen);
    assert.throws(
      () =>
        routePolicy(
          f.store,
          "POST",
          "/api/lab/finance/payments",
          { invoiceId: invoice.id, amount: 1 },
          true,
        ),
      (e) => e.code === "offline_import_pending",
    );
    await syncIsolated(f.store, request);
    assert.equal(server.size, 1);
    assert.equal(payloads[0], payloads[1]);
    assert(!f.engine.state().invoices[invoice.id].importFrozen);
    assert.throws(
      () =>
        routePolicy(
          f.store,
          "POST",
          "/api/lab/finance/payments",
          { invoiceId: invoice.id, amount: 1 },
          true,
        ),
      (e) => e.code === "shared_document_requires_online",
    );
    assert.equal(
      f.engine.read("/api/lab/invoices").invoices[0].number,
      invoice.number,
    );
  } finally {
    f.store.db.close();
  }
});
test("fifty independent offline invoices retain their own dates/prices and are acknowledged individually", async () => {
  const f = fixture();
  try {
    for (let n = 0; n < 50; n++) f.create();
    let count = 0;
    await syncIsolated(f.store, async (url, o = {}) => {
      if (!o.method) return Response.json({ version: 1 });
      const p = JSON.parse(o.body);
      assert.equal(p.invoices[0].total, 200);
      assert.equal(p.invoices[0].issued_at, "2026-10-01T09:00:00.000Z");
      assert.match(p.reference, /^OFF-/);
      count++;
      const remote = crypto.randomUUID();
      return Response.json({
        ok: true,
        shared: true,
        documentId: p.documentId,
        maps: { [p.documentId]: remote },
        customerId: f.customer,
        invoices: [{ id: remote, number: count }],
      });
    });
    assert.equal(count, 50);
    assert(
      Object.values(f.engine.state().invoices).every(
        (i) => i.serverId && i.sharedAt,
      ),
    );
    assert(f.engine.state().events.every((e) => e.state === "synced"));
  } finally {
    f.store.db.close();
  }
});
test("unavailable import capability leaves independent documents editable and never starts a write", async () => {
  const f = fixture(),
    invoice = f.create();
  try {
    await syncIsolated(f.store, async (_url, o) => {
      assert(!o?.method);
      return new Response("{}", { status: 404 });
    });
    assert(!f.engine.state().invoices[invoice.id].importFrozen);
    assert.equal(
      routePolicy(
        f.store,
        "POST",
        "/api/lab/finance/payments",
        { invoiceId: invoice.id },
        true,
      ).kind,
      "local",
    );
  } finally {
    f.store.db.close();
  }
});
test("old pending changes to shared documents are quarantined instead of replayed", () => {
  const f = fixture();
  try {
    f.store.set("documentPolicy:A", 0);
    const s = f.engine.state();
    delete s.documentPolicyVersion;
    const id = crypto.randomUUID();
    s.orders[id] = { id, remote: true, status: "printing" };
    s.events.push({
      id: crypto.randomUUID(),
      kind: "order_status",
      target: id,
      state: "pending",
      body: { status: "ready" },
    });
    f.store.set(f.engine.key(), s);
    applyPolicy(f.store);
    assert.equal(f.engine.state().events.at(-1).state, "conflict");
    assert.equal(
      f.engine.state().events.at(-1).error.code,
      "legacy_policy_review",
    );
  } finally {
    f.store.db.close();
  }
});
