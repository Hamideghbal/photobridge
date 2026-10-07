-- PhotoBridge v0.17.90 — file-first accounting import workflow

ALTER TABLE accounting_party_mappings
  ADD COLUMN IF NOT EXISTS source_resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS accounting_party_mappings_source_resolved_idx
  ON accounting_party_mappings(lab_id, software, source_resolved_at);
