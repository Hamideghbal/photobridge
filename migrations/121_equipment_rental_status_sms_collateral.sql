-- PhotoBridge v0.17.630 — rejected/cancelled rental SMS + per-photographer collateral requirements

ALTER TABLE equipment_rental_sms_settings
  ADD COLUMN IF NOT EXISTS booking_status_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE equipment_rental_shop_memberships
  ADD COLUMN IF NOT EXISTS collateral_requirement text,
  ADD COLUMN IF NOT EXISTS collateral_note text;
