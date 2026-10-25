import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const serverFile='dist/api/server.js',uiFile='dist/web/assets/index-UIRefine-v655-r84.js';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1452 anchor '+a.slice(0,120));return s.replace(a,b)};
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1452 archived invoice snapshot */')){
 const a=server.indexOf('async function archiveOrdersForLab('),b=server.indexOf('async function financeDocumentsForCustomer(',a);
 if(a<0||b<0)throw Error('R1452 archive query');
 let part=server.slice(a,b);
 part=once(part,'i.id invoice_id,i.number invoice_number,i.total invoice_total,i.issued_at invoice_issued_at,i.pdf_ready invoice_pdf_ready,',`i.id invoice_id,i.number invoice_number,i.total invoice_total,i.issued_at invoice_issued_at,i.pdf_ready invoice_pdf_ready,
    /* PB1452 archived invoice snapshot */
    i.items,i.subtotal,i.discount,i.account_balance_at_issue,
    COALESCE((SELECT sum(p.amount) FROM finance_payments p WHERE p.invoice_id=i.id),0)::bigint paid_total,
    GREATEST(0,i.total-COALESCE((SELECT sum(p.amount) FROM finance_payments p WHERE p.invoice_id=i.id),0))::bigint balance,`);
 server=server.slice(0,a)+part+server.slice(b);
 // Accept existing JSON values even if an older database adapter returns jsonb text.
 server=once(server,'const value = q.rows[0]?.value;\n    const raw = value?.hours',`let value = q.rows[0]?.value;
    if(typeof value==='string'){try{value=JSON.parse(value)}catch{value=null}}
    const raw = value?.hours`);
 fs.writeFileSync(serverFile,server);
}
let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1452 archive dialogs and retention readback */')){
 let a=ui.indexOf('function _0(){'),b=ui.indexOf('function k0(',a);if(a<0||b<0)throw Error('R1452 settings');
 let part=ui.slice(a,b);
 part=once(part,'const y=await Me("/api/admin/storage-settings");a(y),r(Number(((I=y.settings)==null?void 0:I.originalRetentionHours)??4))','const y=await pb1452ReadRetention();a(y),r(pb1452RetentionHours(y.settings))');
 const p=part.indexOf('const p=async()=>'),end=part.indexOf(',f=async()=>',p);if(p<0||end<0)throw Error('R1452 save');
 part=part.slice(0,p)+`const p=async()=>{l(!0);try{const fresh=await pb1452SaveRetention(s);a(fresh);r(pb1452RetentionHours(fresh.settings));await pb1452ArchiveNotice('مدت نگهداری فایل اصلی روی '+V(pb1452RetentionHours(fresh.settings))+' ساعت ذخیره و دوباره از سرور تأیید شد.',{title:'سیاست نگهداری ذخیره شد'})}catch(error){await pb1452ArchiveNotice(error.message==='invalid_retention_hours'?'مدت نگهداری را بین صفر و ۸۷۶۰۰ ساعت وارد کنید.':'ذخیره زمان نگهداری توسط سرور تأیید نشد. مقدار واردشده حفظ شده است؛ اتصال را بررسی و دوباره تلاش کنید.',{title:'ذخیره تنظیمات انجام نشد',tone:'error'})}finally{l(!1)}}`+part.slice(end);
 part=once(part,'x.useEffect(()=>{g()},[])',`x.useEffect(()=>{g().catch(()=>pb1452ArchiveNotice('دریافت مقدار ذخیره‌شده از سرور انجام نشد. دوباره این صفحه را باز کنید.',{title:'تنظیمات نگهداری',tone:'error'}))},[])`);
 part=part.replace('بعد از صدور فاکتور/آماده‌تحویل، فایل اصلی فقط به تعداد ساعتی که تعیین می‌کنی روی سرور می‌ماند. اطلاعات سفارش و فاکتور حذف نمی‌شوند.','مدت نگهداری فایل اصلی بعد از صدور فاکتور/آماده‌تحویل تعیین می‌شود. فایل‌ها تا اولین دانلود کامل حذف نمی‌شوند و پس از آن نیز حداقل این زمان برای دریافت مجدد باقی می‌مانند.');
 part=part.replace('۰ ساعت یعنی فایل در اولین پاکسازی بعد از صدور فاکتور آماده حذف است.','۰ ساعت یعنی بعد از صدور فاکتور و اولین دانلود کامل، فایل می‌تواند در پاکسازی بعدی حذف شود.');
 ui=ui.slice(0,a)+part+ui.slice(b);
 // Finance and archive share this invoice action; use a complete saved snapshot before opening.
 let da=ui.indexOf('function db('),de=ui.indexOf('function lj(',da);if(da<0||de<0)throw Error('R1452 invoice action');
 let action=ui.slice(da,de).replaceAll('alert(','await pb1452ArchiveNotice(');
 action=once(action,'[o,l]=x.useState(!1),c=async()=>','[o,l]=x.useState(!1),[detail,setDetail]=x.useState(a),[loading,setLoading]=x.useState(false),openInvoice=async()=>{setLoading(true);try{let invoice=a;if(!vh(invoice).length){const data=await Me((t==="lab"?"/api/lab/invoices":"/api/customer/invoices")+"?archiveDetail=r1452");invoice=(data.invoices||[]).find(row=>row.id===a.id);if(!invoice||!vh(invoice).length)throw Error("invoice_items_unavailable")}setDetail({...a,...invoice});l(!0)}catch{await pb1452ArchiveNotice("دریافت ردیف‌های ذخیره‌شده فاکتور انجام نشد. اتصال را بررسی و دوباره تلاش کنید.",{title:"فاکتور آرشیو",tone:"error"})}finally{setLoading(false)}},c=async()=>');
 action=once(action,'onClick:()=>l(!0),children:"مشاهده"','disabled:loading,onClick:openInvoice,children:loading?"در حال دریافت…":"مشاهده"');
 action=once(action,'o&&e.jsx(Oc,{role:t,invoice:a,','o&&e.jsx(Oc,{role:t,invoice:detail,');
 ui=ui.slice(0,da)+action+ui.slice(de);
 a=ui.indexOf('function hb(');b=ui.indexOf('function ',a+15);if(a<0||b<0)throw Error('R1452 archive UI');
 part=ui.slice(a,b).replaceAll('alert(','await pb1452ArchiveNotice(').replaceAll('confirm(','await pb1452ArchiveConfirm(').replaceAll('pb1450Notify(error)','await pb1452ArchiveNotify(error)').replaceAll('pb1451RecoveryError(error)','await pb1451RecoveryError(error)');
 part=part.replace('title:`آرشیو سفارش #${V(m.order.number)} · ${m.order.customer_name}`','title:`آرشیو سفارش #${V(m.order.number)} · ${m.order.customer_name||"مشتری آزاد"}`');
 ui=ui.slice(0,a)+part+ui.slice(b);
 a=ui.indexOf('function pb1451RecoveryError(');b=ui.indexOf('async function pb1451AcknowledgeDownload(',a);if(a<0||b<0)throw Error('R1452 archive messages');
 part=ui.slice(a,b).replace('function pb1451RecoveryError(','async function pb1451RecoveryError(').replaceAll('alert(','await pb1452ArchiveNotice(').replace('pb1450Notify(error)','return pb1452ArchiveNotify(error)');
 ui=ui.slice(0,a)+part+ui.slice(b);
 a=ui.indexOf('function pb1450Notify(');b=ui.indexOf('const pb1450Flights',a);if(a<0||b<0)throw Error('R1452 archive error mapping');
 const notify=ui.slice(a,b).replace('function pb1450Notify(','function pb1452ArchiveNotify(').replaceAll('alert(','pb1452ArchiveNotice(');
 ui+='\n/* PB1452 archive dialogs and retention readback */\n'+fs.readFileSync('scripts/r1452-archive-dialogs.js','utf8')+'\n'+notify;
 fs.writeFileSync(uiFile,ui);
}
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
if(!html.includes('pb1452ArchiveDialogStyles')){html=html.replace('</head>','<style id="pb1452ArchiveDialogStyles">'+fs.readFileSync('scripts/r1452-archive-dialogs.css','utf8')+'</style></head>');}
html=html.replaceAll('downloadRepair=r1451','downloadRepair=r1452');fs.writeFileSync(htmlFile,html);
for(const file of [serverFile,uiFile])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1452] Retention readback, archived invoice snapshots and project dialogs ready.');
