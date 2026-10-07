-- PhotoBridge v904R10 — repair activation workflow columns for deployments that missed migration 160.
ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS activation_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS activation_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS activation_reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activation_review_note text;

ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS activation_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS activation_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS activation_reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activation_review_note text;

UPDATE labs SET activation_status='approved' WHERE activation_status IS NULL;
UPDATE equipment_rental_shops SET activation_status='approved' WHERE activation_status IS NULL;

CREATE INDEX IF NOT EXISTS labs_activation_status_idx ON labs(activation_status,activation_requested_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_shops_activation_status_idx ON equipment_rental_shops(activation_status,activation_requested_at DESC);
