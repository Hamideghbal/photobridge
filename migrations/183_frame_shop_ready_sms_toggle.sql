-- Allow frame/chassis manufacturers to opt out of the ready-order text independently.
ALTER TABLE equipment_rental_sms_settings
  ADD COLUMN IF NOT EXISTS ready_enabled boolean NOT NULL DEFAULT true;
-- Invitations are always a platform-paid transactional message, not an optional SMS.
UPDATE equipment_rental_sms_settings SET invite_enabled=true WHERE invite_enabled=false;
