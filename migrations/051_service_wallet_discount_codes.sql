-- PhotoBridge v0.17.68 — percentage discount codes for service-wallet online top-ups

CREATE TABLE IF NOT EXISTS service_wallet_discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent numeric(5,2) NOT NULL CHECK (percent > 0 AND percent <= 100),
  audience text NOT NULL DEFAULT 'both' CHECK (audience IN ('lab','customer','both')),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS service_wallet_discount_codes_code_upper_uidx
  ON service_wallet_discount_codes(upper(code));

ALTER TABLE service_wallet_gateway_payments ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES service_wallet_discount_codes(id) ON DELETE SET NULL;
ALTER TABLE service_wallet_gateway_payments ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE service_wallet_gateway_payments ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2);
ALTER TABLE service_wallet_gateway_payments ADD COLUMN IF NOT EXISTS discount_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE service_wallet_gateway_payments ADD COLUMN IF NOT EXISTS payable_amount bigint;
UPDATE service_wallet_gateway_payments SET payable_amount=amount WHERE payable_amount IS NULL;
