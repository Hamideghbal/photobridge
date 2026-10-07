-- PhotoBridge v830 — per-store model menu layered on the central equipment bank.
-- Central products seed each store's menu. Stores can edit/hide those rows locally
-- without changing the global PhotoBridge catalog.
CREATE TABLE IF NOT EXISTS equipment_store_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  category_code text NOT NULL,
  brand_name text,
  name text NOT NULL,
  source_product_id uuid REFERENCES equipment_global_products(id) ON DELETE SET NULL,
  customized boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_store_models_shop_idx
  ON equipment_store_models(shop_id,category_code,brand_name,deleted_at,sort_order,name);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_store_models_source_uidx
  ON equipment_store_models(shop_id,source_product_id)
  WHERE source_product_id IS NOT NULL;

-- Seed the central bank into every existing shop. Brand-free templates remain brand-free
-- and are shown for any selected brand in their category.
INSERT INTO equipment_store_models(shop_id,category_code,brand_name,name,source_product_id,customized,sort_order)
SELECT s.id,c.code,b.name,COALESCE(NULLIF(btrim(p.model),''),p.title),p.id,false,p.sort_order
FROM equipment_rental_shops s
JOIN equipment_global_products p ON p.active=true AND p.deleted_at IS NULL
JOIN equipment_global_categories c ON c.id=p.category_id AND c.active=true AND c.deleted_at IS NULL
LEFT JOIN equipment_global_brands b ON b.id=p.brand_id AND b.active=true AND b.deleted_at IS NULL
ON CONFLICT (shop_id,source_product_id) WHERE source_product_id IS NOT NULL DO NOTHING;

-- Preserve models already used in each store even when they are not in the central bank.
WITH used AS (
  SELECT shop_id,category category_code,NULLIF(btrim(brand),'') brand_name,btrim(model) name
  FROM equipment_rental_items
  WHERE deleted_at IS NULL AND btrim(COALESCE(model,''))<>''
  UNION
  SELECT shop_id,category category_code,NULLIF(btrim(brand),'') brand_name,btrim(model) name
  FROM equipment_sale_items
  WHERE deleted_at IS NULL AND btrim(COALESCE(model,''))<>''
)
INSERT INTO equipment_store_models(shop_id,category_code,brand_name,name,customized,sort_order)
SELECT u.shop_id,u.category_code,u.brand_name,u.name,true,1000
FROM used u
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_store_models m
  WHERE m.shop_id=u.shop_id
    AND m.deleted_at IS NULL
    AND m.category_code=u.category_code
    AND lower(COALESCE(m.brand_name,''))=lower(COALESCE(u.brand_name,''))
    AND lower(btrim(m.name))=lower(btrim(u.name))
);
