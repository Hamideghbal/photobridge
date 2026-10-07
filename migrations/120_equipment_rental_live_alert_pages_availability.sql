-- PhotoBridge v0.17.629 — rental live alerts, desktop agent and booking approval hardening

CREATE TABLE IF NOT EXISTS equipment_rental_alert_agents (
  shop_id uuid PRIMARY KEY REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  label text NOT NULL DEFAULT 'سیستم فروشگاه تجهیزات',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_rental_bookings
  ADD COLUMN IF NOT EXISTS rental_alert_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS rental_alert_acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS equipment_rental_bookings_live_idx
  ON equipment_rental_bookings(shop_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_bookings_alert_idx
  ON equipment_rental_bookings(shop_id,status,rental_alert_acknowledged_at,created_at DESC);

-- Pending/rejected requests must never carry financial documents.
DELETE FROM equipment_rental_invoices inv
USING equipment_rental_bookings b
WHERE inv.booking_id=b.id AND b.status IN ('pending_approval','rejected','cancelled');

DELETE FROM equipment_rental_accounting_entries e
USING equipment_rental_bookings b
WHERE e.booking_id=b.id
  AND b.status IN ('pending_approval','rejected','cancelled')
  AND e.entry_type IN ('booking_charge','booking_reversal');
