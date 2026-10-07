-- PhotoBridge v0.16.8 — printable/visible discount documents
CREATE SEQUENCE IF NOT EXISTS finance_customer_adjustment_document_seq START WITH 100001;

ALTER TABLE finance_customer_adjustments
  ADD COLUMN IF NOT EXISTS document_number bigint;

ALTER TABLE finance_customer_adjustments
  ALTER COLUMN document_number SET DEFAULT nextval('finance_customer_adjustment_document_seq');

UPDATE finance_customer_adjustments
SET document_number=nextval('finance_customer_adjustment_document_seq')
WHERE document_number IS NULL;

ALTER TABLE finance_customer_adjustments
  ALTER COLUMN document_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS finance_customer_adjustments_document_number_idx
  ON finance_customer_adjustments(document_number);

SELECT setval('finance_customer_adjustment_document_seq',
  GREATEST(100001, COALESCE((SELECT max(document_number) FROM finance_customer_adjustments),100001)), true);
