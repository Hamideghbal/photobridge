import crypto from 'node:crypto';
import {validLabReferralMobile,validLabReferralCode,lookupLabReferral} from './lab-referral-policy.js';

function linkForReferral(appUrl,code){
 const out=new URL('/trial',appUrl);
 out.searchParams.set('labReferral',code);
 return out.href;
}
export async function handlePublicLabReferral({req,res,url,pool,sendJson}){
 if(url.pathname!=='/api/public/lab-referral/validate')return false;
 if(req.method!=='GET'){sendJson(res,405,{error:'method_not_allowed'});return true;}
 const code=String(url.searchParams.get('code')||'').trim().toUpperCase();
 const r=await lookupLabReferral(pool,code);
 sendJson(res,r?200:404,r?{valid:true,referrerName:r.referrer_name,discountPercent:30}:{valid:false,error:'lab_referral_invalid'});
 return true;
}
export async function handleLabReferral({req,res,url,labId,userId,pool,bodyJson,sendJson,sendSms,normalizeMobile,publicUrl}){
 if(!url.pathname.startsWith('/api/lab/referrals'))return false;
 const respond=(status,data)=>{sendJson(res,status,data);return true;};
 const lab=await pool.query('SELECT id,name,active,suspended,service_only FROM labs WHERE id=$1',[labId]);
 if(!lab.rowCount||!lab.rows[0].active||lab.rows[0].suspended||lab.rows[0].service_only)
  return respond(403,{error:'lab_referral_not_allowed'});
 if(url.pathname==='/api/lab/referrals'&&req.method==='GET'){
  const invite=(await pool.query('SELECT id,code,active,created_at FROM lab_referral_invites WHERE referrer_lab_id=$1',[labId])).rows[0]||null;
  const labs=await pool.query('SELECT r.referred_lab_id,l.name,l.active,l.activation_status,r.created_at FROM lab_referral_memberships r JOIN labs l ON l.id=r.referred_lab_id WHERE r.referrer_lab_id=$1 ORDER BY r.created_at DESC LIMIT 200',[labId]);
  const payments=await pool.query('SELECT source_kind,paid_amount,reward_amount,created_at FROM lab_referral_rewards WHERE referrer_lab_id=$1 ORDER BY created_at DESC LIMIT 100',[labId]);
  const wallet=await pool.query('SELECT balance FROM lab_service_wallets WHERE lab_id=$1',[labId]);
  const earned=await pool.query('SELECT COALESCE(SUM(reward_amount),0)::bigint total FROM lab_referral_rewards WHERE referrer_lab_id=$1',[labId]);
  return respond(200,{invite:invite?{code:invite.code,active:invite.active,createdAt:invite.created_at,link:linkForReferral(publicUrl,invite.code)}:null,
    referredLabs:labs.rows,rewards:payments.rows,rewardTotal:Number(earned.rows[0]?.total||0),walletBalance:Number(wallet.rows[0]?.balance||0),offer:{referredDiscountPercent:30,referrerRewardPercent:10}});
 }
 if(url.pathname==='/api/lab/referrals/invite'&&req.method==='POST'){
  // Each lab keeps one permanent random link: multiple invitations can reuse it.
  const code=crypto.randomBytes(8).toString('hex').toUpperCase();
  const q=await pool.query("INSERT INTO lab_referral_invites(referrer_lab_id,code,active,created_by) VALUES($1,$2,true,$3) ON CONFLICT(referrer_lab_id) DO UPDATE SET active=true,updated_at=now() RETURNING code",[labId,code,userId]);
  return respond(200,{code:q.rows[0].code,link:linkForReferral(publicUrl,q.rows[0].code),discountPercent:30,rewardPercent:10});
 }
 if(url.pathname==='/api/lab/referrals/send'&&req.method==='POST'){
  const b=await bodyJson(req);
  const mobile=normalizeMobile(String(b.mobile||''));
  if(!validLabReferralMobile(mobile))return respond(400,{error:'invalid_mobile'});
  const invite=(await pool.query('SELECT id,code FROM lab_referral_invites WHERE referrer_lab_id=$1 AND active=true',[labId])).rows[0];
  if(!invite)return respond(409,{error:'lab_referral_invite_required'});
  // Unrelated SMS invitation flows remain unchanged. Limit referral SMS
  // both per target and per lab so links cannot become bulk spam.
  const daily=await pool.query("SELECT COUNT(*)::int total FROM lab_referral_sent_invites WHERE invite_id=$1 AND created_at>now()-interval '24 hours'",[invite.id]);
  if(Number(daily.rows[0]?.total||0)>=20)return respond(429,{error:'lab_referral_sms_daily_limit'});
  const recent=await pool.query("SELECT COUNT(*)::int total FROM lab_referral_sent_invites WHERE invite_id=$1 AND target_mobile=$2 AND created_at>now()-interval '10 minutes'",[invite.id,mobile]);
  if(Number(recent.rows[0]?.total||0)>0)return respond(429,{error:'lab_referral_sms_cooldown'});
  const log=await pool.query("INSERT INTO lab_referral_sent_invites(invite_id,target_mobile,status,created_by) VALUES($1,$2,'processing',$3) RETURNING id",[invite.id,mobile,userId]);
  const id=log.rows[0].id;
  const link=linkForReferral(publicUrl,invite.code);
  try{
   const result=await sendSms({mobile,labId,userId,purpose:'lab_referral_invite',eventKey:'lab_referral_invite',
    message:'PhotoBridge\n'+lab.rows[0].name+' شما را به عضویت لابراتوار در PhotoBridge دعوت کرده است. با این دعوت‌نامه ۳۰٪ تخفیف اشتراک بگیرید:\n'+link,
    metadata:{inviteId:invite.id,referrerLabId:labId}});
   await pool.query("UPDATE lab_referral_sent_invites SET status='sent',sent_at=now(),provider_reference=$2 WHERE id=$1",[id,result?.reference||null]);
   return respond(200,{ok:true,link,sent:true});
  }catch(error){
   await pool.query("UPDATE lab_referral_sent_invites SET status='failed' WHERE id=$1",[id]).catch(()=>{});
   const code=String(error?.message||'sms_unavailable');
   return respond(['sms_not_configured','sms_provider_unsupported'].includes(code)?503:502,{error:'lab_referral_sms_failed',reason:code});
  }
 }
 return respond(405,{error:'method_not_allowed'});
}
