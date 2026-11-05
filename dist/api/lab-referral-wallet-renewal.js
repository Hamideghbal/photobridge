import crypto from 'node:crypto';
import {applyLabReferralDiscount,labReferralPercent} from './lab-referral-policy.js';

// R1614 subscription renewal funded by existing lab wallet. This payment is
// excluded from referral commission because no external money was collected.
export async function handleLabReferralWalletRenewal({
 req,res,url,labId,userId,pool,bodyJson,sendJson,getSubscriptionPricing,
 planAmountFromBase,moneyAmount,applySpecialDiscount,clampDiscount,serviceWalletEnsure
}){
 if(req.method!=='POST'||url.pathname!=='/api/lab/referrals/wallet-renewal')return false;
 const respond=(code,payload)=>{sendJson(res,code,payload);return true;};
 const b=await bodyJson(req),planId=String(b.planId||'');
 const requestKey=String(b.requestKey||'').trim();
 if(!/^[a-zA-Z0-9_-]{12,64}$/.test(requestKey))return respond(400,{error:'invalid_request_key'});
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  const labQ=await db.query('SELECT id,name,active,suspended,active_until,subscription_discount_enabled,subscription_discount_amount,subscription_discount_percent FROM labs WHERE id=$1 FOR UPDATE',[labId]);
  const lab=labQ.rows?.[0];
  if(!lab||lab.suspended){await db.query('ROLLBACK');return respond(403,{error:'lab_not_eligible'});}
  const prev=await db.query('SELECT renewal_id FROM lab_referral_wallet_renewals WHERE lab_id=$1 AND request_key=$2',[labId,requestKey]);
  if(prev.rowCount){await db.query('COMMIT');return respond(200,{ok:true,renewalId:prev.rows[0].renewal_id,alreadyProcessed:true});}
  const plans=await db.query('SELECT id,name,months,price,discount_percent FROM subscription_plans WHERE id=$1 AND active=true',[planId]);
  const plan=plans.rows?.[0];
  if(!plan){await db.query('ROLLBACK');return respond(400,{error:'invalid_plan'});}
  const pricing=await getSubscriptionPricing();
  const publicPrice=planAmountFromBase(pricing.monthlyPrice,plan.months,plan.discount_percent);
  const planAmount=moneyAmount(plan.price)||publicPrice.planAmount;
  const special=applyLabReferralDiscount(await labReferralPercent(db,labId),planAmount,
   applySpecialDiscount(planAmount,Boolean(lab.subscription_discount_enabled),lab.subscription_discount_amount,lab.subscription_discount_percent));
  const amount=Number(special.amount);
  if(!Number.isSafeInteger(amount)||amount<=0){await db.query('ROLLBACK');return respond(409,{error:'subscription_amount_invalid'});}
  await serviceWalletEnsure(db,labId);
  const walletQ=await db.query('SELECT balance FROM lab_service_wallets WHERE lab_id=$1 FOR UPDATE',[labId]);
  const balance=Number(walletQ.rows?.[0]?.balance||0);
  if(balance<amount){await db.query('ROLLBACK');return respond(402,{error:'wallet_insufficient',balance,required:amount});}
  const renewalId=crypto.randomUUID(),after=balance-amount;
  const base=lab.active_until&&new Date(lab.active_until)>new Date()?new Date(lab.active_until):new Date();
  const future=await db.query('SELECT ($1::timestamptz + make_interval(months=>$2::int)) AS new_until',[base.toISOString(),Number(plan.months)]);
  const activeUntil=future.rows[0].new_until;
  await db.query('UPDATE lab_service_wallets SET balance=$2,updated_at=now() WHERE lab_id=$1',[labId,after]);
  const tx=await db.query("INSERT INTO service_wallet_transactions(lab_id,kind,amount,balance_after,reference_type,reference_id,reference_key,note,created_by,metadata) VALUES($1,'debit',$2,$3,'subscription_renewal',$4,$5,$6,$7,$8::jsonb) RETURNING id",
   [labId,amount,after,renewalId,'subscription:wallet:'+renewalId,'پرداخت تمدید اشتراک از کیف پول',userId,JSON.stringify({planId,months:Number(plan.months),requestKey})]);
  await db.query("INSERT INTO subscription_renewals(id,lab_id,plan_id,months,list_amount,plan_amount,discount_percent,special_discount_amount,amount,status,submitted_by,submitted_at,reviewed_at,reviewed_by,review_note,previous_active_until,new_active_until,payment_method) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10,now(),now(),NULL,'پرداخت از کیف پول',$11,$12,'wallet')",
   [renewalId,labId,plan.id,Number(plan.months),publicPrice.grossAmount,planAmount,clampDiscount(plan.discount_percent),special.specialDiscountAmount,amount,userId,lab.active_until||null,activeUntil]);
  await db.query('UPDATE labs SET active=true,active_until=$2,updated_at=now() WHERE id=$1',[labId,activeUntil]);
  // Wallet-funded renewal moves already-held platform credit. It is not new
  // cash revenue and must NOT create a fresh platform_payments paid row.
  await db.query('INSERT INTO lab_referral_wallet_renewals(renewal_id,wallet_transaction_id,lab_id,request_key,amount) VALUES($1,$2,$3,$4,$5)',
   [renewalId,tx.rows[0].id,labId,requestKey,amount]);
  await db.query('COMMIT');
  return respond(200,{ok:true,renewalId,amount,balance:after,activeUntil});
 }catch(error){
  await db.query('ROLLBACK').catch(()=>{});
  console.error('[lab-referral-wallet-renewal]',String(error?.message||error));
  return respond(500,{error:'wallet_renewal_failed'});
 }finally{db.release();}
}
