CREATE TABLE IF NOT EXISTS album_design_projects (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  customer_name text,
  customer_mobile text,
  public_token text NOT NULL UNIQUE,
  access_code_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  customer_review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS album_design_projects_owner_idx ON album_design_projects(owner_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS album_design_project_pages (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES album_design_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id text,
  name text NOT NULL,
  size_label text,
  object_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'image/jpeg',
  bytes bigint NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'designed',
  customer_note text,
  retouch_object_key text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS album_design_project_pages_project_idx ON album_design_project_pages(project_id,sort_order,created_at);
