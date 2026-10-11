import fs from 'node:fs';
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes("from './gallery-trial.js'")){
 const replace=(old,next)=>{if(!server.includes(old))throw Error('R1108 gallery server anchor missing: '+old.slice(0,100));server=server.replace(old,next)};
 server="import { galleryCreationOffer, recordGalleryTrial } from './gallery-trial.js';\n"+server;
 replace('const w = await c.query(`SELECT balance FROM photographer_service_wallets WHERE user_id=$1`, [userId]);\n        const balance = Number(w.rows[0]?.balance || 0), unlimited = await isUnlimitedAdminPhotographer(userId), fee = unlimited ? 0 : Math.max(0, Math.round(Number(service.effective_price || 0)));',
 `const unlimited = await isUnlimitedAdminPhotographer(userId), standardFee = unlimited ? 0 : Math.max(0, Math.round(Number(service.effective_price || 0)));
        const offer = await galleryCreationOffer(c, userId, {unlimited, standardFee});
        const {balance, fee, freeGalleriesRemaining, freeGalleryLimit} = offer;`);
 replace('renewalFee: fee, renewalDays: 30', 'renewalFee: standardFee, freeGalleriesRemaining, freeGalleryLimit, renewalDays: 30');
 replace('const fee = unlimited ? 0 : Math.max(0, Math.round(Number(service.effective_price || 0))), photoLimit = galleryServiceMaxPhotos(service), lifetimeDays = galleryLifetimeDays(service), postCompletionDays = galleryPostCompletionDays(service);',
 `const offer = await galleryCreationOffer(c, a.userId, {unlimited, standardFee: Math.max(0, Math.round(Number(service.effective_price || 0))), lock: true});
                const fee = offer.fee, photoLimit = galleryServiceMaxPhotos(service), lifetimeDays = galleryLifetimeDays(service), postCompletionDays = galleryPostCompletionDays(service);`);
 replace('const gallery = q.rows[0];\n                await c.query(`INSERT INTO photographer_gallery_print_tariff_states', 'const gallery = q.rows[0];\n                if (offer.trial) await recordGalleryTrial(c, a.userId, labId, gallery.id);\n                await c.query(`INSERT INTO photographer_gallery_print_tariff_states');
 fs.writeFileSync('dist/api/server.js',server);
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(bundle,'utf8');
const replace=(old,next)=>{if(js.includes(next))return;if(!js.includes(old))throw Error('R1108 gallery UI anchor missing');js=js.replace(old,next)};
replace('children:"برای هر مشتری یک گالری خصوصی بساز؛ انتخاب، پیش‌فاکتور و تأیید نهایی را یک‌جا مدیریت کن."',
 'children:"گالری، فضای خصوصی عکس‌های هر مشتری است. عکس‌ها را بارگذاری کن و لینک گالری و رمز ورود را برای مشتری بفرست تا از موبایل یا کامپیوتر عکس‌های دلخواهش را انتخاب کند. در صورت فعال‌کردن سفارش، مشتری می‌تواند چاپ یا فایل دیجیتال را با تعرفه‌های خودت درخواست کند. پیش‌فاکتور، نسخه روتوش‌شده و تأیید نهایی مشتری را در همان گالری پیگیری کن؛ بدون رفت‌وبرگشت فایل‌ها در پیام‌رسان. برای شروع، ساخت سه گالری اول هر حساب رایگان است؛ تمدید گالری تعرفه جداگانه دارد."');
replace('children:"＋ گالری جدید"})]}),e.jsx("div",{className:"clientGalleryCards"', 'children:"＋ گالری جدید"+(Number(k.freeGalleriesRemaining)>0?" · "+V(k.freeGalleriesRemaining)+" رایگان باقی‌مانده":"")})]}),e.jsx("div",{className:"clientGalleryCards"');
replace('E?"ساخت گالری":"ساخت گالری و کسر از کیف پول"','E?"ساخت گالری":C===0?"ساخت گالری رایگان":"ساخت گالری و کسر از کیف پول"');
fs.writeFileSync(bundle,js);
const chrome='dist/web/photobridge-v904r100f41-header-date-name-fit.js';let ch=fs.readFileSync(chrome,'utf8');ch=ch.replace("src(n,'＋ گالری جدید',false)","src(n,n.textContent||'＋ گالری جدید',false)");fs.writeFileSync(chrome,ch);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8').replace(/photobridge-v904r100f41-header-date-name-fit.js\?v=[^"']+/g,'photobridge-v904r100f41-header-date-name-fit.js?v=r1108');
 html=html.replace(/index-UIRefine-v655-r84.js\?v=[^"']+/g,'index-UIRefine-v655-r84.js?v=r1108');
 if(!html.includes('/photobridge-r1108-gallery-readability.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1108-gallery-readability.css?v=r1108">\n</head>');
 fs.writeFileSync(file,html);
}
