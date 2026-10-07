-- PhotoBridge v727 — rental member terms, Sofia private test store, discounts and prepaid checkout
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS private_admin_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_required_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS birthday_discount_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS birthday_discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS birthday_discount_days_before integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS birthday_discount_days_after integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS birthday_sms_enabled boolean NOT NULL DEFAULT false;

UPDATE equipment_rental_shops SET private_admin_only=true
WHERE private_admin_only=false AND (lower(coalesce(name,''))='sofia' OR lower(coalesce(slug,''))='sofia' OR lower(coalesce(slug,'')) LIKE '%sofia%' OR (name ILIKE '%صوفیا%' OR name ILIKE '%سوفیا%'));

ALTER TABLE equipment_rental_shop_memberships
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'ledger',
  ADD COLUMN IF NOT EXISTS permanent_discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS birth_jalali text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS birth_certificate_no text,
  ADD COLUMN IF NOT EXISTS business_license_no text;

ALTER TABLE equipment_rental_bookings DROP CONSTRAINT IF EXISTS equipment_rental_bookings_status_check;
ALTER TABLE equipment_rental_bookings ADD CONSTRAINT equipment_rental_bookings_status_check
  CHECK (status IN ('pending_approval','payment_pending','reserved','rejected','picked_up','returned','cancelled'));
ALTER TABLE equipment_rental_bookings
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'ledger',
  ADD COLUMN IF NOT EXISTS gross_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_wallet_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shop_wallet_transaction_id uuid;
UPDATE equipment_rental_bookings SET gross_amount=total_amount WHERE gross_amount=0 AND total_amount>0;

CREATE TABLE IF NOT EXISTS equipment_rental_birthday_sms_log (
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jalali_year integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(shop_id,photographer_id,jalali_year)
);
