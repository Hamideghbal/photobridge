import crypto from "node:crypto";
const uuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
const fail = (code, status = 400) =>
  Object.assign(Error(code), { code, status });
const integer = (v, zero = false) => {
  if (!Number.isSafeInteger(v) || v < (zero ? 0 : 1) || v > 9e12)
    throw fail("invalid_offline_amount");
  return v;
};
const at = (v) => {
  if (typeof v !== "string" || !Number.isFinite(Date.parse(v)))
    throw fail("invalid_offline_date");
  return v;
};
const money = (method) =>
  ["card", "transfer", "cheque"].includes(method) ? "bank" : "cash";
const hash = (p) =>
  crypto.createHash("sha256").update(JSON.stringify(p)).digest("hex");
export function validateOfflineBundle(p) {
  if (
    !p ||
    p.version !== 1 ||
    !uuid(p.documentId) ||
    !uuid(p.deviceId) ||
    p.origin !== "offline"
  )
    throw fail("invalid_offline_bundle");
  const prefix = "OFF-" + p.deviceId.replace(/-/g, "").toUpperCase() + "-";
  const reference = (v) => {
    if (
      typeof v !== "string" ||
      !v.startsWith(prefix) ||
      !/^OFF-[A-F0-9]{32}-(ORD|INV|EXP|PAY|COR)-\d{8,}$/.test(v)
    )
      throw fail("invalid_offline_reference");
  };
  reference(p.reference);
  const root = p.order || p.invoices?.[0] || p.expenses?.[0];
  if (!root || root.id !== p.documentId || root.number !== p.reference)
    throw fail("offline_root_identity_mismatch");
  for (const name of [
    "invoices",
    "payments",
    "expenses",
    "corrections",
    "journal",
  ])
    if (!Array.isArray(p[name]) || p[name].length > 1000)
      throw fail("invalid_offline_document_count");
  if (
    p.invoices.length > 1 ||
    p.expenses.length > 1 ||
    (p.invoices.length && p.expenses.length) ||
    (!p.order && !p.invoices.length && !p.expenses.length)
  )
    throw fail("invalid_offline_root");
  const ids = new Set(),
    docs = new Map(),
    add = (type, d) => {
      if (!d || !uuid(d.id) || ids.has(d.id) || d.serverId || d.remote)
        throw fail("invalid_offline_document");
      ids.add(d.id);
      docs.set(type + ":" + d.id, d);
    };
  if (p.order) {
    add("order", p.order);
    reference(p.order.number);
    if (
      !["print", "album"].includes(p.order.mode) ||
      ![
        "downloaded",
        "printing",
        "reviewing",
        "needs_fix",
        "ready_print",
        "printed",
        "ready",
        "completed",
        "cancelled",
        "files_received",
        "binding",
      ].includes(p.order.status)
    )
      throw fail("invalid_offline_order");
    at(p.order.created_at);
    if (
      !Array.isArray(p.order.files) ||
      !p.order.files.length ||
      p.order.files.length > 1000
    )
      throw fail("invalid_offline_files");
    for (const f of p.order.files) {
      add("file", f);
      if (
        typeof f.original_name !== "string" ||
        !f.original_name ||
        /[\\/\0]/.test(f.original_name) ||
        f.original_name.length > 240
      )
        throw fail("invalid_offline_filename");
      integer(f.bytes);
      if (!/^[a-f0-9]{64}$/i.test(f.sha256 || ""))
        throw fail("offline_file_proof_missing");
      integer(f.print_copies || 1);
    }
  }
  if (
    (p.invoices.length || p.order) &&
    (!uuid(p.localCustomerId) ||
      (!uuid(p.customerId) &&
        !(
          typeof p.customerProfile?.name === "string" &&
          p.customerProfile.name.trim() &&
          p.customerProfile.name.length <= 160
        )))
  )
    throw fail("offline_customer_required");
  for (const inv of p.invoices) {
    add("invoice", inv);
    reference(inv.number);
    at(inv.issued_at);
    if (
      !Array.isArray(inv.items) ||
      !inv.items.length ||
      inv.items.length > 100
    )
      throw fail("invalid_offline_invoice");
    let sum = 0;
    for (const row of inv.items) {
      integer(row.quantity);
      integer(row.unitPrice, true);
      if (
        typeof row.description !== "string" ||
        !row.description.trim() ||
        row.description.length > 1000
      )
        throw fail("invalid_offline_item");
      if (row.lineTotal !== row.quantity * row.unitPrice)
        throw fail("offline_item_amount_mismatch");
      sum += row.lineTotal;
    }
    if (integer(inv.total) !== sum || inv.subtotal !== sum)
      throw fail("offline_invoice_total_mismatch");
    if (
      inv.account_balance_at_issue != null &&
      (!Number.isSafeInteger(inv.account_balance_at_issue) ||
        Math.abs(inv.account_balance_at_issue) > 9e12)
    )
      throw fail("invalid_offline_issue_balance");
  }
  if (
    p.order &&
    ["ready", "completed"].includes(p.order.status) &&
    !p.invoices.length &&
    p.order.invoice_required !== false
  )
    throw fail("offline_invoice_required");
  const net = {},
    expected = {},
    addNet = (map, k, n) => {
      const value = (map[k] || 0) + n;
      if (!Number.isSafeInteger(value) || Math.abs(value) > 9e12)
        throw fail("offline_amount_overflow");
      map[k] = value;
    };
  for (const inv of p.invoices) {
    addNet(expected, "receivable", inv.total);
    addNet(expected, "sales", -inv.total);
  }
  for (const pay of p.payments) {
    add("payment", pay);
    reference(pay.number);
    at(pay.paid_at);
    integer(pay.amount);
    if (!p.invoices.some((i) => i.id === pay.invoice_id))
      throw fail("offline_payment_requires_own_invoice");
    if (!["cash", "card", "transfer", "cheque", "other"].includes(pay.method))
      throw fail("invalid_offline_payment_method");
    addNet(expected, money(pay.method), pay.amount);
    addNet(expected, "receivable", -pay.amount);
  }
  for (const expense of p.expenses) {
    add("expense", expense);
    reference(expense.number);
    at(expense.spent_at);
    integer(expense.amount);
    if (typeof expense.category !== "string" || !expense.category.trim())
      throw fail("invalid_offline_expense");
    if (
      !["cash", "card", "transfer", "cheque", "other"].includes(expense.method)
    )
      throw fail("invalid_offline_payment_method");
    addNet(expected, "operating_expense", expense.amount);
    addNet(expected, money(expense.method), -expense.amount);
  }
  for (const correction of p.corrections) {
    add("correction", correction);
    reference(correction.document_number);
    at(correction.created_at);
    if (
      !docs.has(correction.target_type + ":" + correction.target_id) ||
      !["invoice", "payment", "expense"].includes(correction.target_type) ||
      !String(correction.note || "").trim()
    )
      throw fail("invalid_offline_correction");
    integer(correction.amount, true);
    if (correction.target_type === "invoice") {
      if (
        !["invoice_increase", "invoice_decrease"].includes(
          correction.correction_kind,
        )
      )
        throw fail("invalid_offline_correction");
      const increase = correction.correction_kind === "invoice_increase";
      addNet(
        expected,
        "receivable",
        increase ? correction.amount : -correction.amount,
      );
      addNet(
        expected,
        increase ? "sales" : "sales_discount",
        increase ? -correction.amount : correction.amount,
      );
    } else if (
      correction.correction_kind !==
      correction.target_type + "_replace"
    )
      throw fail("invalid_offline_correction");
  }
  for (const inv of p.invoices) {
    const paid = p.payments
        .filter((x) => x.invoice_id === inv.id)
        .reduce((n, x) => n + x.amount, 0),
      delta = p.corrections
        .filter((x) => x.target_type === "invoice" && x.target_id === inv.id)
        .reduce(
          (n, x) =>
            n +
            (x.correction_kind === "invoice_increase" ? x.amount : -x.amount),
          0,
        );
    if (
      Number(inv.paid || 0) !== paid ||
      Number(inv.correction_delta || 0) !== delta
    )
      throw fail("offline_invoice_balance_mismatch");
  }
  if ((expected.receivable || 0) < 0)
    throw fail("offline_payment_exceeds_invoice");
  const refs = new Set(),
    txnIds = new Set();
  for (const txn of p.journal) {
    if (
      !uuid(txn.id) ||
      txnIds.has(txn.id) ||
      ids.has(txn.id) ||
      !Array.isArray(txn.entries) ||
      txn.entries.length < 2 ||
      txn.entries.length > 16
    )
      throw fail("invalid_offline_journal");
    txnIds.add(txn.id);
    at(txn.txn_date);
    const key = txn.reference_type + ":" + txn.reference_id;
    if (!docs.has(key) || refs.has(key))
      throw fail("invalid_offline_journal_reference");
    refs.add(key);
    let debit = 0,
      credit = 0;
    for (const line of txn.entries) {
      if (
        ![
          "cash",
          "bank",
          "receivable",
          "sales",
          "sales_discount",
          "operating_expense",
        ].includes(line.accountKey) ||
        (line.customer_id && line.customer_id !== p.localCustomerId) ||
        (line.invoice_id && !p.invoices.some((i) => i.id === line.invoice_id))
      )
        throw fail("invalid_offline_journal_account");
      if(line.accountKey==='receivable'&&(line.customer_id!==p.localCustomerId||!p.invoices.some(i=>i.id===line.invoice_id)))throw fail('offline_receivable_identity_mismatch');
      integer(line.debit, true);
      integer(line.credit, true);
      if (line.debit && line.credit) throw fail("invalid_offline_journal_line");
      debit += line.debit;
      credit += line.credit;
      addNet(net, line.accountKey, line.debit - line.credit);
    }
    integer(debit);
    integer(credit);
    if (
      !debit ||
      debit !== credit ||
      debit !== txn.debit ||
      credit !== txn.credit
    )
      throw fail("offline_journal_not_balanced");
  }
  for (const key of docs.keys())
    if (!key.startsWith("order:") && !key.startsWith("file:") && !refs.has(key))
      throw fail("offline_journal_missing_document");
  for (const account of new Set([
    ...Object.keys(expected),
    ...Object.keys(net),
  ]))
    if ((expected[account] || 0) !== (net[account] || 0))
      throw fail("offline_journal_document_mismatch");
  return p;
}
export async function importOfflineBundle({
  pool,
  labId,
  actorId,
  deviceId,
  payload,
  postTransaction,
  authorizePrimary,
  hashPassword,
}) {
  const p = validateOfflineBundle(payload);
  if (p.deviceId !== deviceId) throw fail("offline_device_mismatch", 403);
  const fingerprint = hash(p),
    c = await pool.connect();
  try {
    await c.query("BEGIN");
    if (!(await authorizePrimary(c)))
      throw fail("not_primary_download_device", 403);
    const lab = (
      await c.query(
        "SELECT active,suspended,active_from,active_until FROM labs WHERE id=$1 FOR SHARE",
        [labId],
      )
    ).rows[0];
    if (
      !lab ||
      !lab.active ||
      lab.suspended ||
      (lab.active_from && Date.now() < Date.parse(lab.active_from)) ||
      (lab.active_until && Date.now() > Date.parse(lab.active_until))
    )
      throw fail("lab_subscription_unavailable", 403);
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [
      labId,
      p.documentId,
    ]);
    const prior = (
      await c.query(
        "SELECT payload_hash,result FROM lab_offline_imports WHERE lab_id=$1 AND document_id=$2",
        [labId, p.documentId],
      )
    ).rows[0];
    if (prior) {
      if (prior.payload_hash !== fingerprint)
        throw fail("offline_import_payload_changed", 409);
      await c.query("COMMIT");
      return prior.result;
    }
    let customerId = p.customerId;
    if (!customerId && (p.order || p.invoices.length)) {
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [
        labId,
        p.deviceId + ":" + p.localCustomerId,
      ]);
      customerId = (
        await c.query(
          "SELECT customer_id FROM lab_offline_customers WHERE lab_id=$1 AND device_id=$2 AND local_customer_id=$3",
          [labId, p.deviceId, p.localCustomerId],
        )
      ).rows[0]?.customer_id;
      if (!customerId) {
        if (!hashPassword)
          throw fail("offline_customer_registration_unavailable", 503);
        const mobile = String(p.customerProfile?.mobile || "");
        if (mobile && !/^09[0-9]{9}$/.test(mobile))
          throw fail("invalid_offline_customer_mobile");
        const row = (
          await c.query(
            "INSERT INTO users(id,name,mobile,password_hash,platform_role,active) VALUES($1,$2,$3,$4,'user',true) RETURNING id",
            [
              crypto.randomUUID(),
              p.customerProfile.name.trim(),
              mobile || null,
              hashPassword(crypto.randomBytes(32).toString("hex")),
            ],
          )
        ).rows[0];
        customerId = row.id;
        await c.query(
          "INSERT INTO lab_memberships(lab_id,user_id,role,active) VALUES($1,$2,'customer',true) ON CONFLICT DO NOTHING",
          [labId, customerId],
        );
        await c.query("INSERT INTO lab_offline_customers VALUES($1,$2,$3,$4)", [
          labId,
          p.deviceId,
          p.localCustomerId,
          customerId,
        ]);
      }
    }
    if (customerId) {
      const customer = await c.query(
        "SELECT id FROM users WHERE id=$2 AND (EXISTS(SELECT 1 FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 AND role='customer') OR EXISTS(SELECT 1 FROM invoices WHERE lab_id=$1 AND customer_id=$2)) FOR SHARE",
        [labId, customerId],
      );
      if (!customer.rowCount) throw fail("offline_customer_not_in_lab", 403);
    }

    const maps = {},
      make = (id) => maps[id] || (maps[id] = crypto.randomUUID());
    let order = null;
    const source = p.order;
    if (source || p.invoices.length) {
      const inv = p.invoices[0],
        status = source?.status || "completed",
        metadata = {
          ...(source?.album_data || {}),
          offlineReference: p.reference,
          offlineDeviceId: p.deviceId,
          manualInvoice: !source,
        };
      const q = await c.query(
        `INSERT INTO orders(id,lab_id,customer_id,mode,status,delivery,priority,album_data,total,source,settlement_mode,payment_status,invoice_required,created_at,updated_at,downloaded_at,printed_at,offline_reference,walkin_customer_name,walkin_customer_mobile)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,'ledger','not_required',$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [
          source ? make(source.id) : crypto.randomUUID(),
          labId,
          customerId,
          source?.mode || "print",
          status,
          source?.delivery || "pickup",
          source?.priority || "normal",
          JSON.stringify(metadata),
          inv?.total || 0,
          source ? "lab_delegated" : "manual_invoice",
          source?.invoice_required !== false,
          source?.created_at || inv.issued_at,
          source?.updated_at || inv.issued_at,
          source?.downloaded_at || source?.created_at || inv.issued_at,
          source?.printed_at || inv?.issued_at || null,
          p.reference,
          inv?.customer_name ||
            source?.customer_name ||
            p.customerProfile?.name ||
            null,
          inv?.customer_mobile ||
            source?.customer_mobile ||
            p.customerProfile?.mobile ||
            null,
        ],
      );
      order = q.rows[0];
      await c.query(
        "INSERT INTO order_status_events(order_id,lab_id,customer_id,status,note,actor_id,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          order.id,
          labId,
          customerId,
          status,
          "واردشده از سند مستقل آفلاین " + p.reference,
          actorId,
          source?.updated_at || inv.issued_at,
        ],
      );
      for (const f of source?.files || []) {
        const size = f.print_size_id
          ? (
              await c.query("SELECT id FROM print_sizes WHERE id=$1", [
                f.print_size_id,
              ])
            ).rows[0]?.id
          : null;
        await c.query(
          `INSERT INTO order_files(id,order_id,lab_id,customer_id,original_name,object_key,content_type,bytes,width,height,print_size_id,print_type,print_copies,chassis,frame,original_state,offline_metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',$16::jsonb)`,
          [
            make(f.id),
            order.id,
            labId,
            customerId,
            f.original_name,
            `client-local-recovery/${labId}/${order.id}/${make(f.id)}-${f.original_name}`,
            f.content_type || "application/octet-stream",
            f.bytes,
            f.width || null,
            f.height || null,
            size || null,
            f.print_type || "luster",
            f.print_copies || 1,
            !!f.chassis,
            !!f.frame,
            JSON.stringify({
              size_label: f.size_label || f.print_size_label || f.print_size_id,
              sha256: f.sha256,
            }),
          ],
        );
      }
    }
    const invoices = [];
    for (const inv of p.invoices) {
      const q = await c.query(
        "INSERT INTO invoices(id,lab_id,customer_id,order_id,items,subtotal,total,issued_at,pdf_ready,offline_reference,account_balance_at_issue) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,false,$9,$10) RETURNING *",
        [
          make(inv.id),
          labId,
          customerId,
          order.id,
          JSON.stringify(inv.items),
          inv.subtotal,
          inv.total,
          inv.issued_at,
          inv.number,
          inv.account_balance_at_issue ?? null,
        ],
      );
      invoices.push(q.rows[0]);
    }
    for (const pay of p.payments)
      await c.query(
        "INSERT INTO finance_payments(id,lab_id,customer_id,invoice_id,amount,method,note,paid_at,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          make(pay.id),
          labId,
          customerId,
          make(pay.invoice_id),
          pay.amount,
          pay.method,
          pay.note || pay.number,
          pay.paid_at,
          actorId,
        ],
      );
    for (const x of p.expenses)
      await c.query(
        "INSERT INTO finance_expenses(id,lab_id,category,payee,amount,method,note,spent_at,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          make(x.id),
          labId,
          x.category,
          x.payee || null,
          x.amount,
          x.method,
          x.note || x.number,
          x.spent_at,
          actorId,
        ],
      );
    for (const x of p.corrections)
      await c.query(
        "INSERT INTO finance_corrections(id,lab_id,target_type,target_id,correction_kind,amount,old_value,new_value,note,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)",
        [
          make(x.id),
          labId,
          x.target_type,
          make(x.target_id),
          x.correction_kind,
          x.amount,
          JSON.stringify(x.old_value || {}),
          JSON.stringify(x.new_value || x.body || {}),
          x.note,
          actorId,
          x.created_at,
        ],
      );
    for (const txn of p.journal) {
      const transactionId = await postTransaction(c, {
        labId,
        actorId,
        description: txn.description,
        referenceType:
          txn.reference_type === "correction"
            ? "finance_correction"
            : txn.reference_type,
        referenceId: make(txn.reference_id),
        txnDate: txn.txn_date,
        lines: txn.entries.map((e) => ({
          accountKey: e.accountKey,
          customerId: e.customer_id ? customerId : null,
          invoiceId: e.invoice_id ? make(e.invoice_id) : null,
          debit: e.debit,
          credit: e.credit,
          note: e.note || null,
        })),
      });
      maps[txn.id] = transactionId;
      const table = {
        payment: "finance_payments",
        expense: "finance_expenses",
        correction: "finance_corrections",
      }[txn.reference_type];
      if (table)
        await c.query(`UPDATE ${table} SET transaction_id=$2 WHERE id=$1`, [
          make(txn.reference_id),
          transactionId,
        ]);
    }
    const result = {
      ok: true,
      shared: true,
      documentId: p.documentId,
      reference: p.reference,
      customerId,
      maps,
      order,
      invoices,
    };
    await c.query(
      "INSERT INTO lab_offline_imports(lab_id,document_id,device_id,offline_reference,payload_hash,snapshot,result) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)",
      [
        labId,
        p.documentId,
        p.deviceId,
        p.reference,
        fingerprint,
        JSON.stringify(p),
        JSON.stringify(result),
      ],
    );
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
export async function handleOfflineImport({
  req,
  res,
  url,
  a,
  labId,
  pool,
  bodyJson,
  sendJson,
  postTransaction,
  authorizePrimary,
  publish,
  hashPassword,
}) {
  if (url.pathname !== "/api/lab/desktop/offline-import") return false;
  if (a?.labRole !== "lab_admin" || a.labId !== labId) {
    sendJson(res, 403, { error: "forbidden" });
    return true;
  }
  if (req.method === "GET") {
    sendJson(res, 200, { version: 1, atomic: true });
    return true;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return true;
  }
  try {
    const payload = await bodyJson(req, 4000000),
      device = String(req.headers["x-photobridge-device-id"] || "").replace(
        /^pblab-/,
        "",
      );
    const result = await importOfflineBundle({
      pool,
      labId,
      actorId: a.userId,
      deviceId: device,
      payload,
      postTransaction,
      authorizePrimary,
      hashPassword,
    });
    sendJson(res, 200, result);
    try {
      publish(labId, "offline.imported", { documentId: result.documentId });
    } catch {}
  } catch (e) {
    if (!res.writableEnded)
      sendJson(res, e.status || 500, {
        error: e.code || "offline_import_failed",
        message: e.status
          ? e.message
          : "ثبت کامل نشد؛ ارسال با همان شناسه تکرار خواهد شد.",
      });
  }
  return true;
}

export function projectOfflineNumbers(value) {
  if (Array.isArray(value)) return value.map(projectOfflineNumbers);
  if (
    !value ||
    typeof value !== "object" ||
    value instanceof Date ||
    Buffer.isBuffer(value)
  )
    return value;
  const out = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      projectOfflineNumbers(item),
    ]),
  );
  if (typeof out.offline_reference === "string" && out.number != null) {
    out.server_number = out.server_number ?? out.number;
    out.number = out.offline_reference.replace(/^OFF-[A-F0-9]{32}-(?:INV|ORD|EXP|PAY|COR)-0*([1-9]\d*|0)$/,'OFF-$1');
    out.source_kind = "offline";
  }
  for(const field of ['invoice_number','source_invoice_number','order_number'])if(typeof out[field]==='string')out[field]=out[field].replace(/^OFF-[A-F0-9]{32}-(?:INV|ORD|EXP|PAY|COR)-0*([1-9]\d*|0)$/,'OFF-$1');
  return out;
}
