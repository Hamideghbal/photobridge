-- PhotoBridge v0.17.556 — durable guided-retouch queue and admin monitoring
-- Keeps every paid guided skin-retouch request durable across process restarts and
-- makes one global execution lane explicit instead of rejecting concurrent users.

CREATE TABLE IF NOT EXISTS ai_retouch_queue (
  id bigserial PRIMARY KEY,
  job_id uuid NOT NULL UNIQUE REFERENCES ai_image_jobs(id) ON DELETE CASCADE,
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  queue_mode text NOT NULL DEFAULT 'fast' CHECK (queue_mode IN ('fast','economy24')),
  state text NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting','running','completed','failed','attention','paused','cancelled')),
  priority integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  deadline_at timestamptz,
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  heartbeat_at timestamptz,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  last_error_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_retouch_queue_pick_idx
  ON ai_retouch_queue(state, available_at, priority DESC, queued_at, id)
  WHERE state='waiting';
CREATE INDEX IF NOT EXISTS ai_retouch_queue_owner_idx
  ON ai_retouch_queue(owner_type, owner_id, queued_at DESC);
CREATE INDEX IF NOT EXISTS ai_retouch_queue_attention_idx
  ON ai_retouch_queue(state, updated_at DESC)
  WHERE state IN ('running','attention','failed');
CREATE INDEX IF NOT EXISTS ai_retouch_queue_deadline_idx
  ON ai_retouch_queue(deadline_at)
  WHERE state IN ('waiting','running') AND deadline_at IS NOT NULL;
