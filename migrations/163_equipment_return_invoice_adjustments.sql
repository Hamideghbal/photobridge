ALTER TABLE equipment_rental_bookings
 ADD COLUMN IF NOT EXISTS returned_at timestamptz,
 ADD COLUMN IF NOT EXISTS return_kind text,
 ADD COLUMN IF NOT EXISTS invoice_adjustment_amount bigint NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS invoice_adjustment_note text;
CREATE OR REPLACE FUNCTION equipment_rental_display_name(category text, brand text, model text, title text, owner_shop uuid)
RETURNS text LANGUAGE sql STABLE AS $$
 SELECT concat_ws(' ',CASE category WHEN 'camera' THEN 'دوربین' WHEN 'lens' THEN 'لنز' WHEN 'light' THEN 'نور' WHEN 'audio' THEN 'صدا' WHEN 'stabilizer' THEN 'گیمبال/استابلایزر' WHEN 'other' THEN 'سایر' ELSE coalesce((SELECT c.name FROM equipment_catalog_categories c WHERE c.shop_id=owner_shop AND c.code=category LIMIT 1),(SELECT c.name FROM equipment_global_categories c WHERE c.code=category LIMIT 1),category) END,
 CASE WHEN position(lower(coalesce(brand,'')) in lower(coalesce(nullif(model,''),title,'')))>0 THEN NULL ELSE nullif(brand,'') END,
 coalesce(nullif(model,''),title,'تجهیز'))
$$;
