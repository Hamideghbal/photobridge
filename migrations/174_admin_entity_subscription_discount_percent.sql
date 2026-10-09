-- PhotoBridge 2026-10-10 — per-shop percentage discount for platform subscriptions.
-- Labs already have subscription_discount_percent (migration 012); stores need the same field.
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS subscription_discount_percent numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE equipment_rental_shops
  DROP CONSTRAINT IF EXISTS equipment_rental_shops_subscription_discount_percent_chk;
ALTER TABLE equipment_rental_shops
  ADD CONSTRAINT equipment_rental_shops_subscription_discount_percent_chk
  CHECK (subscription_discount_percent >= 0 AND subscription_discount_percent <= 20);
-- Preserve legacy fixed-amount discounts. Percentage discounts take precedence when nonzero.
