-- PhotoBridge v896 — durable, schema-independent external-accounting tracking.
CREATE TABLE IF NOT EXISTS external_accounting_marks (
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  document_type text NOT NULL DEFAULT 'invoice',
  document_id uuid NOT NULL,
  recorded boolean NOT NULL DEFAULT true,
  recorded_at timestamptz,
  recorded_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_type,owner_id,document_type,document_id)
);
CREATE INDEX IF NOT EXISTS external_accounting_marks_owner_idx
  ON external_accounting_marks(owner_type,owner_id,recorded,recorded_at DESC);
