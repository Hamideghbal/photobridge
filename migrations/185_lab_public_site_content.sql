CREATE TABLE IF NOT EXISTS lab_public_site_content (
 lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
 config jsonb NOT NULL DEFAULT '{}'::jsonb,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
