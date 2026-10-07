-- PhotoBridge v860: direct Zibal payment for equipment-store subscriptions.
ALTER TABLE equipment_rental_subscription_renewals
  DROP CONSTRAINT IF EXISTS equipment_rental_subscription_renewals_status_check;
ALTER TABLE equipment_rental_subscription_renewals
  ADD CONSTRAINT equipment_rental_subscription_renewals_status_check
  CHECK (status IN ('pending','payment_pending','payment_failed','approved','rejected','cancelled'));
ALTER TABLE equipment_rental_subscription_renewals
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS gateway_provider text,
  ADD COLUMN IF NOT EXISTS gateway_order_id text,
  ADD COLUMN IF NOT EXISTS gateway_amount bigint,
  ADD COLUMN IF NOT EXISTS gateway_track_id text,
  ADD COLUMN IF NOT EXISTS gateway_ref_number text,
  ADD COLUMN IF NOT EXISTS gateway_result integer,
  ADD COLUMN IF NOT EXISTS gateway_message text,
  ADD COLUMN IF NOT EXISTS gateway_callback_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;
CREATE INDEX IF NOT EXISTS equipment_rental_subscription_renewals_gateway_track_idx
  ON equipment_rental_subscription_renewals(gateway_track_id) WHERE gateway_track_id IS NOT NULL;
