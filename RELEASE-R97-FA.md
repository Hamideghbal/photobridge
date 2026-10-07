# PhotoBridge v904 R97 — Desktop Web Auto Update

تاریخ: 2026-10-06
مبنا: PhotoBridge_v904R96_Lean_Web_Invite_External_Supply_Store_Chooser_Fix.zip

## هدف
بعد از Deploy نسخه وب روی سرور، برنامه‌های Windows فروشگاه و لابراتوار بتوانند هنگام اجرا آخرین Web/UI را از سرور دریافت و روی نسخه محلی خود اعمال کنند، بدون حذف دیتابیس/صف آفلاین.

## تغییرات

### 1) Manifest مستقل از ورود
- دو endpoint عمومی و فقط‌خواندنی برای Manifest دسکتاپ اضافه شد:
  - `/api/desktop-ui/store-manifest`
  - `/api/desktop-ui/lab-manifest`
- endpointهای قدیمی `/api/rental/desktop-ui-manifest` و `/api/lab/desktop-ui-manifest` نیز قبل از احراز هویت پاسخ داده می‌شوند تا نسخه‌های فعلی نصب‌شده بعد از Deploy R97 دوباره بتوانند UI وب را دریافت کنند.
- Manifest فقط نام فایل‌ها و SHA-256 فایل‌های عمومی سایت را برمی‌گرداند و اطلاعات حساب کاربری ندارد.
- این endpointها در Maintenance Mode هم برای updater قابل دسترس‌اند.

### 2) Updater جدید Windows
- بررسی UI دیگر به `shopId` یا `labId` وابسته نیست و قبل از Login هم انجام می‌شود.
- درخواست‌های Update به‌صورت anonymous انجام می‌شوند و به Cookie ذخیره‌شده وابسته نیستند.
- Timeout مرحله شروع از 25 ثانیه به مسیر کنترل‌شده‌تر افزایش یافت؛ دریافت Manifest حداکثر 15 ثانیه و دانلود فایل‌ها با timeout جداگانه انجام می‌شود.
- فایل‌ها قبل از فعال‌سازی با SHA-256 بررسی می‌شوند.
- پوشه ناقص `.partial` هرگز جای نسخه سالم را نمی‌گیرد.
- نسخه قبلی به‌عنوان rollback نگه داشته می‌شود و نسخه‌های قدیمی اضافی پاک می‌شوند.
- در صورت شکست load نسخه جدید، برنامه به آخرین UI سالم برمی‌گردد و build خراب quarantine می‌شود تا دوباره فعال نشود.
- زمان آخرین check/download/apply و خطای updater در `/desktop/status` قابل مشاهده است.

### 3) Hot Update فایل Desktop Overlay
- `desktop-overlay.js` فروشگاه و لابراتوار داخل Manifest سرور قرار گرفت.
- Store Desktop دیگر Overlay را اجباری از فایل Installer نمی‌خواند؛ نسخه دانلودشده اولویت دارد.
- اگر نسخه قدیمی برنامه Overlay را با فایل محلی overwrite کرده باشد، updater جدید همان build را نیز با hash کنترل و Overlay را repair می‌کند.
- بنابراین بعد از نصب یک نسخه R97+، تغییرات آینده Overlay هم همراه Deploy سایت قابل دریافت خواهند بود.

### 4) Build اتوماتیک Manifest
- `prepare-store-desktop-ui.mjs` و `prepare-lab-desktop-ui.mjs` deterministic شدند و ترتیب فایل‌ها ثابت است.
- هر Deploy در `liara-fast-build.mjs` Manifestهای Store/Lab را دوباره تولید می‌کند.
- Store UI R97: 520 فایل.
- Lab UI R97: 522 فایل.

### 5) نسخه Native بعدی
- Store Desktop: `1.0.2`
- Lab Desktop: `1.0.14`
- نصب Native جدید فقط یک بار برای قابلیت کامل «آپدیت قبل از Login + Overlay hot update + rollback» لازم است.
- با این حال endpoint قدیمی هم عمومی شده تا برنامه‌های نصب‌شده فعلی، در صورتی که شناسه محلی فروشگاه/لابراتوار را داشته باشند، بعد از Deploy R97 دوباره Web UI را دریافت کنند.

## کنترل کیفیت
- `node --check` برای server، main، host و ui-update هر دو برنامه پاس شد.
- Store Desktop tests: 21/21 پاس.
- Lab Desktop tests: 2/2 پاس.
- تست اختصاصی Hot Overlay پاس شد.
- تست repair Overlay یک build یکسان پس از updater قدیمی پاس شد.
- `liara-fast-build.mjs` اجرا و Manifestهای R97 ساخته شدند.
- `verify-lab-desktop-package.mjs` نسخه Lab Desktop 1.0.14 را تأیید کرد.

این نسخه migration جدید دیتابیس نیاز ندارد.
