"use strict";
const crypto = require("node:crypto"),
  { LocalBusiness } = require("./local-business.cjs");
const batchKey = (lab, id) => "offlineImport:v1:" + lab + ":" + id;
function packageFor(store, root) {
  const engine = new LocalBusiness(store),
    s = engine.state(),
    order = root.type === "order" ? s.orders[root.id] : null,
    invoice =
      root.type === "invoice"
        ? s.invoices[root.id]
        : order
          ? Object.values(s.invoices).find((i) => i.order_id === order.id)
          : null,
    expense = root.type === "expense" ? s.expenses[root.id] : null,
    customer = s.customers[order?.customer_id || invoice?.customer_id];
  const invoices = invoice ? [structuredClone(invoice)] : [],
    payments = invoice
      ? Object.values(s.payments).filter((p) => p.invoice_id === invoice.id)
      : [],
    expenses = expense ? [expense] : [],
    ids = new Set([...invoices, ...payments, ...expenses].map((d) => d.id));
  let corrections = Object.values(s.corrections).filter((c) =>
    ids.has(c.target_id),
  );
  for (const c of corrections) ids.add(c.id);
  const journal = s.journal.filter((t) => ids.has(t.reference_id));
  let orderPayload = null;
  if (order) {
    orderPayload = structuredClone(order);
    delete orderPayload.localFiles;
    delete orderPayload.proforma;
    orderPayload.files = order.files.map((f, index) => ({
      ...f,
      sha256: order.localFiles?.[index]?.sha256,
    }));
  }
  return {
    version: 1,
    origin: "offline",
    documentId: root.id,
    deviceId: store.get("deviceId"),
    reference: order?.number || invoice?.number || expense?.number,
    localCustomerId: customer?.id || null,
    customerProfile: customer
      ? { name: customer.name, mobile: customer.mobile || "" }
      : null,
    customerId: customer?.serverId || (customer?.remote ? customer.id : null),
    order: orderPayload,
    invoices,
    payments: structuredClone(payments),
    expenses: structuredClone(expenses),
    corrections: structuredClone(corrections),
    journal: structuredClone(journal),
  };
}
function rootsFor(s) {
  return [
    ...Object.values(s.orders)
      .filter(
        (o) =>
          o.origin_offline &&
          !o.serverId &&
          !o.remote &&
          !o.legacyUnclassified &&
          o.status !== "uploading",
      )
      .map((o) => ({ type: "order", id: o.id })),
    ...Object.values(s.invoices)
      .filter(
        (i) => i.origin_offline && !i.serverId && !i.remote && !i.order_id,
      )
      .map((i) => ({ type: "invoice", id: i.id })),
    ...Object.values(s.expenses)
      .filter((e) => e.origin_offline && !e.serverId && !e.remote)
      .map((e) => ({ type: "expense", id: e.id })),
  ];
}
async function syncIsolated(store, request, verifyFiles) {
  const engine = new LocalBusiness(store),
    lab = store.get("labId");
  if (!store.get(engine.key())) return { sent: 0 };
  const roots = rootsFor(engine.state());
  if (!roots.length) return { sent: 0 };
  const same = () => {
    if (store.get("labId") !== lab || !store.get("auth"))
      throw Error("account_changed");
  };
  const update = (fn) => {
    same();
    return store.transaction(() => {
      const s = engine.state(),
        result = fn(s);
      store.set(engine.key(), s);
      return result;
    });
  };
  const capability = await request("/api/lab/desktop/offline-import");
  same();
  if (!capability.ok || (await capability.json()).version !== 1)
    return { sent: 0, error: "offline_import_server_update_required" };
  let sent = 0;
  for (const root of roots) {
    try {
      let batch = store.get(batchKey(lab, root.id));
      if (!batch) {
        let payload = packageFor(store, root);
        if (
          !payload.customerId &&
          payload.localCustomerId &&
          /^09\d{9}$/.test(
            engine.state().customers[payload.localCustomerId]?.mobile || "",
          )
        ) {
          const customer = engine.state().customers[payload.localCustomerId];
          if (!/^09\d{9}$/.test(customer?.mobile || ""))
            throw Error("offline_customer_mobile_required");
          const response = await request("/api/lab/delegated-customers", {
            method: "POST",
            body: JSON.stringify({
              name: customer.name,
              mobile: customer.mobile,
              sendInvitation: false,
            }),
          });
          const result = await response.json();
          same();
          if (!response.ok || !result.customer?.id)
            throw Error("offline_customer_registration_failed");
          update((s) => {
            s.customers[customer.id].serverId = result.customer.id;
          });
          payload = packageFor(store, root);
        }
        const fingerprint = JSON.stringify(payload);
        if (payload.order) {
          if (!verifyFiles) throw Error("offline_files_not_verified");
          await verifyFiles(engine.state().orders[root.id].localFiles || []);
          same();
        }
        if (JSON.stringify(packageFor(store, root)) !== fingerprint) continue;
        batch = { root, payload, createdAt: new Date().toISOString() };
        update((s) => {
          const ids = new Set(
            [
              root.id,
              ...payload.invoices,
              ...payload.payments,
              ...payload.expenses,
              ...payload.corrections,
            ].map((d) => (typeof d === "string" ? d : d.id)),
          );
          for (const table of [
            "orders",
            "invoices",
            "payments",
            "expenses",
            "corrections",
          ])
            for (const doc of Object.values(s[table]))
              if (ids.has(doc.id)) doc.importFrozen = root.id;
          store.set(batchKey(lab, root.id), batch);
        });
      }
      const response = await request("/api/lab/desktop/offline-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch.payload),
      });
      const result = await response.json();
      same();
      if (!response.ok || !result.shared || result.documentId !== root.id)
        throw Error(result.error || "offline_import_unconfirmed");
      update((s) => {
        const affected = new Set([root.id, ...Object.keys(result.maps || {})]),
          time = new Date().toISOString();
        for (const table of [
          "orders",
          "invoices",
          "payments",
          "expenses",
          "corrections",
        ])
          for (const doc of Object.values(s[table]))
            if (result.maps?.[doc.id]) {
              doc.serverId = result.maps[doc.id];
              doc.sharedAt = time;
              delete doc.importFrozen;
              delete doc.importError;
              for (const file of doc.files || [])
                if (result.maps[file.id]) file.serverId = result.maps[file.id];
            }
        if (root.type === "order" && result.order) {
          s.orders[root.id].serverNumber =
            result.order.server_number || result.order.number;
          s.orders[root.id].updated_at = result.order.updated_at;
          s.orders[root.id].document_revision = result.order.document_revision;
        }
        for (const remote of result.invoices || []) {
          const local = Object.values(s.invoices).find(
            (i) => i.serverId === remote.id,
          );
          if (local) local.serverNumber = remote.server_number || remote.number;
        }
        for (const event of s.events)
          if (
            affected.has(event.target) ||
            affected.has(event.body?.invoiceId)
          ) {
            event.state = "synced";
            event.syncedAt = time;
            delete event.error;
          }
        if (batch.payload.localCustomerId) {
          if (result.customerId)
            s.customers[batch.payload.localCustomerId].serverId =
              result.customerId;
          for (const event of s.events)
            if (
              event.kind === "customer_create" &&
              event.target === batch.payload.localCustomerId
            ) {
              event.state = "synced";
              delete event.error;
            }
        }
        store.set(batchKey(lab, root.id), {
          ...batch,
          result,
          completedAt: time,
        });
      });
      sent++;
    } catch (error) {
      same();
      update((s) => {
        const doc =
          s.orders[root.id] || s.invoices[root.id] || s.expenses[root.id];
        if (doc) doc.importError = { code: error.code || error.message };
      });
    }
  }
  return { sent };
}
module.exports = { syncIsolated, packageFor, rootsFor };
