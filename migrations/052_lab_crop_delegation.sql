-- PhotoBridge v0.17.74 — lab-controlled crop delegation
ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS crop_delegation_enabled boolean NOT NULL DEFAULT false;
