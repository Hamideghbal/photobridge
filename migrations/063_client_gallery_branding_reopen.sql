-- PhotoBridge v0.17.236
-- Photographer-branded public galleries and explicit reopen support in the existing draft/submitted workflow.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gallery_brand_name text,
  ADD COLUMN IF NOT EXISTS gallery_brand_logo_key text,
  ADD COLUMN IF NOT EXISTS gallery_brand_logo_content_type text;

UPDATE users
SET gallery_brand_name=NULLIF(BTRIM(gallery_brand_name),'')
WHERE gallery_brand_name IS NOT NULL;
