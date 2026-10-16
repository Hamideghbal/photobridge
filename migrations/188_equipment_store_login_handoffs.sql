-- One-time browser handoff between a verified equipment-shop hostname and PhotoBridge.
-- Store only a SHA-256 hash of the bearer code; each code is redeemed once.
CREATE TABLE IF NOT EXISTS equipment_store_login_handoffs (
  token_hash text PRIMARY KEY CHECK (length(token_hash)=64),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  origin_host text NOT NULL CHECK (length(origin_host) BETWEEN 4 AND 253),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_store_login_handoff_expiry
  ON equipment_store_login_handoffs(expires_at);
