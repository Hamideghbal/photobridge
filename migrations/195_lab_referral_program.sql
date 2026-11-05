-- R1614: opt-in, lab-to-lab referrals; isolated from photographer invitations.
-- No existing lab is enrolled or modified by this migration.
CREATE TABLE IF NOT EXISTS lab_referral_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 referrer_lab_id uuid NOT NULL UNIQUE REFERENCES labs(id) ON DELETE RESTRICT,
 code varchar(24) NOT NULL UNIQUE,
 active boolean NOT NULL DEFAULT true,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lab_referral_invites_code_format CHECK (code ~ '^[A-F0-9]{16}$')
);
CREATE TABLE IF NOT EXISTS lab_referral_sent_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invite_id uuid NOT NULL REFERENCES lab_referral_invites(id) ON DELETE RESTRICT,
 target_mobile varchar(11) NOT NULL CHECK (target_mobile ~ '^09[0-9]{9}$'),
 status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','sent','failed')),
 provider_reference text,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS lab_referral_sent_invites_recent_idx ON lab_referral_sent_invites(invite_id,target_mobile,created_at DESC);
CREATE TABLE IF NOT EXISTS lab_referral_memberships (
 referred_lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE RESTRICT,
 referrer_lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
 invite_id uuid NOT NULL REFERENCES lab_referral_invites(id) ON DELETE RESTRICT,
 referred_discount_percent integer NOT NULL DEFAULT 30 CHECK(referred_discount_percent = 30),
 referrer_reward_percent integer NOT NULL DEFAULT 10 CHECK(referrer_reward_percent = 10),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lab_referral_no_self CHECK (referred_lab_id <> referrer_lab_id)
);
CREATE INDEX IF NOT EXISTS lab_referral_memberships_referrer_idx ON lab_referral_memberships(referrer_lab_id,created_at DESC);
CREATE TABLE IF NOT EXISTS lab_referral_rewards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 referrer_lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
 referred_lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
 source_kind text NOT NULL CHECK(source_kind IN ('subscription','wallet_topup')),
 source_id uuid NOT NULL,
 paid_amount bigint NOT NULL CHECK(paid_amount > 0),
 reward_amount bigint NOT NULL CHECK(reward_amount > 0),
 wallet_transaction_id uuid UNIQUE REFERENCES service_wallet_transactions(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_kind,source_id),
 CONSTRAINT lab_referral_rewards_no_self CHECK(referrer_lab_id <> referred_lab_id)
);
CREATE INDEX IF NOT EXISTS lab_referral_rewards_referrer_idx ON lab_referral_rewards(referrer_lab_id,created_at DESC);
