-- PhotoBridge v0.17.83 — import legacy customer balances as auditable opening balances

ALTER TABLE accounting_external_parties
  ADD COLUMN IF NOT EXISTS opening_balance bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_balance_provided boolean NOT NULL DEFAULT false;

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS accounting_opening_balance bigint;

CREATE TABLE IF NOT EXISTS accounting_opening_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_party_id uuid REFERENCES accounting_external_parties(id) ON DELETE SET NULL,
  source_external_code text,
  source_external_name text,
  source_external_mobile text,
  amount bigint NOT NULL DEFAULT 0,
  initialized_by uuid REFERENCES users(id) ON DELETE SET NULL,
  initialized_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id, software, customer_id)
);

CREATE INDEX IF NOT EXISTS accounting_opening_balances_lab_software_idx
  ON accounting_opening_balances(lab_id, software, customer_id);

CREATE TABLE IF NOT EXISTS accounting_opening_balance_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_balance_id uuid NOT NULL REFERENCES accounting_opening_balances(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_amount bigint NOT NULL DEFAULT 0,
  new_amount bigint NOT NULL DEFAULT 0,
  delta bigint NOT NULL DEFAULT 0,
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE SET NULL,
  note text,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_opening_balance_changes_customer_idx
  ON accounting_opening_balance_changes(lab_id, customer_id, changed_at DESC);

INSERT INTO finance_accounts(lab_id,code,name,kind,system_key)
SELECT l.id,'3101','مانده افتتاحیه انتقالی','equity','opening_balance_equity'
FROM labs l
ON CONFLICT (lab_id, system_key) DO NOTHING;
