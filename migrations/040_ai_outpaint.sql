-- PhotoBridge v0.17.30 — AI reverse-crop / outpaint service

INSERT INTO platform_services(
  service_key,name,category,unit_label,unit_price,enabled,description,metadata,
  lab_enabled,customer_enabled,lab_token_price_per_1k,customer_token_price_per_1k,
  lab_token_price_low_per_1k,lab_token_price_medium_per_1k,lab_token_price_high_per_1k,
  customer_token_price_low_per_1k,customer_token_price_medium_per_1k,customer_token_price_high_per_1k
)
VALUES(
  'ai_outpaint','بزرگ کردن اطراف عکس','image','پردازش',0,true,
  'گسترش کادر عکس از بالا، پایین، چپ یا راست با حفظ بخش اصلی و بازسازی طبیعی فضای تازه.',
  '{"model":"gpt-image-2","mode":"outpaint","billing_mode":"token","quality_default":"low","editor":"reverse_crop","estimate_low_min_tokens":5000,"estimate_low_max_tokens":16000}'::jsonb,
  true,true,0,0,0,0,0,0,0,0
)
ON CONFLICT(service_key) DO UPDATE SET
  name=EXCLUDED.name,
  category=EXCLUDED.category,
  unit_label=EXCLUDED.unit_label,
  enabled=true,
  description=EXCLUDED.description,
  metadata=COALESCE(platform_services.metadata,'{}'::jsonb)||EXCLUDED.metadata,
  lab_enabled=true,
  customer_enabled=true,
  updated_at=now();

-- Start the new tool with the same token tariff as the existing quality-recovery tool
-- when the admin has already configured that service. Admin can change it independently later.
UPDATE platform_services target
SET
  lab_token_price_per_1k=CASE WHEN target.lab_token_price_per_1k=0 THEN source.lab_token_price_per_1k ELSE target.lab_token_price_per_1k END,
  customer_token_price_per_1k=CASE WHEN target.customer_token_price_per_1k=0 THEN source.customer_token_price_per_1k ELSE target.customer_token_price_per_1k END,
  lab_token_price_low_per_1k=CASE WHEN target.lab_token_price_low_per_1k=0 THEN source.lab_token_price_per_1k ELSE target.lab_token_price_low_per_1k END,
  lab_token_price_medium_per_1k=CASE WHEN target.lab_token_price_medium_per_1k=0 THEN source.lab_token_price_per_1k ELSE target.lab_token_price_medium_per_1k END,
  lab_token_price_high_per_1k=CASE WHEN target.lab_token_price_high_per_1k=0 THEN source.lab_token_price_per_1k ELSE target.lab_token_price_high_per_1k END,
  customer_token_price_low_per_1k=CASE WHEN target.customer_token_price_low_per_1k=0 THEN source.customer_token_price_per_1k ELSE target.customer_token_price_low_per_1k END,
  customer_token_price_medium_per_1k=CASE WHEN target.customer_token_price_medium_per_1k=0 THEN source.customer_token_price_per_1k ELSE target.customer_token_price_medium_per_1k END,
  customer_token_price_high_per_1k=CASE WHEN target.customer_token_price_high_per_1k=0 THEN source.customer_token_price_per_1k ELSE target.customer_token_price_high_per_1k END,
  updated_at=now()
FROM platform_services source
WHERE target.service_key='ai_outpaint' AND source.service_key='ai_identity_upscale';
