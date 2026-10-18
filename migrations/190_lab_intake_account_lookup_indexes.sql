-- R1294: customer-specific accounting retrieval instead of loading every customer at dialog opening.
CREATE INDEX IF NOT EXISTS invoices_lab_customer_issued_idx
  ON invoices (lab_id,customer_id,issued_at DESC,id DESC);

CREATE INDEX IF NOT EXISTS finance_entries_customer_transaction_idx
  ON finance_entries (customer_id,transaction_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invitations_lab_pending_mobile_created_idx
  ON invitations (lab_id,target_mobile,created_at DESC)
  WHERE active=true AND uses=0;
