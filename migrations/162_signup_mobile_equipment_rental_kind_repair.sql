-- PhotoBridge v904R11 — keep shared OTP signup kinds compatible with equipment-store signup.
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
UPDATE signup_mobile_verifications
SET kind='photographer'
WHERE kind IS NULL OR kind NOT IN ('lab_trial','photographer','invite','public_retouch','equipment_rental_trial');
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
    WHERE conrelid='public.signup_mobile_verifications'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) ILIKE '%kind%'
  LOOP
    EXECUTE format('ALTER TABLE signup_mobile_verifications DROP CONSTRAINT IF EXISTS %I',r.conname);
  END LOOP;
END $$;
ALTER TABLE signup_mobile_verifications
  ADD CONSTRAINT signup_mobile_verifications_kind_check
  CHECK (kind IN ('lab_trial','photographer','invite','public_retouch','equipment_rental_trial'));
