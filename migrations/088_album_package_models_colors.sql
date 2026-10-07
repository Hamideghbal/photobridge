-- PhotoBridge v0.17.324 — album package model/color catalog

ALTER TABLE lab_album_packages
  ADD COLUMN IF NOT EXISTS model_group_id uuid,
  ADD COLUMN IF NOT EXISTS color_name text,
  ADD COLUMN IF NOT EXISTS color_value text;

UPDATE lab_album_packages
SET model_group_id = COALESCE(model_group_id,id),
    color_name = COALESCE(NULLIF(color_name,''),'#64748B'),
    color_value = COALESCE(NULLIF(color_value,''),'#64748B')
WHERE model_group_id IS NULL OR color_name IS NULL OR color_value IS NULL;

ALTER TABLE lab_album_packages
  ALTER COLUMN model_group_id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS lab_album_packages_model_group_idx
  ON lab_album_packages(lab_id,size_id,model_group_id,sort_order,created_at);

COMMENT ON COLUMN lab_album_packages.model_group_id IS 'Groups package color variants under one box/bag model.';
COMMENT ON COLUMN lab_album_packages.color_name IS 'Display label for the package color; normally the HEX value.';
COMMENT ON COLUMN lab_album_packages.color_value IS 'HEX package color selected by the lab.';
