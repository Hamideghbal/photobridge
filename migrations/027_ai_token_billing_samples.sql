-- PhotoBridge v0.17.5 — token-based AI billing, usage accounting and admin before/after samples

ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS lab_token_price_per_1k bigint NOT NULL DEFAULT 0 CHECK (lab_token_price_per_1k >= 0);
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS customer_token_price_per_1k bigint NOT NULL DEFAULT 0 CHECK (customer_token_price_per_1k >= 0);

ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS billing_rate_per_1k bigint NOT NULL DEFAULT 0 CHECK (billing_rate_per_1k >= 0);
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS estimated_min_price bigint NOT NULL DEFAULT 0 CHECK (estimated_min_price >= 0);
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS estimated_max_price bigint NOT NULL DEFAULT 0 CHECK (estimated_max_price >= 0);
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS input_tokens bigint;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS input_text_tokens bigint;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS input_image_tokens bigint;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS output_tokens bigint;
ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS total_tokens bigint;

UPDATE platform_services
SET metadata=(COALESCE(metadata,'{}'::jsonb)-'input_fidelity')||'{"billing_mode":"token","estimate_min_tokens":5000,"estimate_max_tokens":30000,"image_model":"gpt-image-2"}'::jsonb
WHERE service_key IN ('ai_restore_colorize','ai_restore_damage','ai_identity_upscale');
