-- Additive laboratory referrals. Existing photographer invitations are untouched.
CREATE TABLE IF NOT EXISTS lab_referral_invites (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK(code ~ '^[a-f0-9]{48}$'),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lab_referrals (
  referred_lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  inviter_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  registered_user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  invite_code text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  CHECK(inviter_lab_id IS NULL OR inviter_lab_id<>referred_lab_id)
);
CREATE INDEX IF NOT EXISTS lab_referrals_inviter_idx ON lab_referrals(inviter_lab_id,registered_at DESC);
CREATE TABLE IF NOT EXISTS lab_referral_rewards (
  renewal_id uuid PRIMARY KEY, -- immutable source id: retain rewards if an old renewal is removed
  inviter_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  referred_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  paid_amount bigint NOT NULL CHECK(paid_amount>0),
  reward_amount bigint NOT NULL CHECK(reward_amount>0 AND reward_amount<=paid_amount),
  wallet_transaction_id uuid REFERENCES service_wallet_transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_referral_rewards_inviter_idx ON lab_referral_rewards(inviter_lab_id,created_at DESC);
ALTER TABLE subscription_renewals DROP CONSTRAINT IF EXISTS subscription_renewals_payment_method_check;
ALTER TABLE subscription_renewals ADD CONSTRAINT subscription_renewals_payment_method_check CHECK(payment_method IN ('receipt','zibal','wallet'));
ALTER TABLE platform_payments DROP CONSTRAINT IF EXISTS platform_payments_source_check;
ALTER TABLE platform_payments ADD CONSTRAINT platform_payments_source_check CHECK(source IN ('receipt','gateway','manual','wallet'));
