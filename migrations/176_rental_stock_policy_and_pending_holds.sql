-- R1095: two per-shop policies for customer rental requests.
-- Legacy/flexible mode remains the default for all existing stores.
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS rental_stock_policy text NOT NULL DEFAULT 'flexible';
ALTER TABLE equipment_rental_shops
  DROP CONSTRAINT IF EXISTS equipment_rental_shops_stock_policy_check;
ALTER TABLE equipment_rental_shops
  ADD CONSTRAINT equipment_rental_shops_stock_policy_check
  CHECK (rental_stock_policy IN ('flexible','strict'));

-- Strict requests reserve inventory while waiting for store approval.
-- All older requests preserve their previous non-holding semantics.
ALTER TABLE equipment_rental_bookings
  ADD COLUMN IF NOT EXISTS inventory_held boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_rental_bookings_inventory_held
  ON equipment_rental_bookings(shop_id,rental_start,rental_end)
  WHERE status='pending_approval' AND inventory_held=true;
