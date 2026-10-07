-- PhotoBridge v0.17.4 — durable AI image jobs, admin studio and resumable processing

ALTER TABLE ai_image_jobs DROP CONSTRAINT IF EXISTS ai_image_jobs_owner_type_check;
ALTER TABLE ai_image_jobs ADD CONSTRAINT ai_image_jobs_owner_type_check CHECK (owner_type IN ('lab','customer','admin'));

ALTER TABLE ai_image_jobs DROP CONSTRAINT IF EXISTS ai_image_jobs_status_check;
ALTER TABLE ai_image_jobs ADD CONSTRAINT ai_image_jobs_status_check CHECK (status IN ('queued','processing','completed','failed'));

ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS input_object_key text;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS ai_image_jobs_pending_idx ON ai_image_jobs(status,created_at) WHERE status IN ('queued','processing');

UPDATE platform_services SET name='رنگی‌سازی طبیعی عکس سیاه‌وسفید',description='تبدیل واقعی عکس سیاه‌وسفید به رنگی طبیعی همراه با ترمیم ملایم، با قفل سخت هویت و فرم چهره.',metadata=COALESCE(metadata,'{}'::jsonb)||'{"prompt_version":"identity-v2","input_fidelity":"high"}'::jsonb WHERE service_key='ai_restore_colorize';
UPDATE platform_services SET name='بازسازی عکس آسیب‌دیده',description='ترمیم خط‌وخش، لکه، ترک، پارگی و آسیب‌های قدیمی با دست‌کاری حداقلی بخش‌های سالم و حفظ کامل هویت.',metadata=COALESCE(metadata,'{}'::jsonb)||'{"prompt_version":"identity-v2","input_fidelity":"high"}'::jsonb WHERE service_key='ai_restore_damage';
UPDATE platform_services SET name='افزایش کیفیت با قفل هویت',description='کاهش نویز و پیکسل‌شدگی و بهبود وضوح بدون ساختن اجزای تازه برای صورت، مو، لباس یا صحنه.',metadata=COALESCE(metadata,'{}'::jsonb)||'{"prompt_version":"identity-v2","input_fidelity":"high"}'::jsonb WHERE service_key='ai_identity_upscale';
