-- PhotoBridge v0.17.3 — direct service-wallet charging, photographer wallets and AI image studio

ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS lab_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE platform_services ADD COLUMN IF NOT EXISTS customer_enabled boolean NOT NULL DEFAULT false;

UPDATE platform_services SET lab_enabled=true,customer_enabled=false WHERE service_key='sms_customer_notification';
UPDATE platform_services SET enabled=false,lab_enabled=false,customer_enabled=false WHERE service_key='image_enhancement';

INSERT INTO platform_services(service_key,name,category,unit_label,unit_price,enabled,description,metadata,lab_enabled,customer_enabled)
VALUES
 ('ai_restore_colorize','ترمیم و رنگی‌سازی عکس قدیمی','image','عکس',0,true,'ترمیم عکس قدیمی یا سیاه‌وسفید و رنگی‌سازی طبیعی با تأکید سخت بر حفظ هویت و اجزای چهره.',jsonb_build_object('model','gpt-image-2','mode','restore_colorize'),true,true),
 ('ai_restore_damage','بازسازی عکس آسیب‌دیده','image','عکس',0,true,'رفع خط‌وخش، لکه، پارگی و خرابی‌های قدیمی بدون جوان‌سازی یا تغییر فرم چهره.',jsonb_build_object('model','gpt-image-2','mode','restore_damage'),true,true),
 ('ai_identity_upscale','افزایش کیفیت با حفظ چهره','image','عکس',0,true,'افزایش وضوح و کیفیت عکس کم‌کیفیت با ممنوعیت تغییر چشم، بینی، دهان، گوش، فک، مو و تناسبات چهره.',jsonb_build_object('model','gpt-image-2','mode','identity_upscale'),true,true)
ON CONFLICT(service_key) DO UPDATE SET
 name=EXCLUDED.name,category=EXCLUDED.category,unit_label=EXCLUDED.unit_label,
 description=EXCLUDED.description,metadata=EXCLUDED.metadata,
 lab_enabled=EXCLUDED.lab_enabled,customer_enabled=EXCLUDED.customer_enabled;

CREATE TABLE IF NOT EXISTS photographer_service_wallets (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photographer_service_prices (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_key text NOT NULL REFERENCES platform_services(service_key) ON DELETE CASCADE,
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,service_key)
);

CREATE TABLE IF NOT EXISTS photographer_service_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_key text REFERENCES platform_services(service_key) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('credit','debit','refund','adjustment')),
  amount bigint NOT NULL CHECK (amount > 0),
  balance_after bigint NOT NULL CHECK (balance_after >= 0),
  reference_type text,
  reference_id text,
  reference_key text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_wallet_tx_user_idx ON photographer_service_wallet_transactions(user_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS photographer_wallet_tx_ref_key_uidx ON photographer_service_wallet_transactions(user_id,reference_key) WHERE reference_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS service_wallet_gateway_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('lab','customer')),
  owner_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  provider text NOT NULL DEFAULT 'zibal',
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending','paid','payment_failed')),
  gateway_track_id text,
  gateway_amount bigint,
  gateway_ref_number text,
  gateway_result integer,
  gateway_message text,
  callback_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS service_wallet_gateway_track_uidx ON service_wallet_gateway_payments(gateway_track_id) WHERE gateway_track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS service_wallet_gateway_owner_idx ON service_wallet_gateway_payments(owner_type,owner_id,created_at DESC);

CREATE TABLE IF NOT EXISTS ai_image_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('lab','customer')),
  owner_id uuid NOT NULL,
  lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  service_key text NOT NULL REFERENCES platform_services(service_key),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
  price bigint NOT NULL DEFAULT 0,
  input_name text,
  input_content_type text,
  output_object_key text,
  output_content_type text,
  prompt_version text,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS ai_image_jobs_owner_idx ON ai_image_jobs(owner_type,owner_id,created_at DESC);
