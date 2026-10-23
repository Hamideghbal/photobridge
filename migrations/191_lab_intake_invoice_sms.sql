-- Per-order consent and durable delivery state; existing orders remain opted out.
CREATE TABLE IF NOT EXISTS lab_intake_invoice_sms (
 order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
 lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
 customer_id uuid NOT NULL REFERENCES users(id),
 requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
 requested boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'not_requested' CHECK(status IN ('not_requested','pending','dispatching','sent','failed')),
 invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
 sms_reference text,error text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS lab_intake_invoice_sms_pending ON lab_intake_invoice_sms(created_at) WHERE requested=true AND status='pending';
