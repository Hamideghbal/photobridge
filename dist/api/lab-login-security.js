import crypto from 'node:crypto';
import {setSharedPassword,sharedMobile} from './shared-credentials.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mobile=sharedMobile;
const fail=(code,status=400)=>Object.assign(Error(code),{status});
export async function sendLabLoginAlert({pool,sendSms,audit=async()=>{},labId,userId,publicAppUrl,kind='login',now=new Date()}){
 if(!labId||!userId)return {sent:0,failed:0};
 const base=new URL(publicAppUrl);if(base.protocol!=='https:')throw fail('invalid_security_origin');
 const link=new URL('/lab-login-security.html',base);link.searchParams.set('lab',labId);
 const q=await pool.query(`SELECT l.name lab_name,u.id user_id,u.mobile FROM labs l JOIN lab_memberships m ON m.lab_id=l.id JOIN users u ON u.id=m.user_id WHERE l.id=$1 AND m.role='lab_admin' AND m.active=true AND u.active=true ORDER BY m.created_at`,[labId]);
 const seen=new Set();let sent=0,failed=0;
 const when=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'}).format(now);
 for(const row of q.rows){const to=mobile(row.mobile);if(!/^09\d{9}$/.test(to)||seen.has(to))continue;seen.add(to);
  const name=String(row.lab_name||'لابراتوار').replace(/[\r\n\x00-\x1f]/g,' ').slice(0,70);
  const message=`PhotoBridge\nورود موفق ${kind==='admin'?'پشتیبانی/ادمین به':'به'} لابراتوار «${name}»\nزمان: ${when}\nاگر این ورود را نمی‌شناسید، تغییر رمز یا غیرفعال‌کردن رمز و خروج از نشست‌ها:\n${link.href}\nاقدام فقط با کد تأیید پیامکی شما انجام می‌شود.`;
  try{await sendSms({mobile:to,message,purpose:'lab_login_security',eventKey:'lab_login',userId:row.user_id,labId,metadata:{loginUserId:userId,kind}});sent++;}
  catch{failed++;await audit(userId,labId,'lab.login_security_sms_failed','user',row.user_id,{kind}).catch(()=>{});}
 }
 return {sent,failed};
}
// The SMS URL is only a navigation link. A separate, short-lived owner OTP
// and an explicit POST confirmation are required for every credential change.
export async function disableLabPassword({pool,input,passwordHash,tokenHash,audit=async()=>{}}){
 const {labId,challengeId,resetToken}=input||{};
 if(!uuid.test(String(labId||''))||!uuid.test(String(challengeId||''))||typeof resetToken!=='string'||resetToken.length<32||input.confirm!==true)throw fail('security_confirmation_required');
 const db=await pool.connect();let userId;
 try{await db.query('BEGIN');
  const row=(await db.query('SELECT * FROM password_reset_challenges WHERE id=$1 FOR UPDATE',[challengeId])).rows[0];
  if(!row||!['lab','account'].includes(row.portal)||row.status!=='verified'||!row.reset_token_hash||new Date(row.expires_at)<=new Date()||tokenHash(resetToken)!==row.reset_token_hash)throw fail('reset_invalid');
  const verifiedMobile=mobile(row.mobile);if(!verifiedMobile)throw fail('reset_invalid');
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',['photobridge.account:'+verifiedMobile]);
  const owner=await db.query(`SELECT u.id FROM lab_memberships m JOIN users u ON u.id=m.user_id WHERE m.lab_id=$1 AND m.role='lab_admin' AND m.active=true AND u.active=true AND right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=right($2,10) FOR SHARE OF m,u`,[labId,mobile(row.mobile)]);
  if(!owner.rows.length)throw fail('lab_manager_required',403);
  userId=row.user_id;
  // Rotate to a random, undisclosed credential: account/memberships/data remain
  // active so the verified owner can recover via the existing SMS flow.
  await setSharedPassword(db,userId,passwordHash(crypto.randomBytes(48).toString('base64url')),{proof:true,mobile:row.mobile});
  await db.query("UPDATE password_reset_challenges SET status='used',used_at=now(),reset_token_hash=NULL WHERE id=$1",[challengeId]);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e;}finally{db.release();}
 await audit(userId,labId,'lab.password_disabled','user',userId,{sessionsRevoked:true}).catch(()=>{});
 return {ok:true,sessionsRevoked:true,recoveryRequired:true};
}
