-- PhotoBridge v0.17.103 — archived order recovery / reprint workflow
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovered_from_order_id uuid REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_required boolean NOT NULL DEFAULT true;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_note text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovered_at timestamptz;
CREATE INDEX IF NOT EXISTS orders_recovered_from_idx ON orders(lab_id,recovered_from_order_id,created_at DESC) WHERE recovered_from_order_id IS NOT NULL;
