// R1105: let lab-origin photographers discover new laboratories when their
// originating lab revokes or ends the membership. No data modifications.
import fs from 'node:fs';
const file='dist/api/server.js';
let src=fs.readFileSync(file,'utf8');
const marker='/* PB_R1105_ORIGIN_LAB_RELEASE */';
if(!src.includes(marker)){
  const before="if (await photographerJoinedViaLabInvite(userId))\n        return false;";
  const after=[
    "if (await photographerJoinedViaLabInvite(userId)) {",
    "        /* PB_R1105_ORIGIN_LAB_RELEASE */",
    "        const origin = await photographerInitialOriginContext(userId);",
    "        const originalLabId = String(origin.primaryLabId || '') || null;",
    "        // An origin-lab restriction lasts only while the inviting lab has",
    "        // an active, accessible customer membership for this photographer.",
    "        const connection = await pool.query(QQSELECT EXISTS(",
    "          SELECT 1 FROM lab_memberships m JOIN labs l ON l.id=m.lab_id",
    "          WHERE m.user_id=$1 AND m.role='customer' AND m.active=true",
    "            AND l.service_only=false AND l.active=true",
    "            AND COALESCE(l.suspended,false)=false",
    "            AND (l.active_from IS NULL OR l.active_from<=now())",
    "            AND (l.active_until IS NULL OR l.active_until>=now())",
    "            AND ($2::uuid IS NULL OR m.lab_id=$2::uuid)",
    "        ) origin_lab_connectedQQ, [userId, originalLabId]);",
    "        // When historical inviter ID is unavailable, use active real-lab",
    "        // membership as conservative fallback instead of guessing a lab.",
    "        return !Boolean(connection.rows[0]?.origin_lab_connected);",
    "    }"
  ].join('\n').replaceAll('QQ',String.fromCharCode(96));
  if(src.split(before).length!==2)throw Error('[R1105] discovery gate moved');
  src=src.replace(before,after);
  // Legacy lab invitations may have an audit event but no redemption. Recover
  // the actual original lab before falling back to a *later* collaboration.
  const historical="primaryLabId = String(q.rows[0]?.id || '');\n        if (!primaryLabId) {";
  const historicalWithAudit=[
    "primaryLabId = String(q.rows[0]?.id || '');",
    "        if (!primaryLabId) {",
    "            const aq = await pool.query(QQSELECT a.lab_id::text id",
    "                FROM audit_log a",
    "                WHERE a.entity_type='user' AND a.entity_id::text=$1::text",
    "                  AND a.lab_id IS NOT NULL",
    "                  AND a.action IN ('invitation.register','photographer.invite_redeem')",
    "                ORDER BY a.created_at ASC LIMIT 1QQ, [userId]);",
    "            primaryLabId = String(aq.rows[0]?.id || '');",
    "        }",
    "        if (!primaryLabId) {"
  ].join('\n').replaceAll('QQ',String.fromCharCode(96));
  if(src.split(historical).length!==2)throw Error('[R1105] legacy inviter recovery moved');
  src=src.replace(historical,historicalWithAudit);
  fs.writeFileSync(file,src,'utf8');
}
if(src.split(marker).length!==2)throw Error('[R1105] marker missing or duplicate');
console.log('[R1105] origin-lab disconnect frees laboratory discovery');
