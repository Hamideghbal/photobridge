CREATE TABLE IF NOT EXISTS album_design_template_ratings (
  id bigserial PRIMARY KEY,
  template_id text NOT NULL,
  rater_key text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, rater_key)
);

CREATE INDEX IF NOT EXISTS album_design_template_ratings_template_idx
  ON album_design_template_ratings(template_id);
