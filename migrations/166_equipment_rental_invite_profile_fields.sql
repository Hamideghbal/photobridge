BEGIN;

ALTER TABLE equipment_rental_shop_memberships
  ADD COLUMN IF NOT EXISTS business_license_image_object_key text,
  ADD COLUMN IF NOT EXISTS business_license_image_name text,
  ADD COLUMN IF NOT EXISTS business_license_image_content_type text,
  ADD COLUMN IF NOT EXISTS business_license_image_bytes bigint;

COMMIT;
