CREATE TABLE IF NOT EXISTS equipment_rental_booking_shortages (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES equipment_rental_bookings(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES equipment_rental_items(id) ON DELETE CASCADE,
  shortage_qty integer NOT NULL CHECK (shortage_qty > 0),
  rental_start date NOT NULL,
  rental_end date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_rental_booking_shortages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS equipment_rental_booking_shortages_booking_item_uidx
  ON equipment_rental_booking_shortages(booking_id,item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_booking_shortages_shop_status_date
  ON equipment_rental_booking_shortages(shop_id,status,rental_start,rental_end);
