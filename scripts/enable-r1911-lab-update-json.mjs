// R1911: ADDITIVE signed Windows updater JSON endpoint; no photo-download changes.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js',marker='/* R1911 SIGNED LAB WINDOWS UPDATE JSON */';
let source=fs.readFileSync(file,'utf8');
function once(a,b,label){if(source.split(a).length!==2)throw Error('R1911 server anchor changed: '+label);source=source.replace(a,b);}
if(!source.includes(marker)){
 once("import crypto from 'node:crypto';",
 "import crypto from 'node:crypto';\nimport {validLabUpdatePair,checkLabInstallerBytes} from './lab-desktop-update-manifest.js';",
 'security module import');
 const start=source.indexOf('function cleanLabDesktopRelease('),end=source.indexOf('async function labDesktopReleaseSetting()',start);
 if(start<0||end<=start)throw Error('R1911 missing release-cleaner section');
 let part=source.slice(start,end);
 const key='updatedAt: x.updatedAt || x.updated_at || null';
 if(part.split(key).length!==2)throw Error('R1911 release-cleaner anchor drift');
 part=part.replace(key,"updatedAt: x.updatedAt || x.updated_at || null,\n        updateManifest: validLabUpdatePair(x.updateManifest,{version,bytes:Math.max(0,Number(x.bytes||0)||0),objectKey})?x.updateManifest:null");
 source=source.slice(0,start)+part+source.slice(end);
 once("    if (req.method === 'POST' && url.pathname === '/api/admin/lab-desktop-release/upload') {",
 "    // Publisher-signed JSON is activated ONLY after checking the actual EXE.\n    if (req.method === 'POST' && url.pathname === '/api/admin/lab-desktop-release/update-manifest') {\n        if (!requireRole(a,'platform_admin')) return sendJson(res,403,{error:'forbidden'});\n        if (!storageConfigured || !s3Download) return sendJson(res,503,{error:'upload_not_configured'});\n        const current=await labDesktopReleaseSetting();\n        if (!current?.objectKey) return sendJson(res,409,{error:'installer_missing'});\n        const body=await bodyJson(req), candidate=body?.update||body?.manifest||body;\n        if (!validLabUpdatePair(candidate,current)) return sendJson(res,400,{error:'invalid_signed_update_manifest'});\n        const stat=await storageStat(current.objectKey).catch(()=>null);\n        if (Number(stat?.ContentLength)!==candidate.size) return sendJson(res,409,{error:'installer_size_mismatch'});\n        try {\n            const object=await s3Download.send(new GetObjectCommand({Bucket:S3_BUCKET,Key:current.objectKey}));\n            await checkLabInstallerBytes(object?.Body,candidate);\n        }catch(error){return sendJson(res,409,{error:'installer_checksum_mismatch'})}\n        const latest=await labDesktopReleaseSetting();\n        if (latest?.objectKey!==current.objectKey) return sendJson(res,409,{error:'installer_changed'});\n        const release=await saveLabDesktopReleaseSetting({...latest,updateManifest:candidate,updatedAt:new Date().toISOString()});\n        await audit(a.userId,undefined,'platform_admin.lab_signed_updater_manifest_activate',\n            'platform_setting',LAB_DESKTOP_RELEASE_SETTING_KEY,\n            {version:candidate.version,sha256:candidate.sha256,bytes:candidate.size}).catch(()=>{});\n        return sendJson(res,200,{ok:true,version:release.version,sha256:candidate.sha256,updateReady:true});\n    }\n"+"    if (req.method === 'POST' && url.pathname === '/api/admin/lab-desktop-release/upload') {",
 'admin update activation');
 once("        if (url.pathname === '/api/lab/desktop-installer'",
 "        // The installed Lab updater expects this authenticated path.\n        // No JSON is returned before EXE+publisher proof are activated.\n        if (req.method === 'GET' && url.pathname === '/api/lab/desktop-installer/update') {\n            const eligible = await pool.query(\"SELECT 1 FROM labs l JOIN lab_memberships m ON m.lab_id=l.id AND m.user_id=$2 AND m.role='lab_admin' AND m.active=true WHERE l.id=$1 AND l.active=true AND COALESCE(l.suspended,false)=false LIMIT 1\",[labId,a.userId]);\n            if (!eligible.rowCount) return sendJson(res,403,{error:'desktop_access_denied'});\n            const release=await labDesktopReleaseSetting().catch(()=>null);\n            const update=release?.updateManifest&&validLabUpdatePair(release.updateManifest,release)?release.updateManifest:null;\n            return sendJson(res,200,{update});\n        }\n"+"        if (url.pathname === '/api/lab/desktop-installer'",
 'authenticated updater GET');
 source+='\n'+marker+'\n';
 fs.writeFileSync(file,source);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1911] Signed Lab updater metadata installed (no photo-download or existing installer route changed)');
