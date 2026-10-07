-- PhotoBridge v0.17.289 — defensive repair for photographer invite schema on installations
-- that received an older partial invite migration.
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
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS uses integer NOT NULL DEFAULT 0;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS campaign text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS channel text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS target_mobile text;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE photographer_invites ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE photographer_invites SET issuer_type='admin' WHERE issuer_type IS NULL OR issuer_type NOT IN ('admin','lab','photographer');
UPDATE photographer_invites SET uses=0 WHERE uses IS NULL OR uses<0;
UPDATE photographer_invites SET max_uses=NULL WHERE max_uses IS NOT NULL AND max_uses<=0;
ALTER TABLE photographer_invites ALTER COLUMN issuer_type SET NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN issuer_lab_id DROP NOT NULL;
ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS photographer_invites_issuer_type_check;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_issuer_type_check CHECK (issuer_type IN ('admin','lab','photographer'));
ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS photographer_invites_max_uses_check;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS photographer_invites_uses_check;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_uses_check CHECK (uses >= 0);
CREATE INDEX IF NOT EXISTS photographer_invites_issuer_idx ON photographer_invites(issuer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS photographer_invites_active_idx ON photographer_invites(active,expires_at) WHERE active=true;

CREATE TABLE IF NOT EXISTS photographer_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invite_id,user_id)
);
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_user_idx ON photographer_invite_redemptions(user_id,redeemed_at DESC);
