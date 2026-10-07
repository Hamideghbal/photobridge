-- PhotoBridge v0.17.306 — public Photographer signup runtime hardening
-- Fresh migration so Production definitely receives the schema guarantees used by
-- /photographer/signup and its OTP verification flow.

ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lng double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_active_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_joined_at timestamptz;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS service_only boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS signup_mobile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  mobile text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  password_hash text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'unknown',
  code_hash text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  request_ip_hash text,
  expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes',
  verified_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS code_hash text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS attempts integer;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS request_ip_hash text;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS used_at timestamptz;
ALTER TABLE signup_mobile_verifications ADD COLUMN IF NOT EXISTS created_at timestamptz;
UPDATE signup_mobile_verifications SET kind='photographer' WHERE kind IS NULL;
UPDATE signup_mobile_verifications SET mobile='' WHERE mobile IS NULL;
UPDATE signup_mobile_verifications SET payload='{}'::jsonb WHERE payload IS NULL;
UPDATE signup_mobile_verifications SET password_hash='' WHERE password_hash IS NULL;
UPDATE signup_mobile_verifications SET provider='unknown' WHERE provider IS NULL;
UPDATE signup_mobile_verifications SET code_hash='' WHERE code_hash IS NULL;
UPDATE signup_mobile_verifications SET status='failed' WHERE status IS NULL OR status NOT IN ('pending','verified','used','expired','failed');
UPDATE signup_mobile_verifications SET attempts=0 WHERE attempts IS NULL OR attempts<0;
UPDATE signup_mobile_verifications SET expires_at=now() WHERE expires_at IS NULL;
UPDATE signup_mobile_verifications SET created_at=now() WHERE created_at IS NULL;
ALTER TABLE signup_mobile_verifications ALTER COLUMN payload SET DEFAULT '{}'::jsonb;
ALTER TABLE signup_mobile_verifications ALTER COLUMN password_hash SET DEFAULT '';
ALTER TABLE signup_mobile_verifications ALTER COLUMN provider SET DEFAULT 'unknown';
ALTER TABLE signup_mobile_verifications ALTER COLUMN code_hash SET DEFAULT '';
ALTER TABLE signup_mobile_verifications ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE signup_mobile_verifications ALTER COLUMN attempts SET DEFAULT 0;
ALTER TABLE signup_mobile_verifications ALTER COLUMN created_at SET DEFAULT now();
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='public.signup_mobile_verifications'::regclass AND contype='c' LOOP
    EXECUTE format('ALTER TABLE signup_mobile_verifications DROP CONSTRAINT IF EXISTS %I',r.conname);
  END LOOP;
END $$;
ALTER TABLE signup_mobile_verifications ADD CONSTRAINT signup_mobile_verifications_kind_check CHECK (kind IN ('lab_trial','photographer','invite'));
ALTER TABLE signup_mobile_verifications ADD CONSTRAINT signup_mobile_verifications_status_check CHECK (status IN ('pending','verified','used','expired','failed'));
CREATE INDEX IF NOT EXISTS signup_mobile_verifications_mobile_idx ON signup_mobile_verifications(mobile,kind,created_at DESC);
CREATE INDEX IF NOT EXISTS signup_mobile_verifications_ip_idx ON signup_mobile_verifications(request_ip_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS signup_mobile_verifications_expiry_idx ON signup_mobile_verifications(status,expires_at);

CREATE TABLE IF NOT EXISTS photographer_service_wallets (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS photographer_service_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_key text REFERENCES platform_services(service_key) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('credit','debit','refund','adjustment')),
  amount bigint NOT NULL CHECK (amount > 0),
  balance_after bigint NOT NULL CHECK (balance_after >= 0),
  reference_type text,
  reference_id text,
  reference_key text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS photographer_wallet_tx_ref_key_uidx ON photographer_service_wallet_transactions(user_id,reference_key) WHERE reference_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS photographer_gallery_access (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  plan_code text NOT NULL DEFAULT 'payg',
  plan_status text NOT NULL DEFAULT 'active',
  active_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photographer_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  commission_amount bigint NOT NULL DEFAULT 0,
  commission_status text NOT NULL DEFAULT 'not_applicable',
  commission_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL,
  UNIQUE(invite_id,user_id)
);
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL;

INSERT INTO labs(name,slug,active,active_from,active_until,timezone,resolution_min,resolution_max,resolution_target,service_only)
SELECT 'PhotoBridge · عکاسان مستقل','photobridge-standalone-photographers',true,now(),NULL,'Asia/Tehran',240,360,300,true
WHERE NOT EXISTS (SELECT 1 FROM labs WHERE service_only=true OR slug='photobridge-standalone-photographers');
UPDATE labs SET service_only=true WHERE slug='photobridge-standalone-photographers';
