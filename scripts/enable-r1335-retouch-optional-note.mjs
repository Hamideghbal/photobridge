import fs from 'node:fs';
export function patch(s){
 const changes=[
 ['if(Ee==="changes"&&we.some(z=>!z.note))return window.pb1113GalleryNotice("برای هر عکس انتخاب‌شده، توضیح اصلاح را بنویس.");','if(Ee==="approve"&&E.size)return window.pb1113GalleryNotice("برای عکس‌های انتخاب‌شده، درخواست اصلاح را ارسال کن؛ برای تأیید نهایی، تیک اصلاح عکس‌ها را بردار.");'],
 ['حداقل یک عکس و توضیح اصلاح آن را ثبت کن.','حداقل یک عکس را برای اصلاح انتخاب کن.'],
 ['placeholder:"توضیح اصلاح همین عکس…"','placeholder:"توضیح اصلاح همین عکس (اختیاری)…"'],
 ['disabled:p||!ot.length,onClick:()=>pt("approve")','disabled:p||!ot.length||E.size>0,title:E.size?"عکس‌هایی برای اصلاح انتخاب شده‌اند؛ درخواست اصلاح را ارسال کن.":"تأیید نهایی نسخه‌های روتوش‌شده",onClick:()=>pt("approve")'],
 ['children:"ارسال درخواست اصلاح"}),e.jsx("button",{className:"primary"','children:"ارسال درخواست اصلاح"}),E.size>0&&e.jsx("small",{role:"status",children:"عکس‌هایی برای اصلاح انتخاب شده‌اند؛ برای ادامه، درخواست اصلاح را ارسال کن. تأیید نهایی پس از برداشتن تیک‌های اصلاح فعال می‌شود."}),e.jsx("button",{className:"primary"']
 ];
 for(const [a,b] of changes){if(s.includes(a))s=s.replace(a,b);else if(!s.includes(b))throw Error('R1335 missing target '+a.slice(0,70));}return s;
}
for(const file of ['dist/web/assets/index-UIRefine-v655-r84.js',...['desktop-ui','lab-desktop-ui'].map(x=>`dist/web/${x}/assets/index-UIRefine-v655-r84.js`)])if(fs.existsSync(file))fs.writeFileSync(file,patch(fs.readFileSync(file,'utf8')));
console.log('[R1335] Optional retouch notes and guarded final approval.');
