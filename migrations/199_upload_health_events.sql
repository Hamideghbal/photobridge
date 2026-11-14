-- R1851: append-only, privacy-minimized diagnostics for photographer->lab uploads.
-- No foreign keys to operational orders/files: a deleted draft must not erase evidence.
-- Do not store names, S3 keys, signed URLs, image contents or request bodies.
CREATE TABLE IF NOT EXISTS upload_health_sessions (
  id uuid PRIMARY KEY,
  photographer_id uuid NOT NULL,
  lab_id uuid NOT NULL,
  order_id uuid,
  client_kind text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upload_health_sessions_lab_idx
  ON upload_health_sessions (lab_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS upload_health_sessions_photographer_idx
  ON upload_health_sessions (photographer_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS upload_health_files (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES upload_health_sessions(id),
  server_file_id uuid,
  total_bytes bigint CHECK (total_bytes IS NULL OR total_bytes BETWEEN 0 AND 5368709120),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upload_health_files_session_idx
  ON upload_health_files (session_id);

CREATE TABLE IF NOT EXISTS upload_health_attempts (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES upload_health_sessions(id),
  file_id uuid REFERENCES upload_health_files(id),
  stage text NOT NULL,
  state text NOT NULL,
  error_code text,
  http_status integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upload_health_attempts_session_idx
  ON upload_health_attempts (session_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS upload_health_timeline_events (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES upload_health_sessions(id),
  file_id uuid REFERENCES upload_health_files(id),
  attempt_id uuid REFERENCES upload_health_attempts(id),
  stage text NOT NULL,
  state text NOT NULL,
  category text NOT NULL,
  error_code text,
  http_status integer,
  sent_bytes bigint,
  total_bytes bigint,
  duration_ms integer,
  online boolean,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upload_health_events_session_idx
  ON upload_health_timeline_events (session_id, received_at DESC);
CREATE INDEX IF NOT EXISTS upload_health_events_category_idx
  ON upload_health_timeline_events (received_at DESC, category, stage)
  WHERE state='failed';
