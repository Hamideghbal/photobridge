-- PhotoBridge v0.17.15
-- Paid per-gallery client selection, protected previews and gallery quota.

INSERT INTO platform_services(service_key,name,category,unit_label,unit_price,enabled,description,metadata,lab_enabled,customer_enabled)
VALUES (
  'client_gallery',
  'گالری خصوصی مشتری',
  'gallery',
  'گالری',
  0,
  true,
  'ساخت یک گالری خصوصی برای نمایش عکس و ویدیو، انتخاب عکس مشتری و ثبت سفارش. مبلغ هنگام ساخت گالری از کیف پول عکاس کم می‌شود.',
  jsonb_build_object('max_photos',100,'preview_max_edge',1600,'preview_quality',70),
  false,
  true
)
ON CONFLICT(service_key) DO UPDATE SET
  name=EXCLUDED.name,
  category=EXCLUDED.category,
  unit_label=EXCLUDED.unit_label,
  description=EXCLUDED.description,
  lab_enabled=false,
  customer_enabled=true,
  metadata=COALESCE(platform_services.metadata,'{}'::jsonb)
    || jsonb_build_object(
      'max_photos', COALESCE((platform_services.metadata->>'max_photos')::int,100),
      'preview_max_edge', COALESCE((platform_services.metadata->>'preview_max_edge')::int,1600),
      'preview_quality', COALESCE((platform_services.metadata->>'preview_quality')::int,70)
    );

ALTER TABLE photographer_client_galleries
  ADD COLUMN IF NOT EXISTS photo_limit integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS creation_fee bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS watermark_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS watermark_text text;

DO $$ BEGIN
  ALTER TABLE photographer_client_galleries
    ADD CONSTRAINT photographer_client_galleries_photo_limit_check CHECK (photo_limit BETWEEN 1 AND 5000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE photographer_client_galleries
SET photo_limit = GREATEST(1, LEAST(5000, COALESCE(photo_limit,100))),
    creation_fee = GREATEST(0, COALESCE(creation_fee,0));
