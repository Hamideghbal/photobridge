import fs from 'node:fs';
const path='dist/api/server.js';
let src=fs.readFileSync(path,'utf8');
const marker='/* PB_R1098_PHOTOGRAPHER_LAB_DISCOVERY */';
const replacement="/* PB_R1098_PHOTOGRAPHER_LAB_DISCOVERY */\nasync function photographerCanDiscoverLabs(userId) {\n // Preserve the invite-origin policy: only invited labs are visible to lab-origin users.\n if (await photographerJoinedViaLabInvite(userId)) return false;\n // A real, enabled independent photographer should not lose the lab directory\n // merely because a legacy service-only membership row is missing.\n const q = await pool.query(\"SELECT EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.photographer_enabled=true) photographer_enabled,\\n EXISTS(SELECT 1 FROM lab_memberships m JOIN labs l ON l.id=m.lab_id\\n WHERE m.user_id=$1 AND m.role='customer' AND m.active=true AND l.service_only=true) legacy_standalone_member\",[userId]);\n return Boolean(q.rows[0]?.photographer_enabled || q.rows[0]?.legacy_standalone_member);\n}";
if(!src.includes(marker)){
 const start=src.indexOf('async function photographerCanDiscoverLabs(userId) {');
 const end=src.indexOf(' // v904R11',start);
 if(start<0||end<=start||!src.slice(start,end).includes('l.service_only=true'))throw Error('[R1098] discovery eligibility anchor changed');
 src=src.slice(0,start)+replacement+src.slice(end);
}
if(src.split(marker).length!==2)throw Error('[R1098] missing or duplicate marker');
fs.writeFileSync(path,src,'utf8');
console.log('[PhotoBridge R1098] public lab discovery for enabled independent photographers, invitation scope preserved');
