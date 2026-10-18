-- R1291: auditable, rate-limited manually requested invoice SMS.
CREATE TABLE IF NOT EXISTS lab_manual_invoice_sms_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  sent_by uuid REFERENCES users(id),
  status text NOT NULL CHECK(status IN ('dispatching','sent','failed')),
  sms_reference text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS lab_manual_invoice_sms_recent_idx ON lab_manual_invoice_sms_sends(lab_id,customer_id,created_at DESC);
