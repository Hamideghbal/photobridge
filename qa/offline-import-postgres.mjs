// Execute with PGLITE_MODULE pointing to a separately installed @electric-sql/pglite module.
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import {
  importOfflineBundle,
  validateOfflineBundle,
  projectOfflineNumbers,
} from "../dist/api/offlineImport.js";
const { PGlite } = await import(
  process.env.PGLITE_MODULE || "@electric-sql/pglite"
);
const pg = new PGlite();
const lab = crypto.randomUUID(),
  otherLab = crypto.randomUUID(),
  customer = crypto.randomUUID(),
  actor = crypto.randomUUID(),
  device = crypto.randomUUID(),
  prefix = "OFF-" + device.replace(/-/g, "").toUpperCase();
await pg.exec(`CREATE TABLE labs(id uuid PRIMARY KEY,active boolean,suspended boolean,active_from timestamptz,active_until timestamptz);CREATE TABLE users(id uuid PRIMARY KEY,name text,mobile text UNIQUE,password_hash text,platform_role text,active boolean);CREATE TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean);CREATE TABLE print_sizes(id text PRIMARY KEY);
CREATE TABLE orders(id uuid PRIMARY KEY,number bigserial,lab_id uuid,customer_id uuid,mode text,status text,delivery text,priority text,album_data jsonb,total bigint,source text,settlement_mode text,payment_status text,invoice_required boolean,created_at timestamptz,updated_at timestamptz,downloaded_at timestamptz,printed_at timestamptz,walkin_customer_name text,walkin_customer_mobile text);
CREATE TABLE order_files(id uuid PRIMARY KEY,order_id uuid,lab_id uuid,customer_id uuid,original_name text,object_key text UNIQUE,content_type text,bytes bigint,width integer,height integer,print_size_id text REFERENCES print_sizes(id),print_type text,print_copies integer,chassis boolean,frame boolean,original_state text);
CREATE TABLE order_status_events(order_id uuid,lab_id uuid,customer_id uuid,status text,note text,actor_id uuid,created_at timestamptz);
CREATE TABLE invoices(id uuid PRIMARY KEY,number bigserial,lab_id uuid,customer_id uuid,order_id uuid UNIQUE REFERENCES orders(id),items jsonb,subtotal bigint,total bigint,issued_at timestamptz,pdf_ready boolean,account_balance_at_issue bigint);
CREATE TABLE finance_transactions(id uuid PRIMARY KEY,lab_id uuid,reference_type text,reference_id uuid,txn_date timestamptz);
CREATE TABLE finance_accounts(id uuid PRIMARY KEY,lab_id uuid,system_key text,UNIQUE(lab_id,system_key));
CREATE TABLE finance_entries(transaction_id uuid REFERENCES finance_transactions(id),account_id uuid REFERENCES finance_accounts(id),customer_id uuid,invoice_id uuid,debit bigint,credit bigint);
CREATE TABLE finance_payments(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid,invoice_id uuid REFERENCES invoices(id),amount bigint,method text,note text,paid_at timestamptz,created_by uuid,transaction_id uuid REFERENCES finance_transactions(id));
CREATE TABLE finance_expenses(id uuid PRIMARY KEY,lab_id uuid,category text,payee text,amount bigint,method text,note text,spent_at timestamptz,created_by uuid,transaction_id uuid REFERENCES finance_transactions(id));
CREATE TABLE finance_corrections(id uuid PRIMARY KEY,lab_id uuid,target_type text,target_id uuid,correction_kind text,amount bigint,old_value jsonb,new_value jsonb,note text,created_by uuid,created_at timestamptz,transaction_id uuid REFERENCES finance_transactions(id));`);
await pg.exec(
  await fs.readFile(
    new URL("../migrations/194_lab_offline_documents.sql", import.meta.url),
    "utf8",
  ),
);
const query = async (sql, params) => {
    const r = await pg.query(sql, params);
    return { ...r, rowCount: r.rows.length || r.affectedRows || 0 };
  },
  pool = { connect: async () => ({ query, release() {} }) };
for (const id of [lab, otherLab])
  await query("INSERT INTO labs(id,active,suspended) VALUES($1,true,false)", [
    id,
  ]);
await query("INSERT INTO users(id) VALUES($1),($2)", [customer, actor]);
await query("INSERT INTO lab_memberships VALUES($1,$2,'customer',true)", [
  lab,
  customer,
]);
let postCalls = 0;
const post = async (c, args) => {
  postCalls++;
  const id = crypto.randomUUID();
  await c.query("INSERT INTO finance_transactions VALUES($1,$2,$3,$4,$5)", [
    id,
    args.labId,
    args.referenceType,
    args.referenceId,
    args.txnDate,
  ]);
  for (const e of args.lines) {
    await c.query(
      "INSERT INTO finance_accounts VALUES($1,$2,$3) ON CONFLICT(lab_id,system_key) DO NOTHING",
      [crypto.randomUUID(), args.labId, e.accountKey],
    );
    const a = (
      await c.query(
        "SELECT id FROM finance_accounts WHERE lab_id=$1 AND system_key=$2",
        [args.labId, e.accountKey],
      )
    ).rows[0];
    await c.query("INSERT INTO finance_entries VALUES($1,$2,$3,$4,$5,$6)", [
      id,
      a.id,
      e.customerId,
      e.invoiceId,
      e.debit,
      e.credit,
    ]);
  }
  return id;
};
function bundle(n = 1) {
  const id = crypto.randomUUID(),
    stamp = "2026-10-01T09:00:00.000Z",
    reference = prefix + "-INV-" + String(n).padStart(8, "0"),
    txn = crypto.randomUUID();
  return {
    version: 1,
    origin: "offline",
    documentId: id,
    deviceId: device,
    reference,
    customerId: customer,
    localCustomerId: customer,
    order: null,
    invoices: [
      {
        id,
        number: reference,
        customer_id: customer,
        items: [
          {
            description: "قیمت ثبت‌شده در آفلاین",
            quantity: 2,
            unitPrice: 100,
            lineTotal: 200,
          },
        ],
        subtotal: 200,
        total: 200,
        issued_at: stamp,
      },
    ],
    payments: [],
    expenses: [],
    corrections: [],
    journal: [
      {
        id: txn,
        txn_date: stamp,
        description: "فاکتور آفلاین",
        reference_type: "invoice",
        reference_id: id,
        debit: 200,
        credit: 200,
        entries: [
          {
            accountKey: "receivable",
            customer_id: customer,
            invoice_id: id,
            debit: 200,
            credit: 0,
          },
          { accountKey: "sales", customer_id: customer, debit: 0, credit: 200 },
        ],
      },
    ],
  };
}
const invoke = (payload, options = {}) =>
  importOfflineBundle({
    pool,
    labId: lab,
    actorId: actor,
    deviceId: device,
    payload,
    postTransaction: post,
    authorizePrimary: async () => true,
    ...options,
  });
try {
  const first = bundle(),
    result = await invoke(first);
  assert.equal(result.invoices[0].total, 200);
  assert.equal(
    projectOfflineNumbers(result).invoices[0].number,
    first.reference,
  );
  await invoke(first);
  assert.equal(postCalls, 1);
  assert.equal(
    (await query("SELECT count(*)::int n FROM invoices")).rows[0].n,
    1,
  );
  const changed = structuredClone(first);
  changed.invoices[0].note = "different";
  await assert.rejects(
    invoke(changed),
    (e) => e.code === "offline_import_payload_changed",
  );
  const version1 = await query(
    "UPDATE orders SET status=status WHERE id=$1 RETURNING document_revision",
    [result.order.id],
  );
  assert.equal(Number(version1.rows[0].document_revision), 1);
  const version2 = await query(
    "UPDATE orders SET document_revision=999 WHERE id=$1 RETURNING document_revision",
    [result.order.id],
  );
  assert.equal(Number(version2.rows[0].document_revision), 2);
  const failed = bundle(2);
  await assert.rejects(
    invoke(failed, {
      postTransaction: async () => {
        throw Error("injected_failure");
      },
    }),
  );
  assert.equal(
    (await query("SELECT count(*)::int n FROM orders")).rows[0].n,
    1,
  );
  assert.equal(
    (await query("SELECT count(*)::int n FROM lab_offline_imports")).rows[0].n,
    1,
  );
  await assert.rejects(
    invoke(bundle(2), { labId: otherLab }),
    (e) => e.code === "offline_customer_not_in_lab",
  );
  await assert.rejects(
    invoke(bundle(2), { deviceId: crypto.randomUUID() }),
    (e) => e.code === "offline_device_mismatch",
  );
  for (let n = 2; n <= 50; n++) await invoke(bundle(n));
  assert.equal(
    (await query("SELECT count(*)::int n FROM invoices")).rows[0].n,
    50,
  );
  assert.equal(
    (await query("SELECT sum(total)::int total FROM invoices")).rows[0].total,
    10000,
  );
  assert.equal(
    (await query("SELECT sum(debit-credit)::int balance FROM finance_entries"))
      .rows[0].balance,
    0,
  );
  const invalid = bundle(51);
  invalid.invoices[0].total = 201;
  assert.throws(() => validateOfflineBundle(invalid));
  const walkin = bundle(51);
  walkin.customerId = null;
  walkin.customerProfile = { name: "مشتری بدون شماره", mobile: "" };
  walkin.localCustomerId = customer;
  const importedWalkin = await invoke(walkin, {
    hashPassword: () => "test-hash",
  });
  assert(importedWalkin.customerId);
  const againWalkin = bundle(52);
  againWalkin.customerId = null;
  againWalkin.customerProfile = walkin.customerProfile;
  againWalkin.localCustomerId = customer;
  const secondWalkin = await invoke(againWalkin, {
    hashPassword: () => {
      throw Error("must_reuse_customer");
    },
  });
  assert.equal(secondWalkin.customerId, importedWalkin.customerId);
  if (process.env.DESKTOP_SOURCE_DIR) {
    const require = createRequire(import.meta.url),
      base = process.env.DESKTOP_SOURCE_DIR,
      { LabStore } = require(base + "/store.cjs"),
      { LocalBusiness } = require(base + "/local-business.cjs"),
      { applyPolicy } = require(base + "/document-policy.cjs"),
      { packageFor } = require(base + "/isolated-sync.cjs"),
      store = new LabStore(":memory:");
    try {
      store.set("labId", lab);
      store.set("auth", { user: {} });
      const cache = (url, data) =>
        store.cache(
          url,
          200,
          "application/json",
          Buffer.from(JSON.stringify(data)).toString("base64"),
        );
      cache("/api/lab/finance/summary", {
        summary: {},
        customers: [{ id: customer, name: "مشتری آزمایشی", balance: 0 }],
      });
      cache("/api/lab/delegated-orders/bootstrap", {
        printSizes: [{ id: "qa-size", label: "۲۰×۳۰", luster: 100 }],
      });
      await query("INSERT INTO print_sizes VALUES('qa-size')");
      applyPolicy(store);
      const engine = new LocalBusiness(store),
        orderId = crypto.randomUUID(),
        fileId = crypto.randomUUID(),
        local = (method, url, body) =>
          engine.handle(method, url, body, crypto.randomUUID(), {
            isolated: true,
            offline: true,
          });
      local("POST", "/api/lab/delegated-orders", {
        localOnly: true,
        clientOrderId: orderId,
        customerId: customer,
        mode: "print",
      });
      local("POST", "/api/lab/delegated-orders/" + orderId + "/files/presign", {
        localOnly: true,
        clientFileId: fileId,
        name: "photo.jpg",
        bytes: 9,
        printSizeId: "qa-size",
        printType: "luster",
        printCopies: 2,
      });
      local("POST", "/api/lab/delegated-orders/" + orderId + "/submit", {
        desktopLocalFiles: [
          {
            rootId: "root",
            parts: ["photo.jpg"],
            bytes: 9,
            sha256: "a".repeat(64),
          },
        ],
      });
      const inv = local("PATCH", "/api/lab/orders/" + orderId, {
          status: "ready",
        }).invoice,
        pay = local("POST", "/api/lab/finance/payments", {
          invoiceId: inv.id,
          amount: 50,
          method: "cash",
        }).payment;
      local("POST", "/api/lab/finance/corrections", {
        targetType: "payment",
        targetId: pay.id,
        newAmount: 80,
        newMethod: "cash",
        note: "اصلاح مبلغ",
      });
      local("POST", "/api/lab/finance/corrections", {
        targetType: "invoice",
        targetId: inv.id,
        amount: 20,
        direction: "decrease",
        note: "اصلاح فاکتور",
      });
      local("PATCH", "/api/lab/orders/" + orderId, { status: "completed" });
      const payload = packageFor(store, { type: "order", id: orderId }),
        actual = await invoke(payload, { deviceId: store.get("deviceId") });
      assert.equal(actual.invoices[0].total, 200);
      assert.equal(actual.order.status, "completed");
      assert.equal(
        (
          await query(
            "SELECT amount FROM finance_payments WHERE invoice_id=$1",
            [actual.invoices[0].id],
          )
        ).rows[0].amount,
        80,
      );
      assert.equal(
        (
          await query(
            "SELECT count(*)::int n FROM finance_corrections WHERE target_id=$1",
            [actual.invoices[0].id],
          )
        ).rows[0].n,
        1,
      );
      console.log(
        "PASS: actual desktop order + final invoice + receipt correction + invoice correction imported into PostgreSQL with exact final balances.",
      );
    } finally {
      store.db.close();
    }
  }
  console.log(
    "PASS: PostgreSQL-compatible atomic import, exact historical prices/date/reference, replay, rollback, lab/device isolation and 50 independent offline invoices.",
  );
} finally {
  await pg.close();
}
