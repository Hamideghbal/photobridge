-- PhotoBridge v0.17.14
-- Prototype: private client galleries for photographer accounts, adapted from KinderPhoto selection flow.

CREATE TABLE IF NOT EXISTS photographer_gallery_access (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  plan_code text NOT NULL DEFAULT 'prototype',
  plan_status text NOT NULL DEFAULT 'trial' CHECK (plan_status IN ('trial','active','expired','disabled')),
  active_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Existing photographer accounts receive prototype access in this test build.
INSERT INTO photographer_gallery_access(user_id,enabled,plan_code,plan_status)
SELECT DISTINCT m.user_id,true,'prototype','trial'
FROM lab_memberships m
WHERE m.role='customer'
ON CONFLICT(user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS photographer_client_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title text NOT NULL,
  customer_name text NOT NULL,
  customer_mobile text,
  public_token text NOT NULL UNIQUE,
  access_code_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  digital_price bigint NOT NULL DEFAULT 0 CHECK (digital_price >= 0),
  note text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_client_galleries_owner_idx ON photographer_client_galleries(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS photographer_client_galleries_token_idx ON photographer_client_galleries(public_token);

CREATE TABLE IF NOT EXISTS photographer_gallery_print_prices (
  gallery_id uuid NOT NULL REFERENCES photographer_client_galleries(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id),
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY(gallery_id,size_id)
);

CREATE TABLE IF NOT EXISTS photographer_gallery_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES photographer_client_galleries(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('photo','video')),
  original_name text NOT NULL,
  object_key text NOT NULL UNIQUE,
  content_type text,
  bytes bigint,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  upload_state text NOT NULL DEFAULT 'pending' CHECK (upload_state IN ('pending','active','deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_gallery_media_gallery_idx ON photographer_gallery_media(gallery_id,sort_order,created_at);

CREATE TABLE IF NOT EXISTS photographer_gallery_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigserial UNIQUE,
  gallery_id uuid NOT NULL REFERENCES photographer_client_galleries(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name text,
  customer_mobile text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','completed','cancelled')),
  total bigint NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_gallery_orders_owner_idx ON photographer_gallery_orders(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS photographer_gallery_orders_gallery_idx ON photographer_gallery_orders(gallery_id,created_at DESC);

CREATE TABLE IF NOT EXISTS photographer_gallery_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES photographer_gallery_orders(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES photographer_gallery_media(id) ON DELETE RESTRICT,
  item_type text NOT NULL CHECK (item_type IN ('digital','print')),
  size_id text REFERENCES print_sizes(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 100),
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  line_total bigint NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_gallery_order_items_order_idx ON photographer_gallery_order_items(order_id);
