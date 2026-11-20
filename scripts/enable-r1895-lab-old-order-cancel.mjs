// R1895 DRAFT — lab-only cancellation / queue removal for legacy records.
// Order cancellation is financial: this script is intentionally review-gated.
// The paid-invoice fallback hides ONLY a queue card, not its financial ledger.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const serverFile='dist/api/server.js';
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';
let api=fs.readFileSync(serverFile,'utf8');
let ui=fs.readFileSync(uiFile,'utf8');
const marker='/* PB1895 legacy queue cancellation (financial review required) */';
function one(s,before,after,label){
  const n=s.split(before).length-1;
  if(n!==1)throw Error('R1895 '+label+' anchor count '+n);
  return s.replace(before,after);
}
function segment(s,start,end,transform,label){
  const a=s.indexOf(start),b=a<0?-1:s.indexOf(end,a);
  if(a<0||b<=a)throw Error('R1895 '+label+' section missing');
  return s.slice(0,a)+transform(s.slice(a,b))+s.slice(b);
}
if(!api.includes(marker)){
  const getAnchor="        if (req.method === 'GET' && url.pathname === '/api/lab/orders') {";
  const visibility=[
    "        const pb1895QueueVisibility = url.pathname.match(/^\\/api\\/lab\\/orders\\/([0-9a-f-]{36})\\/queue-hide$/i);",
    "        if(pb1895QueueVisibility && (req.method==='POST'||req.method==='DELETE')){",
    "          const hidden=req.method==='POST',orderId=pb1895QueueVisibility[1],c=await pool.connect();",
    "          let order;",
    "          try{",
    "            await c.query('BEGIN');",
    "            const oq=await c.query('SELECT * FROM orders WHERE id=$1 AND lab_id=$2 FOR UPDATE',[orderId,labId]);",
    "            if(!oq.rowCount){await c.query('ROLLBACK');return sendJson(res,404,{error:'not_found'})}",
    "            order=oq.rows[0];",
    "            const q=await c.query(\"SELECT status FROM order_status_events WHERE order_id=$1 AND lab_id=$2 AND status IN ('lab_queue_hidden','lab_queue_visible') ORDER BY created_at DESC,id DESC LIMIT 1\",[orderId,labId]);",
    "            if((q.rows[0]?.status==='lab_queue_hidden')!==hidden)",
    "              await statusEvent(c,order,hidden?'lab_queue_hidden':'lab_queue_visible',a.userId,hidden?'فقط از صف کاری لابراتوار حذف شد؛ اسناد مالی محفوظ است.':'بازگرداندن سفارش به صف کاری');",
    "            await c.query('COMMIT');",
    "          }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}",
    "          await audit(a.userId,labId,hidden?'order.queue_hide':'order.queue_restore','order',orderId,{hidden}).catch(()=>{});",
    "          try{publishLabEvent(labId,'order_queue_visibility',{orderId,hidden})}catch{}",
    "          return sendJson(res,200,{ok:true,orderId,hidden});",
    "        }",
    ""
  ].join('\n');
  api=one(api,getAnchor,visibility+getAnchor,'visibility route');
  api=segment(api,getAnchor,"        if (req.method === 'GET' && url.pathname === '/api/lab/archive')",part=>
    one(part,"AND COALESCE(o.source,'')<>'manual_invoice'\n        ORDER BY o.created_at DESC",
      "AND COALESCE(o.source,'')<>'manual_invoice' AND COALESCE((SELECT e.status FROM order_status_events e WHERE e.order_id=o.id AND e.lab_id=o.lab_id AND e.status IN ('lab_queue_hidden','lab_queue_visible') ORDER BY e.created_at DESC,e.id DESC LIMIT 1),'lab_queue_visible')<>'lab_queue_hidden'\n        ORDER BY o.created_at DESC",
      'exclude hidden cards only from working queue'),'working queue GET');

  api=segment(api,"if (labOrder && req.method === 'DELETE')","if (labOrder && req.method === 'PATCH')",part=>{
    part=one(part,"let invoiceCorrection = null;","let invoiceCorrection = null;\n            let alreadyProduced = false;",'production flag');
    part=one(part,"const order = oq.rows[0];",
       "const order = oq.rows[0];\n                const priorInvoice = await c.query('SELECT id FROM invoices WHERE order_id=$1 AND lab_id=$2 LIMIT 1',[orderId,labId]);\n                alreadyProduced=Boolean(order.downloaded_at||priorInvoice.rowCount||['downloaded','printing','reviewing','ready_print','printed','ready','completed','delivered','done','archived'].includes(String(order.status||'')));",
       'prior invoice protection');
    const downloadedGuard=/if \(order\.downloaded_at\) \{\s*await c\.query\('ROLLBACK'\);\s*return sendJson\(res, 409, \{ error: 'order_already_downloaded' \}\);\s*\}/g;
    if([...part.matchAll(downloadedGuard)].length!==1)throw Error('R1895 downloaded guard changed');
    part=part.replace(downloadedGuard,'');
    const oldStatusGuard=/if \(\['completed', 'cancelled', 'ready', 'printed', 'ready_print', 'printing', 'reviewing'\]\.includes\(String\(order\.status \|\| ''\)\)\) \{\s*await c\.query\('ROLLBACK'\);\s*return sendJson\(res, 409, \{ error: 'order_not_deletable' \}\);\s*\}/g;
    if([...part.matchAll(oldStatusGuard)].length!==1)throw Error('R1895 old status guard changed');
    part=part.replace(oldStatusGuard,"if(String(order.status||'')==='cancelled'){await c.query('ROLLBACK');return sendJson(res,409,{error:'order_already_cancelled'})}");
    part=one(part,"for (const [sizeId, qty] of stock) {","if (!alreadyProduced) for (const [sizeId, qty] of stock) {",'do not restock printed old orders');
    part=one(part,"if (rq.rowCount)\n                    await c.query", "if (rq.rowCount && !alreadyProduced)\n                    await c.query", 'preserve receipts on issued old orders');
    part=one(part,"await c.query(\`UPDATE order_files SET original_state='deleted',original_delete_after=NULL,deleted_at=COALESCE(deleted_at,now()) WHERE order_id=$1\`, [orderId]);",
      "if (!alreadyProduced) await c.query(\`UPDATE order_files SET original_state='deleted',original_delete_after=NULL,deleted_at=COALESCE(deleted_at,now()) WHERE order_id=$1\`, [orderId]);",
      'retain uploaded originals on legacy cancellation');
    part=one(part,"await Promise.all(storageKeys.map(key => deleteStoredKeyBestEffort(key).catch(() => false)));",
      "if (alreadyProduced) storageKeys.length=0;\n            await Promise.all(storageKeys.map(key => deleteStoredKeyBestEffort(key).catch(() => false)));",
      'never erase originals of completed orders');
    part=one(part,"'حذف توسط لابراتوار قبل از اولین دانلود'",
      "'ابطال سفارش توسط لابراتوار؛ اسناد مالی طبق سابقه محفوظ است'",'status note');
    part=one(part,"'order.lab_delete_before_download'","alreadyProduced?'order.lab_cancel_produced':'order.lab_delete_before_download'",'audit reason');
    part=one(part,"publishCustomerEvent(labId, String(cancelled?.customer_id || ''), 'order_status',",
      "try{publishLabEvent(labId,'order_cancelled',{orderId,status:'cancelled'})}catch{}\n            publishCustomerEvent(labId, String(cancelled?.customer_id || ''), 'order_status',",
      'sync lab clients');
    return part;
  },'DELETE with existing financial correction');

  api+='\n'+marker+'\n';
  fs.writeFileSync(serverFile,api);
}
if(!ui.includes(marker)){
  ui=segment(ui,'ma=le=>!(le!=null&&le.downloaded_at)',',_a=async le=>',part=>{
    const action=
      'ma=le=>!!(le&&le.id),si=async le=>{'+
      'if(E||!le?.id||!confirm("سفارش #"+V(le.number)+" حذف شود؟\\nاگر فاکتور بدون پرداخت باشد، با ثبت اصلاحیه مالی ابطال می‌شود؛ اطلاعات حسابداری برای رسیدگی محفوظ می‌ماند."))return;'+
      'C(le.id);try{await Me("/api/lab/orders/"+le.id,{method:"DELETE"});(h?.id===le.id)&&(S(null),I(null));await ye();P("سفارش #"+V(le.number)+" لغو شد؛ اصلاحیه فاکتور در حسابداری محفوظ است")}'+
      'catch(err){const code=String(err?.data?.error||err?.message||"");'+
      'if(["paid_order_requires_lab","courier_already_requested"].includes(code)){'+
      'if(confirm("این سفارش پرداخت یا ارسال فعال دارد و ابطال مالی آن خودکار ایمن نیست. فقط از صف کاری حذف شود؟\\nفاکتور، پرداخت‌ها و تصاویر باقی می‌مانند.")){'+
      'try{await Me("/api/lab/orders/"+le.id+"/queue-hide",{method:"POST",body:"{}"});await ye();P("سفارش #"+V(le.number)+" از صف حذف شد؛ فاکتور مالی باقی ماند")}'+
      'catch{alert("حذف از صف انجام نشد")}}'+
      '}else{alert("حذف/ابطال سفارش انجام نشد: "+code);await ye().catch(()=>{})}}finally{C("")}}';
    const start=part.indexOf('ma=le=>'),end=part.indexOf(',_a=async');
    if(start!==0||end!==-1)throw Error('R1895 UI removal anchor mismatch');
    return action;
  },'lab delete action');
  ui+='\n'+marker+'\n';
  fs.writeFileSync(uiFile,ui);
}
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
if(!html.includes('labCancel=r1895')){
  const rx=/index-UIRefine-v655-r84\.js\?[^"'\s]*/g;
  if([...html.matchAll(rx)].length!==1)throw Error('R1895 final web asset revision');
  html=html.replace(rx,v=>v+'&labCancel=r1895');
  fs.writeFileSync(htmlFile,html);
}
execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});
console.log('[R1895] Old orders: unpaid invoice correction + cancellation, otherwise reversible queue hide; no existing originals removed');
