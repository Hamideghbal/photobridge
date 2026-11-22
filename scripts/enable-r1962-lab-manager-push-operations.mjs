/* R1962 — wire committed lab orders from Windows/web to existing mobile Push. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import zlib from 'node:zlib';
const path='dist/api/server.js';
let s=fs.readFileSync(path,'utf8');
const once=(src,a,b,label)=>{if(src.split(a).length!==2)throw Error('[R1962] '+label+' anchor changed');return src.replace(a,b)};
s=once(s,'function publishCustomerEvent(labId, customerId, event, data) {',
  fs.readFileSync('scripts/r1962-lab-manager-events.js.txt','utf8')+'\nfunction publishCustomerEvent(labId, customerId, event, data) {','install manager helper');
s=once(s,'    void storeCustomerSystemNotification(customerId, event, data, labId);\n    const clients = customerEventClients.get',
  '    void storeCustomerSystemNotification(customerId, event, data, labId);\n'+
  "    if(['order_status','album_stage_updated','invoice_ready','invoice_pricing_ready'].includes(event)){\n"+
  '      void pb1962LabManagerNotify(labId,event,data);\n'+
  "      if(event==='order_status'&&data?.invoice?.id)void pb1962LabManagerNotify(labId,'invoice_created',{\n"+
  '        ...data,invoiceId:data.invoice.id,invoiceNumber:data.invoice.number,orderNumber:data.number});\n'+
  '    }\n    const clients = customerEventClients.get','postcommit order/invoice events');
s=once(s,'    void storeLabSystemNotification(labId, event, data);\n    const clients = labEventClients.get(labId);',
  '    void storeLabSystemNotification(labId, event, data);\n'+
  "    if(event==='order_submitted'&&data?.invoiceId)void pb1962LabManagerNotify(labId,'invoice_created',data);\n"+
  '    const clients = labEventClients.get(labId);','new order invoice');
s=once(s,"files: fileCount, mode: submitted.mode, source: 'lab_delegated', createdAt: submitted.updated_at });",
  "files: fileCount, mode: submitted.mode, source: 'lab_delegated', createdAt: submitted.updated_at, invoiceId:submitted._invoice?.id||null,invoiceNumber:submitted._invoice?.number||null });",'delegated invoice');
s=once(s,'readyForPrint: !prepaid, invoiceTotal: submitted._invoice?.total || 0 });',
  'readyForPrint: !prepaid, invoiceTotal: submitted._invoice?.total || 0, invoiceId:submitted._invoice?.id||null,invoiceNumber:submitted._invoice?.number||null });','customer invoice');
s=once(s,'number: order.number, status, note, updatedAt: order.updated_at, invoice: invoice ?',
  "number: order.number, status, note, updatedAt: order.updated_at, managerChanged:String(oldOrder.status||'')!==String(status), invoice: invoice ?",'ignore unchanged order statuses');
s=once(s,'number: order.number, stage, status: order.status, invoice: invoice ?',
  'number: order.number, stage, status: order.status, updatedAt:order.updated_at, invoice: invoice ?','album stage timestamp');
s=once(s,'number: order.number, stage: order.album_stage, status: order.status });',
  'number: order.number, stage: order.album_stage, status: order.status, updatedAt:order.updated_at });','download stage timestamp');
s=once(s,"await audit(a.userId, labId, 'album.download_complete', 'order', orderId, { stage: order?.album_stage, status: order?.status, statusChanged }).catch(() => { });",
  "await audit(a.userId, labId, 'album.download_complete', 'order', orderId, { stage: order?.album_stage, status: order?.status, statusChanged }).catch(() => { });\n"+
  "            void pb1962LabManagerNotify(labId,'album_download_verified',{orderId:order.id,number:order.number,mode:'album',updatedAt:order.updated_at});",'verified album download');
s=once(s,"publishCustomerEvent(labId, String(order.customer_id), 'invoice_pricing_ready', { orderId, number: order.number, invoiceId: invoice.id",
  "publishCustomerEvent(labId, String(order.customer_id), 'invoice_pricing_ready', { orderId, number: order.number, orderNumber:order.number, invoiceId: invoice.id",'prepaid invoice number');
// Scope deliveries to the *current* active lab admin; revoked devices receive no pushes.
s=once(s,"const col = kind === 'lab' ? 'recipient_lab_id' : 'recipient_user_id';",
  "const col = kind === 'lab' ? 'recipient_lab_id' : 'recipient_user_id';\n"+
  "        const subWhere=kind==='lab'?\"recipient_lab_id=$1 AND EXISTS (SELECT 1 FROM lab_memberships m JOIN users u ON u.id=m.user_id WHERE m.lab_id=$1 AND m.user_id=web_push_subscriptions.recipient_user_id AND m.role='lab_admin' AND m.active=true AND u.active=true)\":\"recipient_user_id=$1 AND recipient_lab_id IS NULL\";",
  'manager active membership filter');
s=once(s,'FROM web_push_subscriptions WHERE ${col}=$1 ORDER BY updated_at DESC LIMIT 12',
  'FROM web_push_subscriptions WHERE ${subWhere} ORDER BY updated_at DESC LIMIT 12',
  'recipient scope SQL');
s=once(s,
  'VALUES($1,$2,$3,$4,NULL,$5,$6,now(),now()) ON CONFLICT(endpoint) DO UPDATE SET p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,recipient_lab_id=EXCLUDED.recipient_lab_id,recipient_user_id=NULL,device_label=EXCLUDED.device_label',
  'VALUES($1,$2,$3,$4,$7,$5,$6,now(),now()) ON CONFLICT(endpoint) DO UPDATE SET p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,recipient_lab_id=EXCLUDED.recipient_lab_id,recipient_user_id=EXCLUDED.recipient_user_id,device_label=EXCLUDED.device_label',
  'lab owner ID binding');
s=once(s,'[endpoint, p256dh, authKey, labId, deviceLabel || null, userAgent || null]);',
  '[endpoint, p256dh, authKey, labId, deviceLabel || null, userAgent || null, a.userId]);',
  'bound subscription parameters');
fs.writeFileSync(path,s);
const pushPath='dist/web/photobridge-push-v728.js';
let push=fs.readFileSync(pushPath,'utf8');
push=once(push,"function showPrompt(){if(!supported()||Notification.permission!=='default'||document.getElementById(PROMPT_ID))return;ensureStyle();const el=document.createElement('div');el.id=PROMPT_ID;",
 "function showPrompt(){if(!supported()||Notification.permission!=='default'||document.getElementById(PROMPT_ID))return;ensureStyle();const el=document.createElement('div');el.id=PROMPT_ID;"+
 "const promptMessage=role()==='lab'?'مدیر لابراتوار: سفارش جدید، دانلود کامل، صدور فاکتور و تغییر وضعیت سفارش‌ها را روی این موبایل دریافت کنید.':'مرحله چاپ، فاکتور، اجاره/فروش تجهیزات و رویدادهای مهم با اعلان اطلاع داده می‌شوند.';",'mobile manager opt-in');
push=once(push,"const LAST_SYNC='photobridge:push:last-sync:v783';","const LAST_SYNC='photobridge:push:last-sync:r1962';",'revalidate manager push account scope');
push=once(push,'مرحله چاپ، فاکتور، اجاره/فروش تجهیزات و رویدادهای مهم با اعلان اطلاع داده می‌شوند.</small>','$'+'{promptMessage}</small>','mobile prompt interpolation');
fs.writeFileSync(pushPath,push);
// PB_PERF_FIX built precompressed assets before this late patch; refresh both
// encodings or Android Chrome would silently execute the old push prompt.
const pushBytes=fs.readFileSync(pushPath);
for(const [suffix,compress,expand] of [
 ['.br',b=>zlib.brotliCompressSync(b,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}),zlib.brotliDecompressSync],
 ['.gz',b=>zlib.gzipSync(b,{level:6}),zlib.gunzipSync]
]){
 if(!fs.existsSync(pushPath+suffix))continue;
 fs.writeFileSync(pushPath+suffix,compress(pushBytes));
 if(!expand(fs.readFileSync(pushPath+suffix)).equals(pushBytes))throw Error('[R1962] stale compressed mobile Push asset '+suffix);
}
const index='dist/web/index.html';
let html=fs.readFileSync(index,'utf8');
const matches=[...html.matchAll(/photobridge-push-v728\.js\?[^"'\s>]+/g)];
if(matches.length!==1)throw Error('[R1962] push bundle URL expected once');
html=html.replace(matches[0][0],matches[0][0].replace(/&labManager=r1962/g,'')+'&labManager=r1962');
fs.writeFileSync(index,html);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
execFileSync(process.execPath,['--check',pushPath],{stdio:'inherit'});
console.log('[R1962] lab manager mobile push wired to committed server events');
