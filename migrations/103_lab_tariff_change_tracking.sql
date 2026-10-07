CREATE TABLE IF NOT EXISTS lab_tariff_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_tariff_revisions_lab_created ON lab_tariff_revisions(lab_id,created_at DESC);

ALTER TABLE lab_memberships ADD COLUMN IF NOT EXISTS tariff_ack_at timestamptz;
UPDATE lab_memberships SET tariff_ack_at=now() WHERE role='customer' AND tariff_ack_at IS NULL;
ALTER TABLE lab_memberships ALTER COLUMN tariff_ack_at SET DEFAULT now();
