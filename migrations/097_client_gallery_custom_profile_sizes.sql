BEGIN;

CREATE TABLE IF NOT EXISTS photographer_gallery_custom_sizes (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  width_cm numeric(8,2) NOT NULL CHECK (width_cm > 0 AND width_cm <= 500),
  height_cm numeric(8,2) NOT NULL CHECK (height_cm > 0 AND height_cm <= 500),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photographer_gallery_custom_sizes_owner_idx
  ON photographer_gallery_custom_sizes(owner_id,active,created_at);

-- Gallery tariff IDs may now point either to a standard print_sizes row or to a
-- photographer-owned custom size. API validation keeps the two namespaces safe.
ALTER TABLE photographer_gallery_print_tariffs
  DROP CONSTRAINT IF EXISTS photographer_gallery_print_tariffs_size_id_fkey;
ALTER TABLE photographer_gallery_print_tariff_states
  DROP CONSTRAINT IF EXISTS photographer_gallery_print_tariff_states_size_id_fkey;
ALTER TABLE photographer_gallery_order_items
  DROP CONSTRAINT IF EXISTS photographer_gallery_order_items_size_id_fkey;

COMMIT;
