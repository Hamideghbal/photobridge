-- PhotoBridge v0.17.620 — equipment images, invite debt and rental accounting

ALTER TABLE equipment_rental_items
  ADD COLUMN IF NOT EXISTS image_object_key text,
  ADD COLUMN IF NOT EXISTS image_name text,
  ADD COLUMN IF NOT EXISTS image_content_type text,
  ADD COLUMN IF NOT EXISTS image_bytes bigint;

ALTER TABLE equipment_rental_shop_memberships
  ADD COLUMN IF NOT EXISTS opening_debt bigint NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='equipment_rental_shop_memberships_opening_debt_chk') THEN
    ALTER TABLE equipment_rental_shop_memberships
      ADD CONSTRAINT equipment_rental_shop_memberships_opening_debt_chk CHECK (opening_debt >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS equipment_rental_accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  photographer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES equipment_rental_bookings(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('opening_debt','booking_charge','booking_reversal','payment','adjustment_debit','adjustment_credit')),
  direction text NOT NULL CHECK (direction IN ('debit','credit')),
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  description text,
  entry_date date NOT NULL DEFAULT current_date,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rental_accounting_shop_date_idx
  ON equipment_rental_accounting_entries(shop_id,entry_date DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_accounting_photographer_idx
  ON equipment_rental_accounting_entries(shop_id,photographer_id,entry_date DESC,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_rental_accounting_booking_type_uidx
  ON equipment_rental_accounting_entries(booking_id,entry_type)
  WHERE booking_id IS NOT NULL AND entry_type IN ('booking_charge','booking_reversal');

-- Existing non-cancelled bookings become receivable entries once.
INSERT INTO equipment_rental_accounting_entries(shop_id,photographer_id,booking_id,entry_type,direction,amount,description,entry_date,created_by)
SELECT b.shop_id,b.photographer_id,b.id,'booking_charge','debit',b.total_amount,
       'اجاره تجهیزات · رزرو ' || upper(left(b.id::text,8)),b.rental_start,b.created_by
FROM equipment_rental_bookings b
WHERE b.status <> 'cancelled' AND b.total_amount > 0
ON CONFLICT DO NOTHING;
CREATE UNIQUE INDEX IF NOT EXISTS equipment_rental_accounting_opening_debt_uidx
  ON equipment_rental_accounting_entries(shop_id,photographer_id,entry_type)
  WHERE photographer_id IS NOT NULL AND entry_type='opening_debt';
