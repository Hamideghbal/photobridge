import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';let src=fs.readFileSync(path,'utf8');
function one(a,b){const n=src.split(a).length-1;if(n!==1)throw Error('R1181 server anchor '+n+': '+a.slice(0,100));src=src.replace(a,b);}
function pb1181DeleteEndpoint(){
 const labPreprintFileRemove=url.pathname.match(/^\/api\/lab\/order-files\/([0-9a-f-]+)$/);
 if(labPreprintFileRemove&&req.method==='DELETE'){
  const c=await pool.connect();let removed=null;
  try{
   await c.query('BEGIN');
   const fq=await c.query("SELECT f.*,o.status,o.mode,o.customer_id,o.number,o.total AS order_total FROM order_files f JOIN orders o ON o.id=f.order_id WHERE f.id=$1 AND f.lab_id=$2 AND f.original_state<>'deleted' FOR UPDATE OF f,o",[labPreprintFileRemove[1],labId]);
   if(!fq.rowCount){await c.query('ROLLBACK');return sendJson(res,404,{error:'not_found'});}
   const row=fq.rows[0];
   if(row.mode!=='print'||!['sent','received','downloaded','needs_fix'].includes(String(row.status||''))){
    await c.query('ROLLBACK');return sendJson(res,409,{error:'order_print_settings_locked'});
   }
   const iq=await c.query("SELECT id FROM invoices WHERE order_id=$1 AND lab_id=$2 LIMIT 1",[row.order_id,labId]);
   if(iq.rowCount){await c.query('ROLLBACK');return sendJson(res,409,{error:'issued_invoice_locked'});}
   const count=await c.query("SELECT count(*)::int AS n FROM order_files WHERE order_id=$1 AND lab_id=$2 AND original_state<>'deleted'",[row.order_id,labId]);
   if(Number(count.rows[0]?.n||0)<=1){await c.query('ROLLBACK');return sendJson(res,409,{error:'last_print_photo_required'});}
   const copies=Math.max(1,Number(row.print_copies||1));
   if(row.chassis||row.frame){
    await c.query("SELECT id FROM lab_prices WHERE lab_id=$1 AND size_id=$2 FOR UPDATE",[labId,row.print_size_id]);
    if(row.chassis)await c.query("UPDATE lab_prices SET chassis_stock=CASE WHEN chassis_stock IS NULL THEN NULL ELSE chassis_stock+$3 END,updated_at=now() WHERE lab_id=$1 AND size_id=$2",[labId,row.print_size_id,copies]);
    if(row.frame)await c.query("UPDATE lab_prices SET frame_stock=CASE WHEN frame_stock IS NULL THEN NULL ELSE frame_stock+$3 END,updated_at=now() WHERE lab_id=$1 AND size_id=$2",[labId,row.print_size_id,copies]);
   }
   await c.query("UPDATE order_files SET original_state='deleted' WHERE id=$1 AND order_id=$2 AND lab_id=$3",[row.id,row.order_id,labId]);
   const quote=await c.query("SELECT f.print_type,f.chassis,f.frame,COALESCE(f.print_copies,1) print_copies,CASE WHEN o.source='walkin' THEN wp.luster ELSE p.luster END luster,CASE WHEN o.source='walkin' THEN wp.silk ELSE p.silk END silk,CASE WHEN o.source='walkin' THEN wp.metallic ELSE p.metallic END metallic,CASE WHEN o.source='walkin' THEN wp.chassis ELSE p.chassis END chassis_price,CASE WHEN o.source='walkin' THEN wp.frame ELSE p.frame END frame_price FROM order_files f JOIN orders o ON o.id=f.order_id LEFT JOIN lab_prices p ON p.lab_id=f.lab_id AND p.size_id=f.print_size_id LEFT JOIN walkin_prices wp ON wp.lab_id=f.lab_id AND wp.size_id=f.print_size_id WHERE f.order_id=$1 AND f.lab_id=$2 AND f.original_state<>'deleted'",[row.order_id,labId]);
   let missing=false,estimatedTotal=0;
   for(const item of quote.rows){
    const paper=item[String(item.print_type||'')];
    if(paper==null||(item.chassis&&item.chassis_price==null)||(item.frame&&item.frame_price==null)){missing=true;continue;}
    estimatedTotal+=(Number(paper)+Number(item.chassis?item.chassis_price:0)+Number(item.frame?item.frame_price:0))*Number(item.print_copies||1);
   }
   if(!missing)await c.query("UPDATE orders SET total=$3,updated_at=now() WHERE id=$1 AND lab_id=$2",[row.order_id,labId,Math.round(estimatedTotal)]);
   await c.query('COMMIT');removed=row;
  }catch(err){await c.query('ROLLBACK').catch(()=>{});throw err;}
  finally{c.release();}
  await audit(a.userId,labId,'order_file.remove_before_print','order_file',removed.id,{orderId:removed.order_id,copies:removed.print_copies||1}).catch(()=>{});
  return sendJson(res,200,{ok:true,fileId:removed.id,orderId:removed.order_id,localOnly:String(removed.object_key||'').startsWith('client-local-recovery/')});
 }
}
if(!src.includes('PB1181 defer unpriced print edits')){
 one("                if (price[printType] == null) {\n                    await c.query('ROLLBACK');\n                    return sendJson(res, 409, { error: 'print_price_unavailable' });\n                }\n                if (chassis && price.chassis == null || frame && price.frame == null) {\n                    await c.query('ROLLBACK');\n                    return sendJson(res, 409, { error: 'addon_unavailable' });\n                }",
"                // PB1181 defer unpriced print edits: missing tariff is resolved at invoice creation.\n                // Physical chassis/frame stock limits still apply.");
 one("                const items = [...grouped.values()], subtotal = Math.round(items.reduce((sum, x) => sum + Number(x.lineTotal || 0), 0));",
"                const items = [...grouped.values()], subtotal = Math.round(items.reduce((sum, x) => sum + Number(x.lineTotal || 0), 0));\n                const pricingPending = quoteQ.rows.some(x => x[String(x.print_type || '')] == null || (x.chassis && x.chassis_price == null) || (x.frame && x.frame_price == null));");
 const tick=String.fromCharCode(96);
 one("                const oq = await c.query("+tick+"UPDATE orders SET total=$3,updated_at=now() WHERE id=$1 AND lab_id=$2 RETURNING *"+tick+", [file.order_id, labId, subtotal]);",
"                const oq = await c.query('UPDATE orders SET total=CASE WHEN $4 THEN total ELSE $3 END,updated_at=now() WHERE id=$1 AND lab_id=$2 RETURNING *', [file.order_id, labId, subtotal, pricingPending]);");
 one("                if (iq.rowCount) {\n                    const inv = iq.rows[0], previousOrderTotal",
"                if (iq.rowCount && !pricingPending) {\n                    const inv = iq.rows[0], previousOrderTotal");
 one("                return sendJson(res, 200, { ok: true, file: updatedFile, order, items, total: subtotal, correction });",
"                return sendJson(res, 200, { ok: true, file: updatedFile, order, items, total: pricingPending ? null : subtotal, pricingRequired: pricingPending, correction });");
 one("if ((cq && (p.chassis == null || (p.chassis_stock != null && Number(p.chassis_stock) < cq)))\n                            || (fqty && (p.frame == null || (p.frame_stock != null && Number(p.frame_stock) < fqty))))",
"if ((cq && p.chassis_stock != null && Number(p.chassis_stock) < cq)\n                            || (fqty && p.frame_stock != null && Number(p.frame_stock) < fqty))");
 const injected=pb1181DeleteEndpoint.toString().replace(/^function pb1181DeleteEndpoint\(\)\s*\{/,'').replace(/\}\s*$/,'');
 one("        const labFilePreview = url.pathname.match(",
"        // PB1181 mark removed photos before printing, preserve original storage.\n"+injected+"\n        const labFilePreview = url.pathname.match(");
 fs.writeFileSync(path,src);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
