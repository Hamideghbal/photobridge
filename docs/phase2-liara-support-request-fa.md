موضوع: خطای 403 در عملیات multipart با وجود دسترسی کلید به باکت

سلام. در باکت kinderphoto-storage روی endpoint ‏storage.c2.liara.site، با region=default و کلیدی که باکت‌ها برایش انتخاب شده‌اند:

- CreateMultipartUpload و UploadPart امضاشده موفق‌اند.
- ListObjectsV2 با SDK و URL امضاشده پاسخ 200 می‌دهد.
- ListParts، ListMultipartUploads و AbortMultipartUpload پاسخ 403 AccessDenied می‌دهند.
- درخواست‌ها با AWS SDK JS v3.536.0، هر دو قالب path-style و virtual-hosted، امضای عادی و presigned، با و بدون پارامتر x-id بررسی شده‌اند.

همین نتیجه با Python boto3 1.40.74 نیز روی همان نشست، در regionهای default و us-east-1 و هر دو قالب اتصال تکرار شده است؛ فهرست عادی 200 و ListParts برابر 403 است. هدف، مشخص‌شدن علت مجوز/تنظیم/محدودیت است، نه فرض قطعی عدم پشتیبانی سرویس.

نمونه Request ID مستقل Python: 18E8046720538B07

نمونه Request ID مربوط به ListParts: 18E8037E63BDA025
نمونه Request ID مربوط به Abort: 18E803800C4B0C97
زمان آزمون: 2026-11-14 حدود 20:31:43 UTC

برای پیاده‌سازی آپلود قابل ادامه، باید قطعات موجود واقعاً از storage خوانده و تأیید شوند. لطفاً مشخص کنید آیا این عملیات روی این سرویس پشتیبانی می‌شوند و دقیقاً چه تنظیم یا مجوزی برای رفع 403 لازم است. همچنین پس از رفع مجوز، باید امکان Abort صرفاً نشست‌های آزمایشی خودمان زیر photobridge-compatibility-probes/ فراهم شود؛ هیچ تغییری روی فایل‌های مشتریان درخواست نمی‌شود.

هیچ Access Key، Secret Key یا URL امضاشده‌ای در این تیکت درج نشده است.
