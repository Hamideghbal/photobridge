// Test institutions are identified by their manager's mobile, never by display name.
// This is a read-only discovery gate; normal membership/subscription checks still apply.
const phone = value => `right(regexp_replace(translate(coalesce(${value},''),'۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩','01234567890123456789'),'[^0-9]','','g'),10)`;
export function testAccountSql(kind, alias) {
 if (!['shop','lab'].includes(kind) || !/^[a-z][a-z0-9_]*$/i.test(alias)) throw Error('invalid_visibility_sql_arguments');
 const owner = kind==='shop'
  ? `(${phone(alias+'.manager_mobile')}=${phone('admin.mobile')} OR EXISTS(SELECT 1 FROM equipment_rental_shop_memberships owner_m JOIN users owner_u ON owner_u.id=owner_m.user_id WHERE owner_m.shop_id=${alias}.id AND owner_m.role='shop_admin' AND owner_m.active=true AND ${phone('owner_u.mobile')}=${phone('admin.mobile')}))`
  : `EXISTS(SELECT 1 FROM lab_memberships owner_m JOIN users owner_u ON owner_u.id=owner_m.user_id WHERE owner_m.lab_id=${alias}.id AND owner_m.role='lab_admin' AND owner_m.active=true AND ${phone('owner_u.mobile')}=${phone('admin.mobile')})`;
 return `EXISTS(SELECT 1 FROM users admin WHERE admin.platform_role='platform_admin' AND length(${phone('admin.mobile')})=10 AND ${owner})`;
}
export function testAccountVisibleSql(kind, alias, viewer) {
 if(!/^(?:\$[1-9][0-9]*|[a-z][a-z0-9_]*\.id)$/i.test(viewer))throw Error('invalid_visibility_viewer');
 const issuer=kind==='shop'?'rental':'lab', institution=kind==='shop'?'issuer_rental_shop_id':'issuer_lab_id';
 return `(NOT ${testAccountSql(kind,alias)}
 OR EXISTS(SELECT 1 FROM users viewer JOIN users admin ON ${phone('viewer.mobile')}=${phone('admin.mobile')} WHERE viewer.id=${viewer} AND admin.platform_role='platform_admin' AND admin.active=true AND length(${phone('admin.mobile')})=10)
 OR EXISTS(SELECT 1 FROM photographer_invites invite JOIN users viewer ON viewer.id=${viewer} WHERE invite.issuer_type='${issuer}' AND invite.${institution}=${alias}.id AND (
   (invite.active=true AND invite.target_mobile IS NOT NULL AND length(${phone('viewer.mobile')})=10 AND ${phone('invite.target_mobile')}=${phone('viewer.mobile')} AND (invite.expires_at IS NULL OR invite.expires_at>now()) AND (invite.max_uses IS NULL OR invite.uses<invite.max_uses))
   OR EXISTS(SELECT 1 FROM photographer_invite_redemptions redeemed WHERE redeemed.invite_id=invite.id AND redeemed.user_id=viewer.id))))`;
}
