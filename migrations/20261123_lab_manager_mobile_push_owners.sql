-- R1962: identify the active lab manager behind each lab-scoped browser
-- Push endpoint without violating the existing one-recipient-kind subscription
-- constraints (recipient_lab_id vs recipient_user_id).
CREATE TABLE IF NOT EXISTS lab_manager_push_owners (
  endpoint text PRIMARY KEY REFERENCES web_push_subscriptions(endpoint) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_manager_push_owners_lab_user_idx
  ON lab_manager_push_owners(lab_id,user_id);
