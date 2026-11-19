// LAB 1.0.104 native candidate: final generated-bundle integration.
// Run after all legacy patches (through R1892). Fail closed on anchor drift.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui',jsName='assets/index-UIRefine-v655-r84.js';
const file=root+'/'+jsName,marker='/* LAB104 R1907 scheduler integrated */';
const replaceOnce=(s,a,b,label)=>{
 if(s.split(a).length!==2)throw Error('LAB104 anchor changed: '+label);
 return s.replace(a,b);
};
function rewriteSection(s,startMark,endMark,fn){
 const a=s.indexOf(startMark),b=s.indexOf(endMark,a+startMark.length);
 if(a<0||b<a)throw Error('LAB104 section not found: '+startMark);
 return s.slice(0,a)+fn(s.slice(a,b))+s.slice(b);
}
let s=fs.readFileSync(file,'utf8');
if(!s.includes(marker)){
 // Preserve all original disk/account proof but remove repeated device checks in
 // unattended mode. For completely empty new folders only, the expensive per-file
 // pre-verification is redundant; the FULL post-write verification is mandatory.
 // R1892 scheduled four repeated FULL-LIST probes per notification. This
 // candidate has a direct order-ID lane and bounded detail-only readiness probes.
 // Keep one legacy SSE safety-net scan, but never flood the entire lab list.
 s=replaceOnce(s,'const followUps=[800,2400,5600,11000];',
  'const followUps=window.__PB_LAB104_NATIVE__?[]:[800,2400,5600,11000];',
  'candidate avoids repeated global order-list probes');
 s=rewriteSection(s,'async function pb1450Download(','async function pb1450AllowStage(',part=>{
  const rootPattern=/\\broot\\s*=\\s*await\\s+pb1450Root\\([^;]*\\)\\s*;/g;
  const roots=[...part.matchAll(rootPattern)];
  if(roots.length!==1)throw Error('LAB104 expected one downloader root assignment; found '+roots.length);
  part=part.replace(rootPattern,'root = await pb1450Root(options.silent===true?false:true);');
  const preflightPattern=/report\\s*=\\s*await\\s+pb1450Verify\\(detail\\s*,\\s*root\\s*,\\s*receipts\\s*,\\s*progress\\s*\\)\\s*;/g;
  const verifyAnchors=[...part.matchAll(preflightPattern)];
  if(verifyAnchors.length<1)throw Error('LAB104 expected a pre-download verification call');
  // Only the FIRST scan can use the proven empty-folder shortcut. A later
  // post-download verification remains unchanged and mandatory.
  part=part.replace(preflightPattern,
   'report = await pb1908EmptyPreflight(detail,root,receipts) || await pb1450Verify(detail,root,receipts,progress);');
  return part;
 });
 s=rewriteSection(s,'async function pb1568ProcessOrder(','async function pb1568AutoTick(',part=>{
  part=replaceOnce(part,
   "const detail=await Me('/api/lab/orders/'+encodeURIComponent(id));",
   "const detail=pb1908TakeDetail(lab,id)||await Me('/api/lab/orders/'+encodeURIComponent(id));",
   'accept authenticated notification detail without a redundant order fetch');
  part=replaceOnce(part,
   "await pb1450Root(false,detail);",
   "pb1908Mark(id,'root_check_start');await pb1450Root(false,detail);pb1908Mark(id,'root_check_passed');",
   'diagnose root/device readiness before downloader');
  part=replaceOnce(part,
   "const outcome=await pb1450Download(detail,()=>{},{silent:true});",
   "pb1908Mark(id,'transfer_scheduled');const outcome=await pb1907WithDownloadSlot(()=>pb1450Download(detail,value=>pb1908Progress(id,value),{silent:true}));",
   'download slot and actual first-byte checkpoint');
  part=replaceOnce(part,
   "const ack=await pb1451AcknowledgeDownload(detail);",
   "const ack=await pb1451AcknowledgeDownload(detail);if(!Number.isSafeInteger(Number(ack?.verifiedFiles))||Number(ack.verifiedFiles)<1||ack.desktopPending||ack.offline)throw Error('receipt_not_server_verified');",
   'actual server receipt confirmation');
  part=replaceOnce(part,
   "task={phase:'downloaded',attempts:0};pb1568Save(lab,id,task);",
   "task={phase:'downloaded',attempts:0};pb1568Save(lab,id,task);pb1581Report({...order,lab_id:lab},{phase:'verified',stage:'download',downloadVerified:true,queued:false,networkError:false});",
   'separate verified checkpoint');
  part=replaceOnce(part,
   "pb1581Report({...order,lab_id:lab},{phase:'checking',stage:'invoice',downloadVerified:true,queued:false});",
   "pb1581Report({...order,lab_id:lab},{phase:window.__PB_LAB104_NATIVE__?'invoice_issuing':'checking',stage:'invoice',downloadVerified:true,queued:false});",
   'invoice start');
  part=replaceOnce(part,
   "pb1568Save(lab,id,{phase:'invoice_issued',invoiceId:data.invoice.id,attempts:0});",
   "pb1568Save(lab,id,{phase:'invoice_issued',invoiceId:data.invoice.id,attempts:0});pb1581Report({...order,lab_id:lab},{phase:window.__PB_LAB104_NATIVE__?'invoice_issued':'verified',stage:'invoice',downloadVerified:true,queued:false});",
   'invoice issued');
  part=replaceOnce(part,
   "pb1581Report({...order,lab_id:lab},{phase:'verified',downloadVerified:true,stage:'download',networkError:false,queued:false});",
   "pb1581Report({...order,lab_id:lab},{phase:settings.invoiceTiming==='after_verified_download'&&window.__PB_LAB104_NATIVE__?'complete':'verified',downloadVerified:true,stage:'download',networkError:false,queued:false});",
   'successful final-stage feedback');
  return part;
 });
 s=rewriteSection(s,'async function pb1568AutoTick(',"if(typeof window!=='undefined'&&window.pbNativeStorage){",part=>{
  part=replaceOnce(part,
   "   const status=await fetch('/desktop/thermal/status',{cache:'no-store'});\n   if(!status.ok)return; // Installed legacy host cannot safely perform automated printing.\n   const printer=await status.json();if(!printer?.supported)return;",
   "   if(!window.__PB_LAB104_NATIVE__){const status=await fetch('/desktop/thermal/status',{cache:'no-store'});if(!status.ok)return;const printer=await status.json();if(!printer?.supported)return;}",
   'candidate downloader does not await printer status');
  return replaceOnce(part,'await pb1568ProcessOrder(lab,order,settings);',
   'if(window.__PB_LAB104_NATIVE__)void pb1907ScheduleOrder(lab,order,settings);else await pb1568ProcessOrder(lab,order,settings);',
   'only candidate uses nonblocking per-order scan');
 });
 s=rewriteSection(s,'async function pb1583DrainRetries(',"if(typeof window!=='undefined'&&window.pbNativeStorage)window.pbDesktopEvents",part=>{
  part=replaceOnce(part,'if(pb1568Work.running||!pb1583Queue.size)return;pb1568Work.running=true;',
   'if(pb1907RetryDraining||(!window.__PB_LAB104_NATIVE__&&pb1568Work.running)||!pb1583Queue.size)return;pb1907RetryDraining=true;if(!window.__PB_LAB104_NATIVE__)pb1568Work.running=true;',
   'separate retry flight lock');
  part=replaceOnce(part,'await pb1568ProcessOrder(entry.labId,detail.order,{...settings,autoDownloadEnabled:true});',
   'if(window.__PB_LAB104_NATIVE__){pb1568Work.labId=entry.labId;await pb1907ScheduleOrder(entry.labId,detail.order,{...settings,autoDownloadEnabled:true});}else await pb1568ProcessOrder(entry.labId,detail.order,{...settings,autoDownloadEnabled:true});',
   'retry joins active per-order flight');
  part=replaceOnce(part,'pb1568Work.running=false;',
   'pb1907RetryDraining=false;if(!window.__PB_LAB104_NATIVE__)pb1568Work.running=false;',
   'retry release');
  return part;
 });
 s=replaceOnce(s,"phase=value.phase==='failed'?'failed':value.phase==='verified'?'verified':value.phase==='downloading'?'downloading':'checking';",
  "phase=['invoice_issuing','invoice_issued','complete'].includes(value.phase)?value.phase:value.phase==='failed'?'failed':value.phase==='verified'?'verified':value.phase==='downloading'?'downloading':'checking';",
  'preserve explicit invoice/complete states');
 // The order preview GET can happen long before the tray/periodic scan.
 // Trigger an independent guarded scan immediately when its response arrives.
 s=replaceOnce(s,
  'if(typeof pb1586NoticeWake==="function")pb1586NoticeWake(t,result);return result',
  'if(typeof pb1586NoticeWake==="function")pb1586NoticeWake(t,result);if(typeof pb1907PreviewKick==="function")pb1907PreviewKick(t,result);return result',
  'preview data immediate download wake');
 // PDF uploads queued by the offline host must never count as successful uploads.
 s=replaceOnce(s,
  "await Me('/api/lab/invoices/'+encodeURIComponent(invoice.id)+'/pdf-upload',{method:'POST',body:JSON.stringify({pdfBase64:b64})});",
  "const confirmed=await Me('/api/lab/invoices/'+encodeURIComponent(invoice.id)+'/pdf-upload',{method:'POST',body:JSON.stringify({pdfBase64:b64})});if(confirmed?.desktopPending||confirmed?.offline)throw Error('pdf_upload_unconfirmed');",
  'no queued PDF success');
 s+='\n'+fs.readFileSync('scripts/r1907-native-download-scheduler.js.txt','utf8')+'\n'+marker+'\n';
 fs.writeFileSync(file,s);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
// Download-only receipt is opt-in, and only the candidate native host sends the header.
// Legacy web/desktop clients retain invoice-after-receipt behavior.
const serverPath='dist/api/server.js';
let server=fs.readFileSync(serverPath,'utf8');
const receiptMarker='/* LAB104 R1907 opt-in receipt-only */';
if(!server.includes(receiptMarker)){
 server=replaceOnce(server,
  'afterVerifiedDownload:(c,order)=>invoiceAfterVerifiedDownload(c,labId,order,createOrGetInvoice)',
  "afterVerifiedDownload:req.headers['x-photobridge-receipt-only']==='1'?null:(c,order)=>invoiceAfterVerifiedDownload(c,labId,order,createOrGetInvoice)",
  'receipt-only protocol opt-in');
 server+='\n'+receiptMarker+'\n';
 fs.writeFileSync(serverPath,server);
}
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});
const htmlFile=root+'/index.html';let html=fs.readFileSync(htmlFile,'utf8');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g,u=>u.includes('&downloadPipeline=r1907')?u:u+'&downloadPipeline=r1907');
fs.writeFileSync(htmlFile,html);
const manifestFile=root+'/manifest.json',m=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
if(m.protocol!==1||m.channel!=='lab')throw Error('LAB104 unexpected native manifest');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const name of [jsName,'index.html']){
 const row=m.files.find(x=>x.name===name);
 if(!row)throw Error('LAB104 missing manifest item: '+name);
 row.sha256=sha(fs.readFileSync(root+'/'+name));
}
m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestFile,JSON.stringify(m));
console.log('[LAB104] native scheduler + opt-in receipt split staged');
