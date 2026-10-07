CREATE TABLE IF NOT EXISTS accounting_external_parties (
  id uuid PRIMARY KEY,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  external_code text,
  name text NOT NULL,
  mobile text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_external_parties_lab_software_idx
  ON accounting_external_parties(lab_id, software, name);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_external_parties_code_unique_idx
  ON accounting_external_parties(lab_id, software, external_code)
  WHERE external_code IS NOT NULL AND btrim(external_code) <> '';

CREATE TABLE IF NOT EXISTS accounting_party_mappings (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_party_id uuid REFERENCES accounting_external_parties(id) ON DELETE SET NULL,
  external_code text,
  external_name text NOT NULL,
  external_mobile text,
  mapping_source text NOT NULL DEFAULT 'manual' CHECK (mapping_source IN ('manual','auto_mobile','auto_name')),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lab_id, software, customer_id)
);

CREATE INDEX IF NOT EXISTS accounting_party_mappings_external_idx
  ON accounting_party_mappings(lab_id, software, external_code);

ALTER TABLE accounting_export_runs
  ADD COLUMN IF NOT EXISTS unmapped_mode text NOT NULL DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='accounting_export_runs_unmapped_mode_check'
  ) THEN
    ALTER TABLE accounting_export_runs
      ADD CONSTRAINT accounting_export_runs_unmapped_mode_check
      CHECK (unmapped_mode IN ('new','skip'));
  END IF;
END $$;
