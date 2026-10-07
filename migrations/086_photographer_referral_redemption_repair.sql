-- PhotoBridge v0.17.316 — Photographer referral redemption reliability
-- Keep referral history durable even on installations that received a partial invite schema.

CREATE TABLE IF NOT EXISTS photographer_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  commission_amount bigint NOT NULL DEFAULT 0,
  commission_status text NOT NULL DEFAULT 'not_applicable',
  commission_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL
);
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS redeemed_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL;

-- Partial historical schemas sometimes missed UNIQUE(invite_id,user_id). De-duplicate first,
-- then add the invariant required by reliable idempotent redemption writes.
WITH ranked AS (
  SELECT id,row_number() OVER (
    PARTITION BY invite_id,user_id
    ORDER BY (commission_status='awarded') DESC,redeemed_at ASC,id ASC
  ) rn
  FROM photographer_invite_redemptions
)
DELETE FROM photographer_invite_redemptions r USING ranked x WHERE r.id=x.id AND x.rn>1;
CREATE UNIQUE INDEX IF NOT EXISTS photographer_invite_redemptions_invite_user_uidx ON photographer_invite_redemptions(invite_id,user_id);
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_user_idx ON photographer_invite_redemptions(user_id,redeemed_at DESC);

-- Keep the displayed usage count consistent with the durable redemption rows.
UPDATE photographer_invites i
SET uses=(SELECT count(*)::int FROM photographer_invite_redemptions r WHERE r.invite_id=i.id),updated_at=now()
WHERE i.issuer_type='photographer';
