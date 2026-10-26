const DAY=86400000;
export function subscriptionNotice(lab,now=Date.now()){
 const end=lab?.active_until instanceof Date?lab.active_until.getTime():Date.parse(lab?.active_until);if(!lab?.active||lab.suspended||lab.service_only||!Number.isFinite(end)||end-now>3*DAY)return null;
 return {expiresAt:new Date(end).toISOString(),days:Math.max(0,Math.ceil((end-now)/DAY)),expired:end<=now};
}
export async function flushLabSubscriptionNotices({pool,sendSms,normalizeMobile,publicUrl,now=()=>Date.now()}){
 const candidates=await pool.query(`SELECT id FROM labs WHERE active=true AND COALESCE(suspended,false)=false AND COALESCE(service_only,false)=false AND active_until<=now()+interval '3 days' AND active_until>now()-interval '1 day' ORDER BY active_until`);
 for(const row of candidates.rows){const db=await pool.connect();let key=null,claimed=false;
  try{
   const q=await db.query(`SELECT l.*,u.id manager_id,u.mobile manager_mobile FROM labs l LEFT JOIN LATERAL (SELECT u.id,u.mobile FROM lab_memberships m JOIN users u ON u.id=m.user_id WHERE m.lab_id=l.id AND m.role='lab_admin' AND m.active=true AND u.active=true ORDER BY m.created_at LIMIT 1) u ON true WHERE l.id=$1`,[row.id]);
   const lab=q.rows[0],notice=subscriptionNotice(lab,now());if(!notice)continue;
   const mobile=normalizeMobile(lab.manager_mobile);if(!/^09\d{9}$/.test(mobile))continue;
   key=`lab-subscription-notice:${row.id}:${notice.expiresAt}:${notice.expired?'expired':notice.days}`;
   const claim=await db.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,'{"status":"dispatching"}'::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now() WHERE platform_settings.value->>'status'='retry' RETURNING key`,[key]);if(!claim.rowCount)continue;claimed=true;
   // A durable claim prevents duplicates across workers/restarts, including unknown provider outcomes.
   await db.query('BEGIN');const fresh=await db.query('SELECT * FROM labs WHERE id=$1 FOR UPDATE',[row.id]);const current=subscriptionNotice(fresh.rows[0],now());
   if(!current||current.expiresAt!==notice.expiresAt||current.days!==notice.days){await db.query('ROLLBACK');await db.query("UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1",[key,JSON.stringify({status:'cancelled'})]);continue;}
   const link=new URL('/lab/settings/subscription',publicUrl).href;
   const message=notice.expired?`PhotoBridge\nمدیر لابراتوار ${lab.name}، اعتبار اشتراک پایان یافته و ثبت کار جدید به علت تمدیدنشدن غیرفعال شده است. پرداخت و تمدید:\n${link}`:`PhotoBridge\nمدیر لابراتوار ${lab.name}، ${notice.days.toLocaleString('fa-IR')} روز تا پایان اعتبار اشتراک باقی مانده است. برای جلوگیری از توقف ثبت کار جدید، اشتراک را تمدید کنید:\n${link}`;
   const result=await sendSms({mobile,message,purpose:'lab_subscription_notice',eventKey:notice.expired?'lab_subscription_expired':'lab_subscription_expiring',userId:lab.manager_id,labId:lab.id,metadata:{expiresAt:notice.expiresAt,days:notice.days}});
   await db.query('COMMIT');await db.query("UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1",[key,JSON.stringify({status:'sent',reference:result?.reference||null})]);
  }catch(e){await db.query('ROLLBACK').catch(()=>{});if(claimed)await db.query("UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1",[key,JSON.stringify({status:['sms_not_configured','sms_provider_unsupported'].includes(e?.message)?'retry':'failed',error:String(e?.message||e).slice(0,300)})]).catch(()=>{});console.error('[lab-subscription-notice]',String(e?.message||e));}finally{db.release()}
 }
}
export function startLabSubscriptionNotices(deps){let busy=false;const tick=async()=>{if(busy)return;busy=true;try{await flushLabSubscriptionNotices(deps)}catch(e){console.error('[lab-subscription-notices]',String(e?.message||e))}finally{busy=false}};void tick();const timer=setInterval(()=>void tick(),15*60*1000);timer.unref?.();return()=>clearInterval(timer)}
