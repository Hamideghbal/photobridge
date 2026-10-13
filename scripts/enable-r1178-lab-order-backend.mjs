import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
(function enableBackend(fs){
 let s=fs.readFileSync("dist/api/server.js","utf8");
 if(s.includes("PB1178 deferred delegated proforma"))return;
 const one=(old,repl)=>{const n=s.split(old).length-1;if(n!==1)throw Error("R1178 server patch "+n+" matches: "+old.slice(0,120));s=s.replace(old,repl);};
 const fileLine="const file = fq.rows[0];\n                if (!['sent', 'received', 'downloaded', 'needs_fix'].includes(String(file.status || ''))) {";
 one(fileLine,`const file = fq.rows[0];
                // PB1178: allow accurate per-photo print count edits before printing.
                const printCopies = b.printCopies == null ? Number(file.print_copies || 1) : Number(b.printCopies);
                if (!Number.isInteger(printCopies) || printCopies < 1 || printCopies > 99) {
                    await c.query('ROLLBACK');
                    return sendJson(res, 400, { error: 'invalid_print_copies' });
                }
                if (!['sent', 'received', 'downloaded', 'needs_fix'].includes(String(file.status || ''))) {`);
 one("if (chassis)\n                    addDelta(sizeId, 'chassis', Number(file.print_copies || 1));","if (chassis)\n                    addDelta(sizeId, 'chassis', printCopies);");
 one("if (frame)\n                    addDelta(sizeId, 'frame', Number(file.print_copies || 1));","if (frame)\n                    addDelta(sizeId, 'frame', printCopies);");
 const uq="const uq = await c.query(`UPDATE order_files SET print_size_id=$3,print_type=$4,chassis=$5,frame=$6 WHERE id=$1 AND lab_id=$2 RETURNING *`, [file.id, labId, sizeId, printType, chassis, frame]);";
 one(uq,`const currentName = String(file.original_name || 'photo.jpg'), dot = currentName.lastIndexOf('.'),
                    stem = dot > 0 ? currentName.slice(0,dot) : currentName,
                    ext = dot > 0 ? currentName.slice(dot) : '';
                const baseName = stem.replace(/ = [0-9]{1,2}$/, '');
                const updatedName = printCopies > 1 ? baseName+' = '+printCopies+ext : baseName+ext;
                const uq = await c.query(\`UPDATE order_files SET print_size_id=$3,print_type=$4,chassis=$5,frame=$6,print_copies=$7,original_name=$8 WHERE id=$1 AND lab_id=$2 RETURNING *\`, [file.id, labId, sizeId, printType, chassis, frame, printCopies, updatedName]);`);
 const statusBlock="const pricingRequirements = await orderInvoicePriceRequirements(c, labId, orderId);\n                const invoicePricingRequired = pricingRequirements.some(x => !x.resolved);\n                const prepaid = String(order.settlement_mode || 'ledger') === 'prepaid';\n                const pricingRequired = prepaid && invoicePricingRequired;\n                const status = prepaid ? 'awaiting_payment' : 'sent';";
 one(statusBlock,`const pricingRequirements = await orderInvoicePriceRequirements(c, labId, orderId);
                const invoicePricingRequired = pricingRequirements.some(x => !x.resolved);
                const prepaid = String(order.settlement_mode || 'ledger') === 'prepaid';
                const pricingRequired = prepaid && invoicePricingRequired;
                // PB1178 deferred delegated proforma: the desktop only calls submit
                // after verifying all files were written to its canonical lab folders.
                const localIntake = fq.rows.every(f => String(f.object_key || '').startsWith('client-local-recovery/'));
                const status = localIntake ? 'downloaded' : prepaid ? 'awaiting_payment' : 'sent';`);
 const updateBlock="const uq = await c.query(`UPDATE orders SET status=$2,payment_status=$3,\n                    album_stage=CASE WHEN mode='album' THEN COALESCE(album_stage,'files_received') ELSE album_stage END,\n                    updated_at=now() WHERE id=$1 RETURNING *`, [orderId, status, payment]);";
 one(updateBlock,`const uq = await c.query(\`UPDATE orders SET status=$2,payment_status=$3,
                    downloaded_at=CASE WHEN $4 THEN COALESCE(downloaded_at,now()) ELSE downloaded_at END,
                    album_stage=CASE WHEN mode='album' THEN COALESCE(album_stage,'files_received') ELSE album_stage END,
                    updated_at=now() WHERE id=$1 RETURNING *\`, [orderId, status, payment, localIntake]);`);
 one("// Desktop intake issues the official invoice on the first successful sync,\n                // including the normal ledger settlement path when tariffs are complete.\n                if (!invoicePricingRequired) submitted._invoice = await createOrGetInvoice(c, labId, orderId);",
  "// PB1178: this is a PRE-INVOICE. The normal 'ready' transition\n                // is responsible for the only final invoice after printing.\n                submitted._invoice = null;");
 fs.writeFileSync("dist/api/server.js",s);
})(fs);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
