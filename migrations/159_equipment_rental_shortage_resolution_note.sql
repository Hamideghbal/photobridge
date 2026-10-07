ALTER TABLE equipment_rental_booking_shortages
  ADD COLUMN IF NOT EXISTS resolution_note text;
