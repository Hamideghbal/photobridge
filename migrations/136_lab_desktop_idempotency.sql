-- Keep the acknowledgement in the same transaction as the financial document.
-- A reconnect after an ambiguous response can replay the acknowledgement safely.
CREATE TABLE IF NOT EXISTS lab_desktop_operations (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  method text NOT NULL,
  request_path text NOT NULL,
  payload_hash text NOT NULL,
  http_status integer,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lab_id, operation_id)
);
