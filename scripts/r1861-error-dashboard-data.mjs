// R1861: read-only, administrator-only daily error report. No schema changes.
// Calendar boundaries use Asia/Tehran; incident fingerprints are NOT per-day counts.
const TEHRAN='Asia/Tehran';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_OFFSET=1000000, PAGE_SIZE=200;

function badDate(){throw Object.assign(new Error('invalid_report_date'),{status:400});}
export function reportDate(value,now=new Date()){
  if(value==null||value===''){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:TEHRAN,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const get=kind=>parts.find(x=>x.type===kind)?.value;
    return [get('year'),get('month'),get('day')].join('-');
  }
  if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))badDate();
  const time=Date.parse(value+'T00:00:00Z');
  if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)badDate();
  return value;
}
function uuidFilter(value,field){
  if(value==null||value===''||value==='all')return null;
  if(typeof value!=='string'||!UUID.test(value))throw Object.assign(new Error('invalid_'+field),{status:400});
  return value.toLowerCase();
}
function offset(value){
  if(value==null||value==='')return 0;
  if(typeof value!=='string'||!/^(0|[1-9][0-9]{0,6})$/.test(value)||Number(value)>MAX_OFFSET)
    throw Object.assign(new Error('invalid_report_offset'),{status:400});
  return Number(value);
}
export function normalizeDailyFilters(input={},now=new Date()){
  return {
    day:reportDate(input.day,now),
    labId:uuidFilter(input.labId,'lab_id'),
    photographerId:uuidFilter(input.photographerId,'photographer_id'),
    eventOffset:offset(input.eventOffset),
    incidentOffset:offset(input.incidentOffset),
    successOffset:offset(input.successOffset),
    pageSize:PAGE_SIZE
  };
}
const dayStart="($1::date::timestamp AT TIME ZONE 'Asia/Tehran')";
const dayEnd="(($1::date + 1)::timestamp AT TIME ZONE 'Asia/Tehran')";
export const dailyStudiosSql=`
SELECT s.lab_id::text AS lab_id, COALESCE(NULLIF(l.name,''),'لابراتوار نامشخص') AS lab_name,
       s.photographer_id::text AS photographer_id,
       COALESCE(NULLIF(pp.studio_name,''),NULLIF(u.name,''),'عکاسی نامشخص') AS photographer_name,
       count(*)::int AS failures,
       count(DISTINCT e.session_id)::int AS sessions,
       count(DISTINCT e.file_id) FILTER(WHERE e.file_id IS NOT NULL)::int AS files,
       count(DISTINCT s.order_id) FILTER(WHERE s.order_id IS NOT NULL)::int AS orders,
       min(e.received_at) AS first_at,max(e.received_at) AS last_at,
       sum(COALESCE(e.sent_bytes,0))::text AS reported_sent_bytes
FROM upload_health_timeline_events e
JOIN upload_health_sessions s ON s.id=e.session_id
LEFT JOIN labs l ON l.id=s.lab_id
LEFT JOIN users u ON u.id=s.photographer_id
LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
WHERE e.state='failed' AND e.received_at>=${dayStart}
  AND e.received_at<${dayEnd}
GROUP BY s.lab_id,l.name,s.photographer_id,pp.studio_name,u.name
ORDER BY failures DESC,last_at DESC
LIMIT 3001`;
export const dailyEventsSql=`
SELECT e.id::text AS event_id,e.received_at,s.lab_id::text AS lab_id,
       COALESCE(NULLIF(l.name,''),'لابراتوار نامشخص') AS lab_name,
       s.photographer_id::text AS photographer_id,
       COALESCE(NULLIF(pp.studio_name,''),NULLIF(u.name,''),'عکاسی نامشخص') AS photographer_name,
       s.order_id::text AS order_id,o.number AS order_number,o.total AS order_total,
       e.file_id::text AS file_id, s.client_kind AS client,
       e.stage,e.state,e.category,e.error_code,e.http_status,
       e.sent_bytes::text AS sent_bytes,e.total_bytes::text AS total_bytes,
       e.duration_ms,e.online,
       count(*) OVER()::int AS total_rows
FROM upload_health_timeline_events e
JOIN upload_health_sessions s ON s.id=e.session_id
LEFT JOIN labs l ON l.id=s.lab_id
LEFT JOIN users u ON u.id=s.photographer_id
LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
LEFT JOIN orders o ON o.id=s.order_id AND o.lab_id=s.lab_id
WHERE e.state='failed' AND e.received_at>=${dayStart}
  AND e.received_at<${dayEnd}
  AND ($2::text IS NULL OR s.lab_id::text=$2)
  AND ($3::text IS NULL OR s.photographer_id::text=$3)
ORDER BY e.received_at DESC,e.id DESC
LIMIT $4 OFFSET $5`;
// Durable order success metrics are written exactly once when an order enters 'sent'.
// Legacy successful orders can survive order deletion, but their studio/amount will then be unknown.
export const dailySuccessSummarySql=`
SELECT m.lab_id::text AS lab_id,
       COALESCE(NULLIF(l.name,''),NULLIF(max(m.lab_name),''),'لابراتوار نامشخص') AS lab_name,
       o.customer_id::text AS photographer_id,
       COALESCE(NULLIF(pp.studio_name,''),NULLIF(u.name,''),'عکاسی نامشخص / سفارش قدیمی') AS photographer_name,
       count(*)::int AS successful_orders,
       sum(m.file_count)::text AS successful_files,
       sum(m.original_bytes)::text AS successful_bytes,
       sum(m.unknown_size_files)::text AS unknown_size_files,
       COALESCE(sum(o.total),0)::text AS order_total_amount,
       count(*) FILTER(WHERE o.total IS NOT NULL)::int AS orders_with_amount,
       count(*) FILTER(WHERE m.historical_snapshot)::int AS historical_orders,
       min(m.sent_at) AS first_at,max(m.sent_at) AS last_at
FROM upload_success_metrics m
LEFT JOIN labs l ON l.id=m.lab_id
LEFT JOIN orders o ON o.id=m.order_id AND o.lab_id=m.lab_id
LEFT JOIN users u ON u.id=o.customer_id
LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
WHERE m.mode='print' AND m.sent_at>=${dayStart} AND m.sent_at<${dayEnd}
GROUP BY m.lab_id,l.name,o.customer_id,pp.studio_name,u.name
ORDER BY successful_orders DESC,last_at DESC LIMIT 3001`;
export const dailySuccessSql=`
SELECT m.order_id::text AS order_id,m.sent_at,
       m.lab_id::text AS lab_id,
       COALESCE(NULLIF(l.name,''),NULLIF(m.lab_name,''),'لابراتوار نامشخص') AS lab_name,
       o.customer_id::text AS photographer_id,
       COALESCE(NULLIF(pp.studio_name,''),NULLIF(u.name,''),'عکاسی نامشخص / سفارش قدیمی') AS photographer_name,
       o.number AS order_number,o.total AS order_total,
       m.file_count::text AS file_count,m.original_bytes::text AS original_bytes,
       m.unknown_size_files::text AS unknown_size_files,m.historical_snapshot,
       count(*) OVER()::int AS total_rows
FROM upload_success_metrics m
LEFT JOIN labs l ON l.id=m.lab_id
LEFT JOIN orders o ON o.id=m.order_id AND o.lab_id=m.lab_id
LEFT JOIN users u ON u.id=o.customer_id
LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
WHERE m.mode='print' AND m.sent_at>=${dayStart} AND m.sent_at<${dayEnd}
  AND ($2::text IS NULL OR m.lab_id::text=$2)
  AND ($3::text IS NULL OR o.customer_id::text=$3)
ORDER BY m.sent_at DESC,m.order_id DESC LIMIT $4 OFFSET $5`;
export const dailyIncidentsSql=`
SELECT i.id,i.last_at,i.payload,
       COALESCE(NULLIF(l.name,''),'نامشخص') AS lab_name,
       COALESCE(NULLIF(pp.studio_name,''),NULLIF(u.name,''),'نامشخص') AS photographer_name,
       o.number AS order_number,o.total AS order_total,
       count(*) OVER()::int AS total_rows
FROM application_error_incidents i
LEFT JOIN order_files f ON f.id::text=i.payload->>'fileId'
  AND (NULLIF(i.payload->>'labId','') IS NULL OR f.lab_id::text=i.payload->>'labId')
LEFT JOIN orders o ON o.id=f.order_id
LEFT JOIN labs l ON l.id::text=COALESCE(NULLIF(i.payload->>'labId',''),f.lab_id::text)
LEFT JOIN users u ON u.id::text=COALESCE(NULLIF(i.payload->>'photographerId',''),f.customer_id::text)
LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
WHERE i.last_at>=${dayStart} AND i.last_at<${dayEnd}
  AND ($2::text IS NULL OR COALESCE(NULLIF(i.payload->>'labId',''),f.lab_id::text)=$2)
  AND ($3::text IS NULL OR COALESCE(NULLIF(i.payload->>'photographerId',''),f.customer_id::text)=$3)
ORDER BY i.last_at DESC,i.id DESC
LIMIT $4 OFFSET $5`;
export async function getDailyErrorReport(pool,input={},now=new Date()){
  const filter=normalizeDailyFilters(input,now);
  // Only existing, server-recorded events and incident payloads are queried.
  // Never include file names, S3 object keys, signed URLs or request bodies.
  const [summaryQ,eventsQ,incidentsQ,successSummaryQ,successesQ]=await Promise.all([
    pool.query(dailyStudiosSql,[filter.day]),
    pool.query(dailyEventsSql,[filter.day,filter.labId,filter.photographerId,filter.pageSize,filter.eventOffset]),
    pool.query(dailyIncidentsSql,[filter.day,filter.labId,filter.photographerId,filter.pageSize,filter.incidentOffset]),
    pool.query(dailySuccessSummarySql,[filter.day]),
    pool.query(dailySuccessSql,[filter.day,filter.labId,filter.photographerId,filter.pageSize,filter.successOffset])
  ]);
  const summary=summaryQ.rows.slice(0,3000),events=eventsQ.rows,incidents=incidentsQ.rows;
  const successSummary=successSummaryQ.rows.slice(0,3000),successes=successesQ.rows;
  return {
    day:filter.day,timezone:TEHRAN,
    labId:filter.labId,photographerId:filter.photographerId,
    summary,summaryTruncated:summaryQ.rows.length>3000,
    successSummary,successSummaryTruncated:successSummaryQ.rows.length>3000,
    successes,successesTotal:Number(successes[0]?.total_rows||0),successOffset:filter.successOffset,
    events,eventsTotal:Number(events[0]?.total_rows||0),
    eventOffset:filter.eventOffset,
    incidents,incidentsTotal:Number(incidents[0]?.total_rows||0),
    incidentOffset:filter.incidentOffset,
    pageSize:filter.pageSize,
    incidentCountNote:'Incident count is a lifetime fingerprint total, not the selected-day count; last_at falls in the selected day.'
  };
}
