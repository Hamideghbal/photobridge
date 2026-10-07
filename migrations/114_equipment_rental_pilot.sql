-- PhotoBridge v0.17.616 — admin-only equipment rental pilot
CREATE TABLE IF NOT EXISTS equipment_rental_shops (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  province text,
  city text,
  address text,
  phone text,
  manager_name text,
  manager_mobile text,
  description text,
  deposit_policy text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rental_shops_active_idx ON equipment_rental_shops(active,created_at DESC);

CREATE TABLE IF NOT EXISTS equipment_rental_items (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'camera',
  title text NOT NULL,
  brand text,
  model text,
  sku text,
  daily_price bigint NOT NULL DEFAULT 0 CHECK (daily_price >= 0),
  deposit_amount bigint NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  stock_total integer NOT NULL DEFAULT 1 CHECK (stock_total >= 1),
  active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rental_items_shop_idx ON equipment_rental_items(shop_id,active,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_rental_items_shop_sku_uidx ON equipment_rental_items(shop_id,sku) WHERE sku IS NOT NULL AND btrim(sku) <> '';

CREATE TABLE IF NOT EXISTS equipment_rental_bookings (
  id uuid PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE RESTRICT,
  photographer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_mobile text,
  rental_start date NOT NULL,
  rental_end date NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','picked_up','returned','cancelled')),
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  deposit_amount bigint NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (rental_end >= rental_start)
);
CREATE INDEX IF NOT EXISTS equipment_rental_bookings_shop_dates_idx ON equipment_rental_bookings(shop_id,rental_start,rental_end,status);
CREATE INDEX IF NOT EXISTS equipment_rental_bookings_created_idx ON equipment_rental_bookings(created_at DESC);

CREATE TABLE IF NOT EXISTS equipment_rental_booking_items (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES equipment_rental_bookings(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES equipment_rental_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  rental_days integer NOT NULL DEFAULT 1 CHECK (rental_days >= 1),
  daily_price bigint NOT NULL DEFAULT 0 CHECK (daily_price >= 0),
  deposit_amount bigint NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  subtotal bigint NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rental_booking_items_booking_idx ON equipment_rental_booking_items(booking_id);
CREATE INDEX IF NOT EXISTS equipment_rental_booking_items_item_idx ON equipment_rental_booking_items(item_id);
