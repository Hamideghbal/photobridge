"use strict";
function patchOfflineServer(source) {
  if (source.includes("/* PB1468 isolated offline documents */")) return source;
  const once = (before, after) => {
    if (source.split(before).length !== 2)
      throw Error("offline_policy_server_anchor:" + before.slice(0, 100));
    source = source.replace(before, after);
  };
  source =
    "/* PB1468 isolated offline documents */\nimport {handleOfflineImport,projectOfflineNumbers} from './offlineImport.js';\n" +
    source;
  once(
    "Buffer.from(JSON.stringify(body)); res.writeHead(status,",
    "Buffer.from(JSON.stringify(projectOfflineNumbers(body))); res.writeHead(status,",
  );
  once(
    "res.end(data); }\nfunction sendText",
    "res.end(data);if(status>=200&&status<300&&res.pbBusinessLab){const clients=labEventClients.get(res.pbBusinessLab);for(const client of clients||[])try{client.write('event: document.changed\\ndata: {}\\n\\n');}catch{}} }\nfunction sendText",
  );
  const namespace = source.indexOf("// Lab admin"),
    labLine = source.indexOf("        const labId = a.labId;", namespace);
  if (namespace < 0 || labLine < 0)
    throw Error("offline_policy_lab_scope_anchor");
  const labEnd = labLine + "        const labId = a.labId;".length;
  source =
    source.slice(0, labEnd) +
    "\n        if(!['GET','HEAD','OPTIONS'].includes(req.method)&&/^\\/api\\/lab\\/(?:orders|order-files|invoices|finance|delegated-orders|delegated-customers|customers|desktop\\/offline-import)(?:\\/|$)/.test(url.pathname))res.pbBusinessLab=labId;" +
    source.slice(labEnd);
  const device =
    "        const requestDeviceId = String(req.headers['x-photobridge-device-id'] || '').trim();";
  once(
    device,
    device +
      "\n        if(requestDeviceId.startsWith('pblab-')&&!['GET','HEAD','OPTIONS'].includes(req.method)&&/^\\/api\\/lab\\/(?:orders|order-files|invoices|finance|delegated-orders|delegated-customers|customers|desktop\\/offline-import)(?:\\/|$)/.test(url.pathname)&&req.headers['x-photobridge-document-policy']!=='1')return sendJson(res,409,{error:'desktop_policy_update_required',message:'برای ثبت تغییرات، نسخهٔ 1.0.61 یا جدیدتر برنامهٔ ویندوز را نصب کنید.'});",
  );
  const route =
    "        // R1294: lab-scoped customer detail, initial-debt correction and invoice SMS.";
  once(
    route,
    "        if(await handleOfflineImport({req,res,url,a,labId,pool,bodyJson,sendJson,postTransaction:postBalancedFinanceTransaction,authorizePrimary:requireLocalIntakePrimary,publish:publishLabEvent,hashPassword:passwordHash}))return;\n" +
      route,
  );
  once(
    "const oldOrder = before.rows[0];",
    "const oldOrder = before.rows[0];\n                if(b.expectedRevision==null||String(b.expectedRevision)!==String(oldOrder.document_revision)){await c.query('ROLLBACK');return sendJson(res,409,{error:'shared_document_changed',message:'این سفارش در محل دیگری تغییر کرده است؛ اطلاعات تازه را بررسی کنید.'});}",
  );
  const album = source.indexOf("if (labAlbumStage &&"),
    current = source.indexOf("const current = before.rows[0];", album);
  if (album < 0 || current < 0) throw Error("offline_policy_album_anchor");
  source =
    source.slice(0, current) +
    source
      .slice(current)
      .replace(
        "const current = before.rows[0];",
        "const current = before.rows[0];\n                if(b.expectedRevision==null||String(b.expectedRevision)!==String(current.document_revision)){await c.query('ROLLBACK');return sendJson(res,409,{error:'shared_document_changed'});}",
      );
  for (const field of ["invoice_number", "source_invoice_number"])
    source = source.replaceAll(
      "i.number " + field,
      "COALESCE(i.offline_reference,i.number::text) " + field,
    );
  source = source.replaceAll(
    "o.number order_number",
    "COALESCE(o.offline_reference,o.number::text) order_number",
  );
  source = source.replaceAll(
    "s.label size_label",
    "COALESCE(f.offline_metadata->>'size_label',s.label) size_label",
  );
  once(
    "WHERE lab_id=$1 AND customer_id=$2 AND issued_at >= $3::timestamptz",
    "WHERE lab_id=$1 AND customer_id=$2 AND offline_reference IS NULL AND issued_at >= $3::timestamptz",
  );
  return source;
}
module.exports = { patchOfflineServer };
