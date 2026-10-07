CREATE TABLE IF NOT EXISTS equipment_rental_desktop_orders (
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  booking_id uuid NOT NULL UNIQUE REFERENCES equipment_rental_bookings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(shop_id,client_id)
);
