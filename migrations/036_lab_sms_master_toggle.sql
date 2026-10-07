-- PhotoBridge v0.17.25 — explicit lab-side master switch for customer SMS

ALTER TABLE lab_sms_settings
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false;

-- Preserve any lab that had already opted into automatic customer SMS before this explicit master switch existed.
UPDATE lab_sms_settings
SET enabled=true
WHERE enabled=false AND (order_ready_enabled=true OR order_completed_enabled=true);
