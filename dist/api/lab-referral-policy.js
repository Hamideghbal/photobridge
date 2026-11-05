// R1614 lab-only referral program: no legacy photographer invite or finance changes.
export const validLabReferralCode=code=>/^[A-F0-9]{16}$/.test(String(code||'').trim().toUpperCase());
export const validLabReferralMobile=mobile=>/^09[0-9]{9}$/.test(String(mobile||''));
export function applyLabReferralDiscount(percent,planAmount,current){
 const pct=Number(percent||0),base=Number(planAmount||0);
 if(pct!==30||!Number.isSafeInteger(base)||base<0)return current;
 const amount=Math.min(Number(current.amount),Math.max(0,base-Math.round(base*.30)));
 return {...current,amount,specialDiscountAmount:base-amount,discountPercent:base>0?Math.round((base-amount)*10000/base)/100:0};
}
export async function labReferralPercent(db,labId){
 const q=await db.query('SELECT referred_discount_percent FROM lab_referral_memberships WHERE referred_lab_id=$1',[labId]);
 return Number(q.rows?.[0]?.referred_discount_percent||0);
}
export async function lookupLabReferral(db,code){
 if(!validLabReferralCode(code))return null;
 const q=await db.query("SELECT i.id,i.referrer_lab_id,l.name referrer_name FROM lab_referral_invites i JOIN labs l ON l.id=i.referrer_lab_id WHERE i.code=$1 AND i.active=true AND l.active=true AND COALESCE(l.suspended,false)=false",[String(code).trim().toUpperCase()]);
 return q.rows?.[0]||null;
}
export async function attachVerifiedLabReferral(db,code,referredLabId){
 if(!code)return null;
 const invite=await lookupLabReferral(db,code);
 if(!invite)throw Object.assign(Error('lab_referral_invalid'),{status:409});
 if(String(invite.referrer_lab_id)===String(referredLabId))throw Object.assign(Error('lab_referral_self'),{status:409});
 const q=await db.query('INSERT INTO lab_referral_memberships(referred_lab_id,referrer_lab_id,invite_id,referred_discount_percent,referrer_reward_percent) VALUES($1,$2,$3,30,10) ON CONFLICT(referred_lab_id) DO NOTHING RETURNING referred_lab_id',[referredLabId,invite.referrer_lab_id,invite.id]);
 if(!q.rowCount)throw Object.assign(Error('lab_referral_already_attributed'),{status:409});
 return{referrerLabId:invite.referrer_lab_id,discountPercent:30,rewardPercent:10};
}
export function labReferralRewardAmount(paidAmount,pct=10){
 const amount=Number(paidAmount);
 if(!Number.isSafeInteger(amount)||amount<=0||pct!==10)return 0;
 return Math.floor(amount/10);
}
export async function rewardInvitingLab(db,{referredLabId,sourceKind,sourceId,paidAmount,ensureWallet}){
 if(!['subscription','wallet_topup','wallet_manual_topup'].includes(sourceKind)||!sourceId)return null;
 const memberships=await db.query('SELECT referrer_lab_id,referrer_reward_percent FROM lab_referral_memberships WHERE referred_lab_id=$1',[referredLabId]);
 const r=memberships.rows?.[0];if(!r||String(r.referrer_lab_id)===String(referredLabId))return null;
 const reward=labReferralRewardAmount(paidAmount,Number(r.referrer_reward_percent));if(reward<=0)return null;
 const claim=await db.query('INSERT INTO lab_referral_rewards(referrer_lab_id,referred_lab_id,source_kind,source_id,paid_amount,reward_amount) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(source_kind,source_id) DO NOTHING RETURNING id',[r.referrer_lab_id,referredLabId,sourceKind,sourceId,paidAmount,reward]);
 if(!claim.rowCount)return null;
 await ensureWallet(db,r.referrer_lab_id);
 const lock=await db.query('SELECT balance FROM lab_service_wallets WHERE lab_id=$1 FOR UPDATE',[r.referrer_lab_id]);
 if(!lock.rowCount)throw Error('lab_referral_wallet_missing');
 const previous=Number(lock.rows[0].balance);
 if(!Number.isSafeInteger(previous)||previous<0||!Number.isSafeInteger(previous+reward))throw Error('lab_referral_wallet_overflow');
 const next=previous+reward;
 await db.query('UPDATE lab_service_wallets SET balance=$2,updated_at=now() WHERE lab_id=$1',[r.referrer_lab_id,next]);
 const tx=await db.query("INSERT INTO service_wallet_transactions(lab_id,kind,amount,balance_after,reference_type,reference_id,reference_key,note,metadata) VALUES($1,'credit',$2,$3,'lab_referral_reward',$4,$5,$6,$7::jsonb) RETURNING id",[r.referrer_lab_id,reward,next,sourceId,'lab-referral:'+sourceKind+':'+sourceId,'پاداش ۱۰٪ معرفی لابراتوار',JSON.stringify({referredLabId,sourceKind,sourceId,paidAmount})]);
 await db.query('UPDATE lab_referral_rewards SET wallet_transaction_id=$2 WHERE id=$1',[claim.rows[0].id,tx.rows[0].id]);
 return{referrerLabId:r.referrer_lab_id,reward,transactionId:tx.rows[0].id};
}
