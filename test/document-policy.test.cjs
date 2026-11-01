const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  { LabStore } = require("../store.cjs"),
  { LocalBusiness } = require("../local-business.cjs"),
  {
    applyPolicy,
    routePolicy,
    remoteRequest,
  } = require("../document-policy.cjs");
function fixture() {
  const store = new LabStore(":memory:");
  store.set("labId", "A");
  store.set("auth", { user: {} });
  applyPolicy(store);
  return { store, engine: new LocalBusiness(store) };
}
test("shared orders are read-only offline and mapped online writes carry the observed server version", () => {
  const f = fixture(),
    id = crypto.randomUUID(),
    remote = crypto.randomUUID();
  try {
    const s = f.engine.state();
    s.orders[id] = {
      id,
      serverId: remote,
      remote: false,
      document_revision: 7,
      updated_at: "2026-11-01T09:00:00Z",
    };
    f.store.set(f.engine.key(), s);
    assert.throws(
      () =>
        routePolicy(
          f.store,
          "PATCH",
          "/api/lab/orders/" + id,
          { status: "ready" },
          true,
        ),
      (e) => e.code === "shared_document_requires_online",
    );
    const decision = routePolicy(
        f.store,
        "PATCH",
        "/api/lab/orders/" + id,
        { status: "ready" },
        false,
      ),
      forward = remoteRequest(
        f.store,
        "/api/lab/orders/" + id,
        { status: "ready" },
        decision.target,
      );
    assert.equal(decision.kind, "remote");
    assert.equal(forward.url, "/api/lab/orders/" + remote);
    assert.equal(forward.body.expectedUpdatedAt, s.orders[id].updated_at);
    assert.equal(forward.body.expectedRevision, 7);
    assert.equal(
      routePolicy(f.store, "GET", "/api/lab/orders/" + id, {}, true).kind,
      "read",
    );
  } finally {
    f.store.db.close();
  }
});
test("offline financial adjustments cannot change the shared customer balance", () => {
  const f = fixture();
  try {
    for (const url of [
      "/api/lab/finance/customer-settings",
      "/api/lab/finance/customer-adjustments",
      "/api/lab/finance/corrections",
    ])
      assert.throws(
        () =>
          routePolicy(
            f.store,
            "POST",
            url,
            { customerId: crypto.randomUUID(), targetId: crypto.randomUUID() },
            true,
          ),
        (e) => e.code === "shared_document_requires_online",
      );
    assert.throws(
      () =>
        routePolicy(
          f.store,
          "POST",
          "/api/lab/delegated-customers",
          { name: "مشتری", initialDebt: 100 },
          true,
        ),
      (e) => e.code === "shared_account_requires_online",
    );
  } finally {
    f.store.db.close();
  }
});
test("legacy outbox is retained for review, never automatically reclassified as a new independent document", () => {
  const f = fixture();
  try {
    const row = f.store.enqueue(
      "PATCH",
      "/api/lab/orders/" + crypto.randomUUID(),
      { status: "ready" },
    );
    const s = f.engine.state();
    delete s.documentPolicyVersion;
    f.store.set(f.engine.key(), s);
    applyPolicy(f.store);
    const saved = f.store.rows().find((r) => r.id === row.id);
    assert.equal(saved.state, "conflict");
    assert.equal(saved.error.error, "legacy_policy_review");
  } finally {
    f.store.db.close();
  }
});
