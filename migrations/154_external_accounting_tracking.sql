-- PhotoBridge v890 — manual tracking of invoices entered in the shop/lab's external accounting software.
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS external_accounting_recorded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_accounting_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_accounting_recorded_by uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE equipment_rental_invoices
  ADD COLUMN IF NOT EXISTS external_accounting_recorded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_accounting_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_accounting_recorded_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invoices_external_accounting_recorded_idx
  ON invoices(lab_id, external_accounting_recorded, issued_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_invoices_external_accounting_recorded_idx
  ON equipment_rental_invoices(shop_id, external_accounting_recorded, issued_at DESC);
