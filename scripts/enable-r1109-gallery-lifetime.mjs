import fs from 'node:fs';
let s=fs.readFileSync('dist/api/server.js','utf8');
if(!s.includes("from './gallery-lifetime.js'")){
 const replace=(old,next)=>{if(!s.includes(old))throw Error('R1109 server anchor missing: '+old.slice(0,90));s=s.replace(old,next)};
 s="import { galleryExpirySql, maintainGalleryLifetime } from './gallery-lifetime.js';\n"+s;
 replace("const n = Math.round(Number(service?.metadata?.lifetime_days || 30));\n    return Math.max(1, Math.min(180, Number.isFinite(n) ? n : 30));",'return 30;');
 const a=s.indexOf('    const now = Date.now(), cleanupAt = row.cleanup_after',s.indexOf('async function publicGalleryByToken')),b=s.indexOf('    return row;',a);
 s=s.slice(0,a)+"    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return null;\n"+s.slice(b);
 s=s.replaceAll('SELECT g.*,u.name',"SELECT g.*,${galleryExpirySql('g')} AS expires_at,NULL::timestamptz AS cleanup_after,u.name");
 replace('g.note,g.expires_at,g.cleanup_after,g.lifetime_days_snapshot',"g.note,${galleryExpirySql('g')} AS expires_at,NULL::timestamptz AS cleanup_after,g.lifetime_days_snapshot");
 replace("const days = Math.max(1, Math.min(60, Number(row.post_completion_days_snapshot || 7)));",'// Final customer approval does not change gallery expiry.');
 replace("await c.query(`UPDATE photographer_client_galleries SET cleanup_after=now()+($2::int||' days')::interval,updated_at=now() WHERE id=$1`, [row.id, days]);", "await c.query(`UPDATE photographer_client_galleries SET cleanup_after=NULL,updated_at=now() WHERE id=$1`, [row.id]);");
 replace('SELECT id,title,expires_at,cleanup_after FROM photographer_client_galleries WHERE id=$1 AND owner_id=$2 FOR UPDATE',"SELECT g.id,g.title,${galleryExpirySql('g')} AS expires_at FROM photographer_client_galleries g WHERE g.id=$1 AND g.owner_id=$2 FOR UPDATE");
 replace("if (event === 'client_gallery_finalized') return '/photographer/gallery';","if (event === 'client_gallery_finalized' || event === 'gallery.expiring') return '/photographer/gallery';");
 replace("deadlineKind = gallery.cleanup_after ? 'cleanup_after' : 'expires_at'", "deadlineKind = 'expires_at'");
 const x=s.indexOf("                if (deadlineKind === 'cleanup_after')",s.indexOf('const customerGalleryRenew')),y=s.indexOf('                const renewalId',x);
 s=s.slice(0,x)+"                await c.query(`UPDATE photographer_client_galleries SET expires_at=$3,cleanup_after=NULL,updated_at=now() WHERE id=$1 AND owner_id=$2`, [galleryId, a.userId, deadlineAfter]);\n"+s.slice(y);
 s=s.replaceAll('SELECT expires_at,cleanup_after FROM photographer_client_galleries WHERE id=$1',"SELECT ${galleryExpirySql('g')} AS expires_at,NULL::timestamptz AS cleanup_after FROM photographer_client_galleries g WHERE g.id=$1");
 const begin=s.indexOf('async function cleanupExpiredClientGalleries()'),end=s.indexOf('async function api(',begin);
 s=s.slice(0,begin)+`async function cleanupExpiredClientGalleries() {
    await maintainGalleryLifetime(pool,deleteStoredKeyBestEffort,async(owner,notice)=>sendWebPushToRecipient('customer',owner,notice,'gallery.expiring',notice.metadata));
}
`+s.slice(end);
 fs.writeFileSync('dist/api/server.js',s);
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(bundle,'utf8');
const old='e.jsxs("span",{children:["بعد از تأیید نهایی مشتری ",e.jsxs("b",{children:[V(B)," روز"]})," برای دسترسی باقی می‌ماند."]})';
if(js.includes(old))js=js.replace(old,'e.jsx("span",{children:"برای نگهداری عکس‌ها، پیش از پایان مهلت گالری را تمدید کن؛ در غیر این صورت گالری خودکار حذف می‌شود."})');
js=js.replaceAll('انقضای اولیه','پایان مهلت گالری');
js=js.replace('اگر سفارش نهایی در جریان روتوش باشد، انقضای اولیه وسط کار فایل‌ها را حذف نمی‌کند.','گالری تا پایان مهلت ۳۰ روزه قابل استفاده است. تأیید نهایی مشتری این مهلت را تغییر نمی‌دهد؛ برای ادامه دسترسی، گالری را پیش از انقضا تمدید کن.');
// This prose may have already had its old label rewritten above.
js=js.replace('اگر سفارش نهایی در جریان روتوش باشد، پایان مهلت گالری وسط کار فایل‌ها را حذف نمی‌کند.','گالری تا پایان مهلت ۳۰ روزه قابل استفاده است. تأیید نهایی مشتری این مهلت را تغییر نمی‌دهد؛ برای ادامه دسترسی، گالری را پیش از انقضا تمدید کن.');
js=js.replaceAll(' پس از تأیید نهایی مشتری، شمارش حذف خودکار آغاز می‌شود.','');
js=js.replace('عکس‌های گالری به‌صورت پیش‌نمایش کم‌حجم ذخیره می‌شوند. اگر سفارش در جریان باشد، پایان مهلت گالری وسط کار باعث حذف نمی‌شود؛ بعد از تأیید نهایی مشتری، گالری پس از مهلت تعیین‌شده پاک می‌شود.','عکس‌ها به‌صورت پیش‌نمایش کم‌حجم ذخیره می‌شوند. مهلت گالری ۳۰ روز است و تأیید مشتری آن را تغییر نمی‌دهد. تمدید، ۳۰ روز به مهلت گالری اضافه می‌کند.');
js=js.replace('defaultValue:((fe=w.metadata)==null?void 0:fe.lifetime_days)||30,id:`service-gallery-life-${w.service_key}`','defaultValue:30,readOnly:!0,id:`service-gallery-life-${w.service_key}`');
js=js.replace('e.jsxs("label",{children:[e.jsx("span",{children:"مهلت بعد از تأیید نهایی"}),e.jsxs("div",{className:"moneyInput",children:[e.jsx("input",{type:"number",min:"1",max:"60",step:"1",defaultValue:((be=w.metadata)==null?void 0:be.post_completion_days)||7,id:`service-gallery-cleanup-${w.service_key}`}),e.jsx("span",{children:"روز"})]})]})','null');
fs.writeFileSync(bundle,js);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8').replace(/index-UIRefine-v655-r84.js\?v=[^"']+/g,'index-UIRefine-v655-r84.js?v=r1111');
 if(!html.includes('/photobridge-r1109-gallery-policy.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1109-gallery-policy.css?v=r1111">\n<script defer src="/photobridge-r1109-gallery-guide.js?v=r1111"></script>\n</head>');
 fs.writeFileSync(file,html);
}

// R1110: read-only gallery usage in the admin photographer directory.
let adminServer=fs.readFileSync('dist/api/server.js','utf8');
const usageAnchor="SELECT u.id,COALESCE(pp.studio_name,u.name) name,u.mobile,u.photographer_enabled active,";
if(!adminServer.includes('AS gallery_paid_total')){
 if(!adminServer.includes(usageAnchor))throw Error('Admin photographer usage anchor missing');
 adminServer=adminServer.replace(usageAnchor,usageAnchor+`
        (SELECT count(*)::int FROM photographer_client_galleries cg WHERE cg.owner_id=u.id) AS gallery_count,
        COALESCE((SELECT sum(gt.amount) FROM photographer_service_wallet_transactions gt WHERE gt.user_id=u.id AND gt.service_key='client_gallery' AND gt.kind='debit'),0)::bigint AS gallery_paid_total,`);
 fs.writeFileSync('dist/api/server.js',adminServer);
}
let adminJs=fs.readFileSync(bundle,'utf8');
const usageCell='e.jsxs("small",{children:[V(q.labs_count||0)," اتصال ثبت‌شده"]})';
if(!adminJs.includes('q.gallery_paid_total')){
 if(!adminJs.includes(usageCell))throw Error('Admin photographer usage cell missing');
 adminJs=adminJs.replace(usageCell,usageCell+',e.jsxs("small",{className:"pb1110GalleryUsage",children:[V(q.gallery_count||0)," گالری · پرداخت گالری: ",V(q.gallery_paid_total||0)," تومان"]})');
 fs.writeFileSync(bundle,adminJs);
}

let policyJs=fs.readFileSync(bundle,'utf8');
policyJs=policyJs.replace('className:"clientGalleryPolicyLine",children:[','className:"clientGalleryPolicyLine",children:E?[e.jsx("span",{children:"گالری‌های حساب ادمین محدودیت زمانی و حذف خودکار ندارند؛ حذف فقط به‌صورت دستی انجام می‌شود."})]:[');
fs.writeFileSync(bundle,policyJs);

// R1111: lifetime comes from the admin setting; no post-approval retention prose.
let lifetimeServer=fs.readFileSync('dist/api/server.js','utf8');
lifetimeServer=lifetimeServer.replace('function galleryLifetimeDays(service) {\n    return 30;\n}',`function galleryLifetimeDays(service) {
    const n = Math.round(Number(service?.metadata?.lifetime_days ?? 30));
    return Math.max(1, Math.min(180, Number.isFinite(n) ? n : 30));
}`);
fs.writeFileSync('dist/api/server.js',lifetimeServer);
let lifetimeJs=fs.readFileSync(bundle,'utf8');
lifetimeJs=lifetimeJs.replace('defaultValue:30,readOnly:!0,id:`service-gallery-life-${w.service_key}`','defaultValue:((fe=w.metadata)==null?void 0:fe.lifetime_days)||30,id:`service-gallery-life-${w.service_key}`');
lifetimeJs=lifetimeJs.replace(',e.jsx("span",{children:"برای نگهداری عکس‌ها، پیش از پایان مهلت گالری را تمدید کن؛ در غیر این صورت گالری خودکار حذف می‌شود."})','');
lifetimeJs=lifetimeJs.replace('عمر اولیه هر گالری ','طول عمر گالری ');
lifetimeJs=lifetimeJs.replace('e.jsx("p",{children:"گالری تا پایان مهلت ۳۰ روزه قابل استفاده است. تأیید نهایی مشتری این مهلت را تغییر نمی‌دهد؛ برای ادامه دسترسی، گالری را پیش از انقضا تمدید کن."})','null');
lifetimeJs=lifetimeJs.replace('عکس‌ها به‌صورت پیش‌نمایش کم‌حجم ذخیره می‌شوند. مهلت گالری ۳۰ روز است و تأیید مشتری آن را تغییر نمی‌دهد. تمدید، ۳۰ روز به مهلت گالری اضافه می‌کند.','عکس‌ها به‌صورت پیش‌نمایش کم‌حجم ذخیره می‌شوند. طول عمر گالری از عدد تعیین‌شده در این بخش گرفته می‌شود. تمدید، ۳۰ روز به مهلت گالری اضافه می‌کند.');
lifetimeJs=lifetimeJs.replace('L.cleanup_after?e.jsxs(e.Fragment,{children:["حذف پس از تکمیل: ",e.jsx("b",{children:vn(L.cleanup_after)})]}):L.expires_at?','L.expires_at?');
lifetimeJs=lifetimeJs.replace('l.cleanup_after?"حذف خودکار":"پایان مهلت گالری"','"پایان مهلت گالری"').replace('l.cleanup_after?vn(l.cleanup_after):l.expires_at?vn(l.expires_at):"—"','l.expires_at?vn(l.expires_at):"—"');
fs.writeFileSync(bundle,lifetimeJs);
