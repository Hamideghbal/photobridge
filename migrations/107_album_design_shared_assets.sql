CREATE TABLE IF NOT EXISTS album_design_assets (
  object_key text PRIMARY KEY,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  object_name text,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_album_design_assets_updated_at ON album_design_assets(updated_at);
