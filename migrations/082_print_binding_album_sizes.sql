-- PhotoBridge v0.17.309 — bind album binding price to print tariff sizes

ALTER TABLE lab_prices
  ADD COLUMN IF NOT EXISTS album_binding_price bigint CHECK (album_binding_price IS NULL OR album_binding_price >= 0);

ALTER TABLE lab_album_sizes
  ADD COLUMN IF NOT EXISTS print_size_id text REFERENCES print_sizes(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lab_album_sizes_lab_print_size_uidx
  ON lab_album_sizes(lab_id,print_size_id)
  WHERE print_size_id IS NOT NULL;

-- Best-effort bridge for existing album sizes: match a visible print size by label.
UPDATE lab_album_sizes a
SET print_size_id = ps.id,
    updated_at = now()
FROM print_sizes ps
WHERE a.print_size_id IS NULL
  AND ps.label = a.label
  AND (ps.owner_lab_id IS NULL OR ps.owner_lab_id = a.lab_id)
  AND NOT EXISTS (
    SELECT 1 FROM lab_album_sizes other
    WHERE other.lab_id=a.lab_id AND other.print_size_id=ps.id AND other.id<>a.id
  );

-- Preserve previously configured binding prices by moving them into the print tariff.
UPDATE lab_prices p
SET album_binding_price = a.binding_price,
    updated_at = now()
FROM lab_album_sizes a
WHERE a.lab_id=p.lab_id
  AND a.print_size_id=p.size_id
  AND a.binding_price>0
  AND (p.album_binding_price IS NULL OR p.album_binding_price=0);

COMMENT ON COLUMN lab_prices.album_binding_price IS 'Album binding price per spread/page for this print size. NULL/0 means this size is not offered for album binding.';
COMMENT ON COLUMN lab_album_sizes.print_size_id IS 'Compatibility mirror to the print-size tariff. Album sizes are exposed from print sizes whose lab_prices.album_binding_price is greater than zero.';
