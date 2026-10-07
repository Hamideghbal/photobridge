-- PhotoBridge v0.14.6 — lab-specific subscription discounts and platform payment ledger

ALTER TABLE labs ADD COLUMN IF NOT EXISTS subscription_discount_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS subscription_discount_percent numeric(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'labs_subscription_discount_percent_chk'
  ) THEN
    ALTER TABLE labs ADD CONSTRAINT labs_subscription_discount_percent_chk
      CHECK (subscription_discount_percent >= 0 AND subscription_discount_percent <= 100);
  END IF;
END $$;

ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS list_amount bigint;
ALTER TABLE subscription_renewals ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0;
UPDATE subscription_renewals SET list_amount=amount WHERE list_amount IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_renewals_discount_percent_chk'
  ) THEN
    ALTER TABLE subscription_renewals ADD CONSTRAINT subscription_renewals_discount_percent_chk
      CHECK (discount_percent >= 0 AND discount_percent <= 100);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS platform_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  lab_name text NOT NULL,
  renewal_id uuid UNIQUE REFERENCES subscription_renewals(id) ON DELETE SET NULL,
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('pending','paid','failed','refunded')),
  source text NOT NULL DEFAULT 'receipt' CHECK (source IN ('receipt','gateway','manual')),
  provider text,
  authority text,
  reference text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_payments_paid_at_idx ON platform_payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS platform_payments_lab_idx ON platform_payments(lab_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS platform_payments_status_idx ON platform_payments(status, created_at DESC);

-- Preserve already-approved subscription receipts in the platform revenue dashboard.
INSERT INTO platform_payments(lab_id,lab_name,renewal_id,amount,status,source,paid_at,created_at,updated_at)
SELECT r.lab_id,l.name,r.id,r.amount,'paid','receipt',COALESCE(r.reviewed_at,r.submitted_at,r.created_at),r.created_at,now()
FROM subscription_renewals r
JOIN labs l ON l.id=r.lab_id
WHERE r.status='approved'
ON CONFLICT (renewal_id) DO NOTHING;
