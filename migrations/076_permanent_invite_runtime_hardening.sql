-- PhotoBridge v0.17.301 — permanent referral codes hardening
-- Re-runs the invite schema repair in a NEW migration and guarantees one reusable
-- active code per Photographer/Lab issuer. This is intentionally separate from
-- 074/075 so already-deployed databases must execute it.

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

UPDATE photographer_invites
SET issuer_type=CASE
  WHEN issuer_lab_id IS NOT NULL THEN 'lab'
  ELSE COALESCE(NULLIF(issuer_type,''),'admin')
END
WHERE issuer_type IS NULL OR issuer_type NOT IN ('admin','lab','photographer');
UPDATE photographer_invites SET uses=0 WHERE uses IS NULL OR uses<0;
UPDATE photographer_invites SET active=true WHERE active IS NULL;
UPDATE photographer_invites SET metadata='{}'::jsonb WHERE metadata IS NULL;
UPDATE photographer_invites SET created_at=now() WHERE created_at IS NULL;
UPDATE photographer_invites SET updated_at=COALESCE(created_at,now()) WHERE updated_at IS NULL;

-- Photographer/Lab codes are permanent and unrestricted.
UPDATE photographer_invites
SET max_uses=NULL,
    expires_at=NULL,
    target_mobile=NULL,
    campaign=NULL,
    metadata=COALESCE(metadata,'{}'::jsonb)||'{"permanent":true,"reusable":true}'::jsonb,
    updated_at=now()
WHERE issuer_type IN ('photographer','lab') AND active=true;

-- Keep only the newest active code for each permanent issuer; older duplicates stay
-- in history but are deactivated so the panel always has exactly one live code.
WITH ranked AS (
  SELECT id,row_number() OVER (PARTITION BY issuer_user_id ORDER BY created_at DESC,id DESC) rn
  FROM photographer_invites
  WHERE issuer_type='photographer' AND active=true
)
UPDATE photographer_invites i SET active=false,updated_at=now()
FROM ranked r WHERE i.id=r.id AND r.rn>1;

WITH ranked AS (
  SELECT id,row_number() OVER (PARTITION BY issuer_lab_id ORDER BY created_at DESC,id DESC) rn
  FROM photographer_invites
  WHERE issuer_type='lab' AND issuer_lab_id IS NOT NULL AND active=true
)
UPDATE photographer_invites i SET active=false,updated_at=now()
FROM ranked r WHERE i.id=r.id AND r.rn>1;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='public.photographer_invites'::regclass AND contype='c'
  LOOP
    EXECUTE format('ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS %I',r.conname);
  END LOOP;
END $$;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_issuer_type_check CHECK (issuer_type IN ('admin','lab','photographer'));
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_uses_check CHECK (uses >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS photographer_invites_one_active_photographer_idx
  ON photographer_invites(issuer_user_id)
  WHERE issuer_type='photographer' AND active=true;
CREATE UNIQUE INDEX IF NOT EXISTS photographer_invites_one_active_lab_idx
  ON photographer_invites(issuer_lab_id)
  WHERE issuer_type='lab' AND issuer_lab_id IS NOT NULL AND active=true;
