-- PhotoBridge v0.17.662 — durable like totals for Album / Instagram designs
-- Keeps the public like counter monotonic across guest -> account identity promotion
-- and preserves an already-visible legacy count instead of resetting it to 1.

CREATE TABLE IF NOT EXISTS album_design_template_like_totals (
  template_id text PRIMARY KEY,
  like_count bigint NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO album_design_template_like_totals(template_id,like_count,updated_at)
SELECT template_id,COUNT(*)::bigint,now()
FROM album_design_template_ratings
GROUP BY template_id
ON CONFLICT(template_id) DO UPDATE
SET like_count=GREATEST(album_design_template_like_totals.like_count,EXCLUDED.like_count),
    updated_at=now();
