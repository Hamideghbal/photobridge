-- PhotoBridge v0.17.1 — pluggable SMS gateway, password-reset OTP and lab SMS permissions

ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS sms_customer_notifications_allowed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS password_reset_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text NOT NULL,
  portal text NOT NULL CHECK (portal IN ('admin','lab','photographer')),
  provider text NOT NULL,
  code_hash text NOT NULL,
  reset_token_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','used','expired','failed')),
  attempts integer NOT NULL DEFAULT 0,
  request_ip_hash text,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_mobile_idx ON password_reset_challenges(mobile,created_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_challenges(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_expiry_idx ON password_reset_challenges(status,expires_at);

CREATE TABLE IF NOT EXISTS sms_delivery_log (
  id bigserial PRIMARY KEY,
  provider text NOT NULL,
  purpose text NOT NULL,
  event_key text,
  target_mobile text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped')),
  provider_reference text,
  error_code text,
  response_text text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sms_delivery_log_created_idx ON sms_delivery_log(created_at DESC);
CREATE INDEX IF NOT EXISTS sms_delivery_log_target_idx ON sms_delivery_log(target_mobile,created_at DESC);

CREATE TABLE IF NOT EXISTS lab_sms_settings (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  order_ready_enabled boolean NOT NULL DEFAULT false,
  invoice_enabled boolean NOT NULL DEFAULT false,
  order_completed_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
