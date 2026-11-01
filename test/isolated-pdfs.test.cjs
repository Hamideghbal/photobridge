const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  { LabStore } = require("../store.cjs"),
  { LocalBusiness } = require("../local-business.cjs"),
  { applyPolicy } = require("../document-policy.cjs"),
  { uploadOfflinePdfs } = require("../isolated-pdfs.cjs");
test("PDF failure never undoes imported financial facts; retry uploads the same local-number PDF", async () => {
  const store = new LabStore(":memory:");
  store.set("labId", "A");
  store.set("auth", { user: {} });
  applyPolicy(store);
  const engine = new LocalBusiness(store),
    customer = engine.handle(
      "POST",
      "/api/lab/customers",
      { name: "مشتری" },
      crypto.randomUUID(),
      { isolated: true },
    ).customer,
    invoice = engine.handle(
      "POST",
      "/api/lab/invoices/manual",
      {
        customerId: customer.id,
        items: [{ description: "چاپ", unitPrice: 100 }],
      },
      crypto.randomUUID(),
      { isolated: true },
    ).invoice;
  const s = engine.state();
  s.invoices[invoice.id].serverId = crypto.randomUUID();
  s.invoices[invoice.id].sharedAt = new Date().toISOString();
  store.set(engine.key(), s);
  const journal = JSON.stringify(engine.state().journal),
    sent = [];
  let fail = true,
    rendered = 0;
  const request = async (url, o) => {
      sent.push(JSON.parse(o.body).pdfBase64);
      return new Response("{}", { status: fail ? 503 : 200 });
    },
    render = async (html) => {
      rendered++;
      assert(html.includes(invoice.number));
      return Buffer.from("%PDF-exact-offline-reference");
    };
  try {
    await uploadOfflinePdfs(store, request, render);
    assert(engine.state().invoices[invoice.id].pdfSyncError);
    fail = false;
    await uploadOfflinePdfs(store, request, render);
    assert(engine.state().invoices[invoice.id].remotePdfUploaded);
    assert.equal(rendered, 1);
    assert.equal(sent[0], sent[1]);
    assert.equal(JSON.stringify(engine.state().journal), journal);
  } finally {
    store.db.close();
  }
});
