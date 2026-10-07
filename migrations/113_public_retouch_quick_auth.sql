-- PhotoBridge v0.17.587 — quick public retouch account + SMS verification.
-- Reuse the shared signup OTP table and allow the public-retouch challenge kind.

UPDATE signup_mobile_verifications
SET kind='photographer'
WHERE kind IS NULL OR kind NOT IN ('lab_trial','photographer','invite','public_retouch');

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='public.signup_mobile_verifications'::regclass AND contype='c' LOOP
    EXECUTE format('ALTER TABLE signup_mobile_verifications DROP CONSTRAINT IF EXISTS %I',r.conname);
  END LOOP;
END $$;

ALTER TABLE signup_mobile_verifications
  ADD CONSTRAINT signup_mobile_verifications_kind_check
  CHECK (kind IN ('lab_trial','photographer','invite','public_retouch'));

ALTER TABLE signup_mobile_verifications
  ADD CONSTRAINT signup_mobile_verifications_status_check
  CHECK (status IN ('pending','verified','used','expired','failed'));
