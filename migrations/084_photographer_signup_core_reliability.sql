-- PhotoBridge v0.17.311 — photographer invite/signup core reliability
-- Keep the activation path independent from optional wallet/gallery/referral writes.

ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lng double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_active_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_joined_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_suspended_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_suspended_by uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_deleted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_deleted_by uuid;

ALTER TABLE labs ADD COLUMN IF NOT EXISTS service_only boolean NOT NULL DEFAULT false;
ALTER TABLE lab_memberships ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

INSERT INTO labs(name,slug,active,active_from,active_until,timezone,resolution_min,resolution_max,resolution_target,service_only)
SELECT 'PhotoBridge · عکاسان مستقل','photobridge-standalone-photographers',true,now(),NULL,'Asia/Tehran',240,360,300,true
WHERE NOT EXISTS (SELECT 1 FROM labs WHERE service_only=true OR slug='photobridge-standalone-photographers');
UPDATE labs SET service_only=true,active=true WHERE slug='photobridge-standalone-photographers';

CREATE TABLE IF NOT EXISTS photographer_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  commission_amount bigint NOT NULL DEFAULT 0,
  commission_status text NOT NULL DEFAULT 'not_applicable',
  commission_transaction_id uuid,
  UNIQUE(invite_id,user_id)
);
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS redeemed_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_transaction_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS photographer_invite_redemptions_invite_user_uidx ON photographer_invite_redemptions(invite_id,user_id);
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_user_idx ON photographer_invite_redemptions(user_id,redeemed_at DESC);
