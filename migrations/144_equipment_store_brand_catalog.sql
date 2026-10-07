-- PhotoBridge v829 — store-owned brand menu for rental/sales item forms.
CREATE TABLE IF NOT EXISTS equipment_store_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_store_brands_shop_idx ON equipment_store_brands(shop_id,sort_order,name);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_store_brands_active_uidx ON equipment_store_brands(shop_id,lower(name)) WHERE deleted_at IS NULL;
INSERT INTO equipment_store_brands(shop_id,name,sort_order)
SELECT s.id,v.name,v.sort_order
FROM equipment_rental_shops s
CROSS JOIN (VALUES ('Sony',10),('Canon',20),('Nikon',30)) AS v(name,sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_store_brands b
  WHERE b.shop_id=s.id AND lower(b.name)=lower(v.name)
);
WITH inventory_brands AS (
  SELECT shop_id,btrim(brand) name FROM equipment_rental_items WHERE deleted_at IS NULL AND btrim(COALESCE(brand,''))<>''
  UNION
  SELECT shop_id,btrim(brand) name FROM equipment_sale_items WHERE deleted_at IS NULL AND btrim(COALESCE(brand,''))<>''
)
INSERT INTO equipment_store_brands(shop_id,name,sort_order)
SELECT i.shop_id,i.name,COALESCE((SELECT max(b.sort_order)+10 FROM equipment_store_brands b WHERE b.shop_id=i.shop_id AND b.deleted_at IS NULL),40)
FROM inventory_brands i
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_store_brands b
  WHERE b.shop_id=i.shop_id AND lower(b.name)=lower(i.name)
);
