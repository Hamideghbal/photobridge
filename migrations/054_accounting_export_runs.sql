CREATE TABLE IF NOT EXISTS accounting_export_runs (
  id uuid PRIMARY KEY,
  owner_type text NOT NULL CHECK (owner_type IN ('lab','customer')),
  owner_id uuid NOT NULL,
  lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  from_date date,
  to_date date,
  only_new boolean NOT NULL DEFAULT false,
  document_count integer NOT NULL DEFAULT 0,
  invoice_count integer NOT NULL DEFAULT 0,
  total_amount bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_export_runs_owner_idx
  ON accounting_export_runs(owner_type, owner_id, software, created_at DESC);

CREATE TABLE IF NOT EXISTS accounting_export_documents (
  owner_type text NOT NULL CHECK (owner_type IN ('lab','customer')),
  owner_id uuid NOT NULL,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  run_id uuid NOT NULL REFERENCES accounting_export_runs(id) ON DELETE CASCADE,
  exported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_type, owner_id, software, document_type, document_id)
);

CREATE INDEX IF NOT EXISTS accounting_export_documents_run_idx
  ON accounting_export_documents(run_id);
