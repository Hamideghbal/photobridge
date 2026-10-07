ALTER TABLE labs ADD COLUMN IF NOT EXISTS album_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS album_stage text;

CREATE TABLE IF NOT EXISTS lab_album_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  label text NOT NULL,
  width_cm numeric(8,2),
  height_cm numeric(8,2),
  base_price bigint NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  per_spread_price bigint NOT NULL DEFAULT 0 CHECK (per_spread_price >= 0),
  binding_price bigint NOT NULL DEFAULT 0 CHECK (binding_price >= 0),
  min_spreads integer NOT NULL DEFAULT 1 CHECK (min_spreads >= 1),
  max_spreads integer NOT NULL DEFAULT 100 CHECK (max_spreads >= min_spreads),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_album_sizes_lab_idx ON lab_album_sizes(lab_id, active, sort_order, created_at);

CREATE TABLE IF NOT EXISTS lab_album_covers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_album_covers_lab_idx ON lab_album_covers(lab_id, active, sort_order, created_at);

CREATE TABLE IF NOT EXISTS lab_album_cover_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_id uuid NOT NULL REFERENCES lab_album_covers(id) ON DELETE CASCADE,
  name text NOT NULL,
  color_value text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_album_cover_colors_cover_idx ON lab_album_cover_colors(cover_id, active, sort_order, created_at);

CREATE TABLE IF NOT EXISTS lab_album_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  pricing_mode text NOT NULL DEFAULT 'flat' CHECK (pricing_mode IN ('flat','per_spread')),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_album_extras_lab_idx ON lab_album_extras(lab_id, active, sort_order, created_at);

COMMENT ON COLUMN orders.album_data IS 'Locked album order snapshot: size, spreads, cover/color, cover text, extras and price breakdown.';
COMMENT ON COLUMN orders.album_stage IS 'Album workflow stage independent from normal order status.';
