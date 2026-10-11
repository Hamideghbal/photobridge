import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
const marker='/* PB_R1106_TEST_ACCOUNT_VISIBILITY */';
if(!s.includes(marker)){
 const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R1106 anchor missing/duplicate: '+a.slice(0,100));s=s.replace(a,b)};
 s="import { testAccountVisibleSql, testAccountSql } from './test-account-visibility.js';\n"+s;
 // Ignore the historical Sofia privacy flag. No data is changed or migrated.
 once("            await pool.query(`UPDATE equipment_rental_shops SET private_admin_only=true\n              WHERE private_admin_only=false AND (lower(coalesce(name,''))='sofia' OR lower(coalesce(slug,''))='sofia' OR lower(coalesce(slug,'')) LIKE '%sofia%' OR name ILIKE '%صوفیا%' OR name ILIKE '%سوفیا%')`);",'            '+marker);
 once("    if(shop.private_admin_only && !(await equipmentRentalPrivatePreviewAllowed(db,userId)))return false;", "    const visibility=await db.query(`SELECT 1 FROM equipment_rental_shops s WHERE s.id=$1 AND ${testAccountVisibleSql('shop','s','$2')}`,[shopId,userId]);\n    if(!visibility.rowCount)return false;");
 // Directory no longer filters by the legacy name-derived flag.
 once("(COALESCE(s.private_admin_only,false)=false OR $2::boolean=true)","${testAccountVisibleSql('shop','s','$1')}");
 once("[a.userId, normalizeMobile(String(a.mobile||''))===EQUIPMENT_STORE_PREVIEW_ADMIN_MOBILE_V802 || String(a.platformRole||'')==='platform_admin']);",'[a.userId]);');
 once("(COALESCE(s.private_admin_only,false)=false OR $3::boolean=true)","${testAccountVisibleSql('shop','s','$2')}");
 once("[shopId, a.userId, normalizeMobile(String(a.mobile||''))===EQUIPMENT_STORE_PREVIEW_ADMIN_MOBILE_V802 || String(a.platformRole||'')==='platform_admin']);",'[shopId, a.userId]);');
 once("const previewPrivate=previewAllowed&&shop.private_admin_only===true;",'const previewPrivate=false;');
 // Apply the same gate to all directory/member rows and to explicit selection/request.
 const start=s.indexOf("if (req.method === 'GET' && url.pathname === '/api/customer/labs')"),end=s.indexOf("if (req.method === 'PUT' && url.pathname === '/api/customer/client-gallery-branding')",start);
 let part=s.slice(start,end);
 part=part.replaceAll("m.role='customer' AND m.active=true", "m.role='customer' AND m.active=true AND ${testAccountVisibleSql('lab','l','$1')}");
 part=part.replace('l.photographer_discovery_enabled=true','l.photographer_discovery_enabled=true AND ${testAccountVisibleSql(\'lab\',\'l\',\'$1\')}');
 part=part.replace("SELECT id,name,photographer_discovery_enabled,photographer_join_discount_percent FROM labs WHERE id=$1 AND active=true AND COALESCE(suspended,false)=false AND service_only=false LIMIT 1`, [targetLab]", "SELECT id,name,photographer_discovery_enabled,photographer_join_discount_percent FROM labs l WHERE id=$1 AND active=true AND COALESCE(suspended,false)=false AND service_only=false AND ${testAccountVisibleSql('lab','l','$2')} LIMIT 1`, [targetLab,a.userId]");
 // One EXISTS inside the directory uses $1 correctly; select query also uses user as $1.
 s=s.slice(0,start)+part+s.slice(end);
 // Auth's customer lab choice must not inherit a hidden test laboratory from another role.
 once("AND ($2::text IS DISTINCT FROM 'customer' OR l0.service_only=true OR (l0.active=true", "AND ($2::text IS DISTINCT FROM 'customer' OR l0.service_only=true OR (${testAccountVisibleSql('lab','l0','u.id')} AND l0.active=true");
 // Connected entry-context IDs cannot leak hidden institutions either.
 once("m.role='photographer' AND m.active=true AND s.active=true", "m.role='photographer' AND m.active=true AND ${testAccountVisibleSql('shop','s','$1')} AND s.active=true");
 once("m.role='customer' AND m.active=true AND l.active=true AND COALESCE(l.suspended,false)=false AND l.service_only=false AND (l.active_from IS NULL OR l.active_from<=now()) AND (l.active_until IS NULL OR l.active_until>=now()) ORDER BY (m.lab_id::text=$2::text)", "m.role='customer' AND m.active=true AND ${testAccountVisibleSql('lab','l','$1')} AND l.active=true AND COALESCE(l.suspended,false)=false AND l.service_only=false AND (l.active_from IS NULL OR l.active_from<=now()) AND (l.active_until IS NULL OR l.active_until>=now()) ORDER BY (m.lab_id::text=$2::text)");
 fs.writeFileSync(file,s);
}
let guarded=fs.readFileSync(file,'utf8').replace("import { testAccountVisibleSql }","import { testAccountVisibleSql, testAccountSql }");
guarded=guarded.replace("SELECT active,active_from,active_until,service_only FROM labs WHERE id=$1`, [labId]", "SELECT active,active_from,active_until,service_only FROM labs l WHERE id=$1 AND (l.service_only=true OR ${testAccountVisibleSql('lab','l','$2')})`, [labId,a.userId]");
guarded=guarded.replace("COALESCE(s.private_admin_only,false)=false","${testAccountVisibleSql('shop','s','$1')}").replace("ORDER BY s.created_at DESC LIMIT 100`);","ORDER BY s.created_at DESC LIMIT 100`,[a?.userId||null]);");
guarded=guarded.replace('SELECT 1 FROM equipment_rental_shops s WHERE s.id=$1 AND ${testAccountVisibleSql', 'SELECT ${testAccountSql(\'shop\',\'s\')} AS test_account FROM equipment_rental_shops s WHERE s.id=$1 AND ${testAccountVisibleSql');
guarded=guarded.replace("if (shop.rental_enabled !== false && (await photographerInitialInviteType(userId)) === 'rental')","if (!visibility.rows[0]?.test_account && shop.rental_enabled !== false && (await photographerInitialInviteType(userId)) === 'rental')");
guarded=guarded.replace("SELECT s.id,s.name,s.slug,s.province,s.city,s.address,s.description,s.deposit_policy,s.private_admin_only","SELECT ${testAccountSql('shop','s')} AS admin_test_account,s.id,s.name,s.slug,s.province,s.city,s.address,s.description,s.deposit_policy,s.private_admin_only");
guarded=guarded.replace("q.rows.filter(shop=>!scoped","q.rows.filter(shop=>shop.admin_test_account || !scoped").replace(".map(shop=>{const previewPrivate=false;",".map(({admin_test_account,...shop})=>{const previewPrivate=false;");
// Invitation-scoped photographers also see test labs that invited their own number,
// even before redemption. Normal public-lab discovery remains scoped as before.
const labAnchor="const originContext=await photographerInitialOriginContext(a.userId);\n            const primaryLabId";
if(!guarded.includes('PB_R1106_PENDING_TEST_LAB_INVITES'))guarded=guarded.replace(labAnchor,"/* PB_R1106_PENDING_TEST_LAB_INVITES */\n            if (!canDiscoverLabs) {\n                const testLabs=await pool.query(`SELECT l.id,l.name,l.slug,l.province,l.city,l.photographer_join_discount_percent,EXISTS(SELECT 1 FROM lab_memberships m WHERE m.lab_id=l.id AND m.user_id=$1 AND m.role='customer' AND m.active=true) connected,NULL::text request_status,NULL::timestamptz requested_at,NULL::timestamptz reviewed_at,0::numeric collaboration_discount_percent FROM labs l WHERE l.active=true AND COALESCE(l.suspended,false)=false AND l.service_only=false AND ${testAccountSql('lab','l')} AND ${testAccountVisibleSql('lab','l','$1')} AND (l.active_from IS NULL OR l.active_from<=now()) AND (l.active_until IS NULL OR l.active_until>=now())`,[a.userId]);\n                const known=new Set(labs.map(row=>String(row.id)));labs.push(...testLabs.rows.filter(row=>!known.has(String(row.id))));\n            }\n            "+labAnchor);
guarded=guarded.replace('/* PB_R1106_PENDING_TEST_LAB_INVITES */\n            if (!canDiscoverLabs) {','/* PB_R1106_PENDING_TEST_LAB_INVITES */\n            {');
const selectAt=guarded.indexOf('const customerLabSelect ='),selectEnd=guarded.indexOf("if (req.method === 'PUT' && url.pathname === '/api/customer/client-gallery-branding')",selectAt);
let select=guarded.slice(selectAt,selectEnd);
select=select.replace('SELECT l.id,l.name,l.active,l.active_from,l.active_until,l.service_only,l.suspended,l.suspension_reason FROM lab_memberships',"SELECT ${testAccountSql('lab','l')} AS test_account,l.id,l.name,l.active,l.active_from,l.active_until,l.service_only,l.suspended,l.suspension_reason FROM lab_memberships");
select=select.replace("if (!row.service_only && !(await photographerCanDiscoverLabs(a.userId)))","if (!row.service_only && !row.test_account && !(await photographerCanDiscoverLabs(a.userId)))");
select=select.replace('return sendJson(res, 200, { ok: true, lab: row });','const {test_account,...publicRow}=row;\n            return sendJson(res, 200, { ok: true, lab: publicRow });');
guarded=guarded.slice(0,selectAt)+select+guarded.slice(selectEnd);
fs.writeFileSync(file,guarded);
console.log('[R1106] mobile-based test institution discovery and direct access prepared');
