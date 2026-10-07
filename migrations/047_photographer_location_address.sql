-- PhotoBridge v0.17.57 — persist the human-readable photographer address used by courier handoff

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS location_address text;

