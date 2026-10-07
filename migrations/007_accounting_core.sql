-- PhotoBridge v0.12.0 — core accounting ledger, payments and expenses

CREATE TABLE IF NOT EXISTS finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('asset','liability','equity','income','expense')),
  system_key text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id, code),
  UNIQUE(lab_id, system_key)
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  txn_date timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  reference_type text,
  reference_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_transactions_reference_uidx
  ON finance_transactions(lab_id, reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS finance_transactions_lab_date_idx
  ON finance_transactions(lab_id, txn_date DESC);

CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  debit bigint NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit bigint NOT NULL DEFAULT 0 CHECK (credit >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);
CREATE INDEX IF NOT EXISTS finance_entries_tx_idx ON finance_entries(transaction_id);
CREATE INDEX IF NOT EXISTS finance_entries_customer_idx ON finance_entries(customer_id);
CREATE INDEX IF NOT EXISTS finance_entries_invoice_idx ON finance_entries(invoice_id);

CREATE TABLE IF NOT EXISTS finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','transfer','cheque','other')),
  note text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_payments_lab_date_idx ON finance_payments(lab_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS finance_payments_invoice_idx ON finance_payments(invoice_id);

CREATE TABLE IF NOT EXISTS finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  category text NOT NULL,
  payee text,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','transfer','cheque','other')),
  note text,
  spent_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_expenses_lab_date_idx ON finance_expenses(lab_id, spent_at DESC);

-- Standard chart of accounts for every lab
INSERT INTO finance_accounts(lab_id,code,name,kind,system_key)
SELECT l.id,v.code,v.name,v.kind,v.system_key
FROM labs l
CROSS JOIN (VALUES
  ('1101','صندوق','asset','cash'),
  ('1102','بانک / کارتخوان','asset','bank'),
  ('1201','حساب‌های دریافتنی','asset','receivable'),
  ('4101','درآمد فروش و خدمات چاپ','income','sales'),
  ('5101','هزینه‌های عملیاتی','expense','operating_expense')
) AS v(code,name,kind,system_key)
ON CONFLICT (lab_id, system_key) DO NOTHING;

-- Backfill invoice accounting documents for invoices issued before this migration
INSERT INTO finance_transactions(lab_id,txn_date,description,reference_type,reference_id,created_at)
SELECT i.lab_id,i.issued_at,'صدور فاکتور #'||i.number,'invoice',i.id,i.issued_at
FROM invoices i
WHERE i.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM finance_transactions t
    WHERE t.lab_id=i.lab_id AND t.reference_type='invoice' AND t.reference_id=i.id
  );

INSERT INTO finance_entries(transaction_id,account_id,customer_id,invoice_id,debit,credit,note)
SELECT t.id,a.id,i.customer_id,i.id,i.total,0,'بدهکار شدن مشتری'
FROM finance_transactions t
JOIN invoices i ON i.id=t.reference_id AND t.reference_type='invoice'
JOIN finance_accounts a ON a.lab_id=t.lab_id AND a.system_key='receivable'
WHERE i.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM finance_entries e WHERE e.transaction_id=t.id AND e.account_id=a.id
  );

INSERT INTO finance_entries(transaction_id,account_id,customer_id,invoice_id,debit,credit,note)
SELECT t.id,a.id,i.customer_id,i.id,0,i.total,'درآمد فاکتور'
FROM finance_transactions t
JOIN invoices i ON i.id=t.reference_id AND t.reference_type='invoice'
JOIN finance_accounts a ON a.lab_id=t.lab_id AND a.system_key='sales'
WHERE i.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM finance_entries e WHERE e.transaction_id=t.id AND e.account_id=a.id
  );
