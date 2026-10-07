-- PhotoBridge v0.17.656 — manageable equipment categories and models per rental store
CREATE TABLE IF NOT EXISTS equipment_catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id, code)
);
CREATE INDEX IF NOT EXISTS equipment_catalog_categories_shop_idx
  ON equipment_catalog_categories(shop_id, deleted_at, sort_order, created_at);

CREATE TABLE IF NOT EXISTS equipment_catalog_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES equipment_catalog_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_catalog_models_active_uidx
  ON equipment_catalog_models(shop_id, category_id, lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS equipment_catalog_models_shop_idx
  ON equipment_catalog_models(shop_id, category_id, deleted_at, sort_order, created_at);

-- Preserve any category codes already used by existing rental/sale inventory.
INSERT INTO equipment_catalog_categories(shop_id,code,name,sort_order)
SELECT DISTINCT x.shop_id,x.category,
  CASE x.category
    WHEN 'camera' THEN 'دوربین'
    WHEN 'lens' THEN 'لنز'
    WHEN 'light' THEN 'نور'
    WHEN 'audio' THEN 'صدا'
    WHEN 'stabilizer' THEN 'گیمبال/استابلایزر'
    WHEN 'other' THEN 'سایر'
    ELSE x.category
  END,
  CASE x.category WHEN 'camera' THEN 10 WHEN 'lens' THEN 20 WHEN 'light' THEN 30 WHEN 'audio' THEN 40 WHEN 'stabilizer' THEN 50 WHEN 'other' THEN 90 ELSE 70 END
FROM (
  SELECT shop_id,category FROM equipment_rental_items WHERE category IS NOT NULL AND btrim(category)<>''
  UNION
  SELECT shop_id,category FROM equipment_sale_items WHERE category IS NOT NULL AND btrim(category)<>''
) x
ON CONFLICT(shop_id,code) DO NOTHING;

-- Every store starts with the standard PhotoBridge categories, but can rename/delete them.
INSERT INTO equipment_catalog_categories(shop_id,code,name,sort_order)
SELECT s.id,v.code,v.name,v.sort_order
FROM equipment_rental_shops s
CROSS JOIN (VALUES
 ('camera','دوربین',10),('lens','لنز',20),('light','نور',30),('audio','صدا',40),('stabilizer','گیمبال/استابلایزر',50),('other','سایر',90)
) AS v(code,name,sort_order)
ON CONFLICT(shop_id,code) DO NOTHING;

-- Import models that are already in use so existing data immediately becomes manageable.
INSERT INTO equipment_catalog_models(shop_id,category_id,name,sort_order)
SELECT DISTINCT x.shop_id,c.id,x.model,0
FROM (
  SELECT shop_id,category,btrim(model) model FROM equipment_rental_items WHERE model IS NOT NULL AND btrim(model)<>''
  UNION
  SELECT shop_id,category,btrim(model) model FROM equipment_sale_items WHERE model IS NOT NULL AND btrim(model)<>''
) x
JOIN equipment_catalog_categories c ON c.shop_id=x.shop_id AND c.code=x.category
WHERE NOT EXISTS (SELECT 1 FROM equipment_catalog_models em WHERE em.shop_id=x.shop_id AND em.category_id=c.id AND lower(btrim(em.name))=lower(btrim(x.model)))
ON CONFLICT DO NOTHING;
