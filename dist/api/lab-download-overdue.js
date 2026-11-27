// R2068: server-side overdue download escalation. No dependency on Windows uptime.
const PREFIX='lab-download-overdue:v1:';
const key=(id,stage)=>PREFIX+id+':'+stage;
const limit=100;
const eligible="o.status IN ('sent','received') AND o.downloaded_at IS NULL AND COALESCE(o.source,'')<>'manual_invoice' AND (COALESCE(o.settlement_mode,'ledger')<>'prepaid' OR o.payment_status='paid') AND EXISTS(SELECT 1 FROM order_files f WHERE f.order_id=o.id AND f.lab_id=o.lab_id AND f.original_state='active' AND COALESCE(f.bytes,0)>0) AND NOT EXISTS(SELECT 1 FROM order_files f WHERE f.order_id=o.id AND f.lab_id=o.lab_id AND f.original_state='pending')";
const eligibilityTime="GREATEST(COALESCE((SELECT MIN(e.created_at) FROM order_status_events e WHERE e.order_id=o.id AND e.lab_id=o.lab_id AND e.status IN ('sent','received') AND e.created_at>=COALESCE((SELECT MAX(p.created_at) FROM order_status_events p WHERE p.order_id=o.id AND p.lab_id=o.lab_id AND p.status IN ('uploading','awaiting_payment')),o.created_at)),o.updated_at),COALESCE((SELECT MAX(r.reviewed_at) FROM order_payment_receipts r WHERE r.order_id=o.id AND r.lab_id=o.lab_id AND r.status='approved' AND o.settlement_mode='prepaid'),o.created_at))";
const candidateSQL=`
/* r2068 candidates */
WITH overdue AS (
 SELECT o.id,o.number,o.lab_id,o.mode,l.name lab_name,${eligibilityTime} eligible_at,
 m.updated_at manager_at,m.key manager_key,a.key admin_key
 FROM orders o JOIN labs l ON l.id=o.lab_id
 LEFT JOIN platform_settings m ON m.key='${PREFIX}'||o.id::text||':manager'
 LEFT JOIN platform_settings a ON a.key='${PREFIX}'||o.id::text||':admin'
 WHERE ${eligible} AND a.key IS NULL
)
SELECT *,CASE WHEN manager_key IS NULL THEN 'manager' ELSE 'admin' END stage
FROM overdue
WHERE eligible_at<=now()-interval '15 minutes'
AND (manager_key IS NULL OR manager_at<=now()-interval '30 minutes')
ORDER BY eligible_at,id LIMIT $1
`;
const freshSQL="/* r2068 still eligible */ SELECT 1 FROM orders o WHERE o.id=$1 AND o.lab_id=$2 AND "+eligible+" AND "+eligibilityTime+"<=now()-interval '15 minutes'";
const managerSQL="/* r2068 manager */ SELECT u.id,u.mobile FROM lab_memberships m JOIN users u ON u.id=m.user_id WHERE m.lab_id=$1 AND m.role='lab_admin' AND m.active=true AND u.active=true AND u.mobile IS NOT NULL ORDER BY m.created_at,u.id";
const adminSQL="/* r2068 admin */ SELECT id,mobile FROM users WHERE platform_role='platform_admin' AND active=true AND mobile IS NOT NULL ORDER BY created_at,id";
const claimSQL="/* r2068 claim */ INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO NOTHING RETURNING key";
const finishSQL="/* r2068 finish */ UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1";
function recipient(rows,normalizeMobile){
 for(const r of rows||[]){const mobile=normalizeMobile(r.mobile);if(/^09\d{9}$/.test(mobile))return {id:r.id,mobile};}
 return null;
}
function formatMessage(stage,lab,rows){
 const numbers=rows.slice(0,6).map(r=>String(r.number)).join('، ');
 const extra=rows.length>6?' و '+(rows.length-6)+' مورد دیگر':'';
 const name=String(lab||'لابراتوار').replace(/\s+/g,' ').slice(0,60);
 return stage==='manager'
 ?'PhotoBridge\n'+name+'؛ سفارش '+numbers+extra+' بیش از ۱۵ دقیقه دانلود نشده است. لطفاً سیستم و برنامه دانلود را بررسی کنید.'
 :'PhotoBridge\nهشدار پیگیری: '+name+'؛ سفارش '+numbers+extra+' پس از هشدار مدیر هنوز دانلود نشده است. لطفاً پیگیری کنید.';
}
async function dispatchGroup({pool,sendSms,normalizeMobile,log},rows,stage){
 const lab=rows[0],to=recipient((await pool.query(stage==='manager'?managerSQL:adminSQL,stage==='manager'?[lab.lab_id]:[])).rows,normalizeMobile);
 // If the central admin is not configured, do not consume the escalation.
 if(!to&&stage==='admin'){log('[R2068] central administrator mobile unavailable');return;}
 const claimed=[];
 for(const row of rows){
  if(!(await pool.query(freshSQL,[row.id,row.lab_id])).rowCount)continue;
  const id=key(row.id,stage);
  // Reserve before any external provider call. A crash/ambiguous provider result
  // is not automatically replayed; otherwise paid messages could duplicate.
  const claim=await pool.query(claimSQL,[id,JSON.stringify({status:'dispatching',orderId:row.id,labId:row.lab_id,stage})]);
  if(claim.rowCount)claimed.push(row);
 }
 if(!claimed.length)return;
 const pending=[];
 for(const row of claimed){
  if((await pool.query(freshSQL,[row.id,row.lab_id])).rowCount)pending.push(row);
  else await pool.query(finishSQL,[key(row.id,stage),JSON.stringify({status:'resolved',stage})]);
 }
 if(!pending.length)return;
 let result;
 if(!to)result={status:'no_manager_mobile'};
 else try{
  const response=await sendSms({mobile:to.mobile,message:formatMessage(stage,lab.lab_name,pending),purpose:stage==='manager'?'lab_download_overdue':'admin_lab_download_overdue',eventKey:stage==='manager'?'lab_download_overdue_15m':'lab_download_overdue_escalation',userId:to.id,labId:lab.lab_id,metadata:{stage,orderIds:pending.map(r=>r.id),orderNumbers:pending.map(r=>r.number)}});
  const providerStatus=String(response?.status||response?.state||'').toLowerCase();
  result={status:response?.ok===false||['failed','skipped','suppressed','disabled'].includes(providerStatus)?'not_sent':'sent',reference:response?.reference||null};
 }catch(error){result={status:'failed_or_unknown',error:String(error?.code||error?.message||'sms_error').slice(0,150)};}
 for(const row of pending)await pool.query(finishSQL,[key(row.id,stage),JSON.stringify({...result,stage,orderId:row.id,labId:row.lab_id})]);
 if(result.status!=='sent')log('[R2068] '+stage+' '+result.status+' lab='+lab.lab_id);
}
async function flushLabDownloadOverdue({pool,sendSms,normalizeMobile,log=console.warn}){
 const rows=(await pool.query(candidateSQL,[limit])).rows;
 const groups=new Map();
 for(const row of rows){
  const k=row.lab_id+':'+row.stage;
  if(!groups.has(k))groups.set(k,[]);
  groups.get(k).push(row);
 }
 for(const group of groups.values()){
  try{await dispatchGroup({pool,sendSms,normalizeMobile,log},group,group[0].stage);}
  catch(error){log('[R2068] '+String(error?.message||error));}
 }
}
function startLabDownloadOverdue(deps){
 let busy=false;
 const tick=async()=>{if(busy)return;busy=true;try{await flushLabDownloadOverdue(deps);}catch(error){(deps.log||console.warn)('[R2068] '+String(error?.message||error));}finally{busy=false;}};
 void tick();
 const timer=setInterval(()=>void tick(),60_000);timer.unref?.();
 return()=>clearInterval(timer);
}
export {flushLabDownloadOverdue,startLabDownloadOverdue,formatMessage,candidateSQL,freshSQL};
