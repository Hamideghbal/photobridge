-- PhotoBridge v0.16.5 — customer sub-ledger, account-level payments and periodic discounts

ALTER TABLE finance_payments ALTER COLUMN invoice_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS lab_customer_finance_settings (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_enabled boolean NOT NULL DEFAULT false,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_every_invoices integer NOT NULL DEFAULT 10 CHECK (discount_every_invoices BETWEEN 1 AND 1000),
  last_discount_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lab_id, customer_id)
);

CREATE TABLE IF NOT EXISTS finance_customer_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind text NOT NULL DEFAULT 'discount' CHECK (kind IN ('discount','credit','correction')),
  amount bigint NOT NULL CHECK (amount > 0),
  percent numeric(5,2),
  base_amount bigint,
  invoice_count integer,
  period_from timestamptz,
  period_to timestamptz,
  note text,
  adjusted_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_customer_adjustments_customer_idx
  ON finance_customer_adjustments(lab_id, customer_id, adjusted_at DESC);

INSERT INTO finance_accounts(lab_id,code,name,kind,system_key)
SELECT l.id,'5201','تخفیفات و تعدیلات فروش','expense','sales_discount'
FROM labs l
ON CONFLICT (lab_id, system_key) DO NOTHING;
