-- PhotoBridge v0.17.314 — persistent in-app notification center for labs and photographers

CREATE TABLE IF NOT EXISTS system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_notifications_single_recipient CHECK (
    (recipient_lab_id IS NOT NULL AND recipient_user_id IS NULL)
    OR (recipient_lab_id IS NULL AND recipient_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS system_notifications_lab_idx
  ON system_notifications(recipient_lab_id, created_at DESC)
  WHERE recipient_lab_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS system_notifications_user_idx
  ON system_notifications(recipient_user_id, created_at DESC)
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS system_notifications_lab_unread_idx
  ON system_notifications(recipient_lab_id, read_at, created_at DESC)
  WHERE recipient_lab_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS system_notifications_user_unread_idx
  ON system_notifications(recipient_user_id, read_at, created_at DESC)
  WHERE recipient_user_id IS NOT NULL;
