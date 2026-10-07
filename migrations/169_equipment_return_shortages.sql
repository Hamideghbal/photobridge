-- PhotoBridge v904 R75 — partial equipment returns / missing items
CREATE TABLE IF NOT EXISTS equipment_rental_return_shortages (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES equipment_rental_bookings(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES equipment_rental_items(id) ON DELETE RESTRICT,
  expected_qty integer NOT NULL CHECK (expected_qty > 0),
  returned_qty integer NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
  missing_qty integer NOT NULL CHECK (missing_qty > 0),
  status text NOT NULL DEFAULT 'missing' CHECK (status IN ('missing','returned_later')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id,item_id)
);
CREATE INDEX IF NOT EXISTS idx_equipment_return_shortages_shop_status ON equipment_rental_return_shortages(shop_id,status,detected_at DESC);
