-- PhotoBridge v0.17.327 — unified album package models with images + size/color price matrix

CREATE TABLE IF NOT EXISTS lab_album_package_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  image_data text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_album_package_models_lab_idx
  ON lab_album_package_models(lab_id,active,sort_order,created_at);

INSERT INTO lab_album_package_models(id,lab_id,model_name,active,sort_order)
SELECT COALESCE(p.model_group_id,p.id),p.lab_id,MIN(p.model_name),BOOL_OR(p.active),MIN(p.sort_order)
FROM lab_album_packages p
LEFT JOIN lab_album_package_models m ON m.id=COALESCE(p.model_group_id,p.id)
WHERE m.id IS NULL
GROUP BY COALESCE(p.model_group_id,p.id),p.lab_id
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE lab_album_package_models IS 'Shared metadata for a unified album bag/box model. Prices remain in lab_album_packages as size/color rows.';
COMMENT ON COLUMN lab_album_package_models.image_data IS 'Optional WebP/JPEG/PNG data URL sample for the package model.';
COMMENT ON TABLE lab_album_packages IS 'Album package size/color price rows. kind is retained for backward compatibility; current UI treats box and bag as one unified package family.';
