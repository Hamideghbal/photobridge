-- PhotoBridge R82 — per-unit equipment asset codes, QR handover/return and persistent commitment
CREATE SEQUENCE IF NOT EXISTS equipment_rental_asset_code_seq START WITH 10000001;
CREATE TABLE IF NOT EXISTS equipment_rental_assets (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES equipment_rental_items(id) ON DELETE CASCADE,
  system_code text NOT NULL UNIQUE,
  serial_number text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_assets_shop_item ON equipment_rental_assets(shop_id,item_id,active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_rental_assets_shop_serial ON equipment_rental_assets(shop_id,serial_number) WHERE serial_number IS NOT NULL AND btrim(serial_number)<>'';
CREATE TABLE IF NOT EXISTS equipment_rental_booking_assets (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES equipment_rental_bookings(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES equipment_rental_items(id) ON DELETE RESTRICT,
  asset_id uuid NOT NULL REFERENCES equipment_rental_assets(id) ON DELETE RESTRICT,
  handed_out_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id,asset_id)
);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_booking_assets_open ON equipment_rental_booking_assets(shop_id,asset_id,returned_at);
ALTER TABLE equipment_rental_bookings ADD COLUMN IF NOT EXISTS commitment_generated_at timestamptz;
ALTER TABLE equipment_rental_return_shortages ADD COLUMN IF NOT EXISTS missing_asset_codes jsonb NOT NULL DEFAULT '[]'::jsonb;
