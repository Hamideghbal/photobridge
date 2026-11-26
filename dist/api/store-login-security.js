import crypto from 'node:crypto';
import {setSharedPassword,sharedMobile} from './shared-credentials.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(code,status=400)=>Object.assign(Error(code),{status});
export async function sendStoreLoginAlert({pool,sendSms,audit=async()=>{},shopId,userId,publicAppUrl,kind='login',now=new Date()}){
 if(!shopId||!userId)return {sent:0,failed:0};
 const base=new URL(publicAppUrl);if(base.protocol!=='https:')throw fail('invalid_security_origin');
 const link=new URL('/store-login-security.html',base);link.searchParams.set('shop',shopId);
 const q=await pool.query(`SELECT s.name shop_name,u.id user_id,u.mobile FROM equipment_rental_shops s JOIN equipment_rental_shop_memberships m ON m.shop_id=s.id JOIN users u ON u.id=m.user_id WHERE s.id=$1 AND s.deleted_at IS NULL AND m.role='shop_admin' AND m.active=true AND u.active=true ORDER BY m.created_at`,[shopId]);
 const seen=new Set();let sent=0,failed=0;
 const when=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'}).format(now);
 for(const row of q.rows){const to=sharedMobile(row.mobile);if(!to||seen.has(to))continue;seen.add(to);
  const name=String(row.shop_name||'فروشگاه').replace(/[\r\n\x00-\x1f]/g,' ').slice(0,70);
  const message=`PhotoBridge\nورود موفق ${kind==='staff'?'پرسنل به':kind==='admin'?'پشتیبانی/ادمین به':'به'} فروشگاه «${name}»\nزمان: ${when}\nاگر ورود را نمی‌شناسید، رمز حساب مدیریت خود را تغییر دهید یا دسترسی با رمز فعلی را قطع کنید:\n${link.href}\nاقدام فقط با کد تأیید پیامکی شما انجام می‌شود.`;
  try{await sendSms({mobile:to,message,purpose:'store_login_security',eventKey:'store_login',userId:row.user_id,metadata:{rentalShopId:shopId,loginUserId:userId,kind}});sent++}
  catch{failed++;await audit(userId,undefined,'store.login_security_sms_failed','equipment_rental_shop',shopId,{recipientUserId:row.user_id,kind}).catch(()=>{})}
 }
 return {sent,failed};
}
export async function secureStorePassword({pool,input,passwordHash,tokenHash,audit=async()=>{}}){
 const {shopId,challengeId,resetToken,action,newPassword,confirmPassword,confirm}=input||{};
 if(!uuid.test(String(shopId||''))||!uuid.test(String(challengeId||''))||typeof resetToken!=='string'||resetToken.length<32||resetToken.length>256||!['change','disable'].includes(action))throw fail('security_confirmation_required');
 if(action==='disable'&&confirm!==true)throw fail('security_confirmation_required');
 if(action==='change'){if(typeof newPassword!=='string'||newPassword.length<8||newPassword.length>256)throw fail('password_too_short');if(newPassword!==confirmPassword)throw fail('password_mismatch')}
 const c=await pool.connect();let userId;
 try{
  await c.query('BEGIN');
  const row=(await c.query('SELECT * FROM password_reset_challenges WHERE id=$1 FOR UPDATE',[challengeId])).rows[0];
  if(!row||row.portal!=='account'||row.status!=='verified'||!row.reset_token_hash||new Date(row.expires_at)<=new Date()||tokenHash(resetToken)!==row.reset_token_hash)throw fail('reset_invalid');
  const mobile=sharedMobile(row.mobile);if(!mobile)throw fail('reset_invalid');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['photobridge.account:'+mobile]);
  const owners=await c.query(`SELECT u.id FROM equipment_rental_shop_memberships m JOIN users u ON u.id=m.user_id JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.shop_id=$1 AND m.role='shop_admin' AND m.active=true AND u.active=true AND s.deleted_at IS NULL AND right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=right($2,10) FOR SHARE OF m,u,s`,[shopId,mobile]);
  if(!owners.rows.length)throw fail('store_manager_required',403);
  userId=row.user_id;
  await setSharedPassword(c,userId,passwordHash(action==='disable'?crypto.randomBytes(48).toString('base64url'):newPassword),{proof:true,mobile});
  await c.query("UPDATE password_reset_challenges SET status='used',used_at=now(),reset_token_hash=NULL WHERE id=$1",[challengeId]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
 await audit(userId,undefined,action==='disable'?'store.password_disabled':'store.password_changed','equipment_rental_shop',shopId,{sessionsRevoked:true}).catch(()=>{});
 return {ok:true,sessionsRevoked:true,recoveryRequired:action==='disable'};
}
