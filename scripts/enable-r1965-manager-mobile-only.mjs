// R1965 — manager production notifications belong to mobile (Android/iOS) only.
// Leave Windows' existing initial-order progress/ticks/native alerts unchanged.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
const mark='/* PB1965 MANAGER MOBILE ONLY */';
let s=fs.readFileSync(path,'utf8');
function once(a,b,label){const n=s.split(a).length-1;if(n!==1)throw Error('[R1965] '+label+' anchor count '+n);s=s.replace(a,b)}
function section(start,end,fn,label){
 const i=s.indexOf(start),j=i<0?-1:s.indexOf(end,i+start.length);
 if(i<0||j<=i)throw Error('[R1965] missing '+label+' section');
 s=s.slice(0,i)+fn(s.slice(i,j))+s.slice(j);
}
if(!s.includes(mark)){
 // Scope only the new mobile-manager push events. Existing native order popup,
 // generic Lab events and legacy Web Push are not changed.
 once("AND u.active=true)\":\"recipient_user_id=$1 AND recipient_lab_id IS NULL\";",
      "AND u.active=true) AND web_push_subscriptions.user_agent ~* '(Android|iPhone|iPad|iPod|Mobile)'\":\"recipient_user_id=$1 AND recipient_lab_id IS NULL\";",
      'push recipients restricted to manager mobile devices');
 // Mobile lab notification bell sees the manager log. The Windows Lab bell
 // (including historical r1962 entries) must not show these extra alerts.
 section("if (req.method === 'GET' && url.pathname === '/api/lab/notifications') {",
         "if (req.method === 'GET' && url.pathname === '/api/lab/events') {",part=>{
  const oldGet="const [items, unread] = await Promise.all([";
  const prefix="const managerMobile=/Android|iPhone|iPad|iPod|Mobile/i.test(String(req.headers['user-agent']||''));\n            "+oldGet;
  if(part.split(oldGet).length!==2)throw Error('[R1965] notification mobile flag anchor');
  part=part.replace(oldGet,prefix);
  const only=" AND ($2::boolean OR (event_key NOT LIKE 'lab_manager_%' AND COALESCE(metadata->>'pbManagerMobileOnly','false') <> 'true'))";
  const listOld="WHERE recipient_lab_id=$1 ORDER BY created_at DESC LIMIT $2";
  const listNew="WHERE recipient_lab_id=$1"+only+" ORDER BY created_at DESC LIMIT $3";
  if(part.split(listOld).length!==2)throw Error('[R1965] lab notification list SQL changed');
  part=part.replace(listOld,listNew);
  part=part.replace("FROM system_notifications WHERE recipient_lab_id=$1 AND read_at IS NULL",
                    "FROM system_notifications WHERE recipient_lab_id=$1 AND read_at IS NULL"+only);
  part=part.replace("[labId, limit]","[labId, managerMobile]");
  // Previous replacement changes LIMIT to $3; keep the limit parameter.
  part=part.replace("ORDER BY created_at DESC LIMIT $3\`, [labId, managerMobile])",
                    "ORDER BY created_at DESC LIMIT $3\`, [labId, managerMobile, limit])");
  // Count SELECT and both read paths need their own mobile flag argument.
  part=part.replaceAll("WHERE recipient_lab_id=$1 AND read_at IS NULL\`, [labId])",
                       "WHERE recipient_lab_id=$1 AND read_at IS NULL"+only+"\`, [labId, managerMobile])");
  // A desktop 'read all' must not clear mobile-only manager events.
  part=part.replace("WHERE recipient_lab_id=$1 AND read_at IS NULL\`, [labId]);",
                    "WHERE recipient_lab_id=$1 AND read_at IS NULL"+only+"\`, [labId, managerMobile]);");
  part=part.replace("WHERE recipient_lab_id=$1 AND id=ANY($2::uuid[])\`, [labId, ids])",
                    "WHERE recipient_lab_id=$1 AND id=ANY($2::uuid[]) AND ($3::boolean OR (event_key NOT LIKE 'lab_manager_%' AND COALESCE(metadata->>'pbManagerMobileOnly','false') <> 'true'))\`, [labId, ids, managerMobile])");
  return part;
 },'lab notification list and read');
 // A real verified download is reported only after the transaction and file count
 // have succeeded — not at download start, nor from an arbitrary progress animation.
 section("const labDownloadReceipt=url.pathname.match(",
         "const labOrderDownloadCheck = url.pathname.match(",part=>{
  const needle="return sendJson(res,200,result)}catch(error)";
  if(part.split(needle).length!==2)throw Error('[R1965] receipt response anchor');
  return part.replace(needle,
   "void pb1962LabManagerNotify(labId,'download_verified',{orderId:result.order?.id,number:result.order?.number,mode:result.order?.mode,updatedAt:result.order?.updated_at});"+
   "if(result.invoice?.id)void pb1962LabManagerNotify(labId,'invoice_created',{orderId:result.order?.id,number:result.order?.number,orderNumber:result.order?.number,mode:result.order?.mode,invoiceId:result.invoice.id,invoiceNumber:result.invoice.number});"+
   needle);
 },'verified download receipt');
 // The alternative invoice endpoint also needs a mobile event when a *new* invoice
 // is committed; existing invoices and retry attempts should not send a duplicate.
 once("storageConfigured,storagePresign,audit,actorId:a.userId}))return;",
      "storageConfigured,storagePresign,audit,actorId:a.userId,"+
      "onInvoiceCreated:(lab,order,invoice)=>pb1962LabManagerNotify(lab,'invoice_created',{orderId:order.id,number:order.number,orderNumber:order.number,mode:order.mode,invoiceId:invoice.id,invoiceNumber:invoice.number})}))return;",
      'automation invoice postcommit notifier');
 s+='\n'+mark+'\n';
 fs.writeFileSync(path,s);
}
const auto='dist/api/lab-auto-processing.js';
let a=fs.readFileSync(auto,'utf8');
const amark='/* PB1965 AUTOMATION INVOICE MOBILE */';
if(!a.includes(amark)){
 const old='storageConfigured,storagePresign,audit,actorId})';
 if(a.split(old).length!==2)throw Error('[R1965] automation callback signature changed');
 a=a.replace(old,'storageConfigured,storagePresign,audit,actorId,onInvoiceCreated})');
 const before="if(!wasExisting)await audit?.(actorId,labId,'lab.automation_invoice','invoice',invoice.id,{orderId:id}).catch(()=>{});";
 if(a.split(before).length!==2)throw Error('[R1965] automation after-commit anchor changed');
 a=a.replace(before,before+"\n  if(!wasExisting&&invoice?.id)await onInvoiceCreated?.(labId,order,invoice).catch(()=>{});");
 a+='\n'+amark+'\n';
 fs.writeFileSync(auto,a);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
execFileSync(process.execPath,['--check',auto],{stdio:'inherit'});
console.log('[R1965] Manager events mobile-only: verified downloads, invoices, status and album stages');
