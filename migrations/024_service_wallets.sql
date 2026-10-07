-- PhotoBridge v0.17.2 — generic paid-services wallet, SMS charging and future image services

CREATE TABLE IF NOT EXISTS platform_services (
  service_key text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  unit_label text NOT NULL DEFAULT 'بار استفاده',
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  enabled boolean NOT NULL DEFAULT true,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_services(service_key,name,category,unit_label,unit_price,enabled,description)
VALUES
  ('sms_customer_notification','پیامک عملیاتی مشتری','sms','پیامک',0,true,'پیامک‌هایی که لابراتوار برای آماده‌شدن یا تکمیل سفارش به مشتری و عکاس می‌فرستد.'),
  ('image_enhancement','افزایش کیفیت و ترمیم عکس','image','عکس',0,false,'زیرساخت تعرفه و کیف پول آماده است؛ اجرای واقعی بعد از اتصال API پردازش تصویر فعال می‌شود.')
ON CONFLICT(service_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS lab_service_wallets (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO lab_service_wallets(lab_id,balance)
SELECT id,0 FROM labs
ON CONFLICT(lab_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS lab_service_prices (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  service_key text NOT NULL REFERENCES platform_services(service_key) ON DELETE CASCADE,
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lab_id,service_key)
);

CREATE TABLE IF NOT EXISTS service_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS service_wallet_transactions_lab_idx ON service_wallet_transactions(lab_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS service_wallet_transactions_ref_key_uidx ON service_wallet_transactions(lab_id,reference_key) WHERE reference_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS service_wallet_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'manual' CHECK (method IN ('manual','zibal','admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  note text,
  admin_note text,
  submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_wallet_topups_status_idx ON service_wallet_topups(status,submitted_at DESC);
CREATE INDEX IF NOT EXISTS service_wallet_topups_lab_idx ON service_wallet_topups(lab_id,submitted_at DESC);
