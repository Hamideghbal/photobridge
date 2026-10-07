-- PhotoBridge v0.17.627 — rental approval workflow + dedicated SMS wallet

ALTER TABLE equipment_rental_bookings DROP CONSTRAINT IF EXISTS equipment_rental_bookings_status_check;
ALTER TABLE equipment_rental_bookings
  ADD CONSTRAINT equipment_rental_bookings_status_check
  CHECK (status IN ('pending_approval','reserved','rejected','picked_up','returned','cancelled'));

CREATE TABLE IF NOT EXISTS equipment_rental_sms_wallets (
  shop_id uuid PRIMARY KEY REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO equipment_rental_sms_wallets(shop_id,balance)
SELECT id,0 FROM equipment_rental_shops
ON CONFLICT(shop_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS equipment_rental_sms_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS equipment_rental_sms_wallet_tx_shop_idx
  ON equipment_rental_sms_wallet_transactions(shop_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_rental_sms_wallet_tx_ref_uidx
  ON equipment_rental_sms_wallet_transactions(shop_id,reference_key)
  WHERE reference_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS equipment_rental_sms_settings (
  shop_id uuid PRIMARY KEY REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  booking_approved_enabled boolean NOT NULL DEFAULT true,
  invite_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO equipment_rental_sms_settings(shop_id)
SELECT id FROM equipment_rental_shops
ON CONFLICT(shop_id) DO NOTHING;

ALTER TABLE service_wallet_gateway_payments DROP CONSTRAINT IF EXISTS service_wallet_gateway_payments_owner_type_check;
ALTER TABLE service_wallet_gateway_payments
  ADD CONSTRAINT service_wallet_gateway_payments_owner_type_check
  CHECK (owner_type IN ('lab','customer','rental_shop'));
