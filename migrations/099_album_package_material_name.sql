-- PhotoBridge v0.17.408 — material-scoped package models for unified bag/box manager

ALTER TABLE lab_album_package_models
  ADD COLUMN IF NOT EXISTS material_name text NOT NULL DEFAULT 'کیف / باکس';

UPDATE lab_album_package_models
SET material_name='کیف / باکس'
WHERE material_name IS NULL OR btrim(material_name)='';

CREATE INDEX IF NOT EXISTS lab_album_package_models_material_idx
  ON lab_album_package_models(lab_id,material_name,active,sort_order,created_at);

COMMENT ON COLUMN lab_album_package_models.material_name IS 'Material/family label used by the unified album bag/box manager. Hidden palette rows may use model_name=__PB_PACKAGE_COLOR_PALETTE__.';
