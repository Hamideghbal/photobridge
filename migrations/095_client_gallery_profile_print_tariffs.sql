BEGIN;

CREATE TABLE IF NOT EXISTS photographer_gallery_print_tariffs (
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  luster_enabled boolean NOT NULL DEFAULT false,
  luster_price bigint NOT NULL DEFAULT 0 CHECK (luster_price >= 0),
  silk_enabled boolean NOT NULL DEFAULT false,
  silk_price bigint NOT NULL DEFAULT 0 CHECK (silk_price >= 0),
  metallic_enabled boolean NOT NULL DEFAULT false,
  metallic_price bigint NOT NULL DEFAULT 0 CHECK (metallic_price >= 0),
  chassis_enabled boolean NOT NULL DEFAULT false,
  chassis_price bigint NOT NULL DEFAULT 0 CHECK (chassis_price >= 0),
  frame_enabled boolean NOT NULL DEFAULT false,
  frame_price bigint NOT NULL DEFAULT 0 CHECK (frame_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,size_id)
);

CREATE TABLE IF NOT EXISTS photographer_gallery_print_tariff_states (
  gallery_id uuid NOT NULL REFERENCES photographer_client_galleries(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(gallery_id,size_id)
);

-- Preserve the old per-gallery simple price as a profile-level Luster tariff.
INSERT INTO photographer_gallery_print_tariffs(
  owner_id,size_id,active,luster_enabled,luster_price,
  silk_enabled,silk_price,metallic_enabled,metallic_price,
  chassis_enabled,chassis_price,frame_enabled,frame_price
)
SELECT g.owner_id,gp.size_id,bool_or(gp.active),bool_or(gp.active),max(gp.price),
       false,0,false,0,false,0,false,0
FROM photographer_gallery_print_prices gp
JOIN photographer_client_galleries g ON g.id=gp.gallery_id
GROUP BY g.owner_id,gp.size_id
ON CONFLICT(owner_id,size_id) DO NOTHING;

INSERT INTO photographer_gallery_print_tariff_states(gallery_id,size_id,active)
SELECT gp.gallery_id,gp.size_id,gp.active
FROM photographer_gallery_print_prices gp
ON CONFLICT(gallery_id,size_id) DO NOTHING;

ALTER TABLE photographer_gallery_order_items
  ADD COLUMN IF NOT EXISTS paper_type text,
  ADD COLUMN IF NOT EXISTS chassis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frame boolean NOT NULL DEFAULT false;

UPDATE photographer_gallery_order_items
SET paper_type='luster'
WHERE item_type='print' AND paper_type IS NULL;

DO $$ BEGIN
  ALTER TABLE photographer_gallery_order_items
    ADD CONSTRAINT photographer_gallery_order_items_paper_type_check
    CHECK (paper_type IS NULL OR paper_type IN ('luster','silk','metallic'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
