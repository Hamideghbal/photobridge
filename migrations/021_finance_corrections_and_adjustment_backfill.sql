-- PhotoBridge v0.16.9 — auditable finance corrections + repair older discount ledger entries

CREATE SEQUENCE IF NOT EXISTS finance_correction_document_seq START WITH 200001;

CREATE TABLE IF NOT EXISTS finance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('invoice','payment','expense','discount')),
  target_id uuid NOT NULL,
  document_number bigint NOT NULL DEFAULT nextval('finance_correction_document_seq'),
  correction_kind text NOT NULL,
  amount bigint,
  old_value jsonb,
  new_value jsonb,
  note text NOT NULL,
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_corrections_document_number_idx ON finance_corrections(document_number);
CREATE INDEX IF NOT EXISTS finance_corrections_lab_date_idx ON finance_corrections(lab_id,created_at DESC);
CREATE INDEX IF NOT EXISTS finance_corrections_target_idx ON finance_corrections(lab_id,target_type,target_id,created_at DESC);

-- Older customer discounts could exist as visible discount documents while their
-- receivable ledger transaction was missing. Rebuild the balanced accounting
-- document so those discounts also appear in customer statements.
INSERT INTO finance_transactions(lab_id,txn_date,description,reference_type,reference_id,created_by,created_at)
SELECT x.lab_id,x.adjusted_at,'تخفیف / تعدیل حساب مشتری','customer_adjustment',x.id,x.created_by,x.created_at
FROM finance_customer_adjustments x
WHERE x.transaction_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM finance_transactions t
    WHERE t.lab_id=x.lab_id AND t.reference_type='customer_adjustment' AND t.reference_id=x.id
  );

INSERT INTO finance_entries(transaction_id,account_id,customer_id,debit,credit,note)
SELECT t.id,a.id,x.customer_id,x.amount,0,COALESCE(x.note,'تخفیف حساب مشتری')
FROM finance_customer_adjustments x
JOIN finance_transactions t ON t.lab_id=x.lab_id AND t.reference_type='customer_adjustment' AND t.reference_id=x.id
JOIN finance_accounts a ON a.lab_id=x.lab_id AND a.system_key='sales_discount'
WHERE NOT EXISTS (
  SELECT 1 FROM finance_entries e WHERE e.transaction_id=t.id AND e.account_id=a.id
);

INSERT INTO finance_entries(transaction_id,account_id,customer_id,debit,credit,note)
SELECT t.id,a.id,x.customer_id,0,x.amount,'کاهش مانده حساب مشتری'
FROM finance_customer_adjustments x
JOIN finance_transactions t ON t.lab_id=x.lab_id AND t.reference_type='customer_adjustment' AND t.reference_id=x.id
JOIN finance_accounts a ON a.lab_id=x.lab_id AND a.system_key='receivable'
WHERE NOT EXISTS (
  SELECT 1 FROM finance_entries e WHERE e.transaction_id=t.id AND e.account_id=a.id
);

UPDATE finance_customer_adjustments x
SET transaction_id=t.id
FROM finance_transactions t
WHERE x.transaction_id IS NULL
  AND t.lab_id=x.lab_id
  AND t.reference_type='customer_adjustment'
  AND t.reference_id=x.id;

SELECT setval('finance_correction_document_seq',
  GREATEST(200001, COALESCE((SELECT max(document_number) FROM finance_corrections),200001)), true);
