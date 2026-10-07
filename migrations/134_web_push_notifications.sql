-- PhotoBridge v728 — durable Web Push subscriptions for installed PWA/browser clients.
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  recipient_lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_label text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT web_push_subscriptions_one_recipient CHECK (
    (recipient_lab_id IS NOT NULL AND recipient_user_id IS NULL)
    OR (recipient_lab_id IS NULL AND recipient_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS web_push_subscriptions_lab_idx
  ON web_push_subscriptions(recipient_lab_id, updated_at DESC)
  WHERE recipient_lab_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS web_push_subscriptions_user_idx
  ON web_push_subscriptions(recipient_user_id, updated_at DESC)
  WHERE recipient_user_id IS NOT NULL;
