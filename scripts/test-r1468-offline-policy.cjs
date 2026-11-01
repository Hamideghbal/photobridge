const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const mod = () => import("../dist/api/offlineImport.js");
function valid() {
  const deviceId = crypto.randomUUID(),
    id = crypto.randomUUID(),
    customer = crypto.randomUUID(),
    number =
      "OFF-" + deviceId.replace(/-/g, "").toUpperCase() + "-INV-00000001";
  return {
    version: 1,
    origin: "offline",
    documentId: id,
    deviceId,
    reference: number,
    localCustomerId: customer,
    customerId: customer,
    order: null,
    invoices: [
      {
        id,
        number,
        total: 100,
        subtotal: 100,
        issued_at: "2026-10-01T09:00:00Z",
        items: [
          {
            description: "فاکتور مستقل",
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
          },
        ],
      },
    ],
    payments: [],
    expenses: [],
    corrections: [],
    journal: [
      {
        id: crypto.randomUUID(),
        txn_date: "2026-10-01T09:00:00Z",
        reference_type: "invoice",
        reference_id: id,
        debit: 100,
        credit: 100,
        entries: [
          {
            accountKey: "receivable",
            customer_id: customer,
            invoice_id: id,
            debit: 100,
            credit: 0,
          },
          { accountKey: "sales", customer_id: customer, debit: 0, credit: 100 },
        ],
      },
    ],
  };
}
test("offline invoice requires exact namespace, root identity, amounts and matching balanced ledger", async () => {
  const { validateOfflineBundle } = await mod();
  assert(validateOfflineBundle(valid()));
  for (const edit of [
    (p) => (p.deviceId = crypto.randomUUID()),
    (p) => (p.documentId = crypto.randomUUID()),
    (p) => (p.invoices[0].total = 101),
    (p) => (p.invoices[0].items[0].lineTotal = 101),
    (p) => (p.journal[0].entries[0].debit = 99),
    (p) => (p.journal[0].entries[0].customer_id = crypto.randomUUID()),
    (p) => (p.invoices[0].serverId = crypto.randomUUID()),
    (p) => (p.journal[0].id = p.documentId),
    (p) => delete p.journal[0].entries[0].customer_id,
  ]) {
    const p = valid();
    edit(p);
    assert.throws(() => validateOfflineBundle(p));
  }
});
test("offline number projection retains the internal server sequence and never changes online numbers", async () => {
  const { projectOfflineNumbers } = await mod(),
    p = valid();
  const result = projectOfflineNumbers({
    invoices: [
      { number: 700, offline_reference: p.reference },
      { number: 701, offline_reference: null },
    ],
  });
  assert.equal(result.invoices[0].number, p.reference);
  assert.equal(result.invoices[0].server_number, 700);
  assert.equal(result.invoices[1].number, 701);
});
test("offline import capability and writes require the authenticated administrator of the same lab", async () => {
  const { handleOfflineImport } = await mod();
  let status;
  const handled = await handleOfflineImport({
    req: { method: "GET" },
    res: {},
    url: new URL("http://localhost/api/lab/desktop/offline-import"),
    a: { labRole: "customer", labId: "A" },
    labId: "A",
    sendJson: (_res, s) => (status = s),
  });
  assert(handled);
  assert.equal(status, 403);
});

test("committed business responses emit a real SSE frame; errors and reads do not invalidate peers", () => {
  const fs = require("node:fs"),
    vm = require("node:vm"),
    { patchOfflineServer } = require("./r1468-server-patch.cjs"),
    source = patchOfflineServer(fs.readFileSync("dist/api/server.js", "utf8")),
    start = source.indexOf("function sendJson("),
    end = source.indexOf("\nfunction sendText", start),
    frames = [],
    ctx = {
      Buffer,
      projectOfflineNumbers: (x) => x,
      labEventClients: new Map([
        ["A", new Set([{ write: (data) => frames.push(data) }])],
      ]),
    };
  vm.runInNewContext(
    source.slice(start, end) +
      ';sendJson({pbBusinessLab:"A",writeHead(){},end(){}},200,{});sendJson({pbBusinessLab:"A",writeHead(){},end(){}},409,{});sendJson({writeHead(){},end(){}},200,{});',
    ctx,
  );
  assert.deepEqual(frames, ["event: document.changed\ndata: {}\n\n"]);
  assert.equal(patchOfflineServer(source), source);
});
