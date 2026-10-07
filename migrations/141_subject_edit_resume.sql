CREATE TABLE IF NOT EXISTS photographer_subject_edit_jobs (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  lab_id uuid NULL,
  status text NOT NULL DEFAULT 'ai_ready',
  source_object_key text NOT NULL,
  ai_object_key text NOT NULL,
  final_object_key text NULL,
  ai_content_type text NOT NULL DEFAULT 'image/jpeg',
  final_content_type text NULL,
  model text NOT NULL,
  quality text NOT NULL,
  output_size text NULL,
  estimated_openai_usd numeric(14,6) NOT NULL DEFAULT 0,
  openai_request_id text NULL,
  last_error text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_subject_edit_jobs_owner_created_idx
  ON photographer_subject_edit_jobs(owner_id, created_at DESC);
