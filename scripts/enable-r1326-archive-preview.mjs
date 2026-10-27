import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
// The prebuilt bundle already contains the full R1326/R1327 archive and
// retention work. Do not replay the historical string surgery over it.
const modernServer=fs.readFileSync('dist/api/server.js','utf8');
const modernUi=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const legacyPatchNeeded=!(modernUi.includes('pb1327DetailHeader')&&modernUi.includes('pb1326GroupedFiles')&&modernServer.includes('originalRetentionHours')&&modernServer.includes('thumbnail_key'));
if(!legacyPatchNeeded) console.log('[R1326] Current archive/retention implementation already present; legacy patch skipped.');
else {
function patch(file, changes) {
 let s=fs.readFileSync(file,'utf8');
 for(const [before,after] of changes){if(s.includes(after))continue;if(file==='dist/api/server.js'&&before.startsWith('const raw = Number(q.rows[0]?.value?.days);')&&s.includes('value?.hours != null'))continue;if(file==='dist/api/server.js'&&before.includes("SELECT id,object_key,print_object_key FROM order_files WHERE original_state='ready_for_deletion'")&&s.includes('first_downloaded_at')&&s.includes('o.downloaded_at IS NOT NULL'))continue;if(s.split(before).length!==2)throw new Error('R1326 ambiguous/missing anchor: '+before.slice(0,100));s=s.replace(before,after);}
 fs.writeFileSync(file,s);
}
patch('dist/api/server.js',[[
 'SELECT o.id order_id,o.number order_number,o.mode,o.status raw_order_status,o.album_stage,o.updated_at,',
 `SELECT o.id order_id,o.number order_number,o.mode,o.status raw_order_status,o.album_stage,o.updated_at,
    COALESCE((SELECT min(e.created_at) FROM order_status_events e WHERE e.order_id=o.id AND e.status IN ('sent','awaiting_payment')),o.created_at) sent_at,`
]]);
patch('dist/web/assets/index-UIRefine-v655-r84.js',[
 ['const be=fe.completed_at||fe.issued_at;', 'const be=(t==="customer"?fe.sent_at:null)||fe.completed_at||fe.issued_at;'],
 ['K.mode==="album"?" · آلبوم":" · چاپ"', 'K.mode==="album"?" · آلبوم":" · چاپ",K.sent_at?e.jsx("span",{className:"archiveSentAt",style:{display:"block",marginTop:4},children:"ارسال: "+new Intl.DateTimeFormat("fa-IR",{timeZone:"Asia/Tehran",dateStyle:"medium",timeStyle:"short"}).format(new Date(K.sent_at))}):null'],
 ['c&&["preview_expired","preview_unavailable"].includes(String(((m=g==null?void 0:g.data)==null?void 0:m.error)||""))&&l(!0)', 'c&&l(String(((m=g==null?void 0:g.data)==null?void 0:m.error)||"preview_error"))'],
 ['children:o?"پیش‌نمایش منقضی شده":"▧"', 'children:o==="preview_expired"?"فایل از سرور حذف شده":o==="preview_unavailable"?"پیش‌نمایش این فایل پشتیبانی نمی‌شود":o==="file_not_found"?"فایل در دسترس نیست":o?"دریافت پیش‌نمایش ناموفق؛ دوباره باز کنید":"▧"']
]);
// Choose a populated day on initial load, even when the last order was in an older month.
patch('dist/web/assets/index-UIRefine-v655-r84.js',[
 ['Me(M).then(K=>s(Array.isArray(K.orders)?K.orders:[]))','Me(M).then(K=>{const rows=Array.isArray(K.orders)?K.orders:[];s(rows);const dates=rows.map(row=>(t==="customer"?row.sent_at:null)||row.completed_at||row.issued_at).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a));if(dates.length){const newest=Ji(dates[0]);C({year:newest.year,month:newest.month});F(Wi(dates[0]))}})'],
 ['روزهای دارای سفارش تحویل‌شده روی تقویم مشخص هستند.','روزهای ارسال سفارش روی تقویم مشخص هستند؛ آخرین روز دارای سفارش انتخاب می‌شود.'],
 ['در این روز سفارش تحویل‌شده‌ای وجود ندارد.','در این روز سفارشی در آرشیو نیست.']
]);
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('const printThumbnailJobs = new Map();'))server=server.replace('async function cleanupOriginals() {',fs.readFileSync('scripts/patches/r1326-print-thumbnails.inc','utf8')+'\nasync function cleanupOriginals() {');
fs.writeFileSync('dist/api/server.js',server);
patch('dist/api/server.js',[
 ["AND (\n        i.id IS NOT NULL\n        OR o.status IN", "AND (\n        ${customerId ? \"o.status<>'uploading' OR\" : ''}\n        i.id IS NOT NULL\n        OR o.status IN"],
 ["const GRACE_HOURS = Number(process.env.ORIGINAL_GRACE_HOURS || 48);", "const GRACE_HOURS = Number(process.env.ORIGINAL_GRACE_HOURS || 4);"],
 ["const raw = Number(q.rows[0]?.value?.days);\n    if (Number.isFinite(raw))\n        return Math.max(0, Math.min(3650, Math.round(raw)));\n    return Math.max(0, Math.min(3650, Math.round(GRACE_HOURS / 24)));", "const value = q.rows[0]?.value;\n    const raw = value?.hours != null ? Number(value.hours) / 24 : value?.days != null ? Number(value.days) : NaN;\n    if (Number.isFinite(raw)) return Math.max(0, Math.min(3650, raw));\n    return Math.max(0, Math.min(3650, GRACE_HOURS / 24));"],
 ["let originalDays = await getOriginalRetentionDays(), retouchDays = await getRetouchOutputRetentionDays();\n        if (b.originalRetentionDays !== undefined) {\n            const raw = Number(b.originalRetentionDays);", "let originalDays = await getOriginalRetentionDays(), retouchDays = await getRetouchOutputRetentionDays();\n        if (b.originalRetentionHours !== undefined || b.originalRetentionDays !== undefined) {\n            const raw = b.originalRetentionHours !== undefined ? Number(b.originalRetentionHours) / 24 : Number(b.originalRetentionDays);"],
 ["originalDays = Math.max(0, Math.min(3650, Math.round(raw)));", "originalDays = Math.max(0, Math.min(3650, raw));"],
 ["JSON.stringify({ days: originalDays })", "JSON.stringify({ days: originalDays, hours: originalDays * 24 })"],
 ["SELECT id,object_key,print_object_key FROM order_files WHERE original_state='ready_for_deletion'", "SELECT * FROM order_files WHERE original_state='ready_for_deletion'"],
 ["const originalKey = String(row.object_key || ''), printKey = String(row.print_object_key || '');\n                if (originalKey)\n                    await deleteStoredKeyBestEffort(originalKey);\n                if (printKey && printKey !== originalKey)\n                    await deleteStoredKeyBestEffort(printKey);", "const originalKey = String(row.object_key || ''), printKey = String(row.print_object_key || '');\n                const isImage = String(row.print_content_type || row.content_type || '').startsWith('image/') || /\\.(jpe?g|png|webp|tiff?|bmp|heic|heif)$/i.test(row.original_name || '');\n                if (isImage) await ensurePermanentPrintThumbnail(row);\n                if (originalKey && !(await deleteStoredKeyBestEffort(originalKey))) throw new Error('original_delete_pending');\n                if (printKey && printKey !== originalKey && !(await deleteStoredKeyBestEffort(printKey))) throw new Error('print_delete_pending');"],
]);
// Retain days in the existing internal API, but support fractional days without truncating four hours to zero.
server=fs.readFileSync('dist/api/server.js','utf8').replaceAll('make_interval(days => $2::int) WHERE order_id=$1 AND original_state=\'active\'',"make_interval(secs => $2::double precision * 86400) WHERE order_id=$1 AND original_state='active'");

const start=server.indexOf('async function reschedulePendingOriginalCleanup(days) {'),end=server.indexOf('function tehranDateKey',start);
server=server.slice(0,start)+`async function reschedulePendingOriginalCleanup(days) {
    await pool.query(\`UPDATE order_files f SET original_delete_after=COALESCE(o.printed_at,
    (SELECT min(e.created_at) FROM order_status_events e WHERE e.order_id=o.id AND e.status IN ('ready','printed')),
    (SELECT min(i.issued_at) FROM invoices i WHERE i.order_id=o.id),o.updated_at)
    + make_interval(secs => $1::double precision * 86400)
    FROM orders o WHERE o.id=f.order_id AND f.original_state='ready_for_deletion'\`, [days]);
}
`+server.slice(end);
// Every upload completion path prepares a print JPEG; attach the thumbnail at that common boundary.
server=server.replaceAll("            await bestEffortPrintThumbnail({...row,original_state:'active'});\n",'');
if(!server.includes('async function preparePrintReadyJpegR1326('))server=server.replace('async function ensurePrintReadyJpeg(row) {',`async function ensurePrintReadyJpeg(row) {
    const prepared=await preparePrintReadyJpegR1326(row);
    if(prepared?.id && prepared?.object_key) await bestEffortPrintThumbnail(prepared);
    return prepared;
}
async function preparePrintReadyJpegR1326(row) {`);
fs.writeFileSync('dist/api/server.js',server);
patch('dist/api/server.js',[
 ["SELECT COALESCE(f.object_key,f.print_object_key) object_key,COALESCE(f.original_name,f.print_name) original_name,COALESCE(f.content_type,f.print_content_type) content_type,f.original_state\n        FROM order_files f JOIN orders o ON o.id=f.order_id", "SELECT f.*\n        FROM order_files f JOIN orders o ON o.id=f.order_id"],
 ["const row = q.rows[0], key = String(row.object_key || '');\n            if (!key || String(row.original_state || '') === 'deleted')", "const row = q.rows[0], thumbnail = await bestEffortPrintThumbnail(row), key = thumbnail || (row.original_state !== 'deleted' ? String(row.object_key || row.print_object_key || '') : '');\n            if (thumbnail) { row.content_type='image/jpeg'; row.original_name='thumbnail.jpg'; }\n            if (!key)"],
]);
server=fs.readFileSync('dist/api/server.js','utf8').replaceAll('originalRetentionDays: originalDays, retouchRetentionDays:', 'originalRetentionDays: originalDays, originalRetentionHours: originalDays * 24, retouchRetentionDays:');
fs.writeFileSync('dist/api/server.js',server);
let bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
let begin=bundle.indexOf('function _0(){'),finish=bundle.indexOf('function k0(',begin),ui=bundle.slice(begin,finish);
if(!ui.includes('originalRetentionHours')) ui=ui.replace('x.useState(2)','x.useState(4)').replace('I.originalRetentionDays)??2','I.originalRetentionHours)??4').replace('Math.min(3650,Math.round(Number(s)||0))','Math.min(87600,Number(s)||0)').replace('originalRetentionDays:y','originalRetentionHours:y').replace('روز تنظیم شد.','ساعت تنظیم شد.').replace('به تعداد روزی که تعیین می‌کنی','به تعداد ساعتی که تعیین می‌کنی').replace('max:"3650"','max:"87600",step:"1"').replace('children:"روز"','children:"ساعت"').replace('۰ روز یعنی','۰ ساعت یعنی').replace('اگر برای یک فایل پیش‌نمایش/thumbnail مستقل وجود داشته باشد همان فایل کوچک باقی می‌ماند','پیش‌نمایش کوچک عکس‌ها مستقل ساخته می‌شود و حذف خودکار ندارد؛ اگر ساخت آن ناموفق باشد حذف اصل عکس تا ساخت پیش‌نمایش متوقف می‌شود');
bundle=bundle.slice(0,begin)+ui+bundle.slice(finish);
fs.writeFileSync('dist/web/assets/index-UIRefine-v655-r84.js',bundle);
patch('dist/web/assets/index-UIRefine-v655-r84.js',[
 ['v=K=>C(fe=>Cc(fe.year,fe.month,K)),$=async K=>{if(t==="lab"){','v=K=>C(fe=>Cc(fe.year,fe.month,K)),$=async K=>{if(t==="customer"){f(K.order_id);try{g(await Me(`/api/customer/orders/${K.order_id}`))}catch{alert("دریافت جزئیات سفارش انجام نشد.")}finally{f("")}return}if(t==="lab"){'],
 ['className:"archiveRowActions",children:[t==="lab"', 'className:"archiveRowActions",children:[t==="customer"&&e.jsx("button",{disabled:p===K.order_id,onClick:()=>$(K),children:p===K.order_id?"…":"عکس‌ها / جزئیات"}),t==="lab"'],
 ['m&&t==="lab"&&e.jsxs(On,{title:`آرشیو سفارش', 'm&&t==="customer"&&e.jsxs(On,{title:`عکس‌های سفارش #${V(m.order.number)}`,onClose:()=>{g(null);S(null)},children:[e.jsx("small",{children:"پیش‌نمایش‌ها برای شناسایی عکس‌ها نگهداری می‌شوند؛ فایل کامل ممکن است طبق سیاست نگهداری حذف شده باشد."}),e.jsx(pb1326GroupedFiles,{files:m.files||[],onOpen:index=>S({index})}),h&&e.jsx(vv,{files:m.files||[],initialIndex:h.index,onClose:()=>S(null)})]}),m&&t==="lab"&&e.jsxs(On,{title:`آرشیو سفارش']
]);
patch('dist/api/server.js',[
 ['async function cleanupOriginals() {\n    let objectPending = 0, removed = 0;', 'async function cleanupOriginals() {\n    let objectPending = 0, removed = 0;\n    const attempted = [];'],
 ["SELECT * FROM order_files WHERE original_state='ready_for_deletion' AND original_delete_after<=now() LIMIT 200", "SELECT * FROM order_files WHERE original_state='ready_for_deletion' AND original_delete_after<=now() AND NOT(id=ANY($1::uuid[])) ORDER BY original_delete_after,id LIMIT 200"],
 ["ORDER BY original_delete_after,id LIMIT 200\`);", "ORDER BY original_delete_after,id LIMIT 200\`,[attempted]);"],
 ['const originalKey = String(row.object_key || \'\'), printKey = String(row.print_object_key || \'\');\n                const isImage', 'attempted.push(row.id);\n                const originalKey = String(row.object_key || \'\'), printKey = String(row.print_object_key || \'\');\n                const isImage'],
 ["UPDATE order_files SET object_key=$3,original_name=$4,relative_path=$5,content_type=$6,bytes=$7,width=$8,height=$9,dpi=$10,crop_handling='none',original_state='active'", "UPDATE order_files SET object_key=$3,thumbnail_key=NULL,original_name=$4,relative_path=$5,content_type=$6,bytes=$7,width=$8,height=$9,dpi=$10,crop_handling='none',original_state='active'"]
]);
patch('dist/api/server.js',[
 ["if (!Number.isFinite(raw)) return sendJson(res, 400, { error: 'invalid_retention_days' });", "if (!Number.isFinite(raw) || (b.originalRetentionHours !== undefined && (b.originalRetentionHours === null || b.originalRetentionHours === '' || raw < 0 || raw > 3650))) return sendJson(res, 400, { error: 'invalid_retention_days' });"]
]);
server=fs.readFileSync('dist/api/server.js','utf8');
const labPreviewStart=server.indexOf('        const labFilePreview ='),labPreviewEnd=server.indexOf('        const labFileDownload =',labPreviewStart);
if(labPreviewStart<0||labPreviewEnd<0)throw new Error('R1326 lab preview route missing');
server=server.slice(0,labPreviewStart)+fs.readFileSync('scripts/patches/r1326-lab-preview.inc','utf8')+server.slice(labPreviewEnd);
fs.writeFileSync('dist/api/server.js',server);
patch('dist/api/server.js',[[
 'SELECT f.id,f.original_name,f.relative_path,f.content_type,f.bytes,f.width,f.height,f.dpi,f.print_size_id,f.print_type,f.chassis,f.frame,f.crop_handling,f.original_state,s.label size_label',
 'SELECT f.id,f.original_name,f.relative_path,f.content_type,f.bytes,f.width,f.height,f.dpi,f.print_size_id,f.print_type,f.print_copies,f.chassis,f.frame,f.crop_handling,f.original_state,s.label size_label'
]]);
bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
if(!bundle.includes('function pb1326FileGroups('))bundle=bundle.replace('function yv(',fs.readFileSync('scripts/patches/r1326-mobile-files.inc','utf8')+'function yv(');
const detailStart=bundle.indexOf('function jv('),detailEnd=bundle.indexOf('function ',detailStart+15);
let detail=bundle.slice(detailStart,detailEnd);
// R1327: shared collapsed size groups on desktop and mobile; statistics stay inline with the timestamp.
const headStart=detail.indexOf('e.jsxs("div",{className:"customerOrderDetailHead'),headEnd=detail.indexOf('o?e.jsx("div",{className:"alert error"',headStart);
if(headStart<0||headEnd<0)throw new Error('R1327 details header missing');
detail=detail.slice(0,headStart)+'e.jsxs("div",{className:"customerOrderDetailHead pb1327DetailHeader",children:[e.jsx("span",{className:"pb1327DetailDate",children:vn(p.created_at)+" · "+Yi(p.created_at)}),e.jsx("span",{className:"pb1327DetailStats",title:V(g.length)+" فایل · "+pb1326FileGroups(g).map(group=>group.label+": "+V(group.count)+" چاپ").join(" · "),children:V(g.length)+" فایل · "+pb1326FileGroups(g).map(group=>group.label+": "+V(group.count)+" چاپ").join(" · ")})]}),'+detail.slice(headEnd);
const metaStart=detail.indexOf('e.jsxs("div",{className:"customerOrderDetailMeta"');
if(metaStart>=0){const metaEnd=detail.indexOf('p.mode==="album"&&',metaStart);if(metaEnd<0)throw new Error('R1327 metadata end missing');detail=detail.slice(0,metaStart)+detail.slice(metaEnd);}
const filesStart=detail.indexOf('g.length?'),filesEnd=detail.indexOf(':e.jsx(zn,{text:"فایلی برای این سفارش ثبت نشده است."})',filesStart);
if(filesStart<0||filesEnd<0)throw new Error('R1327 files section missing');
detail=detail.slice(0,filesStart)+'g.length?e.jsx(pb1326GroupedFiles,{files:g,onOpen:m})'+detail.slice(filesEnd);
bundle=bundle.slice(0,detailStart)+detail+bundle.slice(detailEnd);
bundle=bundle.replace('e.jsx("div",{className:"customerOrderDetailThumbs",children:(m.files||[]).map((file,index)=>e.jsx(yv,{file,onOpen:()=>S({index})},file.id))})','e.jsx(pb1326GroupedFiles,{files:m.files||[],onOpen:index=>S({index})})');
fs.writeFileSync('dist/web/assets/index-UIRefine-v655-r84.js',bundle);
// Keep cached bundles distinct without changing the original generator version.
function cache(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory()){cache(file);continue;}if(!item.name.endsWith('.html'))continue;let s=fs.readFileSync(file,'utf8');s=s.replace(/(index-UIRefine-v655-r84\.js)([^"'<>\s]*)/g,(_,name,q)=>{const clean=q.replace(/[?&]archive=r132[67]/g,'');return name+clean+(clean.includes('?')?'&':'?')+'archive=r1327'});if(s.includes('photobridge-r1126-desktop-navigation.js')&&!s.includes('photobridge-r1326-print-details.css')){const prefix=s.match(/src=["']([^"']*)photobridge-r1126-desktop-navigation\.js/)?.[1]??'/';s=s.replace('</head>',`<link rel="stylesheet" href="${prefix}photobridge-r1326-print-details.css?v=r1327"></head>`);if(prefix==='./'||prefix===''){const dest=dir+'/photobridge-r1326-print-details.css';if(dest!=='dist/web/photobridge-r1326-print-details.css')fs.copyFileSync('dist/web/photobridge-r1326-print-details.css',dest);}}fs.writeFileSync(file,s);}}
cache('dist/web');cache('dist/api');
for(const file of ['dist/api/server.js','dist/web/assets/index-UIRefine-v655-r84.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1326] Permanent upload thumbnails, hourly retention, populated archive and compact grouped mobile details.');
}
