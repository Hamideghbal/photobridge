-- PhotoBridge v0.17.89 — safe accounting mapping disconnect + audit history

ALTER TABLE accounting_party_mappings
  ADD COLUMN IF NOT EXISTS connected_at timestamptz;

UPDATE accounting_party_mappings
SET connected_at = COALESCE(connected_at, updated_at, now())
WHERE connected_at IS NULL;

ALTER TABLE accounting_party_mappings
  ALTER COLUMN connected_at SET DEFAULT now();

CREATE TABLE IF NOT EXISTS accounting_party_mapping_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('connect','change','disconnect','auto_connect','auto_refresh')),
  external_party_id uuid,
  external_code text,
  external_name text,
  external_mobile text,
  mapping_source text,
  opening_balance bigint,
  note text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_party_mapping_history_lookup_idx
  ON accounting_party_mapping_history(lab_id, software, customer_id, created_at DESC);

ALTER TABLE lab_accounting_settings
  ALTER COLUMN invite_requires_setup SET DEFAULT false;

UPDATE lab_accounting_settings
SET invite_requires_setup=false
WHERE invite_requires_setup=true;

ALTER TABLE accounting_party_mappings
  DROP CONSTRAINT IF EXISTS accounting_party_mappings_mapping_source_check;
ALTER TABLE accounting_party_mappings
  ADD CONSTRAINT accounting_party_mappings_mapping_source_check
  CHECK (mapping_source IN ('manual','auto_mobile','auto_name','invitation'));
