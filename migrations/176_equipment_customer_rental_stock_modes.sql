-- R1095: shop-specific customer rental request behavior.
-- 'flexible': accept requests despite shortages; 'strict': reserve available stock while awaiting approval.
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS customer_rental_stock_mode text NOT NULL DEFAULT 'flexible';
ALTER TABLE equipment_rental_bookings
  ADD COLUMN IF NOT EXISTS customer_stock_held boolean NOT NULL DEFAULT false;
DO $$ BEGIN
 ALTER TABLE equipment_rental_shops ADD CONSTRAINT customer_rental_stock_mode_check
 CHECK (customer_rental_stock_mode IN ('flexible','strict'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_rental_customer_stock_held
 ON equipment_rental_bookings(shop_id,rental_start,rental_end)
 WHERE status='pending_approval' AND customer_stock_held=true;
