ALTER TABLE orders ADD COLUMN IF NOT EXISTS downloaded_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS correction_note text;

CREATE TABLE IF NOT EXISTS order_status_events (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  actor_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_status_events_order_idx ON order_status_events(order_id, created_at);

INSERT INTO order_status_events(order_id,lab_id,customer_id,status,created_at)
SELECT o.id,o.lab_id,o.customer_id,o.status,o.updated_at
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_events e WHERE e.order_id=o.id);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigserial UNIQUE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal bigint NOT NULL DEFAULT 0,
  discount bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  pdf_object_key text,
  pdf_ready boolean NOT NULL DEFAULT false,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_lab_idx ON invoices(lab_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON invoices(customer_id, issued_at DESC);
