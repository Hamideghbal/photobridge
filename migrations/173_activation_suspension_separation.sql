-- R100F11: public activation and administrative suspension are separate states.
ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS labs_public_activation_idx ON labs(active,suspended,service_only);
CREATE INDEX IF NOT EXISTS equipment_rental_shops_public_activation_idx ON equipment_rental_shops(active,suspended,deleted_at);
