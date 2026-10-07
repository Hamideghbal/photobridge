ALTER TABLE equipment_rental_booking_shortages
  ADD COLUMN IF NOT EXISTS booking_cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS booking_cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_note text,
  ADD COLUMN IF NOT EXISTS external_cancellation_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_cancellation_acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL;
