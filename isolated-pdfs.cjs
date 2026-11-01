"use strict";
const { LocalBusiness } = require("./local-business.cjs");
async function uploadOfflinePdfs(store, request, render) {
  const lab = store.get("labId"),
    engine = new LocalBusiness(store),
    same = () => {
      if (store.get("labId") !== lab || !store.get("auth"))
        throw Error("account_changed");
    };
  for (const inv of Object.values(engine.state().invoices).filter(
    (i) => i.origin_offline && i.serverId && !i.remotePdfUploaded,
  )) {
    try {
      let pdf = store.db
        .prepare("SELECT bytes FROM local_invoice_pdf WHERE lab=? AND id=?")
        .get(lab, inv.id)?.bytes;
      if (!pdf && render) {
        pdf = await render(
          require("./local-invoice.cjs").invoiceHtml(
            engine.decorateInvoice(engine.state(), inv),
            engine.bootstrap().lab,
          ),
        );
        same();
        store.db
          .prepare("INSERT OR REPLACE INTO local_invoice_pdf VALUES(?,?,?)")
          .run(lab, inv.id, Buffer.from(pdf));
      }
      if (!pdf) continue;
      const response = await request(
        "/api/lab/invoices/" + inv.serverId + "/pdf-upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64: Buffer.from(pdf).toString("base64"),
          }),
        },
      );
      same();
      if (!response.ok) throw Error("offline_pdf_upload_pending");
      store.transaction(() => {
        const s = engine.state();
        s.invoices[inv.id].remotePdfUploaded = true;
        delete s.invoices[inv.id].pdfSyncError;
        store.set(engine.key(), s);
      });
    } catch (e) {
      same();
      store.transaction(() => {
        const s = engine.state();
        s.invoices[inv.id].pdfSyncError = { code: e.code || e.message };
        store.set(engine.key(), s);
      });
    }
  }
}
module.exports = { uploadOfflinePdfs };
