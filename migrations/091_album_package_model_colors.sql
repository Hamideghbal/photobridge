-- PhotoBridge v0.17.343 — persist package model colors even before pricing

CREATE TABLE IF NOT EXISTS lab_album_package_model_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES lab_album_package_models(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_value text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_id,color_value)
);

CREATE INDEX IF NOT EXISTS lab_album_package_model_colors_model_idx
  ON lab_album_package_model_colors(model_id,active,sort_order,created_at);

INSERT INTO lab_album_package_model_colors(model_id,color_name,color_value,active,sort_order)
SELECT p.model_group_id,
       COALESCE(NULLIF(MIN(p.color_name),''),MIN(p.color_value),'#64748B'),
       UPPER(COALESCE(NULLIF(p.color_value,''),'#64748B')),
       BOOL_OR(p.active),
       MIN(p.sort_order)
FROM lab_album_packages p
JOIN lab_album_package_models m ON m.id=p.model_group_id AND m.lab_id=p.lab_id
WHERE p.model_group_id IS NOT NULL
GROUP BY p.model_group_id,UPPER(COALESCE(NULLIF(p.color_value,''),'#64748B'))
ON CONFLICT (model_id,color_value) DO NOTHING;

COMMENT ON TABLE lab_album_package_model_colors IS 'Draft-friendly package model colors. A color persists even before any size price is entered.';
