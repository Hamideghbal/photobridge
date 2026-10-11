// R1106 — prevent public discovery of laboratories and equipment stores whose
// original administrator mobile matches an active platform administrator.
// Access is based on phone identity or an ACTIVE accepted customer membership,
// never on a mutable business name, display title, or a hard-coded test phone.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digits=v=>String(v||'').replace(/\D/g,'');
const phone=v=>{const d=digits(v);return d.length>=10?d.slice(-10):''};
const schema={
 lab:{table:'lab_memberships',entity:'lab_id',admin:'lab_admin',member:'customer'},
 shop:{table:'equipment_rental_shop_memberships',entity:'shop_id',admin:'shop_admin',member:'photographer'}
};
export async function adminMobileEntityScope(db,kind,userId,entityIds){
 const cfg=schema[kind];if(!cfg)throw new Error('invalid_entity_type');
 const ids=[...new Set((entityIds||[]).map(String).filter(x=>UUID.test(x)))];
 const restricted=new Set(),allowed=new Set(),ownerMatched=new Set();
 if(!ids.length)return {restricted,allowed,ownerMatched};
 const owners=await db.query(`SELECT DISTINCT m.${cfg.entity}::text entity_id,u.mobile owner_mobile
   FROM ${cfg.table} m JOIN users u ON u.id=m.user_id
   WHERE m.${cfg.entity}=ANY($1::uuid[]) AND m.role=$2
   AND LENGTH(REGEXP_REPLACE(COALESCE(u.mobile,''),'[^0-9]','','g'))>=10
   AND EXISTS(SELECT 1 FROM users pa
     WHERE pa.platform_role='platform_admin' AND pa.active=true
       AND LENGTH(REGEXP_REPLACE(COALESCE(pa.mobile,''),'[^0-9]','','g'))>=10
       AND RIGHT(REGEXP_REPLACE(COALESCE(pa.mobile,''),'[^0-9]','','g'),10)
        = RIGHT(REGEXP_REPLACE(COALESCE(u.mobile,''),'[^0-9]','','g'),10))`,[ids,cfg.admin]);
 const rows=owners.rows||[];
 if(!rows.length)return {restricted,allowed,ownerMatched};
 const viewer=userId?(await db.query('SELECT mobile FROM users WHERE id=$1 AND active=true LIMIT 1',[userId])).rows?.[0]:null;
 const viewerPhone=phone(viewer?.mobile);
 for(const row of rows){
  const id=String(row.entity_id||'');restricted.add(id);
  if(viewerPhone&&viewerPhone===phone(row.owner_mobile)){allowed.add(id);ownerMatched.add(id)}
 }
 if(userId){
  const members=await db.query(`SELECT DISTINCT ${cfg.entity}::text entity_id
    FROM ${cfg.table} WHERE ${cfg.entity}=ANY($1::uuid[])
    AND user_id=$2 AND role=$3 AND active=true`,[ids,userId,cfg.member]);
  for(const row of members.rows||[])if(restricted.has(String(row.entity_id)))allowed.add(String(row.entity_id));
 }
 return {restricted,allowed,ownerMatched};
}
export async function adminMobileEntityVisible(db,kind,userId,entityId){
 const policy=await adminMobileEntityScope(db,kind,userId,[entityId]);
 return !policy.restricted.has(String(entityId))||policy.allowed.has(String(entityId));
}
export async function filterAdminMobileEntities(db,kind,userId,rows){
 const policy=await adminMobileEntityScope(db,kind,userId,(rows||[]).map(r=>r.id));
 return (rows||[]).filter(r=>!policy.restricted.has(String(r.id))||policy.allowed.has(String(r.id)));
}
