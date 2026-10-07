-- A lab can receive the same offline order more than once while reconnecting.
-- The client-generated UUID identifies one intake across all retries.
CREATE TABLE IF NOT EXISTS lab_delegated_order_intakes (
  id uuid PRIMARY KEY,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id),
  actor_id uuid NOT NULL REFERENCES users(id),
  invitation_id uuid REFERENCES invitations(id),
  source_device text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, id)
);

CREATE INDEX IF NOT EXISTS lab_delegated_order_intakes_lab_idx
  ON lab_delegated_order_intakes(lab_id, created_at DESC);
