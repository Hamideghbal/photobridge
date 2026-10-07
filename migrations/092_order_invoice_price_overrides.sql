ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_chk;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_chk
  CHECK (payment_status IN ('not_required','pricing_required','awaiting_receipt','receipt_pending','paid','receipt_rejected'));

CREATE TABLE IF NOT EXISTS order_invoice_price_overrides (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id),
  print_type text NOT NULL CHECK (print_type IN ('luster','silk','metallic')),
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, size_id, print_type)
);

CREATE INDEX IF NOT EXISTS order_invoice_price_overrides_lab_idx
  ON order_invoice_price_overrides(lab_id, order_id);
