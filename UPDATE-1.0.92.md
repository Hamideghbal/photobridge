# PhotoBridge Lab 1.0.92 — manual invoice after local file save

Manual photo orders issue the invoice immediately after the submitted file-save proof, without changing the print workflow stage. Missing tariffs queue the existing operator unit-price form. A pricing action with no missing rows issues the invoice directly instead of opening an empty modal.

Independent offline orders use the same automation-invoice route locally, require persisted SHA-256 file proofs, and reuse the existing invoice on replay. Invoice journal entries are created once. Offline printing reads the local invoice, lab identity and cached paper-width settings and uses the existing persisted thermal spool journal; it does not call the cloud. Independent local orders do not show a misleading cloud-download network dialog.

Online manual orders acknowledge the server download receipt before the existing guarded automation-invoice endpoint. PDF and thermal-print failures keep the issued invoice and show a separate warning; they do not create another invoice or silently retry an uncertain spool job.

Build using the existing publisher folder: copy `.publisher` beside `main.cjs`, then run `BUILD-WINDOWS.cmd`. The launcher obtains a SHA-256-verified portable Node 22 in a short user cache and leaves system Node unchanged. Windows validation and installer signing/build remain local.
