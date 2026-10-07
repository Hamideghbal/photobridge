-- PhotoBridge v0.17.283
-- Public AI: three clear consumer tiers with explicit delivery policy.

UPDATE public_ai_plans
SET title='روتوش اقتصادی',
    description='روتوش طبیعی با قیمت اقتصادی؛ خروجی استاندارد تا 1024px برای استفاده روزمره و آنلاین.',
    metadata=COALESCE(metadata,'{}'::jsonb) || '{"publicTier":"economy","deliveryPreset":"web_1024","deliveryLabel":"خروجی استاندارد 1024px","retouchLevel":"gentle","retouchResolutionPreset":"default","quality":"low"}'::jsonb,
    sort_order=10,
    updated_at=now()
WHERE id='skin-light';

UPDATE public_ai_plans
SET title='روتوش حرفه‌ای',
    description='روتوش قوی‌تر با حفظ ابعاد و رزولوشن اصلی عکس؛ مناسب چاپ و استفاده حرفه‌ای.',
    metadata=COALESCE(metadata,'{}'::jsonb) || '{"publicTier":"professional","deliveryPreset":"original","deliveryLabel":"ابعاد و رزولوشن اصلی","recommended":true,"retouchLevel":"standard","retouchResolutionPreset":"default","quality":"low"}'::jsonb,
    sort_order=20,
    updated_at=now()
WHERE id='skin-strong';

UPDATE public_ai_plans
SET title='روتوش + افزایش کیفیت 2K',
    description='روتوش طبیعی همراه با پردازش کیفیت بالاتر و تحویل تا 2K؛ فایل‌های بزرگ‌تر از 2K کوچک نمی‌شوند.',
    metadata=COALESCE(metadata,'{}'::jsonb) || '{"publicTier":"enhanced","deliveryPreset":"enhanced_2k","deliveryLabel":"افزایش کیفیت تا 2K","retouchLevel":"gentle","retouchResolutionPreset":"low_2k","quality":"medium"}'::jsonb,
    sort_order=30,
    updated_at=now()
WHERE id='skin-2k';
