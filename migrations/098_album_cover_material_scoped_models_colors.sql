-- PhotoBridge v0.17.398 — material-scoped album cover models/colors + image-first pricing chooser
-- Existing catalogs were lab-global. The UI now treats each model/color as belonging to one cover material.
-- Split legacy shared rows so editing leather does not alter velvet/fabric rows with the same model/color.

ALTER TABLE lab_album_cover_type_catalog
  DROP CONSTRAINT IF EXISTS lab_album_cover_type_catalog_lab_id_name_key;
ALTER TABLE lab_album_cover_color_catalog
  DROP CONSTRAINT IF EXISTS lab_album_cover_color_catalog_lab_id_name_key;

DO $$
DECLARE
  r record;
  new_type_id uuid;
BEGIN
  FOR r IN
    SELECT type_id,material_id,rn
    FROM (
      SELECT x.type_id,x.material_id,
             row_number() OVER (PARTITION BY x.type_id ORDER BY x.first_sort,x.material_id) rn
      FROM (
        SELECT type_id,material_id,min(sort_order) first_sort
        FROM lab_album_cover_variants
        GROUP BY type_id,material_id
      ) x
    ) ranked
    WHERE rn>1
  LOOP
    INSERT INTO lab_album_cover_type_catalog(lab_id,name,image_data,preview_preset_key,active,sort_order)
    SELECT lab_id,name,image_data,preview_preset_key,active,sort_order
    FROM lab_album_cover_type_catalog
    WHERE id=r.type_id
    RETURNING id INTO new_type_id;

    UPDATE lab_album_cover_variants
    SET type_id=new_type_id,updated_at=now()
    WHERE type_id=r.type_id AND material_id=r.material_id;
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
  new_color_id uuid;
BEGIN
  FOR r IN
    SELECT color_id,material_id,rn
    FROM (
      SELECT x.color_id,x.material_id,
             row_number() OVER (PARTITION BY x.color_id ORDER BY x.first_sort,x.material_id) rn
      FROM (
        SELECT vc.color_id,v.material_id,min(vc.sort_order) first_sort
        FROM lab_album_cover_variant_colors vc
        JOIN lab_album_cover_variants v ON v.id=vc.variant_id
        GROUP BY vc.color_id,v.material_id
      ) x
    ) ranked
    WHERE rn>1
  LOOP
    INSERT INTO lab_album_cover_color_catalog(lab_id,name,color_value,active,sort_order)
    SELECT lab_id,name,color_value,active,sort_order
    FROM lab_album_cover_color_catalog
    WHERE id=r.color_id
    RETURNING id INTO new_color_id;

    UPDATE lab_album_cover_variant_prices p
    SET color_id=new_color_id,updated_at=now()
    FROM lab_album_cover_variants v
    WHERE p.variant_id=v.id
      AND v.material_id=r.material_id
      AND p.color_id=r.color_id;

    UPDATE lab_album_cover_variant_colors vc
    SET color_id=new_color_id,updated_at=now()
    FROM lab_album_cover_variants v
    WHERE vc.variant_id=v.id
      AND v.material_id=r.material_id
      AND vc.color_id=r.color_id;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS lab_album_cover_type_catalog_lab_name_idx
  ON lab_album_cover_type_catalog(lab_id,name);
CREATE INDEX IF NOT EXISTS lab_album_cover_color_catalog_lab_name_idx
  ON lab_album_cover_color_catalog(lab_id,name);
