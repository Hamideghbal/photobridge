// R1852: durable, fail-closed suppression of repeated administrator SMS.
// Uses the existing sms_delivery_log (no migration, no order / billing mutations).
import { createHash } from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERSIAN_STAGE={
  download:'دانلود عکس',presign:'آماده‌سازی آپلود',complete:'تأیید آپلود',
  submit:'ثبت سفارش',upload:'آپلود عکس'
};
const cleanName=value=>String(value||'').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim().slice(0,55);
const safeCode=value=>String(value||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,80);
const uuid=value=>typeof value==='string'&&UUID.test(value)?value:null;

export function stageFromErrorPath(value){
  const pathname=String(value||'').split(/[?#]/)[0];
  if(/(?:^|\/)(?:download|downloads|file-download|public-download|desktop-download)(?:[/-]|$)/i.test(pathname)
    ||/(?:download|stream|download-file)/i.test(pathname))return 'download';
  if(/presign/.test(pathname))return 'presign';
  if(/(?:uploads|upload)\/(?:complete|status)/.test(pathname))return 'complete';
  if(/\/submit(?:\/|$)/.test(pathname))return 'submit';
  return /(?:uploads|upload)/.test(pathname)?'upload':'api';
}
export function shouldNotifySms(incident){
  // Browser retries, outages and incident duplicates must never generate paid SMS.
  // Restrict SMS to server-confirmed failures in the photo-transfer pipeline.
  if(!incident||incident.source!=='server'||Number(incident.status)<500)return false;
  if(incident.channel==='network_path'||incident.channel==='browser')return false;
  return ['download','presign','complete','submit','upload'].includes(String(incident.stage));
}
export function fingerprintSms(incident){
  // Identity is from auth() on the server, never from client-supplied labels.
  const base=[incident.source,incident.stage,incident.code,incident.status,
    String(incident.route||'').replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,':id'),
    uuid(incident.labId)||'',uuid(incident.photographerId)||''];
  return createHash('sha256').update(JSON.stringify(base)).digest('hex').slice(0,48);
}
export async function loadSmsOrigin(pool,incident){
  const labId=uuid(incident.labId),photographerId=uuid(incident.photographerId);
  if(!labId&&!photographerId)return {lab:'نامشخص',photographer:'نامشخص'};
  // Read names only from existing authoritative DB rows.
  const sql=`SELECT
      (SELECT NULLIF(name,'') FROM labs WHERE id=$1::uuid) AS lab_name,
      (SELECT COALESCE(NULLIF(pp.studio_name,''),NULLIF(u.name,''))
         FROM users u LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
         WHERE u.id=$2::uuid) AS photographer_name`;
  const result=await pool.query(sql,[labId,photographerId]);
  return {lab:cleanName(result.rows[0]?.lab_name)||'نامشخص',
    photographer:cleanName(result.rows[0]?.photographer_name)||'نامشخص'};
}
export function formatAlertSms(incident,origin){
  const kind=PERSIAN_STAGE[String(incident.stage)]||'خطای برنامه';
  return ['هشدار PhotoBridge',
    'عملیات: '+kind,
    'لابراتوار: '+(cleanName(origin?.lab)||'نامشخص'),
    'عکاسی: '+(cleanName(origin?.photographer)||'نامشخص'),
    'خطا: '+safeCode(incident.code||'unknown')+' / '+(Number(incident.status)||0),
    'پیگیری: '+String(incident.id||'').replace(/[^A-Za-z0-9-]/g,'').slice(0,36),
    'جزئیات: photobridge.ir/admin/error-monitor'].join('\n');
}
export async function reserveAdminAlert(pool,incident,options){
  const key=fingerprintSms(incident),client=await pool.connect();
  let tx=false;
  try{
    await client.query('BEGIN');tx=true;
    // Serializes even across Liara replicas/restarts; prevents concurrent double claims.
    await client.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)',[1852,21]);
    const earlier=await client.query(
      `SELECT id FROM sms_delivery_log
       WHERE purpose='admin_alert' AND event_key='application_error'
         AND metadata->>'guardFingerprint'=$1 LIMIT 1`,[key]);
    if(earlier.rowCount){
      await client.query('COMMIT');tx=false;
      return {reserved:false,reason:'duplicate',fingerprint:key};
    }
    const budget=await client.query(
      `SELECT count(*)::int AS cnt FROM sms_delivery_log
        WHERE purpose='admin_alert' AND event_key='application_error'
          AND metadata->>'alertPolicy'='r1852'
          AND created_at>=now()-interval '24 hours'`);
    if(Number(budget.rows[0]?.cnt||0)>=3){
      await client.query('COMMIT');tx=false;
      return {reserved:false,reason:'daily_cap',fingerprint:key};
    }
    const payload=JSON.stringify({alertPolicy:'r1852',guardFingerprint:key,
      incidentId:String(incident.id||''),stage:String(incident.stage||''),
      labId:uuid(incident.labId),photographerId:uuid(incident.photographerId)});
    const inserted=await client.query(
      `INSERT INTO sms_delivery_log
       (provider,purpose,event_key,target_mobile,user_id,lab_id,status,error_code,metadata)
       VALUES($1,'admin_alert','application_error',$2,$3,$4,'skipped','reserved',$5::jsonb)
       RETURNING id`,[options.provider,options.mobile,options.adminId,uuid(incident.labId),payload]);
    if(!inserted.rowCount)throw Error('sms_claim_failed');
    await client.query('COMMIT');tx=false;
    return {reserved:true,id:inserted.rows[0].id,fingerprint:key};
  }catch(error){
    if(tx)await client.query('ROLLBACK').catch(()=>{});
    throw error;
  }finally{client.release();}
}
export async function completeAdminAlert(pool,reservation,{success,reference,errorCode}={}){
  if(!reservation?.reserved)return;
  const state=success?'sent':'failed';
  await pool.query(
    `UPDATE sms_delivery_log
       SET status=$2,provider_reference=$3,error_code=$4
       WHERE id=$1 AND purpose='admin_alert' AND event_key='application_error'
         AND status='skipped' AND metadata->>'alertPolicy'='r1852'`,
    [reservation.id,state,success?String(reference||'').slice(0,120):null,
      success?null:safeCode(errorCode||'delivery_failed')]);
}
