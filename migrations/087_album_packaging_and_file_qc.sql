-- PhotoBridge v0.17.319 — size-specific album box/bag catalog + album upload QC support

CREATE TABLE IF NOT EXISTS lab_album_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES lab_album_sizes(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'box' CHECK (kind IN ('box','bag')),
  model_name text NOT NULL,
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_album_packages_lab_size_idx
  ON lab_album_packages(lab_id,size_id,active,sort_order,created_at);

COMMENT ON TABLE lab_album_packages IS 'Optional album box/bag models priced independently per album size.';
COMMENT ON COLUMN lab_album_packages.kind IS 'box = باکس آلبوم, bag = کیف آلبوم';
