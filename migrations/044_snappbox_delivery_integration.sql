-- PhotoBridge v0.17.40 — direct SnappBox delivery integration

CREATE TABLE IF NOT EXISTS lab_delivery_settings (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_address text,
  pickup_contact_name text,
  pickup_phone text,
  snappbox_enabled boolean NOT NULL DEFAULT false,
  snappbox_environment text NOT NULL DEFAULT 'production' CHECK (snappbox_environment IN ('production','staging')),
  snappbox_api_token_encrypted text,
  default_delivery_category text NOT NULL DEFAULT 'bike-without-box',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lab_delivery_pickup_lat_chk CHECK (pickup_lat IS NULL OR (pickup_lat >= -90 AND pickup_lat <= 90)),
  CONSTRAINT lab_delivery_pickup_lng_chk CHECK (pickup_lng IS NULL OR (pickup_lng >= -180 AND pickup_lng <= 180))
);

CREATE TABLE IF NOT EXISTS order_courier_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'snappbox' CHECK (provider IN ('snappbox')),
  provider_ref_id text NOT NULL,
  provider_order_id text,
  delivery_category text,
  quoted_price bigint,
  status text,
  raw_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, provider),
  UNIQUE(provider, provider_ref_id)
);

CREATE INDEX IF NOT EXISTS order_courier_shipments_lab_idx
  ON order_courier_shipments(lab_id, created_at DESC);
