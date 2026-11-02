import fs from 'node:fs';
const file='dist/api/server.js';let server=fs.readFileSync(file,'utf8');
if(!server.includes('/* PB1545 delete downloaded before print */')){
 const start=server.indexOf("if (labOrder && req.method === 'DELETE')"),end=server.indexOf("if (labOrder && req.method === 'PATCH')",start);if(start<0||end<start)throw Error('R1545 delete route missing');let part=server.slice(start,end);
 const one=(a,b)=>{if(part.split(a).length!==2)throw Error('R1545 delete guard changed: '+a.slice(0,100));part=part.replace(a,b)};
 one('if (order.downloaded_at) {','/* PB1545 delete downloaded before print */\n                if (order.downloaded_at && String(order.status || \'\') !== \'downloaded\') {');
 const payment="                if (String(order.payment_status || '') === 'paid') {";
 one(payment,`                const printStarted = await c.query(\`SELECT 1 FROM order_status_events WHERE order_id=$1 AND lab_id=$2 AND status IN ('printing','reviewing','ready_print','printed','ready','completed','binding') LIMIT 1\`, [orderId,labId]);
                if (order.printed_at || ['printing','binding','ready','completed','delivered'].includes(String(order.album_stage || '')) || printStarted.rowCount) {
                    await c.query('ROLLBACK');
                    return sendJson(res,409,{error:'order_print_started'});
                }
`+payment);
 part=part.replaceAll('قبل از اولین دانلود','پیش از شروع چاپ').replace("'order.lab_delete_before_download'","'order.lab_delete_before_print'");server=server.slice(0,start)+part+server.slice(end);fs.writeFileSync(file,server);
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(bundle,'utf8');
if(!js.includes('/* PB1545 downloaded cancellation UI */')){
 const one=(a,b)=>{if(js.split(a).length!==2)throw Error('R1545 cancellation UI changed: '+a.slice(0,100));js=js.replace(a,b)};
 one('ma=le=>!(le!=null&&le.downloaded_at)&&!["completed","cancelled","ready","printed","ready_print","printing","reviewing"].includes(String((le==null?void 0:le.status)||""))&&String((le==null?void 0:le.payment_status)||"")!=="paid"', 'ma=le=>!(le!=null&&le.printed_at)&&(!(le!=null&&le.downloaded_at)||le.status==="downloaded")&&!["uploading","completed","cancelled","ready","printed","ready_print","printing","reviewing"].includes(String((le==null?void 0:le.status)||""))&&!["printing","binding","ready","completed","delivered"].includes(String((le==null?void 0:le.album_stage)||""))&&String((le==null?void 0:le.payment_status)||"")!=="paid"');
 one('&&confirm(`سفارش #${V(le.number)} از صف حذف شود؟\nاین کار فقط قبل از شروع دانلود/چاپ ممکن است.`)', '&&await pb1452ArchiveDialog(`سفارش #${V(le.number)} از صف حذف شود؟\nاین کار تا پیش از شروع چاپ ممکن است. فایل‌های سفارش از فضای ابری حذف می‌شوند؛ نسخه‌های ذخیره‌شده روی کامپیوتر باقی می‌مانند.`,{title:"حذف سفارش",confirm:true,acceptLabel:"حذف سفارش",brandLabel:"فوتوبریج · مدیریت سفارش‌ها"})');
 one('Mt==="order_already_downloaded"?"این سفارش قبلاً روی سیستم دریافت شده و دیگر از اینجا قابل حذف نیست."', '(Mt==="order_already_downloaded"||Mt==="order_print_started"||Mt==="order_not_deletable")?"چاپ این سفارش شروع شده یا وضعیت آن تغییر کرده است؛ حذف از این مرحله مجاز نیست."');
 js+='\n/* PB1545 downloaded cancellation UI */\n';fs.writeFileSync(bundle,js);
}
console.log('[PhotoBridge R1545] downloaded orders can be cancelled only before print, with existing financial/courier safeguards');
