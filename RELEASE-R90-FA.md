# PhotoBridge v904 R90

- رفع قطعی عدم نمایش فیلدهای اجباری دعوت فروشگاه در لینک‌های قدیمی.
- خواندن تنظیمات فیلدهای عضویت در همان Query اصلی دعوت؛ حذف وابستگی به Query کوتاه ۹۰۰ms.
- تشخیص صحیح requiredFields قدیمی/خالی و fallback به تنظیمات فروشگاه.
- public invite اکنون signupContext شامل فیلدهای لازم را از همان ابتدا می‌دهد.
- پاسخ membership_profile_required شامل requiredFields و missingFields کامل است.
- UI علاوه بر fields، requiredFields/missingFields را هم می‌فهمد و فیلدها را فوراً نمایش می‌دهد.
- اصلاحات R89 شامل QR تجهیزات و اسکن تحویل/برگشت حفظ شده‌اند.
