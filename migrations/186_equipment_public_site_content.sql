CREATE TABLE IF NOT EXISTS equipment_public_site_content (
 shop_id uuid PRIMARY KEY REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
 config jsonb NOT NULL DEFAULT '{}'::jsonb,
 revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
 updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
