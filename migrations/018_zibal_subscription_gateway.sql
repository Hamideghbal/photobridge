-- PhotoBridge v0.16.0 — Zibal online payments for platform subscriptions

ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'receipt';
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_provider text;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_track_id text;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_order_id text;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_amount bigint;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_ref_number text;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_result integer;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_message text;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS gateway_callback_at timestamptz;

UPDATE subscription_renewals SET payment_method='receipt' WHERE payment_method IS NULL;

ALTER TABLE subscription_renewals DROP CONSTRAINT IF EXISTS subscription_renewals_status_check;
ALTER TABLE subscription_renewals ADD CONSTRAINT subscription_renewals_status_check
  CHECK (status IN ('uploading','pending','approved','rejected','payment_pending','payment_failed'));

ALTER TABLE subscription_renewals DROP CONSTRAINT IF EXISTS subscription_renewals_payment_method_check;
ALTER TABLE subscription_renewals ADD CONSTRAINT subscription_renewals_payment_method_check
  CHECK (payment_method IN ('receipt','zibal'));

CREATE UNIQUE INDEX IF NOT EXISTS subscription_renewals_gateway_track_uidx
  ON subscription_renewals(gateway_track_id) WHERE gateway_track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS subscription_renewals_gateway_order_idx
  ON subscription_renewals(gateway_order_id) WHERE gateway_order_id IS NOT NULL;
