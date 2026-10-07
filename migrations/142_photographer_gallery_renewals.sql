CREATE TABLE IF NOT EXISTS photographer_gallery_renewals (
  id uuid PRIMARY KEY,
  gallery_id uuid NOT NULL REFERENCES photographer_client_galleries(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  days integer NOT NULL DEFAULT 30,
  amount bigint NOT NULL DEFAULT 0,
  wallet_transaction_id text,
  deadline_kind text NOT NULL CHECK (deadline_kind IN ('expires_at','cleanup_after')),
  deadline_before timestamptz,
  deadline_after timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS photographer_gallery_renewals_owner_key_uidx
  ON photographer_gallery_renewals(owner_id,idempotency_key);
CREATE INDEX IF NOT EXISTS photographer_gallery_renewals_gallery_idx
  ON photographer_gallery_renewals(gallery_id,created_at DESC);
