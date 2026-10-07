-- PhotoBridge v0.17.298 — album cover catalog + production invite schema repair
-- IMPORTANT: this is a new migration on purpose. Previous invite repairs were appended to
-- already-applied migration files on some installations, so they never re-ran in production.

-- Album cover catalog: keep the existing flat price rows for runtime compatibility, but add
-- explicit material/model fields so the Lab UI can group colors by material and price by
-- size × material × model without duplicating configuration in the operator interface.
ALTER TABLE lab_album_covers ADD COLUMN IF NOT EXISTS material_name text;
ALTER TABLE lab_album_covers ADD COLUMN IF NOT EXISTS model_name text;
UPDATE lab_album_covers
SET material_name=COALESCE(NULLIF(btrim(material_name),''),NULLIF(btrim(name),''),'جلد'),
    model_name=COALESCE(NULLIF(btrim(model_name),''),'استاندارد')
WHERE material_name IS NULL OR btrim(material_name)='' OR model_name IS NULL OR btrim(model_name)='';
CREATE INDEX IF NOT EXISTS lab_album_covers_catalog_idx ON lab_album_covers(lab_id,material_name,model_name,size_id,active,sort_order);

-- Canonical invite table/columns. CREATE/ADD are defensive so this repair also works on
-- databases that received only a partial historical invite migration.
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

-- A few production databases can still contain obsolete columns from an earlier partial
-- invite implementation. If such a column is NOT NULL and has no default, every modern
-- INSERT fails with PostgreSQL 23502 even though the current app never uses that column.
-- Only relax non-canonical legacy columns; canonical required fields remain strict below.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT a.attname
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='public.photographer_invites'::regclass
      AND a.attnum>0 AND NOT a.attisdropped AND a.attnotnull
      AND d.adbin IS NULL
      AND a.attname NOT IN ('id','code','issuer_user_id','issuer_type','uses','active','metadata','created_at','updated_at')
  LOOP
    EXECUTE format('ALTER TABLE photographer_invites ALTER COLUMN %I DROP NOT NULL',r.attname);
  END LOOP;
END $$;

ALTER TABLE photographer_invites ALTER COLUMN issuer_lab_id DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN max_uses DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN campaign DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN channel DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN target_mobile DROP NOT NULL;

UPDATE photographer_invites SET issuer_type='admin' WHERE issuer_type IS NULL OR issuer_type NOT IN ('admin','lab','photographer');
UPDATE photographer_invites SET uses=0 WHERE uses IS NULL OR uses<0;
UPDATE photographer_invites SET active=true WHERE active IS NULL;
UPDATE photographer_invites SET metadata='{}'::jsonb WHERE metadata IS NULL;
UPDATE photographer_invites SET created_at=now() WHERE created_at IS NULL;
UPDATE photographer_invites SET updated_at=COALESCE(created_at,now()) WHERE updated_at IS NULL;
UPDATE photographer_invites SET max_uses=NULL WHERE max_uses IS NOT NULL AND max_uses<=0;

ALTER TABLE photographer_invites ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE photographer_invites ALTER COLUMN issuer_type SET DEFAULT 'admin';
ALTER TABLE photographer_invites ALTER COLUMN uses SET DEFAULT 0;
ALTER TABLE photographer_invites ALTER COLUMN active SET DEFAULT true;
ALTER TABLE photographer_invites ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
ALTER TABLE photographer_invites ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE photographer_invites ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE photographer_invites ALTER COLUMN issuer_type SET NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN uses SET NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN active SET NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN metadata SET NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN updated_at SET NOT NULL;

-- Remove incompatible historical CHECKs and restore only the canonical business checks.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='public.photographer_invites'::regclass AND contype='c'
  LOOP
    EXECUTE format('ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS %I',r.conname);
  END LOOP;
END $$;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_issuer_type_check CHECK (issuer_type IN ('admin','lab','photographer'));
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_uses_check CHECK (uses >= 0);
CREATE INDEX IF NOT EXISTS photographer_invites_issuer_idx ON photographer_invites(issuer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS photographer_invites_active_idx ON photographer_invites(active,expires_at) WHERE active=true;

-- Redemption/commission columns are needed by the list view immediately after creation.
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
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_commission_idx ON photographer_invite_redemptions(commission_status,redeemed_at DESC);
