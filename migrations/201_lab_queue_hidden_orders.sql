-- R1921: user-visible removal from lab queue without deleting invoices or history.
CREATE TABLE IF NOT EXISTS lab_queue_hidden_orders (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  hidden_by uuid NOT NULL REFERENCES users(id),
  hidden_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lab_id,order_id)
);
CREATE INDEX IF NOT EXISTS lab_queue_hidden_orders_lab_hidden_idx
  ON lab_queue_hidden_orders(lab_id,hidden_at DESC);
