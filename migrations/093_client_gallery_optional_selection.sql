BEGIN;

ALTER TABLE photographer_client_galleries
  ADD COLUMN IF NOT EXISTS selection_enabled boolean NOT NULL DEFAULT true;

UPDATE photographer_client_galleries
SET selection_enabled=true
WHERE selection_enabled IS NULL;

COMMIT;
