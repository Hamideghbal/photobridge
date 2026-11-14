// R1851 upload health: limited, authenticated, idempotent diagnostic events.
// No filenames, object keys, signed URLs, image data, cookies or request bodies.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGES=new Set(['session','create','presign','transfer','complete','derivative','submit','cleanup']);
const STATES=new Set(['started','progress','ok','failed','aborted','unknown']);
const CLIENTS=new Set(['web','mobile','windows']);
const MAX_BYTES=5368709120;
function bad(code,status=400){return Object.assign(new Error(code),{status});}
function uid(value,required=false){
  if(value==null||value===''){if(required)throw bad('missing_event_id');return null;}
  if(typeof value!=='string'||!UUID.test(value))throw bad('invalid_event_id');
  return value.toLowerCase();
}
function quantity(value,max){
  if(value===undefined||value===null)return null;
  if(!Number.isSafeInteger(value)||value<0||value>max)throw bad('invalid_upload_metric');
  return value;
}
export function classifyUploadHealth(e){
  if(e.state!=='failed')return 'none';
  if(e.online===false)return 'offline';
  const code=String(e.errorCode||'').toLowerCase();
  if(/abort|cancel/.test(code))return 'cancelled';
  if(/timeout|timedout/.test(code)||[408,504].includes(e.httpStatus))return 'timeout';
  if(e.httpStatus===413||/too_large|limit|quota/.test(code))return 'size_or_quota';
  if((e.stage==='complete'&&e.httpStatus===422)||/heic|convert|jpeg|derivative/.test(code))return 'derivative';
  if(e.stage==='transfer')return 'storage_or_network';
  if(e.stage==='presign')return 'presign';
  if(e.stage==='submit')return 'order_submit';
  if(e.stage==='complete')return 'verify';
  return 'application';
}
export function normalizeUploadHealthEvent(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw bad('invalid_upload_event');
  const eventId=uid(raw.eventId,true),sessionId=uid(raw.sessionId,true);
  const fileId=uid(raw.fileId),attemptId=uid(raw.attemptId);
  const serverFileId=uid(raw.serverFileId),orderId=uid(raw.orderId);
  const stage=String(raw.stage||''),state=String(raw.state||'');
  if(!STAGES.has(stage)||!STATES.has(state))throw bad('invalid_upload_stage');
  if(serverFileId&&!fileId)throw bad('upload_file_required');
  const client=CLIENTS.has(raw.client)?raw.client:'web';
  const errorCode=String(raw.errorCode||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,80)||null;
  const httpStatus=quantity(raw.httpStatus,599);
  const sentBytes=quantity(raw.sentBytes,MAX_BYTES);
  const totalBytes=quantity(raw.totalBytes,MAX_BYTES);
  const durationMs=quantity(raw.durationMs,86400000);
  if(sentBytes!==null&&totalBytes!==null&&sentBytes>totalBytes)throw bad('invalid_byte_progress');
  const online=typeof raw.online==='boolean'?raw.online:null;
  const event={eventId,sessionId,fileId,attemptId,serverFileId,orderId,stage,state,client,
    errorCode,httpStatus,sentBytes,totalBytes,durationMs,online};
  event.category=classifyUploadHealth(event);
  return event;
}
export async function recordUploadHealthEvents(pool,{photographerId,labId,events}){
  if(!Array.isArray(events)||events.length<1||events.length>16)throw bad('invalid_event_batch');
  const rows=events.map(normalizeUploadHealthEvent);
  const client=await pool.connect();
  let inserted=0;
  try{
    await client.query('BEGIN');
    const orders=new Set(),fileIds=new Set();
    for(const e of rows){
      if(e.orderId&&!orders.has(e.orderId)){
        const result=await client.query('SELECT 1 FROM orders WHERE id=$1 AND customer_id=$2 AND lab_id=$3',[e.orderId,photographerId,labId]);
        if(!result.rowCount)throw bad('upload_order_not_owned',403);
        orders.add(e.orderId);
      }
      if(e.serverFileId&&!fileIds.has(e.serverFileId)){
        const result=await client.query('SELECT 1 FROM order_files WHERE id=$1 AND customer_id=$2 AND lab_id=$3',[e.serverFileId,photographerId,labId]);
        if(!result.rowCount)throw bad('upload_file_not_owned',403);
        fileIds.add(e.serverFileId);
      }
      const session=await client.query(
        `INSERT INTO upload_health_sessions(id,photographer_id,lab_id,order_id,client_kind)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT(id) DO UPDATE SET
          order_id=COALESCE(EXCLUDED.order_id,upload_health_sessions.order_id),
          updated_at=now()
         WHERE upload_health_sessions.photographer_id=EXCLUDED.photographer_id
           AND upload_health_sessions.lab_id=EXCLUDED.lab_id
         RETURNING id`,
        [e.sessionId,photographerId,labId,e.orderId,e.client]);
      if(!session.rowCount)throw bad('upload_session_collision',409);
      if(e.fileId){
        const file=await client.query(
          `INSERT INTO upload_health_files(id,session_id,server_file_id,total_bytes)
           VALUES($1,$2,$3,$4)
           ON CONFLICT(id) DO UPDATE SET
            server_file_id=COALESCE(EXCLUDED.server_file_id,upload_health_files.server_file_id),
            total_bytes=COALESCE(EXCLUDED.total_bytes,upload_health_files.total_bytes),
            updated_at=now()
           WHERE upload_health_files.session_id=EXCLUDED.session_id
             AND (upload_health_files.server_file_id IS NULL OR
                  EXCLUDED.server_file_id IS NULL OR
                  upload_health_files.server_file_id=EXCLUDED.server_file_id)
           RETURNING id`,
          [e.fileId,e.sessionId,e.serverFileId,e.totalBytes]);
        if(!file.rowCount)throw bad('upload_file_collision',409);
      }
      if(e.attemptId){
        const attempt=await client.query(
          `INSERT INTO upload_health_attempts(id,session_id,file_id,stage,state,error_code,http_status)
           VALUES($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT(id) DO UPDATE SET
            stage=EXCLUDED.stage,state=EXCLUDED.state,error_code=EXCLUDED.error_code,
            http_status=EXCLUDED.http_status,updated_at=now()
           WHERE upload_health_attempts.session_id=EXCLUDED.session_id
             AND (upload_health_attempts.file_id IS NULL OR
                  EXCLUDED.file_id IS NULL OR
                  upload_health_attempts.file_id=EXCLUDED.file_id)
           RETURNING id`,
          [e.attemptId,e.sessionId,e.fileId,e.stage,e.state,e.errorCode,e.httpStatus]);
        if(!attempt.rowCount)throw bad('upload_attempt_collision',409);
      }
      const result=await client.query(
        `INSERT INTO upload_health_timeline_events
          (id,session_id,file_id,attempt_id,stage,state,category,error_code,http_status,
           sent_bytes,total_bytes,duration_ms,online)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT(id) DO NOTHING RETURNING id`,
        [e.eventId,e.sessionId,e.fileId,e.attemptId,e.stage,e.state,e.category,e.errorCode,
          e.httpStatus,e.sentBytes,e.totalBytes,e.durationMs,e.online]);
      inserted+=result.rowCount;
    }
    await client.query('COMMIT');
    return {accepted:inserted,duplicates:rows.length-inserted};
  }catch(error){
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  }finally{client.release();}
}
export const uploadHealthSummarySql=`
SELECT (e.received_at AT TIME ZONE 'Asia/Tehran')::date::text AS day,
       s.lab_id::text AS lab_id,COALESCE(l.name,'—') AS lab_name,
       count(DISTINCT e.session_id)::int AS sessions,
       count(DISTINCT e.file_id) FILTER(WHERE e.file_id IS NOT NULL)::int AS files,
       count(DISTINCT e.attempt_id) FILTER(WHERE e.stage='transfer')::int AS transfer_attempts,
       count(DISTINCT e.attempt_id) FILTER(WHERE e.stage='transfer' AND e.state='ok')::int AS successful_transfers,
       count(*) FILTER(WHERE e.state='failed')::int AS failures,
       round(percentile_cont(0.5) WITHIN GROUP(ORDER BY e.duration_ms)
         FILTER(WHERE e.stage='transfer' AND e.state='ok' AND e.duration_ms IS NOT NULL))::int AS p50_transfer_ms,
       round(percentile_cont(0.95) WITHIN GROUP(ORDER BY e.duration_ms)
         FILTER(WHERE e.stage='transfer' AND e.state='ok' AND e.duration_ms IS NOT NULL))::int AS p95_transfer_ms
FROM upload_health_timeline_events e
JOIN upload_health_sessions s ON s.id=e.session_id
LEFT JOIN labs l ON l.id=s.lab_id
WHERE e.received_at>=now()-interval '14 days'
GROUP BY 1,2,3 ORDER BY day DESC,lab_name LIMIT 500`;
export const uploadHealthFailureSql=`
SELECT e.category,e.stage,COALESCE(e.error_code,'unknown') AS error_code,
       COALESCE(e.http_status,0)::int AS http_status,
       count(*)::int AS events,max(e.received_at) AS last_at
FROM upload_health_timeline_events e
WHERE e.received_at>=now()-interval '14 days' AND e.state='failed'
GROUP BY 1,2,3,4 ORDER BY events DESC,last_at DESC LIMIT 50`;
