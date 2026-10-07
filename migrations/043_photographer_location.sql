-- PhotoBridge v0.17.39 — photographer map location for courier/Snapp workflows

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_location_lat_chk') THEN
    ALTER TABLE users ADD CONSTRAINT users_location_lat_chk
      CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_location_lng_chk') THEN
    ALTER TABLE users ADD CONSTRAINT users_location_lng_chk
      CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_location_available_idx
  ON users(id)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
