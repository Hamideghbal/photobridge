-- PhotoBridge v0.17.36 — Latin-only storage paths + photographer settlement workflow

ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS payment_card_number text,
  ADD COLUMN IF NOT EXISTS payment_iban text,
  ADD COLUMN IF NOT EXISTS payment_account_holder text;

ALTER TABLE lab_memberships
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'ledger';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lab_memberships_settlement_mode_chk') THEN
    ALTER TABLE lab_memberships ADD CONSTRAINT lab_memberships_settlement_mode_chk
      CHECK (settlement_mode IN ('ledger','prepaid'));
  END IF;
END $$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'ledger',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_settlement_mode_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_settlement_mode_chk
      CHECK (settlement_mode IN ('ledger','prepaid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_payment_status_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_chk
      CHECK (payment_status IN ('not_required','awaiting_receipt','receipt_pending','paid','receipt_rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS order_payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  object_key text NOT NULL,
  original_name text NOT NULL,
  content_type text,
  bytes bigint,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','pending','approved','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_payment_receipts_lab_status_idx ON order_payment_receipts(lab_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS order_payment_receipts_customer_idx ON order_payment_receipts(customer_id,created_at DESC);
