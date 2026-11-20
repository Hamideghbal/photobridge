-- R1921: hide legacy cards without deleting source orders, invoices, payments, or files.
CREATE TABLE IF NOT EXISTS lab_hidden_order_cards(
 lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 hidden_at timestamptz NOT NULL DEFAULT now(),
 hidden_by uuid,
 reason text,
 PRIMARY KEY(lab_id,order_id)
);
CREATE INDEX IF NOT EXISTS idx_lab_hidden_order_cards_order ON lab_hidden_order_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_r1921_orders_page ON orders(lab_id,mode,status,created_at DESC,id DESC);
