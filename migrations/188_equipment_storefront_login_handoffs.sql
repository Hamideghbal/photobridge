-- A short-lived, single-use handoff from an authenticated custom equipment-store
-- hostname to the primary PhotoBridge photographer session. Never store raw codes.
CREATE TABLE IF NOT EXISTS equipment_storefront_login_handoffs (
  code_hash text PRIMARY KEY CHECK (length(code_hash)=64),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  source_hostname text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 seconds')
);
CREATE INDEX IF NOT EXISTS equipment_storefront_handoff_expiry_idx
  ON equipment_storefront_login_handoffs (expires_at);
