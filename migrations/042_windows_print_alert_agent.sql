-- PhotoBridge v0.17.37 — Windows print alert companion

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS print_alert_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS print_alert_acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Do not resurrect historical orders as new alerts on first deploy.
UPDATE orders
SET print_alert_acknowledged_at=now()
WHERE status='sent' AND print_alert_acknowledged_at IS NULL;

CREATE TABLE IF NOT EXISTS lab_print_alert_agents (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'Windows Print Alert',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_print_alert_agents_enabled_idx ON lab_print_alert_agents(enabled,last_seen_at DESC);
