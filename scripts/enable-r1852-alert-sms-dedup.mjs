// R1852 is deliberately applied after R1850/R1851, before final HTML/perf steps.
import fs from 'node:fs';
const serverFile='dist/api/server.js';
function once(source,needle,replacement){
  if(source.split(needle).length!==2)throw Error('R1852 anchor mismatch: '+needle.slice(0,100));
  return source.replace(needle,replacement);
}
fs.copyFileSync('scripts/r1852-sms-alert-guard.mjs','dist/api/sms-alert-guard.mjs');
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('R1852: durable administrator SMS guard')){
  server="import {stageFromErrorPath,shouldNotifySms,loadSmsOrigin,formatAlertSms,reserveAdminAlert,completeAdminAlert} from './sms-alert-guard.mjs';\n"+server;
  server=once(server,
    "  const adapter=SMS_PROVIDER_ADAPTERS[cfg.provider];if(!adapter)throw Error('sms_provider_unsupported');",
    "  const adapter=SMS_PROVIDER_ADAPTERS[cfg.provider];if(!adapter)throw Error('sms_provider_unsupported');\n"+
    "  // R1852: durable administrator SMS guard: only server-confirmed transfer failures.\n"+
    "  if(!shouldNotifySms(incident))return {state:'suppressed',reason:'not_actionable_server_transfer_error'};");
  const oldMessage="  const message='هشدار PhotoBridge\\n'+incident.id+'\\n'+incident.channel+' / '+incident.stage+' / '+incident.code+' / '+incident.status+'\\nتعداد: '+incident.count+'\\nپیگیری: photobridge.ir/admin/error-monitor';\n"+
    "  const result=await adapter(normalizeMobile(admin.mobile),message+'\\n'+cfg.footer,cfg);\n"+
    "  void logSms({provider:cfg.provider,purpose:'admin_alert',eventKey:'application_error',mobile:admin.mobile,userId:admin.id,status:'sent',reference:result.reference,metadata:{incidentId:incident.id}}).catch(()=>{});";
  const replacement=String.raw`
  let origin;
  try{origin=await loadSmsOrigin(pool,incident);}
  catch(_){origin={lab:'نامشخص',photographer:'نامشخص'};}
  // Reserve the right to send BEFORE contacting the paid provider. A failed DB
  // claim always fails closed, preventing duplicate billed SMS on retries.
  const claimed=await reserveAdminAlert(pool,incident,{
    provider:cfg.provider,mobile:normalizeMobile(admin.mobile),adminId:admin.id});
  if(!claimed.reserved)return {state:'suppressed',reason:claimed.reason};
  try{
    const message=formatAlertSms(incident,origin)+'\n'+cfg.footer;
    const result=await adapter(normalizeMobile(admin.mobile),message,cfg);
    await completeAdminAlert(pool,claimed,{success:true,reference:result.reference});
    return {state:'sent'};
  }catch(error){
    await completeAdminAlert(pool,claimed,{
      success:false,errorCode:String(error?.code||'sms_provider_error')}).catch(()=>{});
    throw error;
  }`;
  server=once(server,oldMessage,replacement);
  // The existing role-auth gate is unchanged. Attach server-validated identity
  // to the request for error reporting only; never trust browser-supplied IDs.
  server=once(server,
    "    const a = await auth(req);\n    // Independent owner-scoped CRM endpoints;",
    String.raw`    const a = await auth(req);
    if(a){req.PB1852userId=a.userId;req.PB1852labId=a.labId||null;
      req.PB1852photographerId=requestPortal(req)==='photographer'?a.userId:null;}
    // Independent owner-scoped CRM endpoints;`);
  // For photographers working with multiple laboratories, the selection is only
  // applied after the existing membership validation has succeeded.
  const labScope="        const access = await pool.query(`SELECT active,active_from,active_until,service_only FROM labs l WHERE id=$1";
  server=once(server,labScope,
    "        req.PB1852labId=labId;\n"+labScope);
  // Lab download: resolve the actual photographer from the authorized order,
  // not from any browser field. Carry that trusted scope through the opaque
  // one-use stream token because S3 GET errors occur on /api/public-download.
  const downloadSql="o.settlement_mode,o.payment_status FROM order_files f JOIN orders o";
  server=once(server,downloadSql,
    "o.settlement_mode,o.payment_status,o.customer_id AS pb1852_photographer_id FROM order_files f JOIN orders o");
  const downloadRow="            const row = q.rows[0];\n            if (row.settlement_mode === 'prepaid' && row.payment_status !== 'paid')";
  server=once(server,downloadRow,
    "            const row = q.rows[0];\n"+
    "            req.PB1852photographerId=row.pb1852_photographer_id||null;\n"+
    "            if (row.settlement_mode === 'prepaid' && row.payment_status !== 'paid')");
  const localToken="downloadTokens.set(token, { kind: 'local', path: filePath, name: row.original_name, expires: Date.now() + 5 * 60 * 1000, contentType: row.content_type });";
  server=once(server,localToken,
    "downloadTokens.set(token, { kind: 'local', path: filePath, name: row.original_name, expires: Date.now() + 5 * 60 * 1000, contentType: row.content_type, labId, photographerId:req.PB1852photographerId });");
  const s3Token="downloadTokens.set(token, { kind: 's3', key: row.object_key, name: row.original_name, expires: Date.now() + 5 * 60 * 1000, contentType: row.content_type });";
  server=once(server,s3Token,
    "downloadTokens.set(token, { kind: 's3', key: row.object_key, name: row.original_name, expires: Date.now() + 5 * 60 * 1000, contentType: row.content_type, labId, photographerId:req.PB1852photographerId });");
  const streamToken="        const item = downloadTokens.get(publicDownload[1]);";
  server=once(server,streamToken,
    streamToken+"\n        if(item){req.PB1852labId=item.labId||null;req.PB1852photographerId=item.photographerId||null;}");
  // Scope error reports to the authenticated principal (never to client data).
  const reporter="userId:actor.userId,revision:process.env.DEPLOY_REVISION||'r1850'";
  server=once(server,reporter,
    "userId:actor.userId,labId:actor.labId||null,photographerId:requestPortal(req)==='photographer'?actor.userId:null,revision:process.env.DEPLOY_REVISION||'r1850'");
  const stage="stage:/presign/.test(req.url||'')?'presign':/uploads/.test(req.url||'')?'complete':/submit/.test(req.url||'')?'submit':'api'";
  server=once(server,stage,"stage:stageFromErrorPath(req.url)");
  const context="route:req.url,reference:PB1850reference";
  server=once(server,context,
    "route:req.url,reference:PB1850reference,userId:req.PB1852userId,labId:req.PB1852labId,photographerId:req.PB1852photographerId");
  fs.writeFileSync(serverFile,server);
}
console.log('[R1852] persistent SMS suppression; per-lab/studio origin; low-noise download/upload alerts');
