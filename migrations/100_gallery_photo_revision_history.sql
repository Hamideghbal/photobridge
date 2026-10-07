CREATE TABLE IF NOT EXISTS photographer_gallery_revision_requests (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES photographer_gallery_orders(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES photographer_gallery_media(id) ON DELETE CASCADE,
  round integer NOT NULL DEFAULT 1,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS photographer_gallery_revision_requests_order_idx
  ON photographer_gallery_revision_requests(order_id, round, created_at);
CREATE INDEX IF NOT EXISTS photographer_gallery_revision_requests_media_idx
  ON photographer_gallery_revision_requests(media_id, created_at);
