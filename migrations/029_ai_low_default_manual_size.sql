-- PhotoBridge v0.17.8 — Low as the default AI quality + explicit manual output size

ALTER TABLE ai_image_jobs
  ADD COLUMN IF NOT EXISTS requested_size text;

ALTER TABLE ai_image_jobs
  DROP CONSTRAINT IF EXISTS ai_image_jobs_requested_size_check;

ALTER TABLE ai_image_jobs
  ADD CONSTRAINT ai_image_jobs_requested_size_check
  CHECK (requested_size IS NULL OR requested_size IN ('1024x1024','1536x1024','1024x1536'));

ALTER TABLE ai_image_jobs
  ALTER COLUMN quality SET DEFAULT 'low';

UPDATE platform_services
SET metadata=COALESCE(metadata,'{}'::jsonb)||'{"quality_default":"low","size_default":"1024x1536"}'::jsonb,
    updated_at=now()
WHERE service_key IN ('ai_restore_colorize','ai_restore_damage','ai_identity_upscale');
