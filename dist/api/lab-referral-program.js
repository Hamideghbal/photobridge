// R1616: Lab-to-Lab referrals. Independent from photographer invitations,
// print orders, invoice pricing and all existing wallet debits.
import crypto from 'node:crypto';
export const LAB_REFERRAL_DISCOUNT=30;
export const LAB_REFERRAL_REWARD=10;
const FORMAT=/^LB[A-F0-9]{18}$/;
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});

export function normalizeReferralCode(value){
 const s=String(value||'').trim().toUpperCase();
 return FORMAT.test(s)?s:'';
}
export function calculateReferralDiscount(amount,special,eligible){
 if(!eligible)return special;
 const base=Math.max(0,Math.round(Number(amount)||0));
 const normal=Math.min(base,Math.max(0,Math.round(Number(special?.specialDiscountAmount)||0)));
 const target=Math.round(base*LAB_REFERRAL_DISCOUNT/100);
 const granted=Math.max(normal,target);
 return {...special,amount:base-granted,specialDiscountAmount:granted,
  discountPercent:granted>normal?LAB_REFERRAL_DISCOUNT:Number(special?.discountPercent||0),
  referralDiscountPercent:LAB_REFERRAL_DISCOUNT,
  referralExtraDiscount:granted-normal};
}
export async function referralEligibility(db,labId){
 const q=await db.query("SELECT 1 FROM lab_referrals WHERE referred_lab_id=$1",[labId]);
 return Boolean(q.rowCount);
}
export async function validateReferral(db,code,mobile,userId){
 const token=normalizeReferralCode(code);
 if(!token)throw fail('lab_referral_invalid');
 const q=await db.query(
  "SELECT c.lab_id,c.code,l.name,l.active,l.suspended,l.created_by FROM lab_referral_codes c JOIN labs l ON l.id=c.lab_id WHERE c.code=$1",
  [token]);
 if(!q.rowCount||q.rows[0].active!==true||q.rows[0].suspended===true)
  throw fail('lab_referral_unavailable',404);
 const owner=q.rows[0];
 if(userId&&String(userId)===String(owner.created_by))throw fail('lab_referral_self_invite',409);
 if(userId){
  const same=await db.query(
   "SELECT 1 FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 AND role='lab_admin' AND active=true LIMIT 1",
   [owner.lab_id,userId]);
  if(same.rowCount)throw fail('lab_referral_self_invite',409);
 }
 const tail=String(mobile||'').replace(/\D/g,'').slice(-10);
 if(tail.length===10){
  const samePhone=await db.query(
   "SELECT 1 FROM lab_memberships lm JOIN users u ON u.id=lm.user_id WHERE lm.lab_id=$1 AND lm.role='lab_admin' AND lm.active=true AND right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=$2 LIMIT 1",
   [owner.lab_id,tail]);
  if(samePhone.rowCount)throw fail('lab_referral_self_invite',409);
 }
 return owner;
}
export async function attachReferral(db,{labId,referralCode,userId,mobile}){
 if(!referralCode)return null;
 const owner=await validateReferral(db,referralCode,mobile,userId);
 if(String(owner.lab_id)===String(labId))throw fail('lab_referral_self_invite',409);
 const q=await db.query(
  "INSERT INTO lab_referrals(referred_lab_id,referrer_lab_id,invite_code) VALUES($1,$2,$3) ON CONFLICT(referred_lab_id) DO NOTHING RETURNING referred_lab_id",
  [labId,owner.lab_id,owner.code]);
 if(!q.rowCount)throw fail('lab_referral_already_claimed',409);
 return {referrerLabId:owner.lab_id,discountPercent:LAB_REFERRAL_DISCOUNT};
}
export async function getOrCreateReferralCode(db,labId,userId){
 const lab=await db.query("SELECT active,suspended FROM labs WHERE id=$1",[labId]);
 if(!lab.rowCount||lab.rows[0].active!==true||lab.rows[0].suspended===true)
  throw fail('lab_referral_requires_active_lab',409);
 for(let attempt=0;attempt<4;attempt++){
  const code='LB'+crypto.randomBytes(9).toString('hex').toUpperCase();
  await db.query(
   "INSERT INTO lab_referral_codes(lab_id,code,created_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
   [labId,code,userId]);
  const q=await db.query("SELECT code FROM lab_referral_codes WHERE lab_id=$1",[labId]);
  if(q.rowCount)return q.rows[0].code;
 }
 throw fail('lab_referral_code_unavailable',503);
}
export async function referralOverview(db,labId){
 const q=await db.query(
  "SELECT r.referred_lab_id,l.name,l.created_at,COALESCE(SUM(c.reward_amount),0)::bigint reward_total,COUNT(c.id)::int paid_count FROM lab_referrals r JOIN labs l ON l.id=r.referred_lab_id LEFT JOIN lab_referral_commissions c ON c.referred_lab_id=r.referred_lab_id WHERE r.referrer_lab_id=$1 GROUP BY r.referred_lab_id,l.name,l.created_at ORDER BY l.created_at DESC LIMIT 100",
  [labId]);
 const total=await db.query(
  "SELECT COALESCE(SUM(reward_amount),0)::bigint total,COUNT(*)::int count FROM lab_referral_commissions WHERE referrer_lab_id=$1",
  [labId]);
 return {introduced:q.rows.map(x=>({...x,reward_total:Number(x.reward_total||0)})),
  earned:Number(total.rows[0]?.total||0),paidCount:Number(total.rows[0]?.count||0)};
}
export async function rewardConfirmedPayment(db,{referredLabId,kind,paymentId,actualPaid},ensureWallet){
 if(!referredLabId||!['subscription','wallet_topup'].includes(kind)||
    !/^[0-9a-f-]{36}$/i.test(String(paymentId||'')))return null;
 const paid=Math.round(Number(actualPaid));
 if(!Number.isSafeInteger(paid)||paid<1||paid>1e12)return null;
 const q=await db.query("SELECT referrer_lab_id FROM lab_referrals WHERE referred_lab_id=$1 LIMIT 1",[referredLabId]);
 if(!q.rowCount)return null;
 const inviter=q.rows[0].referrer_lab_id;
 if(String(inviter)===String(referredLabId))throw fail('lab_referral_self_invite',409);
 const reward=Math.round(paid*LAB_REFERRAL_REWARD/100);
 if(reward<1)return null;
 await ensureWallet(db,inviter);
 // Calling transaction must commit the commission, wallet movement and
 // verified payment together. The unique payment key prevents callback replay.
 const wallet=await db.query("SELECT balance FROM lab_service_wallets WHERE lab_id=$1 FOR UPDATE",[inviter]);
 if(!wallet.rowCount)throw fail('lab_referral_wallet_missing',409);
 const before=Number(wallet.rows[0].balance);
 if(!Number.isSafeInteger(before)||before<0||!Number.isSafeInteger(before+reward))
  throw fail('lab_referral_wallet_overflow',409);
 const commission=await db.query(
  "INSERT INTO lab_referral_commissions(referrer_lab_id,referred_lab_id,payment_kind,payment_id,paid_amount,reward_amount) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(payment_kind,payment_id) DO NOTHING RETURNING id",
  [inviter,referredLabId,kind,paymentId,paid,reward]);
 if(!commission.rowCount)return {credited:false,duplicate:true};
 const next=before+reward;
 await db.query("UPDATE lab_service_wallets SET balance=$2,updated_at=now() WHERE lab_id=$1",[inviter,next]);
 const key='lab-referral:'+kind+':'+String(paymentId);
 const movement=await db.query(
  "INSERT INTO service_wallet_transactions(lab_id,kind,amount,balance_after,reference_type,reference_id,reference_key,note,metadata) VALUES($1,'credit',$2,$3,'lab_referral_commission',$4,$5,$6,$7::jsonb) RETURNING id",
  [inviter,reward,next,String(paymentId),key,'پاداش معرفی لابراتوار',
   JSON.stringify({referredLabId,kind,actualPaid:paid,percent:LAB_REFERRAL_REWARD})]);
 await db.query("UPDATE lab_referral_commissions SET wallet_transaction_id=$2 WHERE id=$1",
  [commission.rows[0].id,movement.rows[0].id]);
 return {credited:true,amount:reward,inviterLabId:inviter};
}

export async function reserveReferralSms(db,labId,mobile){
 const c=await db.connect();
 try{
  await c.query('BEGIN');
  // Serializes all sends for one Lab; no concurrent throttle bypass.
  await c.query("SELECT id FROM labs WHERE id=$1 FOR UPDATE",[labId]);
  const count=await c.query(
   "SELECT count(*)::int AS n FROM lab_referral_sms_attempts WHERE lab_id=$1 AND created_at>now()-interval '1 hour'",[labId]);
  if(Number(count.rows[0]?.n||0)>=15)throw fail('lab_referral_sms_hourly_limit',429);
  const repeat=await c.query(
   "SELECT 1 FROM lab_referral_sms_attempts WHERE lab_id=$1 AND recipient_mobile=$2 AND created_at>now()-interval '10 minutes' LIMIT 1",
   [labId,mobile]);
  if(repeat.rowCount)throw fail('lab_referral_sms_repeat_limit',429);
  const q=await c.query(
   "INSERT INTO lab_referral_sms_attempts(lab_id,recipient_mobile) VALUES($1,$2) RETURNING id",
   [labId,mobile]);
  await c.query('COMMIT');
  return q.rows[0].id;
 }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error}
 finally{c.release()}
}

export async function handleReferralApi({req,res,url,a,pool,bodyJson,sendJson,requireRole,sendSms,publicUrl}){
 if(req.method==='GET'&&url.pathname==='/api/public/lab-referral/preview'){
  const code=normalizeReferralCode(url.searchParams.get('code'));
  if(!code)return sendJson(res,400,{error:'lab_referral_invalid'}),true;
  try{
   const q=await pool.query(
    "SELECT l.name,l.active,l.suspended FROM lab_referral_codes c JOIN labs l ON l.id=c.lab_id WHERE c.code=$1",
    [code]);
   const row=q.rows[0];
   if(!row||row.active!==true||row.suspended===true)
    return sendJson(res,404,{error:'lab_referral_unavailable'}),true;
   return sendJson(res,200,{inviterName:row.name,discountPercent:LAB_REFERRAL_DISCOUNT}),true;
  }catch(err){throw err}
 }
 if(url.pathname!=='/api/lab/referrals'&&url.pathname!=='/api/lab/referrals/send-sms')
  return false;
 if(!requireRole(a,'lab_admin')||!a?.labId)
  return sendJson(res,403,{error:'forbidden'}),true;
 const labId=a.labId;
 try{
  const code=await getOrCreateReferralCode(pool,labId,a.userId);
  const link=publicUrl+'/trial?labReferral='+encodeURIComponent(code);
  if(req.method==='GET'&&url.pathname==='/api/lab/referrals'){
   const data=await referralOverview(pool,labId);
   return sendJson(res,200,{code,inviteUrl:link,
    discountPercent:LAB_REFERRAL_DISCOUNT,rewardPercent:LAB_REFERRAL_REWARD,
    benefitScope:'lab_subscription',rewardScope:['subscription','wallet_topup'],
    ...data}),true;
  }
  if(req.method==='POST'&&url.pathname==='/api/lab/referrals/send-sms'){
   const payload=await bodyJson(req);
   const mobile=String(payload.mobile||'').trim().replace(/[٠-٩۰-۹]/g,d=>{
    const i='۰۱۲۳۴۵۶۷۸۹'.indexOf(d);return i>=0?String(i):String('٠١٢٣٤٥٦٧٨٩'.indexOf(d));
   }).replace(/\D/g,'');
   const target=/^989\d{9}$/.test(mobile)?'0'+mobile.slice(2):/^9\d{9}$/.test(mobile)?'0'+mobile:mobile;
   if(!/^09\d{9}$/.test(target))return sendJson(res,400,{error:'invalid_mobile'}),true;
   const owner=await pool.query(
    "SELECT 1 FROM lab_memberships lm JOIN users u ON u.id=lm.user_id WHERE lm.lab_id=$1 AND lm.role='lab_admin' AND lm.active=true AND right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=$2",
    [labId,target.slice(-10)]);
   if(owner.rowCount)return sendJson(res,409,{error:'lab_referral_self_invite'}),true;
   const reserved=await reserveReferralSms(pool,labId,target);
   try{
    await sendSms({mobile:target,message:'PhotoBridge: دعوت به عضویت لابراتوار با ۳۰٪ تخفیف اشتراک.\nثبت‌نام: '+link,
     purpose:'lab_referral_invitation',eventKey:'lab_referral_invitation',labId,userId:a.userId,
     metadata:{referralCode:code}});
    await pool.query("UPDATE lab_referral_sms_attempts SET status='sent',sent_at=now() WHERE id=$1",[reserved]);
    return sendJson(res,200,{ok:true,sent:true}),true;
   }catch(error){
    await pool.query("UPDATE lab_referral_sms_attempts SET status='failed' WHERE id=$1",[reserved]).catch(()=>{});
    throw error;
   }
  }
  return sendJson(res,405,{error:'method_not_allowed'}),true;
 }catch(error){
  const code=String(error.code||error.message||'lab_referral_failed');
  const http=Number(error.status||0);
  return sendJson(res,http>=400&&http<600?http:503,{error:code}),true;
 }
}
