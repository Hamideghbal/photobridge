function pb1451RecoveryUrl(order) {
  if (!/^[0-9a-f-]{36}$/i.test(String(order?.id || ''))) throw Error('recovery_not_confirmed');
  return '/lab/'+(order.mode==='album'?'album':'orders')+'/flow?recoveredOrder='+encodeURIComponent(order.id);
}
async function pb1451LiveRecovery(path,body,method='POST') {
  // Existing Windows hosts send /download operations live instead of enqueueing them.
  const result=await Me(path+'/download',{method,body:JSON.stringify(body || {})});
  if (result?.queued || result?.operationId) throw Error('recovery_not_confirmed');
  return result;
}
async function pb1451ReadArchive(detail,progress) {
  if (!ai()) return null;
  const root=await qs();
  if (!root || !await Vs(root)) return null;
  const files=[],missing=[],targets=new Map(),receipts=yc(detail.order.id)?.localFiles || {};
  let localCount=0,serverCount=0;
  for (const original of detail.files || []) {
    progress?.({done:files.length,total:detail.files.length,current:'بررسی هارد · '+original.original_name});
    let meta=pb1450Meta(original,receipts),file=null;
    const target=await pb1450Target(root,detail,original,targets);
    try { const candidate=await (await target.dir.getFileHandle(Ya(meta.original_name,'file'),{create:false})).getFile();if(pb1445ValidLocal(candidate,meta))file=candidate; }
    catch(error){if(!pb1450Missing(error))throw error}
    if (!file) { const candidate=await Eg(root,detail,meta);if(pb1445ValidLocal(candidate,meta))file=candidate; }
    if (file) localCount++;
    else {
      progress?.({done:files.length,total:detail.files.length,current:'دریافت از سرور · '+original.original_name});
      try {
        const response=await Ky(original.id),blob=await response.blob();
        const expected=Number(response.pbDownloadBytes || original.bytes || 0),name=response.pbDownloadName || original.original_name;
        if(!blob.size || expected>0&&blob.size!==expected)throw Error('download_size_mismatch');
        meta={...original,original_name:name,bytes:blob.size};
        file=new File([blob],name,{type:blob.type || original.content_type || 'application/octet-stream'});
        await jc(target.dir,name,file);
        const saved=await pb1450FileInfo(await target.dir.getFileHandle(Ya(name,'file'),{create:false}));
        if(saved.size!==file.size)throw Error('download_size_mismatch');
        serverCount++;
      }catch(error){
        if(!['file_not_found','local_file_only','file_storage_unavailable'].includes(pb1450Code(error)))throw error;
        missing.push(original.original_name);continue;
      }
    }
    files.push({meta,file});
  }
  if(missing.length)throw Object.assign(Error('archive_sources_incomplete'),{missing,localCount,serverCount});
  files.localCount=localCount;files.serverCount=serverCount;
  return files;
}
async function pb1451RestoreLocal(detail,invoiceRequired,note,files,progress) {
  const started=await pb1451LiveRecovery('/api/lab/orders/'+detail.order.id+'/recover',{invoiceRequired,note:note || null,localRecovery:true});
  const draft=started?.order;
  if(!draft?.id)throw Error('recovery_not_confirmed');
  let finalized=null;
  const mapped=[];
  try {
    for (const entry of files) {
      const meta=entry.meta,file=entry.file;
      progress?.({done:mapped.length,total:files.length,current:'ساخت سفارش جدید · '+meta.original_name});
      const response=await pb1451LiveRecovery('/api/lab/orders/'+draft.id+'/recovered-files/register-local',{
        name:meta.original_name || file.name,relativePath:meta.relative_path || meta.original_name || file.name,contentType:file.type || meta.content_type || 'application/octet-stream',bytes:file.size,width:meta.width || null,height:meta.height || null,dpi:meta.dpi || null,printSizeId:meta.print_size_id,printType:meta.print_type,printCopies:meta.print_copies || 1,chassis:!!meta.chassis,frame:!!meta.frame,cropHandling:meta.crop_handling || 'none'
      });
      if(!response?.file?.id)throw Error('recovery_not_confirmed');
      mapped.push({id:String(response.file.id),file});
    }
    const prepared=await Me('/api/lab/orders/'+draft.id+'/download?recovery='+encodeURIComponent(draft.id));
    if((prepared.files||[]).length!==files.length)throw Error('recovery_files_incomplete');
    const root=await pb1450Root(false),targets=new Map(),receipts={};
    const startedAt=new Date().toISOString();
    hr(draft.id,{startedAt,pathDate:startedAt,localComplete:false,total:files.length});
    for(const entry of mapped){
      const meta=prepared.files.find(f=>String(f.id)===entry.id);
      if(!meta)throw Error('local_recovery_file_mapping_missing');
      const target=await pb1450Target(root,prepared,meta,targets);
      await jc(target.dir,meta.original_name,entry.file);
      receipts[entry.id]={serverName:meta.original_name,serverBytes:Number(meta.bytes||0),name:meta.original_name,bytes:entry.file.size};
    }
    const report=await pb1450Verify(prepared,root,receipts);
    pb1450Save(prepared,report,receipts,report.complete?null:'local_download_incomplete');
    if(!report.complete)throw Object.assign(Error('local_download_incomplete'),{report});
    // No published sent-order with absent local files: finish the real copies first.
    finalized=await pb1451LiveRecovery('/api/lab/orders/'+draft.id+'/recovery-finalize',{expectedFileCount:files.length});
    if(!finalized?.order?.id)throw Error('recovery_not_confirmed');
    const downloaded=await pb1451LiveRecovery('/api/lab/orders/'+draft.id,{status:'downloaded',note:'فایل‌های بازیابی‌شده روی هارد بررسی و کامل تأیید شدند.'},'PATCH');
    if(!downloaded?.order?.id)throw Error('recovery_not_confirmed');
    return {...finalized,order:downloaded.order,localPrepared:true,localCount:files.localCount ?? files.length,serverCount:files.serverCount || 0};
  }catch(error){
    if(finalized)error.recoveryOrder=finalized.order;
    else {try{await pb1451LiveRecovery('/api/lab/orders/'+draft.id+'/recovery-draft',{},'DELETE')}catch{error.recoveryDraft=draft}}
    throw error;
  }
}
async function pb1451RecoverOrder(detail,invoiceRequired,note,progress) {
  let files;
  try { files=await pb1451ReadArchive(detail,progress); }
  catch(error){
    if(!['folder_picker_unsupported','folder_permission_denied','folder_not_selected','not_primary_download_device','download_device_not_registered','storage_activation_required','folder_unavailable','storage_target_changed'].includes(pb1450Code(error)))throw error;
    files=null;
  }
  if(files?.length)return pb1451RestoreLocal(detail,invoiceRequired,note,files,progress);
  progress?.({done:0,total:detail.files.length,current:'بازیابی نسخه سرور و ساخت سفارش جدید'});
  const result=await pb1451LiveRecovery('/api/lab/orders/'+detail.order.id+'/recover',{invoiceRequired,note:note || null});
  if(!result?.order?.id)throw Error('recovery_not_confirmed');
  return {...result,localPrepared:false,localCount:0,serverCount:result.fileCount || detail.files.length};
}
function pb1451RecoveryMessage(result) {
  const lines=['سفارش جدید #'+V(result.order.number)+' در صف '+(result.order.mode==='album'?'آلبوم':'چاپ')+' ساخته شد.'];
  if(result.localPrepared){
    if(result.localCount)lines.push(V(result.localCount)+' فایل از هارد بازیابی شد.');
    if(result.serverCount)lines.push(V(result.serverCount)+' فایل که روی هارد نبود، از سرور دریافت و روی هارد ذخیره شد.');
    lines.push('فایل‌های سفارش جدید روی هارد بررسی و کامل تأیید شدند.');
  }else lines.push('نسخه '+V(result.serverCount)+' فایل از سرور بازیابی شد؛ برای ذخیره فایل‌ها روی هارد، دانلود سفارش جدید را بزنید.');
  lines.push(result.order.invoice_required===false?'چاپ مجدد بدون فاکتور.':'گزینه صدور فاکتور جدید برای این سفارش فعال است.');
  return lines.join('\n');
}
function pb1451RecoveryError(error) {
  const code=pb1450Code(error);
  if(code==='archive_sources_incomplete')return alert('بازیابی کامل نشد. این فایل‌ها نه روی هارد و نه در نسخه کامل سرور پیدا شدند:\n'+(error.missing||[]).join('، '));
  if(code==='archive_files_unavailable')return alert('نسخه کامل بعضی فایل‌ها روی سرور موجود نیست و روی هارد این سیستم هم پیدا نشد. اصل فایل‌ها باید دوباره از عکاس دریافت شود.');
  if(code==='recovery_not_confirmed')return alert('ساخت سفارش جدید هنوز توسط سرور تأیید نشده است. بازیابی به‌عنوان موفق اعلام نشد؛ اتصال را بررسی کنید و صف سفارش‌ها را بازخوانی کنید.');
  if(error.recoveryDraft)return alert('آماده‌سازی سفارش پیش‌نویس #'+V(error.recoveryDraft.number)+' کامل نشد. سفارش هنوز وارد صف چاپ نشده است؛ ابتدا وضعیت همین پیش‌نویس را بررسی کنید.');
  pb1450Notify(error);
}
async function pb1451OpenArchiveFile(detail,meta) {
  if(ai()){
    const root=await qs();
    if(root&&await Vs(root)){
      const actual=pb1450Meta(meta,yc(detail.order.id)?.localFiles || {}),target=await pb1450Target(root,detail,meta,new Map());
      try{
        const local=await (await target.dir.getFileHandle(Ya(actual.original_name,'file'),{create:false})).getFile();
        if(pb1445ValidLocal(local,actual)){
          const url=URL.createObjectURL(local);window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),120000);return;
        }
      }catch(error){if(!pb1450Missing(error))throw error}
    }
  }
  const url=await pb1183PreviewFile(meta.id);
  const opened=window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),120000);
  if(!opened)throw Error('مرورگر پنجره پیش‌نمایش را مسدود کرده است؛ اجازه بازکردن پنجره را بدهید.');
  alert('نسخه این عکس روی هارد پیدا نشد؛ پیش‌نمایش آن از سرور باز شد. برای ذخیره روی هارد، دریافت مجدد فایل‌ها را بزنید.');
}
// R1772: Files saved with " = copies" must still acknowledge the exact
// source transfer name. Never treat a local display filename as server identity.
function pb1772ReceiptFile(file,receipts) {
 const actual=pb1450Meta(file,receipts),receipt=receipts[String(file.id)]||{};
 const bytes=Number(actual.bytes);
 const original=String(file.original_name||'');
 const printable=String(file.print_name||'');
 let name=String(receipt.transportName||'');
 if(!name){
  if(original&&bytes===Number(file.bytes))name=original;
  else if(printable&&bytes===Number(file.print_bytes))name=printable;
  else if(file.source_original_name&&bytes>0)name=String(file.source_original_name);
  else{
   // Old receipt metadata may carry a copy suffix; only the server may
   // confirm that an inferred canonical filename/size is truly valid.
   const local=String(actual.original_name||'');
   const copies=Number(file.print_copies??file.printCopies??1);
   const match=Number.isSafeInteger(copies)&&copies>1?local.match(/^(.*) = ([0-9]+)(\.[A-Za-z0-9]{1,12})$/):null;
   name=match&&Number(match[2])===copies?match[1]+match[3]:local;
  }
 }
 return {id:file.id,name,bytes};
}
async function pb1451AcknowledgeDownload(detail) {
  const receipts=yc(detail.order.id)?.localFiles || {};
  const files=(detail.files||[]).map(file=>pb1772ReceiptFile(file,receipts));
  const result=await pb1451LiveRecovery('/api/lab/orders/'+detail.order.id+'/download-receipt',{files});
  if(!result.order?.downloaded_at||result.verifiedFiles!==files.length)throw Error('تأیید دانلود کامل توسط سرور انجام نشد؛ دوباره تلاش کنید.');
  return result;
}
