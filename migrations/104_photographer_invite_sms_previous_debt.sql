-- PhotoBridge v0.17.431 — recipient-specific previous debt for lab photographer SMS invites

ALTER TABLE photographer_invite_sms_links
  ADD COLUMN IF NOT EXISTS previous_debt bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='photographer_invite_sms_links_previous_debt_check'
  ) THEN
    ALTER TABLE photographer_invite_sms_links
      ADD CONSTRAINT photographer_invite_sms_links_previous_debt_check
      CHECK (previous_debt IS NULL OR previous_debt >= 0);
  END IF;
END $$;
