-- PhotoBridge v0.17.304 — reusable album cover catalogs + per size/color pricing

ALTER TABLE lab_album_cover_colors
  ADD COLUMN IF NOT EXISTS price bigint NOT NULL DEFAULT 0 CHECK (price >= 0);
UPDATE lab_album_cover_colors cc SET price=c.price FROM lab_album_covers c WHERE c.id=cc.cover_id AND cc.price=0 AND c.price>0;

CREATE TABLE IF NOT EXISTS lab_album_cover_material_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id,name)
);
CREATE INDEX IF NOT EXISTS lab_album_cover_material_catalog_lab_idx
  ON lab_album_cover_material_catalog(lab_id,active,sort_order,name);

CREATE TABLE IF NOT EXISTS lab_album_cover_type_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_data text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id,name)
);
CREATE INDEX IF NOT EXISTS lab_album_cover_type_catalog_lab_idx
  ON lab_album_cover_type_catalog(lab_id,active,sort_order,name);

CREATE TABLE IF NOT EXISTS lab_album_cover_color_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  color_value text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id,name)
);
CREATE INDEX IF NOT EXISTS lab_album_cover_color_catalog_lab_idx
  ON lab_album_cover_color_catalog(lab_id,active,sort_order,name);

CREATE TABLE IF NOT EXISTS lab_album_cover_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES lab_album_cover_material_catalog(id) ON DELETE CASCADE,
  type_id uuid NOT NULL REFERENCES lab_album_cover_type_catalog(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id,material_id,type_id)
);
CREATE INDEX IF NOT EXISTS lab_album_cover_variants_lab_idx
  ON lab_album_cover_variants(lab_id,active,sort_order);

CREATE TABLE IF NOT EXISTS lab_album_cover_variant_colors (
  variant_id uuid NOT NULL REFERENCES lab_album_cover_variants(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES lab_album_cover_color_catalog(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(variant_id,color_id)
);
CREATE INDEX IF NOT EXISTS lab_album_cover_variant_colors_variant_idx
  ON lab_album_cover_variant_colors(variant_id,active,sort_order);

CREATE TABLE IF NOT EXISTS lab_album_cover_variant_prices (
  variant_id uuid NOT NULL REFERENCES lab_album_cover_variants(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES lab_album_cover_color_catalog(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES lab_album_sizes(id) ON DELETE CASCADE,
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(variant_id,color_id,size_id)
);
CREATE INDEX IF NOT EXISTS lab_album_cover_variant_prices_size_idx
  ON lab_album_cover_variant_prices(size_id,variant_id,color_id);

-- Seed the reusable catalogs from legacy flat cover rows when upgrading an existing lab.
INSERT INTO lab_album_cover_material_catalog(lab_id,name,active,sort_order)
SELECT c.lab_id,COALESCE(NULLIF(btrim(c.material_name),''),NULLIF(btrim(c.name),''),'جلد'),bool_or(c.active),min(c.sort_order)
FROM lab_album_covers c
GROUP BY c.lab_id,COALESCE(NULLIF(btrim(c.material_name),''),NULLIF(btrim(c.name),''),'جلد')
ON CONFLICT(lab_id,name) DO NOTHING;

INSERT INTO lab_album_cover_type_catalog(lab_id,name,image_data,active,sort_order)
SELECT c.lab_id,COALESCE(NULLIF(btrim(c.model_name),''),'استاندارد'),
       max(NULLIF(c.image_data,'')),bool_or(c.active),min(c.sort_order)
FROM lab_album_covers c
GROUP BY c.lab_id,COALESCE(NULLIF(btrim(c.model_name),''),'استاندارد')
ON CONFLICT(lab_id,name) DO NOTHING;

INSERT INTO lab_album_cover_color_catalog(lab_id,name,color_value,active,sort_order)
SELECT c.lab_id,cc.name,max(cc.color_value),bool_or(cc.active),min(cc.sort_order)
FROM lab_album_covers c JOIN lab_album_cover_colors cc ON cc.cover_id=c.id
WHERE btrim(cc.name)<>''
GROUP BY c.lab_id,cc.name
ON CONFLICT(lab_id,name) DO NOTHING;

INSERT INTO lab_album_cover_variants(lab_id,material_id,type_id,active,sort_order)
SELECT c.lab_id,m.id,t.id,bool_or(c.active),min(c.sort_order)
FROM lab_album_covers c
JOIN lab_album_cover_material_catalog m ON m.lab_id=c.lab_id AND m.name=COALESCE(NULLIF(btrim(c.material_name),''),NULLIF(btrim(c.name),''),'جلد')
JOIN lab_album_cover_type_catalog t ON t.lab_id=c.lab_id AND t.name=COALESCE(NULLIF(btrim(c.model_name),''),'استاندارد')
GROUP BY c.lab_id,m.id,t.id
ON CONFLICT(lab_id,material_id,type_id) DO NOTHING;

INSERT INTO lab_album_cover_variant_colors(variant_id,color_id,active,sort_order)
SELECT v.id,col.id,bool_or(cc.active),min(cc.sort_order)
FROM lab_album_covers c
JOIN lab_album_cover_colors cc ON cc.cover_id=c.id
JOIN lab_album_cover_material_catalog m ON m.lab_id=c.lab_id AND m.name=COALESCE(NULLIF(btrim(c.material_name),''),NULLIF(btrim(c.name),''),'جلد')
JOIN lab_album_cover_type_catalog t ON t.lab_id=c.lab_id AND t.name=COALESCE(NULLIF(btrim(c.model_name),''),'استاندارد')
JOIN lab_album_cover_variants v ON v.lab_id=c.lab_id AND v.material_id=m.id AND v.type_id=t.id
JOIN lab_album_cover_color_catalog col ON col.lab_id=c.lab_id AND col.name=cc.name
GROUP BY v.id,col.id
ON CONFLICT(variant_id,color_id) DO NOTHING;

INSERT INTO lab_album_cover_variant_prices(variant_id,color_id,size_id,price)
SELECT v.id,col.id,c.size_id,COALESCE(NULLIF(cc.price,0),c.price,0)
FROM lab_album_covers c
JOIN lab_album_cover_colors cc ON cc.cover_id=c.id
JOIN lab_album_cover_material_catalog m ON m.lab_id=c.lab_id AND m.name=COALESCE(NULLIF(btrim(c.material_name),''),NULLIF(btrim(c.name),''),'جلد')
JOIN lab_album_cover_type_catalog t ON t.lab_id=c.lab_id AND t.name=COALESCE(NULLIF(btrim(c.model_name),''),'استاندارد')
JOIN lab_album_cover_variants v ON v.lab_id=c.lab_id AND v.material_id=m.id AND v.type_id=t.id
JOIN lab_album_cover_color_catalog col ON col.lab_id=c.lab_id AND col.name=cc.name
WHERE c.size_id IS NOT NULL
ON CONFLICT(variant_id,color_id,size_id) DO UPDATE SET price=EXCLUDED.price,updated_at=now();
