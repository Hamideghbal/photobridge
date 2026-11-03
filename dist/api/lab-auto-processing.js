// R1568: Lab-scoped unattended processing policy and guarded early invoice.
// This endpoint is called *inside* the authenticated /api/lab/ section in server.js.
import {downloadManifestFingerprint, verifiedDownloadKey} from './lab-download-receipt.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const automationKey=labId=>'lab_auto_processing:'+labId;
export const automationDefaults=Object.freeze({
  autoDownloadEnabled:false,invoiceTiming:'after_print',autoPrintInvoice:false,
  autoPrintMissingPriceTicket:true,receiptWidthMm:80
});
export function normalizeAutomation(raw={}){
  const v=raw&&typeof raw==='object'?raw:{};
  return {
    autoDownloadEnabled:v.autoDownloadEnabled===true,
    invoiceTiming:v.invoiceTiming==='after_verified_download'?'after_verified_download':'after_print',
    autoPrintInvoice:v.autoPrintInvoice===true,
    autoPrintMissingPriceTicket:v.autoPrintMissingPriceTicket!==false,
    receiptWidthMm:v.receiptWidthMm===58?58:80
  };
}
export function validateAutomation(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return false;
  const keys=Object.keys(automationDefaults);
  if(Object.keys(body).some(k=>!keys.includes(k)))return false;
  if(keys.filter(k=>k!=='invoiceTiming'&&k!=='receiptWidthMm').some(k=>typeof body[k]!=='boolean'))return false;
  return ['after_print','after_verified_download'].includes(body.invoiceTiming)
    && [58,80].includes(body.receiptWidthMm);
}
export async function readLabAutomation(pool,labId){
  const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1',[automationKey(labId)]);
  return normalizeAutomation(q.rows[0]?.value);
}
export function verifiedReceiptMatches(proof,files,deviceId){
  return Boolean(proof&&proof.fileCount===files.length&&files.length>0
    &&proof.manifest===downloadManifestFingerprint(files)
    &&String(proof.deviceId||'')===String(deviceId||'')
    &&typeof proof.verifiedAt==='string'&&Number.isFinite(Date.parse(proof.verifiedAt)));
}
export async function handleLabAutomation({req,res,url,labId,deviceId,pool,bodyJson,sendJson,issueInvoice,invoiceRequirements,storageConfigured,storagePresign,audit,actorId}){
  const settingsRoute=url.pathname==='/api/lab/automation';
  const invoiceRoute=url.pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})\/automation-invoice$/i);
  if(!settingsRoute&&!invoiceRoute)return false;
  const reply=(code,data)=>{res.setHeader?.('Cache-Control','private, no-store');sendJson(res,code,data);return true;};
  if(settingsRoute){
    if(req.method==='GET')return reply(200,{settings:await readLabAutomation(pool,labId)});
    if(req.method!=='PUT')return reply(405,{error:'method_not_allowed'});
    const body=await bodyJson(req);
    if(!validateAutomation(body))return reply(400,{error:'invalid_lab_automation_settings'});
    const q=await pool.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now())
       ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now() RETURNING value`,
      [automationKey(labId),JSON.stringify(normalizeAutomation(body))]);
    await audit?.(actorId,labId,'lab.automation_settings','lab',labId,normalizeAutomation(body)).catch(()=>{});
    return reply(200,{settings:normalizeAutomation(q.rows[0].value)});
  }
  if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
  const settings=await readLabAutomation(pool,labId);
  if(settings.invoiceTiming!=='after_verified_download')return reply(409,{error:'invoice_timing_after_print'});
  if(!deviceId)return reply(403,{error:'verified_device_required'});
  const id=invoiceRoute[1];if(!UUID.test(id))return reply(400,{error:'invalid_order_id'});
  const c=await pool.connect();let invoice,order,wasExisting=false;
  try{
    await c.query('BEGIN');
    const oq=await c.query('SELECT * FROM orders WHERE lab_id=$1 AND id=$2 FOR UPDATE',[labId,id]);
    order=oq.rows[0];if(!order)throw Object.assign(Error('not_found'),{status:404});
    if(['cancelled','uploading'].includes(String(order.status||'')))throw Object.assign(Error('order_not_downloadable'),{status:409});
    if(order.settlement_mode==='prepaid'&&order.payment_status!=='paid')throw Object.assign(Error('payment_required'),{status:409});
    if(!order.downloaded_at)throw Object.assign(Error('download_not_verified'),{status:409});
    const fileQ=await c.query(`SELECT id,original_name,print_name,bytes,print_bytes FROM order_files
      WHERE order_id=$1 AND lab_id=$2 AND original_state<>'deleted' ORDER BY id`,[id,labId]);
    const proofQ=await c.query('SELECT value FROM platform_settings WHERE key=$1',[verifiedDownloadKey(labId,id)]);
    if(!verifiedReceiptMatches(proofQ.rows[0]?.value,fileQ.rows,deviceId))
      throw Object.assign(Error('download_proof_expired_or_missing'),{status:409});
    const requirements=await invoiceRequirements(c,labId,id);
    const missing=requirements.filter(x=>!x.resolved);
    if(missing.length){
      await c.query('ROLLBACK');
      return reply(409,{error:'invoice_pricing_required',missingPricing:missing,pricingRequirements:requirements});
    }
    wasExisting=Boolean((await c.query('SELECT id FROM invoices WHERE lab_id=$1 AND order_id=$2 LIMIT 1',[labId,id])).rowCount);
    invoice=await issueInvoice(c,labId,id);
    await c.query('COMMIT');
  }catch(error){
    await c.query('ROLLBACK').catch(()=>{});
    if(error.message==='invoice_pricing_required')
      return reply(409,{error:'invoice_pricing_required',missingPricing:error.missingPricing||[],pricingRequirements:error.pricingRequirements||[]});
    if(error.status)return reply(error.status,{error:error.message});
    throw error;
  }finally{c.release();}
  let invoiceUploadUrl=null;
  if(invoice?.pdf_object_key&&!invoice?.pdf_ready&&storageConfigured){
    try{invoiceUploadUrl=await storagePresign('upload',invoice.pdf_object_key);}catch{}
  }
  if(!wasExisting)await audit?.(actorId,labId,'lab.automation_invoice','invoice',invoice.id,{orderId:id}).catch(()=>{});
  return reply(200,{invoice,orderId:id,existing:wasExisting,invoiceUploadUrl});
}
