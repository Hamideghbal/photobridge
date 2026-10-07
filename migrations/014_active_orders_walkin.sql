-- PhotoBridge v0.14.8 — active order carry-over + walk-in customer channel
ALTER TABLE labs ADD COLUMN IF NOT EXISTS walkin_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS walkin_show_prices boolean NOT NULL DEFAULT true;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'photographer';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_upload_token_hash text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS walkin_customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS walkin_customer_mobile text;

CREATE TABLE IF NOT EXISTS walkin_prices (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id),
  luster bigint,
  silk bigint,
  metallic bigint,
  chassis bigint,
  frame bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lab_id,size_id)
);

INSERT INTO walkin_prices(lab_id,size_id,luster,silk,metallic,chassis,frame)
SELECT p.lab_id,p.size_id,p.luster,p.silk,p.metallic,p.chassis,p.frame
FROM lab_prices p
ON CONFLICT(lab_id,size_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS orders_source_idx ON orders(lab_id,source,created_at DESC);
