/* R1825: camera-equipment store staff access; all frame/chassis and lab paths remain unchanged. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'), write=(p,x)=>fs.writeFileSync(p,x);
function once(src,from,to,label){const n=src.split(from).length-1;if(n!==1)throw Error('[R1825] '+label+' anchor count '+n);return src.replace(from,to)}
const camera="['equipment_rental','equipment_sale','equipment_rental_sale']";
const cameraExpr=""+camera+".includes(String(shop.business_category||''))";
let s=read('dist/api/server.js');
// The rental session lookup must not count historic memberships from deleted CAMERA stores.
// Preserve the previous behavior for frame/chassis stores exactly.
s=once(s,
 "WHERE m.user_id=$1 AND m.role IN ('shop_admin','handover_staff') AND m.active=true\n              ORDER BY CASE WHEN m.role='shop_admin' THEN 0 ELSE 1 END,m.created_at LIMIT 2",
 "WHERE m.user_id=$1 AND m.role IN ('shop_admin','handover_staff') AND m.active=true\n                AND (s.deleted_at IS NULL OR COALESCE(s.business_category,'equipment_rental_sale') IN ('frame','chassis','frame_chassis'))\n              ORDER BY CASE WHEN m.role='shop_admin' THEN 0 ELSE 1 END,m.created_at LIMIT 2",
 'rental-only session ignores deleted camera shop');
// Platform-admin manager binding should not mistake an already-deleted camera store for an active role.
s=once(s,
 "    const owners=await db.query(\`SELECT shop_id,user_id FROM equipment_rental_shop_memberships WHERE role='shop_admin' AND active=true AND (shop_id=$1 OR user_id=$2) FOR UPDATE\`,[shop.id,user.id]);",
 "    const pb1825CameraManager="+cameraExpr+";\n"+
 "    const owners=await db.query(pb1825CameraManager?"+
 "\`SELECT m.shop_id,m.user_id FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.role='shop_admin' AND m.active=true AND (m.shop_id=$1 OR m.user_id=$2) AND s.deleted_at IS NULL FOR UPDATE OF m\`:"+
 "\`SELECT shop_id,user_id FROM equipment_rental_shop_memberships WHERE role='shop_admin' AND active=true AND (shop_id=$1 OR user_id=$2) FOR UPDATE\`,[shop.id,user.id]);",
 'camera manager excludes deleted stores');
s=once(s,
 "    const staff=await db.query(\`SELECT shop_id FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='handover_staff' AND active=true FOR UPDATE\`,[user.id]);",
 "    const staff=await db.query(pb1825CameraManager?"+
 "\`SELECT m.shop_id FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.user_id=$1 AND m.role='handover_staff' AND m.active=true AND s.deleted_at IS NULL FOR UPDATE OF m\`:"+
 "\`SELECT shop_id FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='handover_staff' AND active=true FOR UPDATE\`,[user.id]);",
 'camera manager respects active staff elsewhere');
// Only camera stores present active personnel in their access lists.
s=once(s,
 "const q=await pool.query(\`SELECT m.id,m.user_id,m.active,m.created_at,u.name,u.mobile,(SELECT max(s.created_at) FROM sessions s WHERE s.user_id=u.id) last_login_at FROM equipment_rental_shop_memberships m JOIN users u ON u.id=m.user_id WHERE m.shop_id=$1 AND m.role='handover_staff' ORDER BY m.active DESC,m.created_at DESC\`,[shop.id]);",
 "const q=await pool.query("+cameraExpr+"?"+
 "\`SELECT m.id,m.user_id,m.active,m.created_at,u.name,u.mobile,(SELECT max(sess.created_at) FROM sessions sess WHERE sess.user_id=u.id) last_login_at FROM equipment_rental_shop_memberships m JOIN users u ON u.id=m.user_id WHERE m.shop_id=$1 AND m.role='handover_staff' AND m.active=true ORDER BY m.created_at DESC\`:"+
 "\`SELECT m.id,m.user_id,m.active,m.created_at,u.name,u.mobile,(SELECT max(s.created_at) FROM sessions s WHERE s.user_id=u.id) last_login_at FROM equipment_rental_shop_memberships m JOIN users u ON u.id=m.user_id WHERE m.shop_id=$1 AND m.role='handover_staff' ORDER BY m.active DESC,m.created_at DESC\`,[shop.id]);",
 'camera staff list hides revoked personnel');
// In the add route, serialize per-user role assignments against manager activation (which
// already locks users), and only count memberships in non-deleted stores as conflicts.
s=once(s,
 "const c=await pool.connect();let userId='',temporaryPassword='',created=false,isPlatformAdmin=false;\n        try{await c.query('BEGIN');",
 "const c=await pool.connect();let userId='',temporaryPassword='',created=false,isPlatformAdmin=false;\n        const pb1825CameraStaff="+cameraExpr+";\n        try{await c.query('BEGIN');",
 'staff mode scoped to camera');
s=once(s,
 "          const adminRow=q.rows.find(x=>String(x.platform_role)==='platform_admin');\n          if(q.rowCount>1&&!adminRow)",
 "          const adminRow=q.rows.find(x=>String(x.platform_role)==='platform_admin');\n          if(pb1825CameraStaff&&q.rowCount>1){await c.query('ROLLBACK');return sendJson(res,409,{error:'mobile_ambiguous'})}\n          if(q.rowCount>1&&!adminRow)",
 'camera staff ambiguous mobile safeguards');
s=once(s,
 "          const access=await c.query(\`SELECT shop_id,role FROM equipment_rental_shop_memberships WHERE user_id=$1 AND active=true AND role IN ('shop_admin','handover_staff')\`,[userId]);\n          const conflicting=isPlatformAdmin?access.rows.find(x=>String(x.role)==='handover_staff'&&String(x.shop_id)!==String(shop.id)):access.rows.find(x=>String(x.shop_id)!==String(shop.id)||String(x.role)==='shop_admin');",
 "          if(pb1825CameraStaff){\n"+
 "            await c.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[userId]);\n"+
 "            const owner=await c.query(\`SELECT id FROM equipment_rental_shops WHERE deleted_at IS NULL AND manager_mobile IS NOT NULL AND right(regexp_replace(coalesce(manager_mobile,''),'[^0-9]','','g'),10)=right(regexp_replace($1,'[^0-9]','','g'),10) LIMIT 1 FOR UPDATE\`,[mobile]);\n"+
 "            if(owner.rowCount){await c.query('ROLLBACK');return sendJson(res,409,{error:'staff_already_store_manager'})}\n"+
 "          }\n"+
 "          const access=await c.query(pb1825CameraStaff?"+
 "\`SELECT m.shop_id,m.role FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.user_id=$1 AND m.active=true AND m.role IN ('shop_admin','handover_staff') AND s.deleted_at IS NULL FOR UPDATE OF m\`:"+
 "\`SELECT shop_id,role FROM equipment_rental_shop_memberships WHERE user_id=$1 AND active=true AND role IN ('shop_admin','handover_staff')\`,[userId]);\n"+
 "          const conflicting=pb1825CameraStaff?access.rows.find(x=>String(x.role)==='shop_admin'||String(x.shop_id)!==String(shop.id)):(isPlatformAdmin?access.rows.find(x=>String(x.role)==='handover_staff'&&String(x.shop_id)!==String(shop.id)):access.rows.find(x=>String(x.shop_id)!==String(shop.id)||String(x.role)==='shop_admin'));",
 'camera staff excludes deleted shop and blocks active managers');
// Revocation must change one ACTIVE membership only; frame/chassis keep old behavior.
s=once(s,
 "const id=rentalHandoverStaffRoute[1];const q=await pool.query(\`UPDATE equipment_rental_shop_memberships SET active=false,updated_at=now() WHERE id=$1 AND shop_id=$2 AND role='handover_staff' RETURNING id,user_id\`,[id,shop.id]);",
 "const id=rentalHandoverStaffRoute[1];const q=await pool.query("+cameraExpr+"?"+
 "\`UPDATE equipment_rental_shop_memberships SET active=false,updated_at=now() WHERE id=$1 AND shop_id=$2 AND role='handover_staff' AND active=true RETURNING id,user_id\`:"+
 "\`UPDATE equipment_rental_shop_memberships SET active=false,updated_at=now() WHERE id=$1 AND shop_id=$2 AND role='handover_staff' RETURNING id,user_id\`,[id,shop.id]);",
 'revocation updates active camera staff membership only');
// Camera-store signup has a second manager-grant path. Reject active staff there too,
// before OTP and at OTP verification under the same users-row lock as staff creation.
const pb1825TrialAddBefore = "        if (existing) {\n            const mq = await pool.query(\`SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='shop_admin' AND active=true LIMIT 1\`, [existing.id]);\n            if (mq.rowCount) return sendJson(res, 409, { error: 'rental_admin_already_exists' });\n        }";
const pb1825TrialAddAfter = "        if (existing) {\n"+
"            const pb1825CameraTrial="+camera+".includes(String(businessCategory||''));\n"+
"            const mq = await pool.query(pb1825CameraTrial?\`SELECT 1 FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.user_id=$1 AND m.role='shop_admin' AND m.active=true AND s.deleted_at IS NULL LIMIT 1\`:\`SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='shop_admin' AND active=true LIMIT 1\`, [existing.id]);\n"+
"            if (mq.rowCount) return sendJson(res, 409, { error: 'rental_admin_already_exists' });\n"+
"            if(pb1825CameraTrial){const st=await pool.query(\`SELECT 1 FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.user_id=$1 AND m.role='handover_staff' AND m.active=true AND s.deleted_at IS NULL LIMIT 1\`,[existing.id]);if(st.rowCount)return sendJson(res,409,{error:'rental_staff_cannot_be_manager'})}\n"+
"        }";
// Earlier signup-sms-identity rewrites the rental signup route before R1825 runs.
// Keep the exact legacy replacement for old builds; on identity-upgraded builds,
// insert the camera-only guard immediately before the unchanged OTP challenge.
// Do not relax or rewrite any lab or frame/chassis routes.
if(s.includes(pb1825TrialAddBefore)){
  s=once(s,pb1825TrialAddBefore,pb1825TrialAddAfter,'camera store OTP signup blocks staff/ignores deleted owners');
}else{
  const pb1827ChallengeAnchor="            const challenge = await createSignupMobileChallenge('equipment_rental_trial', mobile, ";
  const pb1827ChallengeGuard=
    "            const pb1825CameraTrial="+camera+".includes(String(businessCategory||''));\n"+
    "            if(pb1825CameraTrial){\n"+
    "              if(existing){\n"+
    "                const memberships=await pool.query(\`SELECT m.role FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops shop ON shop.id=m.shop_id WHERE m.user_id=$1 AND m.role IN ('shop_admin','handover_staff') AND m.active=true AND shop.deleted_at IS NULL LIMIT 2\`,[existing.id]);\n"+
    "                if(memberships.rows.some(x=>x.role==='shop_admin'))return sendJson(res,409,{error:'rental_admin_already_exists'});\n"+
    "                if(memberships.rows.some(x=>x.role==='handover_staff'))return sendJson(res,409,{error:'rental_staff_cannot_be_manager'});\n"+
    "              }\n"+
    "            }\n"+
    pb1827ChallengeAnchor;
  s=once(s,pb1827ChallengeAnchor,pb1827ChallengeGuard,'camera store OTP challenge identity-upgrade compatibility');
}
const pb1825TrialVerifyBefore = "                const mq = await c.query(\`SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='shop_admin' AND active=true LIMIT 1\`, [userId]);\n                if (mq.rowCount) throw Object.assign(new Error('rental_admin_already_exists'), { status: 409 });";
const pb1825TrialVerifyAfter = "                const pb1825CameraTrial="+camera+".includes(String(businessCategory||''));\n"+
"                const mq = await c.query(pb1825CameraTrial?\`SELECT 1 FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.user_id=$1 AND m.role='shop_admin' AND m.active=true AND s.deleted_at IS NULL LIMIT 1\`:\`SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='shop_admin' AND active=true LIMIT 1\`, [userId]);\n"+
"                if (mq.rowCount) throw Object.assign(new Error('rental_admin_already_exists'), { status: 409 });\n"+
"                if(pb1825CameraTrial){const st=await c.query(\`SELECT 1 FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops s ON s.id=m.shop_id WHERE m.user_id=$1 AND m.role='handover_staff' AND m.active=true AND s.deleted_at IS NULL LIMIT 1\`,[userId]);if(st.rowCount)throw Object.assign(new Error('rental_staff_cannot_be_manager'),{status:409})}";
s=once(s,pb1825TrialVerifyBefore,pb1825TrialVerifyAfter,'camera store OTP verify blocks active personnel');
// Even a profile-only admin store record must not label an active camera-store
// staff account as manager of another camera store without granting access.
const pb1825StaffIdentityQuery = "SELECT 1 FROM equipment_rental_shop_memberships m JOIN equipment_rental_shops shop ON shop.id=m.shop_id JOIN users u ON u.id=m.user_id WHERE m.role='handover_staff' AND m.active=true AND shop.deleted_at IS NULL AND right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=right(regexp_replace($1,'[^0-9]','','g'),10) LIMIT 1";
s=once(s,
 "        if (!name) return sendJson(res, 400, { error: 'shop_name_required' });\n        let slug = slugify(String(b.slug || name));",
 "        if (!name) return sendJson(res, 400, { error: 'shop_name_required' });\n"+
 "        const pb1825ManagerMobile=normalizeMobile(String(b.managerMobile||''));\n"+
 "        if(pb1825ManagerMobile){const staff=await pool.query("+JSON.stringify(pb1825StaffIdentityQuery)+",[pb1825ManagerMobile]);if(staff.rowCount)return sendJson(res,409,{error:'rental_staff_cannot_be_manager'});}\n"+
 "        let slug = slugify(String(b.slug || name));",
 'admin camera store creation refuses manager number belonging to active staff');
s=once(s,
 "        if (!next.name) return sendJson(res, 400, { error: 'shop_name_required' });\n        if (b.active === true",
 "        if (!next.name) return sendJson(res, 400, { error: 'shop_name_required' });\n"+
 "        if("+camera+".includes(String(current.business_category||'equipment_rental_sale')) && b.managerMobile!==undefined && String(next.managerMobile||'')!==String(current.manager_mobile||'')){\n"+
 "            const managerMobile=normalizeMobile(String(next.managerMobile||''));if(managerMobile){const staff=await pool.query("+JSON.stringify(pb1825StaffIdentityQuery)+",[managerMobile]);if(staff.rowCount)return sendJson(res,409,{error:'rental_staff_cannot_be_manager'});}\n"+
 "        }\n"+
 "        if (b.active === true",
 'admin camera store edit refuses staff manager mobile');
write('dist/api/server.js',s);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});

let portal=read('dist/api/equipment-rental-portal.html');
const original="window.pbR100F9RemoveStaff=async function(id){if(!confirm('دسترسی این پرسنل حذف شود؟'))return;await api('/api/rental/handover-staff/'+encodeURIComponent(id),{method:'DELETE'});await pbR100F9LoadStaff()};";
const replacement="window.pbR100F9RemoveStaff=async function(id){if(!confirm('دسترسی این پرسنل حذف شود؟'))return;"+
 "if(!['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))){await api('/api/rental/handover-staff/'+encodeURIComponent(id),{method:'DELETE'});await pbR100F9LoadStaff();return}"+
 "const msg=q('#pbR100F9StaffMsg');try{await api('/api/rental/handover-staff/'+encodeURIComponent(id),{method:'DELETE'});"+
 "await pbR100F9LoadStaff();if(msg)msg.innerHTML='<div class=\"msg ok\">دسترسی این پرسنل لغو شد؛ ورود بعدی او به این فروشگاه مجاز نیست.</div>'}"+
 "catch(e){if(msg)msg.innerHTML='<div class=\"msg\">حذف دسترسی انجام نشد. '+(e?.error||'خطای نامشخص')+'</div>'}};";
portal=once(portal,original,replacement,'camera staff revoke feedback');
portal=once(portal,
 "e.error==='staff_already_assigned'?'این شماره هم‌اکنون دسترسی مدیریتی/پرسنلی فروشگاه دیگری دارد و برای جلوگیری از ورود مبهم نمی‌تواند اینجا به‌عنوان پرسنل تحویل ثبت شود.':",
 "e.error==='staff_already_store_manager'?'این شماره مالک یا مدیر یک فروشگاه حذف‌نشده است و نمی‌تواند پرسنل فروشگاه دیگری شود.':e.error==='staff_already_assigned'?'این شماره هم‌اکنون دسترسی مدیریتی/پرسنلی فروشگاه دیگری دارد و برای جلوگیری از ورود مبهم نمی‌تواند اینجا به‌عنوان پرسنل تحویل ثبت شود.':",
 'staff conflict message');
write('dist/api/equipment-rental-portal.html',portal);
console.log('[R1825] Camera equipment shop staff revocation + deleted-manager rehire + exclusive roles installed; frame/chassis and lab unchanged.');
