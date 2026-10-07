-- PhotoBridge v0.17.303 — public Photographer invite reliability
-- A fresh migration is intentional: Production databases that already recorded 074/076
-- must still re-run the final invite schema guarantees used by the public signup route.

CREATE TABLE IF NOT EXISTS photographer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  issuer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer_type text NOT NULL DEFAULT 'admin',
  issuer_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  campaign text,
  channel text,
  target_mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS issuer_type text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS issuer_lab_id uuid;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS max_uses integer;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS uses integer;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS active boolean;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS campaign text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS channel text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS target_mobile text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE photographer_invites ALTER COLUMN issuer_lab_id DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN max_uses DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN campaign DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN channel DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN target_mobile DROP NOT NULL;

UPDATE photographer_invites SET issuer_type=CASE WHEN issuer_lab_id IS NOT NULL THEN 'lab' ELSE COALESCE(NULLIF(issuer_type,''),'admin') END WHERE issuer_type IS NULL OR issuer_type NOT IN ('admin','lab','photographer');
UPDATE photographer_invites SET uses=0 WHERE uses IS NULL OR uses<0;
UPDATE photographer_invites SET active=true WHERE active IS NULL;
UPDATE photographer_invites SET metadata='{}'::jsonb WHERE metadata IS NULL;
UPDATE photographer_invites SET created_at=now() WHERE created_at IS NULL;
UPDATE photographer_invites SET updated_at=COALESCE(created_at,now()) WHERE updated_at IS NULL;

-- Lab/Photographer links remain permanent and reusable.
UPDATE photographer_invites
SET max_uses=NULL,expires_at=NULL,target_mobile=NULL,campaign=NULL,
    metadata=COALESCE(metadata,'{}'::jsonb)||'{"permanent":true,"reusable":true}'::jsonb,
    updated_at=now()
WHERE issuer_type IN ('lab','photographer') AND active=true;

CREATE TABLE IF NOT EXISTS photographer_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invite_id,user_id)
);
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_user_idx ON photographer_invite_redemptions(user_id,redeemed_at DESC);
