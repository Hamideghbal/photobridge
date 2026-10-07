-- PhotoBridge v0.17.66 — verified mobile signup + lab-owned print-size catalog

ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS signup_mobile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('lab_trial','photographer','invite')),
  mobile text NOT NULL,
  payload jsonb NOT NULL,
  password_hash text NOT NULL,
  provider text NOT NULL,
  code_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','used','expired','failed')),
  attempts integer NOT NULL DEFAULT 0,
  request_ip_hash text,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signup_mobile_verifications_mobile_idx ON signup_mobile_verifications(mobile,kind,created_at DESC);
CREATE INDEX IF NOT EXISTS signup_mobile_verifications_ip_idx ON signup_mobile_verifications(request_ip_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS signup_mobile_verifications_expiry_idx ON signup_mobile_verifications(status,expires_at);

ALTER TABLE print_sizes
  ADD COLUMN IF NOT EXISTS owner_lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_size_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS print_sizes_owner_lab_idx ON print_sizes(owner_lab_id,active,width_cm,height_cm);

CREATE TABLE IF NOT EXISTS lab_hidden_print_sizes (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id) ON DELETE CASCADE,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lab_id,size_id)
);
CREATE INDEX IF NOT EXISTS lab_hidden_print_sizes_lab_idx ON lab_hidden_print_sizes(lab_id,hidden_at DESC);
