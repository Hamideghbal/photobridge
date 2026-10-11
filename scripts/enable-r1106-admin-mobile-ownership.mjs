// R1106: enforce phone-based access to admin-owned labs/stores without changing data.
import fs from 'node:fs';
const file='dist/api/server.js';
let src=fs.readFileSync(file,'utf8');
const marker='/* PB_R1106_ADMIN_MOBILE_SCOPE */';
if(!src.includes(marker)){
 const patch=(old,value,label)=>{
  if(src.split(old).length!==2)throw Error('[R1106] '+label+' anchor missing or ambiguous');
  src=src.replace(old,value);
 };
 const imp="import {adminMobileEntityScope,adminMobileEntityVisible,filterAdminMobileEntities} from './admin-mobile-entity-scope.js';";
 src=imp+'\n'+marker+'\n'+src;
 // Eliminate historical test-store classification using arbitrary display names.
 patch("await pool.query(`UPDATE equipment_rental_shops SET private_admin_only=true\n              WHERE private_admin_only=false AND (lower(coalesce(name,''))='sofia' OR lower(coalesce(slug,''))='sofia' OR lower(coalesce(slug,'')) LIKE '%sofia%' OR name ILIKE '%صوفیا%' OR name ILIKE '%سوفیا%')`);",
  '// R1106: no business is made private based on its name or slug.','name_seed');
 patch("if(shop.private_admin_only && !(await equipmentRentalPrivatePreviewAllowed(db,userId)))return false;",
  "const adminScope=await adminMobileEntityScope(db,'shop',userId,[shopId]);\n    if(adminScope.restricted.has(String(shopId))){\n        // Accepted members and the owner photographer may access test shops.\n        return adminScope.allowed.has(String(shopId));\n    }",'shop_discover_gate');
 patch('AND COALESCE(s.private_admin_only,false)=false AND (s.active_from IS NULL OR s.active_from<=now())',
  'AND (s.active_from IS NULL OR s.active_from<=now())','public_shop_predicate');
 patch("const shops=q.rows.filter(shop=>reachAllows(shop,'rental',location)||reachAllows(shop,'sale',location)).map(shop=>({id:shop.id,name:shop.name,province:shop.province,city:shop.city}));",
  "const publicShops=await filterAdminMobileEntities(pool,'shop',null,q.rows);\n        const shops=publicShops.filter(shop=>reachAllows(shop,'rental',location)||reachAllows(shop,'sale',location)).map(shop=>({id:shop.id,name:shop.name,province:shop.province,city:shop.city}));",'public_shop_filter');
 patch("AND (COALESCE(s.private_admin_only,false)=false OR $2::boolean=true) AND (s.active_from IS NULL OR s.active_from<=now())",
  'AND (s.active_from IS NULL OR s.active_from<=now())','photographer_shop_predicate');
 patch("[a.userId, normalizeMobile(String(a.mobile||''))===EQUIPMENT_STORE_PREVIEW_ADMIN_MOBILE_V802 || String(a.platformRole||'')==='platform_admin']);\n        const previewAllowed=normalizeMobile(String(a.mobile||''))===EQUIPMENT_STORE_PREVIEW_ADMIN_MOBILE_V802 || String(a.platformRole||'')==='platform_admin';",
  "[a.userId]);\n        const shopScope=await adminMobileEntityScope(pool,'shop',a.userId,q.rows.map(s=>s.id));",'shop_rows_scope');
 patch("const shops=q.rows.filter(shop=>!scoped || shop.rental_enabled===false && shop.sale_enabled===true || invitedShopSet.has(String(shop.id))).map(shop=>{const previewPrivate=previewAllowed&&shop.private_admin_only===true;return {...shop,is_primary:String(shop.id)===String(primaryShopId||''),canRent:previewPrivate||reachAllows(shop,'rental',viewer),canBuy:previewPrivate||reachAllows(shop,'sale',viewer)}})",
  "const shops=q.rows.filter(shop=>(!shopScope.restricted.has(String(shop.id))||shopScope.allowed.has(String(shop.id)))&&(!scoped || shop.rental_enabled===false && shop.sale_enabled===true || invitedShopSet.has(String(shop.id)) || shopScope.allowed.has(String(shop.id))&&shopScope.restricted.has(String(shop.id)))).map(shop=>{const approvedAdminShop=shopScope.restricted.has(String(shop.id))&&shopScope.allowed.has(String(shop.id));return {...shop,is_primary:String(shop.id)===String(primaryShopId||''),canRent:approvedAdminShop||reachAllows(shop,'rental',viewer),canBuy:approvedAdminShop||reachAllows(shop,'sale',viewer)}})",'shop_rows_filter');
 patch('AND (COALESCE(s.private_admin_only,false)=false OR $3::boolean=true) AND (s.active_from IS NULL OR s.active_from<=now())',
  'AND (s.active_from IS NULL OR s.active_from<=now())','shop_select_predicate');
 patch("[shopId, a.userId, normalizeMobile(String(a.mobile||''))===EQUIPMENT_STORE_PREVIEW_ADMIN_MOBILE_V802 || String(a.platformRole||'')==='platform_admin']);",
  '[shopId,a.userId]);','shop_select_params');
 // Store admin access now depends on login identity and confirmed membership,
 // not whether the owner gave the store a particular test name.
 // Customer lab list: restrict both discoverable and connected rows.
 patch("const originContext=await photographerInitialOriginContext(a.userId);\n            const primaryLabId=originContext.originType==='lab'?originContext.primaryLabId:null;",
  "labs=await filterAdminMobileEntities(pool,'lab',a.userId,labs);\n            const visibleMemberships=await filterAdminMobileEntities(pool,'lab',a.userId,memberships.rows);\n            const visibleLabIds=new Set([...labs,...visibleMemberships].map(l=>String(l.id)));\n            const originContext=await photographerInitialOriginContext(a.userId);\n            const primaryLabId=originContext.originType==='lab'?originContext.primaryLabId:null;",'lab_list_filter');
 patch('memberships:sortPrimary(memberships.rows), activeLabId, primaryLabId, canDiscoverLabs',
  'memberships:sortPrimary(visibleMemberships), activeLabId, primaryLabId, canDiscoverLabs','lab_member_filter');
 // Also permit an admin-mobile photographer to discover their own lab even
 // when a different originating lab still imposes an invitation scope.
 patch("const originContext=await photographerInitialOriginContext(a.userId);\n            const primaryLabId=originContext.originType==='lab'?originContext.primaryLabId:null;",
  "if(!canDiscoverLabs){\n              const own=await pool.query(`SELECT l.id,l.name,l.slug,l.province,l.city,l.photographer_join_discount_percent,\n                EXISTS(SELECT 1 FROM lab_memberships m WHERE m.lab_id=l.id AND m.user_id=$1 AND m.role='customer' AND m.active=true) connected,\n                NULL::text request_status,NULL::timestamptz requested_at,NULL::timestamptz reviewed_at,0::numeric collaboration_discount_percent\n                FROM labs l WHERE l.active=true AND COALESCE(l.suspended,false)=false AND l.service_only=false\n                AND (l.active_from IS NULL OR l.active_from<=now()) AND (l.active_until IS NULL OR l.active_until>=now())\n                ORDER BY l.id`,[a.userId]);\n              const ownScope=await adminMobileEntityScope(pool,'lab',a.userId,own.rows.map(x=>x.id));\n              for(const row of own.rows){if(ownScope.ownerMatched.has(String(row.id))&&!labs.some(x=>String(x.id)===String(row.id)))labs.push(row)}\n            }\n            for(const lab of labs)visibleLabIds.add(String(lab.id));\n            if(!visibleLabIds.has(activeLabId))activeLabId='';\n            const originContext=await photographerInitialOriginContext(a.userId);\n            const primaryLabId=originContext.originType==='lab'?originContext.primaryLabId:null;",'admin_owner_lab_discovery');
 // Collaboration may be requested ONLY when original scope allows it or the
 // target admin-owned laboratory matches this viewer's own admin mobile.
 patch("if (!(await photographerCanDiscoverLabs(a.userId)))\n                return sendJson(res, 403, { error: 'lab_discovery_not_allowed' });\n            const targetLab = customerLabRequest[1];",
  "const targetLab = customerLabRequest[1];\n            const scope=await adminMobileEntityScope(pool,'lab',a.userId,[targetLab]);\n            if(!scope.restricted.has(String(targetLab))&&!await photographerCanDiscoverLabs(a.userId))return sendJson(res,403,{error:'lab_discovery_not_allowed'});\n            if(scope.restricted.has(String(targetLab))&&!scope.allowed.has(String(targetLab)))return sendJson(res,403,{error:'lab_admin_scope_forbidden'});",'lab_request_gate');
 patch("const targetLab = customerLabSelect[1];\n            const q = await pool.query(",
  "const targetLab = customerLabSelect[1];\n            if(!(await adminMobileEntityVisible(pool,'lab',a.userId,targetLab)))return sendJson(res,403,{error:'lab_admin_scope_forbidden'});\n            const q = await pool.query(",'lab_select_gate');
}
if(src.split(marker).length!==2)throw Error('[R1106] scope patch duplicate or missing');
fs.writeFileSync(file,src,'utf8');
console.log('[PhotoBridge R1106] admin-mobile ownership scope enforced for lab/store discovery');
