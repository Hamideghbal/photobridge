-- R1921: lab-only queue visibility. This does NOT delete orders, photos, invoices or financial postings.
CREATE TABLE IF NOT EXISTS lab_order_queue_hidden (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  hidden_by uuid REFERENCES users(id) ON DELETE SET NULL,
  note text,
  PRIMARY KEY (lab_id, order_id)
);
CREATE INDEX IF NOT EXISTS lab_order_queue_hidden_order_idx ON lab_order_queue_hidden(order_id);

-- Keep the first page of each tab index-backed even with many delivered orders.
CREATE INDEX IF NOT EXISTS orders_lab_queue_page_r1921_idx ON orders(lab_id,mode,status,created_at DESC,id DESC) WHERE status NOT IN ('uploading','cancelled');
