-- PhotoBridge v0.17.628 — photographer collaboration requests + per-store rental invoices

CREATE TABLE IF NOT EXISTS equipment_rental_collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(shop_id,photographer_id)
);
CREATE INDEX IF NOT EXISTS equipment_rental_collaboration_requests_shop_idx
  ON equipment_rental_collaboration_requests(shop_id,status,requested_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_collaboration_requests_photographer_idx
  ON equipment_rental_collaboration_requests(photographer_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS equipment_rental_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  booking_id uuid NOT NULL UNIQUE REFERENCES equipment_rental_bookings(id) ON DELETE RESTRICT,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE RESTRICT,
  photographer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  deposit_amount bigint NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS equipment_rental_invoices_photographer_shop_idx
  ON equipment_rental_invoices(photographer_id,shop_id,issued_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_invoices_shop_idx
  ON equipment_rental_invoices(shop_id,issued_at DESC);

-- Existing accepted rentals receive one historical invoice. Pending requests intentionally do not.
INSERT INTO equipment_rental_invoices(invoice_number,booking_id,shop_id,photographer_id,total_amount,deposit_amount,issued_at,created_by)
SELECT 'ER-' || to_char(COALESCE(b.updated_at,b.created_at),'YYYYMMDD') || '-' || upper(left(replace(b.id::text,'-',''),12)),
       b.id,b.shop_id,b.photographer_id,b.total_amount,b.deposit_amount,COALESCE(b.updated_at,b.created_at),b.created_by
FROM equipment_rental_bookings b
WHERE b.status IN ('reserved','picked_up','returned','cancelled')
  AND EXISTS (SELECT 1 FROM equipment_rental_accounting_entries e WHERE e.booking_id=b.id AND e.entry_type='booking_charge')
ON CONFLICT (booking_id) DO NOTHING;
