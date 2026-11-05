-- R1614: isolated lab-to-lab invitation program. No changes to existing
-- photographer invites, existing discounts, order financial documents or payouts.
CREATE TABLE IF NOT EXISTS lab_referral_codes (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lab_referral_codes_format CHECK (code ~ '^LB[A-F0-9]{18}$')
);

CREATE TABLE IF NOT EXISTS lab_referrals (
  referred_lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  referrer_lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  invite_code text NOT NULL REFERENCES lab_referral_codes(code),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lab_referrals_distinct_labs CHECK (referred_lab_id <> referrer_lab_id)
);
CREATE INDEX IF NOT EXISTS lab_referrals_referrer_idx ON lab_referrals(referrer_lab_id,created_at DESC);

-- Exact reconciliation per verified external payment, regardless of callback retries.
CREATE TABLE IF NOT EXISTS lab_referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  referred_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  payment_kind text NOT NULL CHECK (payment_kind IN ('subscription','wallet_topup')),
  payment_id uuid NOT NULL,
  paid_amount bigint NOT NULL CHECK (paid_amount > 0),
  reward_percent numeric(5,2) NOT NULL DEFAULT 10 CHECK (reward_percent=10),
  reward_amount bigint NOT NULL CHECK (reward_amount >= 0),
  wallet_transaction_id uuid UNIQUE REFERENCES service_wallet_transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_kind,payment_id)
);
CREATE INDEX IF NOT EXISTS lab_referral_commissions_referrer_idx
  ON lab_referral_commissions(referrer_lab_id,created_at DESC);

-- Track/refuse excessive SMS sends without using the existing SMS wallet.
CREATE TABLE IF NOT EXISTS lab_referral_sms_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  recipient_mobile text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS lab_referral_sms_throttle_idx
  ON lab_referral_sms_attempts(lab_id,created_at DESC);
