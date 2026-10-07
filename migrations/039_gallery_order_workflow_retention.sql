-- PhotoBridge v0.17.28
-- Single editable client invoice, retouch approval workflow and automatic gallery retention cleanup.

ALTER TABLE photographer_client_galleries
  ADD COLUMN IF NOT EXISTS lifetime_days_snapshot integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS post_completion_days_snapshot integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS cleanup_after timestamptz;

DO $$ BEGIN
  ALTER TABLE photographer_client_galleries
    ADD CONSTRAINT photographer_client_galleries_lifetime_days_check CHECK (lifetime_days_snapshot BETWEEN 1 AND 180);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE photographer_client_galleries
    ADD CONSTRAINT photographer_client_galleries_post_completion_days_check CHECK (post_completion_days_snapshot BETWEEN 1 AND 60);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE photographer_client_galleries
SET lifetime_days_snapshot=GREATEST(1,LEAST(180,COALESCE(lifetime_days_snapshot,30))),
    post_completion_days_snapshot=GREATEST(1,LEAST(60,COALESCE(post_completion_days_snapshot,7))),
    expires_at=COALESCE(expires_at, now()+interval '30 days');

ALTER TABLE photographer_gallery_orders DROP CONSTRAINT IF EXISTS photographer_gallery_orders_status_check;
-- v0.17.14 used the legacy state `reviewed`; map it before installing the new state machine constraint.
UPDATE photographer_gallery_orders SET status='submitted' WHERE status='reviewed';
ALTER TABLE photographer_gallery_orders
  ALTER COLUMN status SET DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz,
  ADD COLUMN IF NOT EXISTS retouch_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS revision_note text;

DO $$ BEGIN
  ALTER TABLE photographer_gallery_orders
    ADD CONSTRAINT photographer_gallery_orders_status_check CHECK (status IN ('draft','submitted','retouching','awaiting_approval','completed','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE photographer_gallery_orders SET is_current=false WHERE status='cancelled';

WITH ranked AS (
  SELECT id,row_number() OVER (PARTITION BY gallery_id ORDER BY created_at DESC,id DESC) rn
  FROM photographer_gallery_orders
  WHERE status<>'cancelled'
)
UPDATE photographer_gallery_orders o
SET is_current=(ranked.rn=1)
FROM ranked WHERE ranked.id=o.id;

CREATE UNIQUE INDEX IF NOT EXISTS photographer_gallery_orders_one_current_idx
  ON photographer_gallery_orders(gallery_id) WHERE is_current=true;

UPDATE photographer_client_galleries g
SET cleanup_after=COALESCE(g.cleanup_after, now() + (g.post_completion_days_snapshot::text || ' days')::interval)
FROM photographer_gallery_orders o
WHERE o.gallery_id=g.id AND o.is_current=true AND o.status='completed' AND g.cleanup_after IS NULL;

CREATE TABLE IF NOT EXISTS photographer_gallery_retouch_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES photographer_client_galleries(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES photographer_gallery_orders(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES photographer_gallery_media(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  original_name text NOT NULL,
  content_type text,
  bytes bigint,
  upload_state text NOT NULL DEFAULT 'pending' CHECK (upload_state IN ('pending','active','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_gallery_retouch_proofs_order_idx ON photographer_gallery_retouch_proofs(order_id,media_id,created_at DESC);

UPDATE platform_services
SET metadata=COALESCE(metadata,'{}'::jsonb)
  || jsonb_build_object(
      'lifetime_days', COALESCE((metadata->>'lifetime_days')::int,30),
      'post_completion_days', COALESCE((metadata->>'post_completion_days')::int,7),
      'preview_max_edge', 1280,
      'preview_quality', 58
    ),
    updated_at=now()
WHERE service_key='client_gallery';
