ALTER TABLE lab_album_cover_type_catalog
  ADD COLUMN IF NOT EXISTS palette_storage jsonb NOT NULL DEFAULT '{}'::jsonb;
