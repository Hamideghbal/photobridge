-- PhotoBridge R100F25 — optional photographer profile avatar
ALTER TABLE photographer_profiles ADD COLUMN IF NOT EXISTS avatar_data text;
