-- One-time, shop-scoped SMS invitations for handover staff.
-- Tokens are stored only as SHA-256 hashes and are never returned to managers.
CREATE TABLE IF NOT EXISTS equipment_rental_handover_staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  mobile text NOT NULL CHECK (mobile ~ '^09[0-9]{9}$'),
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash)=64),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','redeemed','cancelled')),
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id,mobile)
);
CREATE INDEX IF NOT EXISTS idx_rental_staff_invite_pending
  ON equipment_rental_handover_staff_invitations(expires_at) WHERE status='pending';
