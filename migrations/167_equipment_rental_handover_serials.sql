ALTER TABLE equipment_rental_bookings
  ADD COLUMN IF NOT EXISTS handover_serials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS handover_serials_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS handover_serials_recorded_by uuid;

CREATE INDEX IF NOT EXISTS equipment_rental_bookings_handover_serials_recorded_idx
  ON equipment_rental_bookings(shop_id,handover_serials_recorded_at DESC)
  WHERE handover_serials_recorded_at IS NOT NULL;
