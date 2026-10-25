import {storageDeviceAllowed} from './lab-storage-pair.js';
const fail=(message,status=409)=>Object.assign(Error(message),{status});
export function downloadFilesMatch(rows,files) {
  if(!Array.isArray(files)||!rows.length||files.length!==rows.length)return false;
  const ids=new Set(),expected=new Map(rows.map(row=>[String(row.id),row]));
  for(const file of files){
    const id=String(file.id||''),row=expected.get(id),bytes=Number(file.bytes);
    if(!row||ids.has(id)||!Number.isSafeInteger(bytes)||bytes<=0)return false;
    ids.add(id);
    const original=file.name===row.original_name&&bytes===Number(row.bytes);
    const prepared=file.name===(row.print_name||row.original_name)&&bytes===Number(row.print_bytes||row.bytes);
    if(!original&&!prepared)return false;
  }
  return true;
}
export async function acknowledgeLabDownload({pool,labId,deviceId,orderId,files}) {
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    const lab=(await c.query('SELECT ui_preferences,primary_download_device_id FROM labs WHERE id=$1 FOR SHARE',[labId])).rows[0];
    if(!lab||!storageDeviceAllowed(lab,deviceId))throw fail('not_primary_download_device',403);
    const order=(await c.query('SELECT * FROM orders WHERE id=$1 AND lab_id=$2 FOR UPDATE',[orderId,labId])).rows[0];
    if(!order)throw fail('not_found',404);
    if(['cancelled','uploading'].includes(order.status))throw fail('order_not_downloadable');
    if(order.settlement_mode==='prepaid'&&order.payment_status!=='paid')throw fail('payment_required');
    const rows=(await c.query("SELECT id,original_name,print_name,bytes,print_bytes FROM order_files WHERE order_id=$1 AND lab_id=$2 AND original_state<>'deleted'",[orderId,labId])).rows;
    if(!downloadFilesMatch(rows,files))throw fail('download_files_incomplete');
    // This acknowledges actual delivery; workflow status and invoice are intentionally untouched.
    const updated=await c.query('UPDATE orders SET downloaded_at=COALESCE(downloaded_at,now()),updated_at=CASE WHEN downloaded_at IS NULL THEN now() ELSE updated_at END WHERE id=$1 AND lab_id=$2 RETURNING *',[orderId,labId]);
    await c.query('COMMIT');
    return {order:updated.rows[0],verifiedFiles:rows.length};
  }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error}
  finally{c.release()}
}
