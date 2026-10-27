import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const serverFile='dist/api/server.js',uiFile='dist/web/assets/index-UIRefine-v655-r84.js';
let server=fs.readFileSync(serverFile,'utf8');
function once(s,a,b){if(s.split(a).length!==2)throw Error('R1451 anchor '+a.slice(0,120));return s.replace(a,b)}
if(!server.includes('/* PB1451 first download retention */')){
 server="import {canDeleteLabOriginal} from './lab-original-retention.js';\nimport {acknowledgeLabDownload} from './lab-download-receipt.js';\n/* PB1451 first download retention */\n"+server;
 server=once(server,'        const labOrderDownloadCheck = url.pathname.match(',`        const labDownloadReceipt=url.pathname.match(/^\\/api\\/lab\\/orders\\/([0-9a-f-]+)\\/download-receipt\\/download$/);
        if(labDownloadReceipt&&req.method==='POST'){
            const body=await bodyJson(req);
            try{const result=await acknowledgeLabDownload({pool,labId,deviceId:requestDeviceId,orderId:labDownloadReceipt[1],files:body.files});await audit(a.userId,labId,'order.download_verified','order',labDownloadReceipt[1],{fileCount:result.verifiedFiles}).catch(()=>{});return sendJson(res,200,result)}catch(error){if(error.status)return sendJson(res,error.status,{error:error.message});throw error}
        }
        const labOrderDownloadCheck = url.pathname.match(`);
 server=once(server,"async function cleanupOriginals() {\n    let objectPending = 0, removed = 0;","async function cleanupOriginals() {\n    const retentionDays=await getOriginalRetentionDays();\n    let objectPending = 0, removed = 0;");
 server=once(server,"SELECT * FROM order_files WHERE original_state='ready_for_deletion' AND original_delete_after<=now() AND NOT(id=ANY($1::uuid[])) ORDER BY original_delete_after,id LIMIT 200",
 "SELECT f.*,o.downloaded_at first_downloaded_at FROM order_files f JOIN orders o ON o.id=f.order_id WHERE f.original_state='ready_for_deletion' AND o.downloaded_at IS NOT NULL AND GREATEST(f.original_delete_after,o.downloaded_at+make_interval(secs => $2::double precision * 86400))<=now() AND NOT(f.id=ANY($1::uuid[])) ORDER BY f.original_delete_after,f.id LIMIT 200");
 server=once(server,'LIMIT 200`,[attempted]);','LIMIT 200`,[attempted,retentionDays]);');
 server=once(server,'attempted.push(row.id);\n                const originalKey', 'attempted.push(row.id);\n                if(!canDeleteLabOriginal(row,Date.now(),retentionDays))continue;\n                const originalKey');
 const a=server.indexOf('async function reschedulePendingOriginalCleanup(days) {'),b=server.indexOf('function tehranDateKey',a);
 if(a<0||b<0)throw Error('R1451 retention scheduler');
 server=server.slice(0,a)+`async function reschedulePendingOriginalCleanup(days) {
    await pool.query(\`UPDATE order_files f SET original_delete_after=CASE WHEN o.downloaded_at IS NULL THEN NULL ELSE
    GREATEST(o.downloaded_at,COALESCE(o.printed_at,
    (SELECT min(e.created_at) FROM order_status_events e WHERE e.order_id=o.id AND e.status IN ('ready','printed')),
    (SELECT min(i.issued_at) FROM invoices i WHERE i.order_id=o.id),o.updated_at))
    + make_interval(secs => $1::double precision * 86400) END
    FROM orders o WHERE o.id=f.order_id AND f.original_state='ready_for_deletion'\`, [days]);
}
`+server.slice(b);
 // The /download suffix uses the installed native host's existing live-only policy.
 // Route bodies and all existing lab/order authorization checks remain shared.
 for(const route of ['labArchiveRecover','recoveredLocalRegister','recoveryFinalize','recoveryDraft','labOrder']){
  const re=new RegExp('const '+route+' = url\\.pathname\\.match\\(([^;]+)\\);');
  const match=server.match(re);if(!match)throw Error('R1451 recovery route '+route);
  const source=match[0];if(!source.includes('$/'))throw Error('R1451 route shape '+route);
  server=once(server,source,source.replace('$/','(?:\\/download)?$/'));
 }
 const recoverStart=server.indexOf('const labArchiveRecover ='),recoverEnd=server.indexOf('const recoveredLocalRegister =',recoverStart);
 let recover=server.slice(recoverStart,recoverEnd);
 recover=once(recover,"OR (o.mode='album' AND COALESCE(o.album_stage,'') IN ('completed','delivered','done','archived'))","OR (o.mode='album' AND COALESCE(o.album_stage,'') IN ('completed','delivered','done','archived'))\n                OR EXISTS(SELECT 1 FROM invoices recover_invoice WHERE recover_invoice.order_id=o.id AND recover_invoice.lab_id=o.lab_id)");
 server=server.slice(0,recoverStart)+recover+server.slice(recoverEnd);
 const regStart=server.indexOf('const recoveredLocalRegister ='),regEnd=server.indexOf('const recoveredFilePresign =',regStart);
 let reg=server.slice(regStart,regEnd);
 reg=once(reg,'chassis,frame,crop_handling,original_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,\'active\')',"chassis,frame,crop_handling,print_copies,original_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'active')");
 reg=once(reg,"String(b.cropHandling || 'none')]);","String(b.cropHandling || 'none'),Math.max(1,Math.min(9999,Math.floor(Number(b.printCopies)||1)))]);");
 server=server.slice(0,regStart)+reg+server.slice(regEnd);
 const getStart=server.indexOf("if (labOrder && req.method === 'GET')"),getEnd=server.indexOf("if (labOrder && req.method === 'DELETE')",getStart);
 let get=server.slice(getStart,getEnd);
 get=once(get,"AND f.original_state<>'deleted' ORDER BY s.width_cm","AND (f.original_state<>'deleted' OR $3::boolean) ORDER BY s.width_cm");
 get=once(get,'f.created_at ASC`, [orderId, labId]),',"f.created_at ASC`, [orderId, labId,url.searchParams.get('archive')==='1']),");
 server=server.slice(0,getStart)+get+server.slice(getEnd);
 fs.writeFileSync(serverFile,server);
}
// Repair partial/stale bundles where the R1451 marker exists but the retention
// scheduler was later overwritten by an older staging step.
server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('CASE WHEN o.downloaded_at IS NULL THEN NULL')){
 const a=server.indexOf('async function reschedulePendingOriginalCleanup(days) {'),b=server.indexOf('function tehranDateKey',a);
 if(a<0||b<0)throw Error('R1451 retention scheduler');
 server=server.slice(0,a)+`async function reschedulePendingOriginalCleanup(days) {
    await pool.query(\`UPDATE order_files f SET original_delete_after=CASE WHEN o.downloaded_at IS NULL THEN NULL ELSE
    GREATEST(o.downloaded_at,COALESCE(o.printed_at,
    (SELECT min(e.created_at) FROM order_status_events e WHERE e.order_id=o.id AND e.status IN ('ready','printed')),
    (SELECT min(i.issued_at) FROM invoices i WHERE i.order_id=o.id),o.updated_at))
    + make_interval(secs => $1::double precision * 86400) END
    FROM orders o WHERE o.id=f.order_id AND f.original_state='ready_for_deletion'\`, [days]);
}
`+server.slice(b);
 fs.writeFileSync(serverFile,server);
}
let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1451 storage and archive flow */')){
 const change=(a,b)=>{ui=once(ui,a,b)};
 change("const result=await Dg(detail,value=>F({orderId:le.id,...value}),options);","const result=await Dg(detail,value=>F({orderId:le.id,...value}),options);\n   await pb1451AcknowledgeDownload(detail);");
 change("download_manifest_incomplete:'", "download_files_incomplete:'فهرست فایل‌های سرور با دریافت تأییدشده یکسان نیست؛ دانلود مجدد را انجام دهید.',\n    download_manifest_incomplete:'");
 change('const fe=await Me(`/api/lab/orders/${K.order_id}`);I(""),g({...fe,archiveInvoice:K})','const fe=await Me(`/api/lab/orders/${K.order_id}?archive=1`);I(""),g({...fe,archiveInvoice:K})');
 change('h&&e.jsx("div",{className:"archiveProgress"','h&&e.jsx("p",{className:"archiveRecoveryProgressLabel",role:"status",children:h.current||"در حال بازیابی فایل‌ها…"}),h&&e.jsx("div",{className:"archiveProgress"');
 change('async function pb1395Choose(){','async function pb1451ChooseRaw(){');
 const ps=ui.indexOf('function PB1395StoragePanel(){'),pe=ui.indexOf(" return e.jsxs('section'",ps);
 if(ps<0||pe<0)throw Error('R1451 storage panel');
 ui=ui.slice(0,ps)+`function PB1395StoragePanel(){
 const [root,setRoot]=x.useState(null),[state,setState]=x.useState(null),[busy,setBusy]=x.useState(false),[error,setError]=x.useState('');
 const control=x.useRef(null);
 if(!control.current)control.current=pb1451StorageController({
  read:async()=>{const current=await qs();Uc();const target=await Me('/api/lab/storage-target');if(target.paired&&(!current||!target.isThisDevice)){target.isThisDevice=false;target.message='پوشه در دسترس نیست؛ مسیر ذخیره‌سازی را دوباره انتخاب کنید.'}if(target.paired&&target.isThisDevice&&current){if(await current.queryPermission({mode:'readwrite'})!=='granted'){target.isThisDevice=false;target.message='دسترسی پوشه داده نشده است؛ مسیر را دوباره انتخاب کنید.'}else if(await pb1395FolderId(current)!==target.folderId){target.isThisDevice=false;target.message='مسیر این سیستم با سرور یکسان نیست؛ مسیر را دوباره انتخاب کنید.'}}return {root:current,state:target}},
  choose:async()=>({...await pb1395Choose(),selected:true}),
  apply:value=>{setRoot(value.root);setState(value.selected?{...value.state,message:'مسیر جدید ثبت و بازخوانی شد.'}:value.state);setError('')},
  error:err=>setError(err?.data?.display||err.message)
 });
 const refresh=()=>control.current.refresh();
 x.useEffect(()=>{control.current.activate();const poll=()=>void refresh();poll();const timer=setInterval(poll,5000);window.addEventListener('focus',poll);return()=>{control.current.dispose();clearInterval(timer);window.removeEventListener('focus',poll)}},[]);
 const choose=async()=>{setBusy(true);setError('');try{await control.current.choose()}catch{}finally{setBusy(false)}};
`+ui.slice(pe);
 const a=ui.indexOf('re=async(K,fe)=>{try{await Zy(K,fe)}'),b=ui.indexOf(',W=async K=>',a);
 if(a<0||b<0)throw Error('R1451 archive preview');
 ui=ui.slice(0,a)+'re=async(K,fe)=>{try{await pb1451OpenArchiveFile(K,fe)}catch(error){pb1451RecoveryError(error)}}'+ui.slice(b);
 const ws=ui.indexOf('W=async K=>pb1445ReadArchive('),we=ui.indexOf(',ie=async K=>',ws),ieEnd=ui.indexOf(';return e.jsxs("section",{className:"archiveWorkspace',we);
 if(ws<0||we<0||ieEnd<0)throw Error('R1451 recovery handlers');
 ui=ui.slice(0,ws)+`W=async K=>pb1451ReadArchive(K,value=>S(value)),O=async(K,fe,be,Z)=>pb1451RestoreLocal(K,fe,be,Z,value=>S(value)),ie=async K=>{
  if(t!=='lab'||!m)return;
  if(!confirm('سفارش #'+V(m.order.number)+' به‌عنوان سفارش جدید '+(K?'با امکان صدور فاکتور':'بدون فاکتور')+' وارد صف شود؟'))return;
  f('recover-'+m.order.id);S({done:0,total:m.files.length,current:'بررسی هارد و سرور'});
  try{const result=await pb1451RecoverOrder(m,K,y.trim(),value=>S(value));alert(pb1451RecoveryMessage(result));location.href=pb1451RecoveryUrl(result.order)}
  catch(error){if(error.recoveryOrder?.id){alert('سفارش جدید #'+V(error.recoveryOrder.number)+' ساخته شد، اما ثبت مرحله دانلود کامل نشد. همین سفارش در صف باز می‌شود؛ سفارش تکراری نسازید.');location.href=pb1451RecoveryUrl(error.recoveryOrder)}else pb1451RecoveryError(error)}
  finally{f('');S(null)}
 }`+ui.slice(ieEnd);
 // Explicit routes select the correct Print/Album workspace, then reveal the new queue card.
 change('if(o==="album")return;const le=new URLSearchParams(location.search).get("recoveredOrder");','const le=new URLSearchParams(location.search).get("recoveredOrder");');
 change('nt&&(k("flow"),Dn(ur("flow",String(nt.id),l),!0),Tt(nt,!1).catch(()=>{}))','nt&&(k("flow"),S(null),I(null),b(nt.id),Dn(ur("flow","",l),!0),window.setTimeout(()=>document.querySelector(\'[data-order-id="\'+nt.id+\'"]\')?.scrollIntoView({block:"center"}),180))');
 change('const ye=()=>Me("/api/lab/orders").then(', 'const ye=()=>Me("/api/lab/orders"+(new URLSearchParams(location.search).get("recoveredOrder")?"?recovery="+encodeURIComponent(new URLSearchParams(location.search).get("recoveredOrder")):"")).then(');
 ui+='\n/* PB1451 storage and archive flow */\n'+fs.readFileSync('scripts/r1451-storage-selection.js','utf8')+'\nasync function pb1395Choose(){return pb1451ChooseFolder(pb1451ChooseRaw)}\n'+fs.readFileSync('scripts/r1451-archive-recovery.js','utf8');
 fs.writeFileSync(uiFile,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');html=html.replace(/downloadRepair=r1450/g,'downloadRepair=r1451');fs.writeFileSync('dist/web/index.html',html);
for(const file of [serverFile,uiFile])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
