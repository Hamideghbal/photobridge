// R2091: final server archive selection, catalog, and receipt/report wiring.
const marker='/* PB2091 selective archive reprint */';
function once(s,a,b){if(s.split(a).length!==2)throw Error('R2091 anchor '+a.slice(0,120));return s.replace(a,()=>b)}
function section(s,a,b,fn){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);if(i<0||j<i)throw Error('R2091 boundary '+a);return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)}
export function patchServer(s){
 if(s.includes(marker))return s;
 const helper="import {selectArchivePrintFiles} from './archive-print-selection.js';\n";
 s=helper+s;
 const catalog=[
 "        const pb2091Options=url.pathname.match(/^\\/api\\/lab\\/orders\\/([0-9a-f-]+)\\/reprint-options(?:\\/download)?$/);",
 "        if(pb2091Options&&req.method==='GET'){",
 "            const oq=await pool.query('SELECT id,mode FROM orders WHERE id=$1 AND lab_id=$2',[pb2091Options[1],labId]);",
 "            if(!oq.rowCount)return sendJson(res,404,{error:'archived_order_not_found'});",
 "            const sizes=await pool.query(\`SELECT s.id,s.label,s.width_cm,s.height_cm FROM print_sizes s WHERE s.active=true AND (s.owner_lab_id IS NULL OR s.owner_lab_id=$1) AND NOT EXISTS(SELECT 1 FROM lab_hidden_print_sizes h WHERE h.lab_id=$1 AND h.size_id=s.id) ORDER BY s.width_cm,s.height_cm,s.label\`,[labId]);",
 "            const q=await pool.query('SELECT ui_preferences FROM labs WHERE id=$1',[labId]);",
 "            const catalog=normalizePrintCatalog(q.rows[0]?.ui_preferences?.printTariffCatalog);",
 "            return sendJson(res,200,{sizes:sizes.rows,models:catalog.types.filter(t=>['chassis','frame'].includes(t.kind)&&t.active!==false).map(t=>({id:t.id,kind:t.kind,name:t.name,colors:(t.colors||[]).filter(c=>c.available!==false).map(c=>({id:c.id,name:c.name}))}))});",
 "        }",
 "        "
 ].join('\n');
 s=once(s,'const labArchiveRecover =',catalog+'const labArchiveRecover =');
 s=section(s,'const labArchiveRecover =','const recoveredLocalRegister =',part=>{
  const anchor="            if (b.localRecovery === true) {";
  const selected=[
   "            let selectedRows;",
   "            try{selectedRows=await selectArchivePrintFiles(fq.rows,b.selection,{mode:sourceOrder.mode,invoiceRequired,canUseSize:size=>labCanUsePrintSize(pool,labId,size),snapshotAddons:(item,size)=>pb1779Snapshot(labId,item,invoiceRequired?size:'',sourceOrder.source==='walkin'||Boolean(sourceOrder.walkin_customer_name||sourceOrder.walkin_customer_mobile)?'walkin':'colleague')});}",
   "            catch(error){if(error.status)return sendJson(res,error.status,{error:error.message});throw error;}"
  ].join('\n');
  const idx=part.indexOf(anchor);if(idx<0)throw Error('R2091 recover local boundary');
  // Only use the selection downstream, including the missing-file check and stock.
  let tail=part.slice(idx).replaceAll('fq.rowCount','selectedRows.length').replaceAll('fq.rows','selectedRows');
  const insert='chassis,frame,crop_handling,print_copies,original_state)';
  tail=once(tail,insert,'chassis,frame,crop_handling,print_copies,addon_selection,original_state)');
  tail=once(tail,"$15,$16,$17,$18,'active')","$15,$16,$17,$18,$19::jsonb,'active')");
  tail=once(tail,'Number(f.print_copies || 1)]);','Number(f.print_copies || 1),JSON.stringify(f.addon_selection||{})]);');
  return part.slice(0,idx)+selected+'\n'+tail;
 });
 s=section(s,'const recoveredLocalRegister =','const recoveredFilePresign =',part=>{
  const anchor="            const sizeId = String(b.printSizeId || '');";
  const validate=[
   "            let selectedSource=null;",
   "            if(b.sourceFileId){",
   "                if(!/^[0-9a-f-]{36}$/i.test(String(b.sourceFileId)))return sendJson(res,400,{error:'archive_selection_invalid'});",
   "                const source=await pool.query(\`SELECT f.*,o.mode source_mode,o.source source_kind,o.walkin_customer_name,o.walkin_customer_mobile FROM order_files f JOIN orders o ON o.id=f.order_id WHERE f.id=$1 AND f.order_id=$2 AND f.lab_id=$3 AND o.lab_id=$3\`,[String(b.sourceFileId),oq.rows[0].recovered_from_order_id,labId]);",
   "                if(!source.rowCount)return sendJson(res,400,{error:'archive_selection_invalid'});",
   "                try{const src=source.rows[0];const result=await selectArchivePrintFiles([src],[{...b,id:src.id}],{mode:src.source_mode,invoiceRequired:oq.rows[0].invoice_required!==false,canUseSize:size=>labCanUsePrintSize(pool,labId,size),snapshotAddons:(item,size)=>pb1779Snapshot(labId,item,oq.rows[0].invoice_required!==false?size:'',src.source_kind==='walkin'||Boolean(src.walkin_customer_name||src.walkin_customer_mobile)?'walkin':'colleague')});selectedSource=result[0];}",
   "                catch(error){if(error.status)return sendJson(res,error.status,{error:error.message});throw error;}",
   "            }"
  ].join('\n');
  part=once(part,'SELECT id,customer_id,status,recovered_from_order_id FROM orders','SELECT id,customer_id,status,recovered_from_order_id,invoice_required FROM orders');
  part=once(part,anchor,validate+'\n'+anchor);
  part=once(part,"const printType = ['luster', 'silk', 'metallic'].includes(String(b.printType || '')) ? String(b.printType) : '';","const printType = selectedSource?selectedSource.print_type:['luster', 'silk', 'metallic'].includes(String(b.printType || '')) ? String(b.printType) : '';");
  part=once(part,'chassis,frame,crop_handling,print_copies,original_state)','chassis,frame,crop_handling,print_copies,addon_selection,original_state)');
  part=once(part,"$15,$16,$17,$18,'active')","$15,$16,$17,$18,$19::jsonb,'active')");
  part=once(part,"Math.max(1,Math.min(9999,Math.floor(Number(b.printCopies)||1)))]);","Math.max(1,Math.min(9999,Math.floor(Number(b.printCopies)||1))),JSON.stringify(selectedSource?.addon_selection||{})]);");
  return part;
 });
 return s+'\n'+marker+'\n';
}
export function patchUi(s,helper){
 if(s.includes(marker))return s;
 s=section(s,'function hb(','function ',part=>{
  const a=part.indexOf('ie=async K=>'),b=part.indexOf(';return e.jsxs("section",{className:"archiveWorkspace',a);
  if(a<0||b<a)throw Error('R2091 archive handler boundary');
  const handler=String.raw`ie=async K=>{
   if(t!=='lab'||!m||p)return;
   f('recover-'+m.order.id);
   try{
    let detail=m;
    if(m.order.mode==='album'){if(!await pb1452ArchiveConfirm('آلبوم #'+V(m.order.number)+' با تمام صفحات دوباره ثبت شود؟'))return;}
    else{const selection=await pb2091ChooseArchivePhotos(m,K);if(!selection)return;const ids=new Set(selection.map(v=>String(v.id)));detail={...m,files:m.files.filter(v=>ids.has(String(v.id))),pb2091Selection:selection};}
    S({done:0,total:detail.files.length,current:'بررسی هارد و سرور'});
    const result=await pb1451RecoverOrder(detail,K,y.trim(),value=>S(value));
    await pb2091ArchiveResult(result);
    // Stay on this calendar/day and archive details; no hard navigation.
    window.dispatchEvent(new CustomEvent('photobridge-archive-reprinted',{detail:{orderId:result.order.id}}));
   }catch(error){
    if(error.recoveryOrder?.id)await pb1452ArchiveNotice('سفارش جدید #'+V(error.recoveryOrder.number)+' ثبت شد ولی آماده‌سازی فایل‌ها کامل نیست. در صف چاپ همان سفارش را بررسی کنید؛ سفارش تکراری نسازید.',{title:'پیگیری چاپ مجدد',tone:'warning'});
    else await pb1451RecoveryError(error);
   }finally{f('');S(null)}
  }`;
  return part.slice(0,a)+handler+part.slice(b);
 });
 // Locate the original disk files with their ORIGINAL metadata. Only after reading
 // the source bytes do we apply the user's edits to the new order.
 s=section(s,'async function pb1451RestoreLocal(','async function pb1451RecoverOrder(',part=>{
  part=once(part,'{invoiceRequired,note:note || null,localRecovery:true}','{invoiceRequired,note:note || null,localRecovery:true,...(detail.pb2091Selection?{selection:detail.pb2091Selection}:{})}');
  part=once(part,'const meta=entry.meta,file=entry.file;','const original=entry.meta,file=entry.file,edit=detail.pb2091Selection?.find(v=>String(v.id)===String(original.id)),meta=edit?{...original,print_size_id:edit.printSizeId,print_type:edit.printType,print_copies:edit.printCopies,chassis:edit.chassis,frame:edit.frame,crop_handling:edit.cropHandling}:original;');
  part=once(part,"name:meta.original_name || file.name,relativePath:","...(edit?{sourceFileId:original.id,chassisModelId:edit.chassisModelId,frameModelId:edit.frameModelId,frameColorId:edit.frameColorId}:{}),name:meta.original_name || file.name,relativePath:");
  return part;
 });
 s=section(s,'async function pb1451RecoverOrder(','function pb1451RecoveryMessage(',part=>once(part,'{invoiceRequired,note:note || null}','{invoiceRequired,note:note || null,...(detail.pb2091Selection?{selection:detail.pb2091Selection}:{})}'));
 // R2080 sends verified download only; propagate the actual invoice outcome.
 s=once(s,"const verified={phase:'verified',stage:'download',downloadVerified:true,networkError:false,queued:false,done:result.verifiedFiles,total:result.verifiedFiles};","const invoiceIssued=Boolean(result.invoice?.id||order.invoice_id),invoiceRequired=order.invoice_required!==false;const verified={phase:'verified',stage:invoiceRequired&&invoiceIssued?'invoice':'download',downloadVerified:true,invoiceRequired,invoiceIssued,invoiceVerified:invoiceIssued,invoiceId:result.invoice?.id||order.invoice_id||null,networkError:false,queued:false,done:result.verifiedFiles,total:result.verifiedFiles};");
 // Propagate billing policy to every progress update for a known reprint;
 // never carry an old invoice success flag into a different order.
 s=once(s,'function pb1581Report(order,value){', "function pb1581Report(order,value){\\n if(order?.recovered_from_order_id){const invoiceRequired=order.invoice_required!==false;const old=pb1581Transfers.get(order.lab_id+':'+order.id)?.value;const invoiceIssued=invoiceRequired&&Boolean(value.invoiceIssued||order.invoice_id||old?.invoiceIssued);value={...value,invoiceRequired,invoiceIssued,invoiceVerified:invoiceIssued,invoiceId:invoiceRequired?(value.invoiceId||order.invoice_id||old?.invoiceId||null):null};}");
 return s+'\n'+helper+'\n'+marker+'\n';
}
