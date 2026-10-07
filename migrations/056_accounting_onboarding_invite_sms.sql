CREATE TABLE IF NOT EXISTS lab_accounting_settings (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL DEFAULT 'holo' CHECK (software IN ('generic','holo','sepidar','mahak')),
  setup_completed boolean NOT NULL DEFAULT false,
  new_customer_policy text NOT NULL DEFAULT 'approval' CHECK (new_customer_policy IN ('auto_new','approval','skip')),
  invite_requires_setup boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS target_mobile text,
  ADD COLUMN IF NOT EXISTS target_name text,
  ADD COLUMN IF NOT EXISTS accounting_software text,
  ADD COLUMN IF NOT EXISTS accounting_external_party_id uuid REFERENCES accounting_external_parties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accounting_external_code text,
  ADD COLUMN IF NOT EXISTS accounting_external_name text,
  ADD COLUMN IF NOT EXISTS accounting_external_mobile text,
  ADD COLUMN IF NOT EXISTS sms_status text,
  ADD COLUMN IF NOT EXISTS sms_reference text,
  ADD COLUMN IF NOT EXISTS sms_sent_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='invitations_accounting_software_check'
  ) THEN
    ALTER TABLE invitations
      ADD CONSTRAINT invitations_accounting_software_check
      CHECK (accounting_software IS NULL OR accounting_software IN ('generic','holo','sepidar','mahak'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='invitations_sms_status_check'
  ) THEN
    ALTER TABLE invitations
      ADD CONSTRAINT invitations_sms_status_check
      CHECK (sms_status IS NULL OR sms_status IN ('sent','failed','not_sent'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS invitations_lab_target_mobile_idx
  ON invitations(lab_id, target_mobile, created_at DESC);
CREATE INDEX IF NOT EXISTS invitations_accounting_party_idx
  ON invitations(accounting_external_party_id);
