CREATE TABLE IF NOT EXISTS equipment_store_site_reviews (
 id uuid PRIMARY KEY,
 shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
 hostname text NOT NULL,
 author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 80),
 rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
 body text NOT NULL CHECK (char_length(body) BETWEEN 5 AND 2000),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS equipment_store_site_reviews_scope ON equipment_store_site_reviews(shop_id,status,created_at DESC);
