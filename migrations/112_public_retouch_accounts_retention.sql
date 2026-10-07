-- PhotoBridge v0.17.583 — shared public/photographer retouch core, public retouch accounts, SMS-only delivery, physical output retention

ALTER TABLE public_ai_orders
  ALTER COLUMN contact_email DROP NOT NULL;

ALTER TABLE public_ai_orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS public_ai_orders_user_idx
  ON public_ai_orders(user_id, created_at DESC);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS public_retouch_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_retouch_joined_at timestamptz;

ALTER TABLE ai_image_jobs
  ADD COLUMN IF NOT EXISTS output_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS output_deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS ai_image_jobs_retouch_expiry_idx
  ON ai_image_jobs(output_expires_at)
  WHERE service_key='ai_skin_retouch' AND status='completed' AND output_deleted_at IS NULL;

INSERT INTO platform_settings(key,value,updated_at)
VALUES('retouch_output_retention_days','{"days":3}'::jsonb,now())
ON CONFLICT(key) DO NOTHING;
