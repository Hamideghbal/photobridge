-- PhotoBridge R100F10 — platform-admin store removal without destroying financial/order history
ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS equipment_rental_shops_not_deleted_idx
  ON equipment_rental_shops(active,created_at DESC)
  WHERE deleted_at IS NULL;
