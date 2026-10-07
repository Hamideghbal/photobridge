ALTER TABLE accounting_external_parties
  ADD COLUMN IF NOT EXISTS person_name text;
