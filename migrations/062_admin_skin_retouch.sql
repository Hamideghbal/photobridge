-- PhotoBridge v0.17.168 — admin-only natural skin retouch pilot

INSERT INTO platform_services(
  service_key,name,category,unit_label,unit_price,enabled,description,metadata,
  lab_enabled,customer_enabled
)
VALUES(
  'ai_skin_retouch','روتوش طبیعی حرفه‌ای پوست','image','عکس',0,true,
  'روتوش طبیعی پوست با سه شدت آزمایشی؛ پاک‌سازی قوی لک‌ها، تیرگی و سایه‌های اضافه و صاف‌سازی حرفه‌ای پوست با حفظ منافذ ریز، حجم طبیعی صورت و هویت.',
  '{"model":"gpt-image-2","mode":"skin_retouch","admin_only":true,"prompt_version":"skin-retouch-v2"}'::jsonb,
  false,false
)
ON CONFLICT(service_key) DO UPDATE SET
  name=EXCLUDED.name,
  category=EXCLUDED.category,
  unit_label=EXCLUDED.unit_label,
  enabled=true,
  description=EXCLUDED.description,
  metadata=COALESCE(platform_services.metadata,'{}'::jsonb)||EXCLUDED.metadata,
  lab_enabled=false,
  customer_enabled=false,
  updated_at=now();
