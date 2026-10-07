-- PhotoBridge v0.17.618 — rental shop exact location + invitation-scoped photographer access

ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_address text;

ALTER TABLE photographer_invites
  ADD COLUMN IF NOT EXISTS issuer_rental_shop_id uuid REFERENCES equipment_rental_shops(id) ON DELETE SET NULL;

ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS photographer_invites_issuer_type_check;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_issuer_type_check
  CHECK (issuer_type IN ('admin','lab','photographer','rental'));

CREATE INDEX IF NOT EXISTS photographer_invites_rental_shop_idx
  ON photographer_invites(issuer_rental_shop_id,active,created_at DESC)
  WHERE issuer_type='rental';

CREATE TABLE IF NOT EXISTS equipment_rental_photographer_scopes (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  source_invite_id uuid REFERENCES photographer_invites(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rental_photographer_scopes_shop_idx
  ON equipment_rental_photographer_scopes(shop_id,created_at DESC);
