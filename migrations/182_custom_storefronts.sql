CREATE TABLE IF NOT EXISTS equipment_store_domains(
 hostname text PRIMARY KEY,shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id),verification_token text NOT NULL,
 verified_at timestamptz,routed_at timestamptz,active boolean NOT NULL DEFAULT false,
 created_by uuid REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_store_domains_shop ON equipment_store_domains(shop_id);
CREATE TABLE IF NOT EXISTS equipment_store_public_orders(
 id uuid PRIMARY KEY,shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id),hostname text NOT NULL REFERENCES equipment_store_domains(hostname),
 access_token_hash text NOT NULL UNIQUE,idempotency_key uuid NOT NULL,customer_name text NOT NULL,customer_mobile text NOT NULL,
 delivery_method text NOT NULL CHECK(delivery_method IN ('pickup','courier')),delivery_address text,
 items jsonb NOT NULL,total_amount bigint NOT NULL CHECK(total_amount>=0),bank_details jsonb NOT NULL,
 status text NOT NULL DEFAULT 'awaiting_receipt' CHECK(status IN ('awaiting_receipt','pending_review','confirmed','in_production','ready','delivered','cancelled')),
 receipt_object_key text,receipt_submitted_at timestamptz,review_note text,stock_reserved boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(hostname,idempotency_key)
);
CREATE INDEX IF NOT EXISTS equipment_store_public_orders_shop ON equipment_store_public_orders(shop_id,created_at DESC);
