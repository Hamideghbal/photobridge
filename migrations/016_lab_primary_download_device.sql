-- PhotoBridge v0.15.5 — primary lab workstation for local downloads
ALTER TABLE labs ADD COLUMN IF NOT EXISTS primary_download_device_id text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS primary_download_device_label text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS primary_download_device_registered_at timestamptz;

CREATE INDEX IF NOT EXISTS labs_primary_download_device_idx
  ON labs(primary_download_device_id)
  WHERE primary_download_device_id IS NOT NULL;
