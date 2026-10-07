-- PhotoBridge v0.17.654 — rental inventory edit/delete + equipment sales storefront

ALTER TABLE equipment_rental_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS equipment_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'camera',
  title text NOT NULL,
  brand text,
  model text,
  sku text,
  sale_price bigint NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  stock_total integer NOT NULL DEFAULT 1 CHECK (stock_total >= 0),
  active boolean NOT NULL DEFAULT true,
  description text,
  image_object_key text,
  image_name text,
  image_content_type text,
  image_bytes bigint,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_sale_items_shop_idx ON equipment_sale_items(shop_id,active,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_sale_items_shop_sku_uidx
  ON equipment_sale_items(shop_id,sku)
  WHERE deleted_at IS NULL AND sku IS NOT NULL AND btrim(sku)<>'';

CREATE TABLE IF NOT EXISTS equipment_sale_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE RESTRICT,
  sale_item_id uuid NOT NULL REFERENCES equipment_sale_items(id) ON DELETE RESTRICT,
  buyer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_mobile text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_sale_orders_shop_idx ON equipment_sale_orders(shop_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS equipment_sale_orders_buyer_idx ON equipment_sale_orders(buyer_user_id,created_at DESC);
