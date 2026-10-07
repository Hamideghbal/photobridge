-- PhotoBridge v0.17.6 — selectable Low / Medium / High AI quality with per-tier token tariffs

ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS lab_token_price_low_per_1k bigint NOT NULL DEFAULT 0 CHECK (lab_token_price_low_per_1k >= 0);
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS lab_token_price_medium_per_1k bigint NOT NULL DEFAULT 0 CHECK (lab_token_price_medium_per_1k >= 0);
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS lab_token_price_high_per_1k bigint NOT NULL DEFAULT 0 CHECK (lab_token_price_high_per_1k >= 0);
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS customer_token_price_low_per_1k bigint NOT NULL DEFAULT 0 CHECK (customer_token_price_low_per_1k >= 0);
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS customer_token_price_medium_per_1k bigint NOT NULL DEFAULT 0 CHECK (customer_token_price_medium_per_1k >= 0);
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS customer_token_price_high_per_1k bigint NOT NULL DEFAULT 0 CHECK (customer_token_price_high_per_1k >= 0);

-- Preserve any tariff already configured in v0.17.5 as the starting value for all three tiers.
UPDATE platform_services
SET lab_token_price_low_per_1k=lab_token_price_per_1k,
    lab_token_price_medium_per_1k=lab_token_price_per_1k,
    lab_token_price_high_per_1k=lab_token_price_per_1k,
    customer_token_price_low_per_1k=customer_token_price_per_1k,
    customer_token_price_medium_per_1k=customer_token_price_per_1k,
    customer_token_price_high_per_1k=customer_token_price_per_1k,
    metadata=COALESCE(metadata,'{}'::jsonb)||'{"quality_default":"medium","estimate_low_min_tokens":5000,"estimate_low_max_tokens":12000,"estimate_medium_min_tokens":5000,"estimate_medium_max_tokens":18000,"estimate_high_min_tokens":5000,"estimate_high_max_tokens":30000}'::jsonb
WHERE service_key IN ('ai_restore_colorize','ai_restore_damage','ai_identity_upscale');

ALTER TABLE ai_image_jobs ADD COLUMN IF NOT EXISTS quality text NOT NULL DEFAULT 'high';
ALTER TABLE ai_image_jobs DROP CONSTRAINT IF EXISTS ai_image_jobs_quality_check;
ALTER TABLE ai_image_jobs ADD CONSTRAINT ai_image_jobs_quality_check CHECK (quality IN ('low','medium','high'));
ALTER TABLE ai_image_jobs ALTER COLUMN quality SET DEFAULT 'medium';
