"use strict";
const { LocalBusiness, canonical } = require("./local-business.cjs");
const fail = (code, message, status = 409) =>
  Object.assign(Error(message), { code, status });
const shared = (doc) => !!(doc && (doc.remote || doc.serverId || doc.sharedAt));
function applyPolicy(store) {
  const lab = store.get("labId");
  if (!lab) return;
  store.set("documentPolicy:" + lab, 1);
  const engine = new LocalBusiness(store);
  store.transaction(() => {
    const s = engine.state();
    if (s.documentPolicyVersion === 1) return;
    for (const table of [
      "orders",
      "invoices",
      "payments",
      "expenses",
      "corrections",
      "adjustments",
    ])
      for (const doc of Object.values(s[table])) {
        if (shared(doc))
          doc.sharedAt ||= s.snapshotAt || new Date().toISOString();
        else if (!doc.origin_offline) doc.legacyUnclassified = true;
      }
    for (const event of s.events.filter((e) => e.state !== "synced")) {
      const doc =
        s.orders[event.target] ||
        s.invoices[event.target] ||
        s.payments[event.target] ||
        s.expenses[event.target] ||
        s.corrections[event.target];
      if (!doc?.origin_offline) {
        event.state = "conflict";
        event.error = {
          code: "legacy_policy_review",
          message:
            "این تغییر از نسخهٔ قبلی است؛ قبل از ارسال آنلاین باید بررسی شود.",
        };
      }
    }
    for (const row of store
      .rows()
      .filter(
        (r) =>
          r.state === "pending" &&
          /^\/api\/lab\/(?:orders|order-files|invoices|finance|delegated-orders|delegated-customers|customers)(?:\/|$)/.test(
            canonical(r.url),
          ),
      ))
      store.conflict(row.id, {
        error: "legacy_policy_review",
        message:
          "تغییر معلق نسخهٔ قبلی؛ ارسال خودکار متوقف شد تا با سایت بررسی شود.",
      });
    s.documentPolicyVersion = 1;
    store.set(engine.key(), s);
  });
}
function targetFor(s, p, b) {
  const match = p.match(
    /^\/api\/lab\/(orders|delegated-orders|invoices|order-files)\/([^/]+)/,
  );
  if (match) {
    const tables = match[1] === "invoices" ? ["invoices"] : ["orders"];
    if (match[1] === "order-files")
      return Object.values(s.orders).find((o) =>
        o.files?.some((f) => f.id === match[2] || f.serverId === match[2]),
      );
    for (const table of tables) {
      const doc = Object.values(s[table]).find(
        (d) => d.id === match[2] || d.serverId === match[2],
      );
      if (doc) return doc;
    }
  }
  if (p === "/api/lab/finance/payments")
    return (
      s.invoices[b.invoiceId] ||
      Object.values(s.invoices).find((i) => i.serverId === b.invoiceId)
    );
  if (p === "/api/lab/finance/corrections") {
    const table = {
      invoice: "invoices",
      payment: "payments",
      expense: "expenses",
    }[b.targetType];
    return table && s[table][b.targetId];
  }
  return null;
}
function routePolicy(store, method, url, b, offline) {
  const p = canonical(url);
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return { kind: "read" };
  const s = new LocalBusiness(store).state(),
    target = targetFor(s, p, b);
  const creation = [
    "/api/lab/delegated-orders",
    "/api/lab/invoices/manual",
    "/api/lab/finance/expenses",
    "/api/lab/delegated-customers",
    "/api/lab/customers",
  ].includes(p);
  if(target?.legacyUnclassified)throw fail('legacy_policy_review','این سند از نسخهٔ قبلی باقی مانده است و پیش از هر تغییر باید با سایت تطبیق داده شود.');
  if (target?.importFrozen)
    throw fail(
      "offline_import_pending",
      "نتیجهٔ انتقال این سند هنوز مشخص نیست. برای جلوگیری از دو نسخه‌شدن، تا بررسی آنلاین فقط مشاهده و چاپ مجاز است.",
    );
  const exclusive =
    target?.origin_offline && !shared(target) && !target.legacyUnclassified;
  if (exclusive || (offline && creation)) {
    if (
      (p.includes("customers") && Number(b.initialDebt || 0)) ||
      (p === "/api/lab/finance/payments" && !b.invoiceId)
    )
      throw fail(
        "shared_account_requires_online",
        "تغییر ماندهٔ مشترک حساب به اتصال آنلاین نیاز دارد.",
      );
    return { kind: "local", target };
  }
  if (offline)
    throw fail(
      "shared_document_requires_online",
      "این سند با سایت مشترک است؛ در حالت آفلاین فقط مشاهده و چاپ مجاز است. ادامهٔ کار پس از اتصال انجام می‌شود.",
    );
  return { kind: "remote", target };
}
function remoteRequest(store, url, body, target) {
  const s = new LocalBusiness(store).state(),
    maps = new Map();
  for (const table of [
    "orders",
    "invoices",
    "customers",
    "payments",
    "expenses",
    "corrections",
  ])
    for (const d of Object.values(s[table])) {
      if (d.serverId) maps.set(d.id, d.serverId);
      for (const f of d.files || []) if (f.serverId) maps.set(f.id, f.serverId);
    }
  const u = new URL(url, "http://localhost");
  // The verified native intake UI appends '/download' to distinguish
  // local device requests. It is ONLY a desktop-host routing alias: the
  // Liara API has no corresponding routes. Canonicalize the narrow
  // intake/detail aliases before forwarding online. Do not rewrite
  // legitimate /api/lab/order-files/:id/download routes.
  const nativeIntakeAlias =
    /^\/api\/lab\/delegated-orders\/(?:download|[0-9a-f-]{36}\/(?:files\/presign|submit)\/download)$/i.test(u.pathname) ||
    /^\/api\/lab\/orders\/[0-9a-f-]{36}\/download$/i.test(u.pathname);
  if (nativeIntakeAlias) u.pathname = u.pathname.slice(0, -'/download'.length);
  u.pathname = u.pathname
    .split("/")
    .map((x) => maps.get(x) || x)
    .join("/");
  const b = { ...body };
  for (const key of ["customerId", "invoiceId", "targetId", "orderId"])
    if (maps.has(b[key])) b[key] = maps.get(b[key]);
  if (/^\/api\/lab\/orders\//.test(u.pathname)) {
    if (b.expectedUpdatedAt==null&&target?.updated_at) b.expectedUpdatedAt = target.updated_at;
    if (b.expectedRevision==null&&target?.document_revision != null)
      b.expectedRevision = target.document_revision;
  }
  return { url: u.pathname + u.search, body: b };
}
module.exports = { applyPolicy, routePolicy, remoteRequest, shared };
