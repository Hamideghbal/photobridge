import crypto from 'node:crypto';
export const DOMAIN_PRICE_REFERENCE={provider:'ایران‌سرور',url:'https://www.iranserver.com/domains/tld/',checkedAt:'2026-10-23',periodYears:1,currency:'تومان',taxPercent:10,prices:{ir:99000,com:3375000}};
const fail=(code,status=400)=>{throw Object.assign(Error(code),{status})};
export function domainPriceTotals(base){if(!Number.isSafeInteger(base)||base<1||base>100000000)fail('invalid_domain_amount');const tax=Math.round(base/10);return {baseAmount:base,taxPercent:10,taxAmount:tax,amount:base+tax};}
export async function domainOrderTransaction({pool,labId,userId,domains,quotes,review,ensureWallet}){
 const c=await pool.connect();try{await c.query('BEGIN');
 const items=[];for(const domain of [...domains].sort()){const key='lab_domain_request:'+labId+':'+domain,q=await c.query('SELECT value FROM platform_settings WHERE key=$1 FOR UPDATE',[key]);if(!q.rows[0])fail('request_not_found',404);items.push({key,data:q.rows[0].value});}
 if(review){const item=items[0],r=item.data;
  if(r.gatewayCheckoutId&&r.paymentStatus!=='paid'&&r.paymentStatus!=='refund_pending'&&r.paymentStatus!=='refunded')fail('domain_checkout_pending',409);
  if(review.status==='quoted'){
   if(r.paymentTransactionId||r.status==='completed')fail('domain_order_already_paid',409);
   if(review.confirmedAvailable!==true)fail('domain_availability_confirmation_required');
   if(!Number.isSafeInteger(review.amount)||review.amount<1||review.amount>100000000)fail('invalid_domain_amount');
   Object.assign(r,{...domainPriceTotals(review.amount),status:'quoted',quoteId:crypto.randomUUID(),quoteExpiresAt:new Date(Date.now()+86400000).toISOString(),provider:DOMAIN_PRICE_REFERENCE.provider,periodYears:1,availability:'confirmed_by_admin',billingRequired:true});
  }else if(review.status==='completed'){
   if(r.billingRequired&&r.paymentStatus!=='paid')fail('domain_payment_required',409);if(r.paymentStatus==='refunded')fail('domain_payment_required',409);r.status='completed';
  }else if(review.status==='rejected'){
   if(r.status==='completed')fail('domain_already_completed',409);
   if(r.paymentStatus==='paid'&&r.paymentMethod==='gateway'){r.paymentStatus='refund_pending';r.refundRequestedAt=new Date().toISOString();}
   else if(r.paymentStatus==='paid'){
    await ensureWallet(c,labId);const w=await c.query('SELECT balance FROM lab_service_wallets WHERE lab_id=$1 FOR UPDATE',[labId]),next=Number(w.rows[0].balance)+r.amount;
    await c.query('UPDATE lab_service_wallets SET balance=$2,updated_at=now() WHERE lab_id=$1',[labId,next]);
    await c.query(`INSERT INTO service_wallet_transactions(lab_id,kind,amount,balance_after,reference_type,reference_key,note,created_by,metadata) VALUES($1,'refund',$2,$3,'domain_registration_refund',$4,$5,$6,$7::jsonb)`,[labId,r.amount,next,'domain-refund:'+r.paymentTransactionId,'برگشت هزینه دامنه '+r.domain,userId,JSON.stringify({domain:r.domain,transactionId:r.paymentTransactionId})]);r.paymentStatus='refunded';r.refundedAt=new Date().toISOString();
   }r.status='rejected';
  }else if(review.status==='refund_confirmed'){if(r.paymentMethod!=='gateway'||r.paymentStatus!=='refund_pending'||typeof review.refundReference!=='string'||review.refundReference.trim().length<3)fail('invalid_refund_reference');r.paymentStatus='refunded';r.refundReference=review.refundReference.trim().slice(0,150);r.refundedAt=new Date().toISOString();
  }else if(review.status==='reviewing'){if(r.paymentStatus==='paid'||r.status==='completed')fail('domain_order_already_paid',409);r.status='reviewing';}
  else fail('invalid_domain_request_status');
  r.reviewedAt=new Date().toISOString();await c.query('UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1',[item.key,JSON.stringify(r)]);await c.query('COMMIT');return {requests:[r]};
 }
 let total=0;for(const {data:r}of items){if(r.paymentStatus==='paid'){if(r.quoteId!==quotes?.[r.domain])fail('domain_quote_changed',409);continue}if(r.status!=='quoted'||r.quoteId!==quotes?.[r.domain]||(!Number.isFinite(new Date(r.quoteExpiresAt).getTime())||new Date(r.quoteExpiresAt).getTime()<Date.now())||!Number.isSafeInteger(r.amount)||r.amount<1)fail('domain_quote_changed',409);total+=r.amount;}
 await ensureWallet(c,labId);const wallet=await c.query('SELECT balance FROM lab_service_wallets WHERE lab_id=$1 FOR UPDATE',[labId]);let balance=Number(wallet.rows[0].balance);if(balance<total)fail('service_wallet_insufficient',402);
 for(const item of items){const r=item.data;if(r.paymentStatus==='paid')continue;balance-=r.amount;await c.query('UPDATE lab_service_wallets SET balance=$2,updated_at=now() WHERE lab_id=$1',[labId,balance]);
 const tx=await c.query(`INSERT INTO service_wallet_transactions(lab_id,kind,amount,balance_after,reference_type,reference_key,note,created_by,metadata) VALUES($1,'debit',$2,$3,'domain_registration',$4,$5,$6,$7::jsonb) RETURNING id`,[labId,r.amount,balance,'domain:'+r.quoteId,'تهیه دامنه '+r.domain,userId,JSON.stringify({domain:r.domain,provider:r.provider,periodYears:1,quoteId:r.quoteId})]);
 Object.assign(r,{paymentStatus:'paid',status:'paid_pending_registration',paidAt:new Date().toISOString(),paymentTransactionId:String(tx.rows[0].id)});await c.query('UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1',[item.key,JSON.stringify(r)]);
 }await c.query('COMMIT');return {requests:items.map(x=>x.data),charged:total,balance};
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
export async function captureDomainCandidates({pool,labId,userId,domains,checks={}}){
 const c=await pool.connect(),requests=[],prefix='lab_domain_request:'+labId+':';try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[prefix]);const count=await c.query('SELECT count(*)::int AS n FROM platform_settings WHERE key LIKE $1',[prefix+'%']);let total=Number(count.rows[0]?.n||0);
 for(const domain of domains){const key=prefix+domain,existing=(await c.query('SELECT value FROM platform_settings WHERE key=$1',[key])).rows[0]?.value;if(existing){requests.push(existing);continue}if(total>=20)fail('domain_request_limit',409);const value={domain,status:'pending',availability:'unverified',billingRequired:true,estimatedAmount:DOMAIN_PRICE_REFERENCE.prices[domain.split('.').pop()],provider:DOMAIN_PRICE_REFERENCE.provider,periodYears:1,requestedAt:new Date().toISOString(),requestedBy:userId};if(checks[domain]?.status==='unregistered')Object.assign(value,domainPriceTotals(value.estimatedAmount),{status:'quoted',availability:'unregistered',quoteId:crypto.randomUUID(),quoteExpiresAt:new Date(Date.now()+86400000).toISOString(),priceSource:'published_tariff'});else if(checks[domain]?.status==='registered')value.availability='registered';const q=await c.query('INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO NOTHING RETURNING value',[key,JSON.stringify(value)]);requests.push(q.rows[0].value);total++;}await c.query('COMMIT');return requests;
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
