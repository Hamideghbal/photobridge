# فاز ۲: نتیجهٔ ممیزی و آزمون واقعی multipart در Liara

## وضعیت

**پیاده‌سازی و انتشار فاز ۲ انجام نشده است.** پیش‌شرط صریح این مأموریت، تأیید عملی سازگاری multipart پیش از پیاده‌سازی است. آزمون‌های واقعی اکنون اجرا شده‌اند، اما خواندن قطعات و توقف نشست‌ها با `403 AccessDenied` مسدود است. نتیجه، اثبات عدم پشتیبانی Liara نیست؛ علت مجوز/محدودیت سرویس باید مشخص شود.

شاخه: `feature/phase2-durable-multipart-upload`، مبنا: `ce563ff4fcb107a7f608a908b44c69b9f80d2445` در `aaa-liara-release`.
PR #865 و تغییرات R1852 بازنویسی، ادغام یا منتشر نشده‌اند.

## یافته‌های مسیر فعلی چاپ

- `/api/customer/uploads/presign` برای هر فراخوانی یک فایل تازه ایجاد و URL مربوط به PUT کامل می‌دهد؛ نشست multipart پایدار وجود ندارد.
- `scripts/enable-r1587-print-upload-pool.mjs` سه فایل کامل را هم‌زمان ارسال می‌کند، نه قطعات قابل ادامهٔ یک فایل.
- wrapper انتقال در R1850 کل PUT را تکرار می‌کند؛ `UploadId` و دفتر قطعات ندارد.
- catch ارسال چاپ، حتی پس از خطای شبکه، DELETE پیش‌نویس سفارش را صدا می‌زند. این رفتار با ادامهٔ قطعات ناسازگار است.
- کش IndexedDB (`Cy`/`Py`) Blob ذخیره می‌کند، ولی نبود یک Blob یا خطای خواندن می‌تواند بازیابی را `null` کند؛ رکورد مستقلِ نیازمند بازانتخاب وجود ندارد.
- HEAD و اندازه در تأیید فعلی بررسی می‌شوند؛ تأیید manifest و checksum قطعات وجود ندارد.
- ساخت draft کلید idempotency پایدار ندارد؛ تکرار submit نیز پاسخ موفق قبلی را بازپخش نمی‌کند.
- جداول پایش R1851 دفتر مالکیت‌دار نشست/قطعات نیستند. طرح جدید به persistence افزایشی مستقل نیاز دارد؛ migration و تغییر تضمین‌های یکپارچگی داده مشمول بررسی `AGENTS.md` است.

## شواهد واقعی سرویس

کاربر چهار Secret مخصوص qualification را در GitHub تنظیم کرد و تأیید کرد همهٔ باکت‌ها در دسترسی کلید انتخاب شده‌اند. Secretها در خروجی چاپ نشده‌اند. آزمون‌ها در باکت مجاز `kinderphoto-storage` و فقط زیر `photobridge-compatibility-probes/` اجرا شدند؛ هیچ عکس مشتری خوانده، تغییر یا حذف نشد.

| عملیات | نتیجه |
|---|---|
| CreateMultipartUpload | موفق |
| PUT مستقیم یک قطعهٔ ۵ MiB به URL امضاشده | موفق |
| رد قطعه با Content-MD5 ناسازگار | درخواست رد شد؛ qualification کامل checksum هنوز نهایی نیست |
| preflight مرورگر برای PUT و content-md5 | ۲۰۴، origin درست و header مجاز |
| ListObjectsV2 در فضای آزمایش | ۲۰۰، در هر دو قالب path/virtual و SDK/presigned |
| ListMultipartUploads در فضای آزمایش | ۴۰۳ AccessDenied، در هر چهار ترکیب |
| ListParts روی نشست خالی آزمایشی | ۴۰۳ AccessDenied، در هشت ترکیب شامل حذف x-id |
| AbortMultipartUpload روی همان نشست خالی | ۴۰۳ AccessDenied، در چهار ترکیب |
| CompleteMultipartUpload، HEAD نهایی و تطبیق بایت‌ها | به علت شکست پیش‌شرط ListParts اجرا و تأیید نشده |
| سناریوهای بازیابی A تا R | پیاده‌سازی نشده؛ ادعای قبولی وجود ندارد |

آزمون مستقل با Python boto3 1.40.74 نیز روی همان نشست خالی انجام شد، بدون ایجاد آپلود تازه: در regionهای `default` و `us-east-1` و هر دو قالب path/virtual، خواندن فهرست فایل‌های عادی ۲۰۰ و ListParts همواره ۴۰۳ بود. بنابراین مشکل صرفاً SDK جاوااسکریپت کمتر محتمل است؛ علت قطعی میان مجوز اختصاصی multipart، سیاست باکت/سرویس و محدودیت provider هنوز مشخص نیست.

[نتیجهٔ آزمون مستقل پایتون](https://github.com/Hamideghbal/photobridge/actions/runs/43639393529). Request ID نمونه: `18E8046720538B07`.

شناسهٔ درخواست نمونهٔ ListParts: `18E8037E63BDA025`؛ Abort: `18E803800C4B0C97`.
Endpoint: `storage.c2.liara.site`؛ region: `default`.

اجراها:
- [آزمون انتقال واقعی، شکست روی ListParts](https://github.com/Hamideghbal/photobridge/actions/runs/43637277032)
- [مقایسهٔ خواندن عادی و فهرست multipart](https://github.com/Hamideghbal/photobridge/actions/runs/43637748053)
- [مقایسهٔ هشت قالب ListParts روی نشست خالی](https://github.com/Hamideghbal/photobridge/actions/runs/43637908365)

سبزبودن jobهای diagnostic فقط به معنی اتمام جمع‌آوری شواهد است؛ **به معنی قبولی multipart نیست**. نتایج تک‌تک عملیات در artifact خصوصی ذخیره شده‌اند.

### باقی‌ماندهٔ آزمون

توقف نشست آزمایشی نیز ۴۰۳ می‌گیرد؛ یک قطعهٔ تصادفی ۵ MiB از آزمون انتقال و یک نشست آزمایشی خالی هنوز پاک‌سازیِ تأییدشده ندارند. اطلاعات نشست خالی در artifact خصوصی `liara-empty-probe-recovery.json` نگه‌داری شده است. پس از رفع دسترسی، صرفاً همین داده‌های آزمایشی باید پاک شوند؛ پاک‌سازی سراسری یا حذف قطعات مشتری مجاز نیست. آزمون نوشتنی دیگری نباید تا رفع مانع اجرا شود.

## ادامه پس از رفع مانع

1. تأیید ListParts و Abort، سپس تکمیل، HEAD، checksum و تطبیق بایت‌های نمونهٔ واقعی؛ ETag باید opaque تلقی شود.
2. نشست/manifest مالکیت‌دار در PostgreSQL، کلیدهای یکتا، قفل نهایی‌سازی و reconciliation میان storage و DB؛ هیچ فرضی دربارهٔ تراکنش توزیع‌شده مجاز نیست.
3. UploadManager مستقل از React با IndexedDB و bytes پایدار/handle، worker برای hash، قفل بین tabها و بازانتخاب همان فایل در صورت eviction.
4. فقط قطعاتِ مفقود طبق storage مجدداً ارسال شوند؛ نتیجهٔ مبهم موجب MPU تازه یا حذف draft نشود.
5. سه قطعهٔ هم‌زمان، backoff و jitter، تازه‌سازی URL، retry زمان‌بندی‌شده و stateهای صریح هر فایل؛ ۱۰۰٪ فقط پس از verification.
6. حفظ naming، copy quantity، addon/model snapshots، crop، مسیر JPEG/HEIC، invoice، download، album، Windows و PWA؛ R1852 بازنویسی نشود.
7. آزمون‌های A تا R، مرورگر واقعی و restart، شمارش بایت‌های دوباره‌ارسال‌شده و یکتایی هم‌زمان DB؛ سپس production build و regressionها.
8. migration افزایشی و rollback/backward compatibility باید آماده و بررسی شوند. ادغام/استقرار خودکار پیش از تأییدهای مقرر انجام نشود.

## بررسی مبنا

`npm run build` با Node 22.23.3 موفق شد. `npm run verify:full` روی مبنای بدون تغییر فاز ۲، در checksum فایل `account-recovery.html` از بستهٔ ثابت لابراتوار شکست خورد. این مشکل در این شاخه اصلاح نشده تا با کار جداگانهٔ R1852 تداخل نکند.

فایل‌های ابزار در `tools/qualification` و workflow در `.github` خارج از allowlist تصویر Docker هستند؛ runtime، schema و `DEPLOY_REVISION.txt` تغییر نکرده‌اند.
