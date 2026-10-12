-- Descriptive category only: membership, invitations and access rules stay unchanged.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='equipment_rental_shops' AND column_name='business_category') THEN
  ALTER TABLE equipment_rental_shops ADD COLUMN business_category text NOT NULL DEFAULT 'equipment_rental_sale';
  UPDATE equipment_rental_shops SET business_category=CASE WHEN rental_enabled=false AND sale_enabled=true THEN 'equipment_sale' WHEN rental_enabled=true AND sale_enabled=false THEN 'equipment_rental' ELSE 'equipment_rental_sale' END;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='equipment_rental_shops'::regclass AND conname='equipment_rental_shops_business_category_check') THEN
  ALTER TABLE equipment_rental_shops ADD CONSTRAINT equipment_rental_shops_business_category_check CHECK(business_category IN ('equipment_rental','equipment_sale','equipment_rental_sale','frame','chassis','frame_chassis'));
 END IF;
END $$;
