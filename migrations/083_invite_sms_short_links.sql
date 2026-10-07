-- PhotoBridge v0.17.309 — compact SMS invite links

CREATE TABLE IF NOT EXISTS photographer_invite_sms_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  mobile text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz,
  UNIQUE(invite_id,mobile)
);
CREATE INDEX IF NOT EXISTS photographer_invite_sms_links_lookup_idx
  ON photographer_invite_sms_links(token,active);
