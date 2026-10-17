// Secure, one-time onboarding for equipment handover staff.
// A photographer keeps their existing identity/password; new mobile numbers receive
// an SMS activation link instead of a password disclosed to the shop manager.
import crypto from 'node:crypto';

const matchMobile = mobile => /^09\d{9}$/.test(String(mobile || ''));
const invitationHash = token => crypto.createHash('sha256').update(token).digest('hex');
const fail = (code, status = 409) => { throw Object.assign(new Error(code), { status }); };
const mobileSearch = "SELECT id,name,mobile,active,platform_role FROM users WHERE right(regexp_replace(coalesce(mobile,''),'[^0-9]','','g'),10)=right(regexp_replace($1,'[^0-9]','','g'),10) ORDER BY created_at,id LIMIT 3 FOR UPDATE";
const roleSearch = "SELECT shop_id,role FROM equipment_rental_shop_memberships WHERE user_id=$1 AND active=true AND role IN ('shop_admin','handover_staff') FOR UPDATE";

async function ensureStaffAllowed(client, userId, shopId, platformRole) {
  const q = await client.query(roleSearch, [userId]);
  const other = q.rows.find(row => platformRole === 'platform_admin'
    ? row.role === 'handover_staff' && String(row.shop_id) !== String(shopId)
    : row.role === 'shop_admin' || String(row.shop_id) !== String(shopId));
  if (other) fail('staff_already_assigned');
}

async function grantStaff(client, shopId, userId) {
  await client.query("INSERT INTO equipment_rental_shop_memberships(shop_id,user_id,role,active,updated_at) VALUES($1,$2,'handover_staff',true,now()) ON CONFLICT(shop_id,user_id,role) DO UPDATE SET active=true,updated_at=now()", [shopId, userId]);
}

export async function addHandoverStaff({pool, shop, mobile, name, sendSms, publicAppUrl}) {
  if (!matchMobile(mobile)) fail('invalid_mobile', 400);
  const displayName = String(name || 'پرسنل تحویل تجهیزات').trim().slice(0, 120) || 'پرسنل تحویل تجهیزات';
  const client = await pool.connect();
  let outcome;
  try {
    await client.query('BEGIN');
    const users = await client.query(mobileSearch, [mobile]);
    if (users.rowCount > 1) fail('mobile_ambiguous');
    const existing = users.rows[0];
    if (existing && !existing.active) fail('account_suspended', 403);
    if (existing) {
      await ensureStaffAllowed(client, existing.id, shop.id, existing.platform_role);
      await grantStaff(client, shop.id, existing.id);
      await client.query("UPDATE equipment_rental_handover_staff_invitations SET status='cancelled',updated_at=now() WHERE shop_id=$1 AND mobile=$2 AND status='pending'", [shop.id, mobile]);
      outcome = {ok:true,created:false,pending:false,accountExists:true,userId:existing.id,mobile,name:existing.name,platformAdmin:existing.platform_role === 'platform_admin'};
    } else {
      const prior = await client.query('SELECT id,status,sent_at FROM equipment_rental_handover_staff_invitations WHERE shop_id=$1 AND mobile=$2 FOR UPDATE', [shop.id, mobile]);
      if (prior.rows[0]?.status === 'pending' && prior.rows[0].sent_at && Date.now()-new Date(prior.rows[0].sent_at).getTime()<5*60*1000) fail('staff_invite_rate_limited',429);
      const token = crypto.randomBytes(32).toString('base64url');
      const hash = invitationHash(token);
      const invite = await client.query("INSERT INTO equipment_rental_handover_staff_invitations(shop_id,mobile,name,token_hash,status,expires_at,sent_at,updated_at) VALUES($1,$2,$3,$4,'pending',now()+interval '48 hours',now(),now()) ON CONFLICT(shop_id,mobile) DO UPDATE SET name=EXCLUDED.name,token_hash=EXCLUDED.token_hash,status='pending',expires_at=EXCLUDED.expires_at,sent_at=now(),redeemed_at=NULL,updated_at=now() RETURNING id", [shop.id, mobile, displayName, hash]);
      outcome = {ok:true,created:false,pending:true,inviteId:invite.rows[0].id,mobile,name:displayName,token,tokenHash:hash};
    }
    await client.query('COMMIT');
  } catch(e) {
    await client.query('ROLLBACK').catch(()=>{});
    throw e;
  } finally {
    client.release();
  }
  if (!outcome.pending) return outcome;
  const base = String(publicAppUrl || 'https://photobridge.ir').replace(/\/+$/, '');
  const link = base + '/rental/staff-activate?token=' + encodeURIComponent(outcome.token);
  try {
    await sendSms({
      mobile,
      message: 'دعوت به همکاری در تحویل تجهیزات فروشگاه «' + String(shop.name || 'تجهیزات') + '» در PhotoBridge:\n' + link + '\nبرای فعال‌سازی حساب و تعیین رمز ورود، لینک را تا ۴۸ ساعت آینده باز کنید.',
      purpose:'rental_handover_staff_invite',eventKey:'handover_staff_invite',
      referenceId:outcome.inviteId,metadata:{shopId:shop.id,invitationId:outcome.inviteId}
    });
  } catch(e) {
    await pool.query("DELETE FROM equipment_rental_handover_staff_invitations WHERE shop_id=$1 AND mobile=$2 AND token_hash=$3 AND status='pending'",[shop.id,mobile,outcome.tokenHash]).catch(()=>{});
    fail(e?.message === 'sms_not_configured' ? 'sms_not_configured' : 'sms_send_failed',502);
  }
  return {ok:true,pending:true,inviteSent:true,smsSent:true,inviteId:outcome.inviteId,mobile,name:outcome.name};
}

export async function listHandoverInvites(pool, shopId) {
  const q = await pool.query("SELECT id,mobile,name,expires_at,sent_at,created_at FROM equipment_rental_handover_staff_invitations WHERE shop_id=$1 AND status='pending' AND expires_at>now() ORDER BY created_at DESC", [shopId]);
  return q.rows;
}

export async function cancelHandoverInvite(pool, shopId, inviteId) {
  const q = await pool.query("UPDATE equipment_rental_handover_staff_invitations SET status='cancelled',updated_at=now() WHERE id=$1 AND shop_id=$2 AND status='pending' RETURNING id", [inviteId, shopId]);
  return q.rowCount === 1;
}

export async function inspectHandoverInvite(pool, token) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) fail('staff_invite_invalid',400);
  const q = await pool.query("SELECT i.name,i.mobile,i.expires_at,s.name shop_name FROM equipment_rental_handover_staff_invitations i JOIN equipment_rental_shops s ON s.id=i.shop_id WHERE i.token_hash=$1 AND i.status='pending' AND i.expires_at>now() AND s.deleted_at IS NULL AND s.active=true AND COALESCE(s.suspended,false)=false", [invitationHash(token)]);
  if (!q.rowCount) fail('staff_invite_expired',410);
  const row = q.rows[0];
  return {ok:true,name:row.name,shopName:row.shop_name,mobileMasked:row.mobile.slice(0,4)+'***'+row.mobile.slice(-4),expiresAt:row.expires_at};
}

export async function activateHandoverInvite({pool,token,password,confirmPassword,passwordHash}) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) fail('staff_invite_invalid',400);
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) fail('password_invalid',400);
  if (password !== confirmPassword) fail('password_mismatch',400);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const iq = await client.query("SELECT i.*,s.deleted_at,s.active shop_active,COALESCE(s.suspended,false) shop_suspended FROM equipment_rental_handover_staff_invitations i JOIN equipment_rental_shops s ON s.id=i.shop_id WHERE i.token_hash=$1 FOR UPDATE OF i", [invitationHash(token)]);
    const invite = iq.rows[0];
    if (!invite || invite.status !== 'pending' || new Date(invite.expires_at).getTime() <= Date.now()) fail('staff_invite_expired',410);
    if (invite.deleted_at || !invite.shop_active || invite.shop_suspended) fail('staff_shop_unavailable',403);
    const uq = await client.query(mobileSearch,[invite.mobile]);
    if (uq.rowCount>1) fail('mobile_ambiguous');
    let userId;
    let existingAccount=false;
    if (uq.rowCount) {
      const current=uq.rows[0];
      if (!current.active) fail('account_suspended',403);
      await ensureStaffAllowed(client,current.id,invite.shop_id,current.platform_role);
      userId=current.id;
      existingAccount=true;
      // An existing account's password and display name are NEVER overwritten.
    } else {
      const q = await client.query("INSERT INTO users(name,mobile,password_hash,platform_role,active,mobile_verified_at,photographer_enabled) VALUES($1,$2,$3,'user',true,now(),false) RETURNING id", [invite.name,invite.mobile,passwordHash(password)]);
      userId=q.rows[0].id;
    }
    await grantStaff(client,invite.shop_id,userId);
    await client.query("UPDATE equipment_rental_handover_staff_invitations SET status='redeemed',redeemed_at=now(),updated_at=now() WHERE id=$1",[invite.id]);
    await client.query('COMMIT');
    return {ok:true,mobile:invite.mobile,existingAccount};
  } catch(e) {
    await client.query('ROLLBACK').catch(()=>{});
    throw e;
  } finally {
    client.release();
  }
}
