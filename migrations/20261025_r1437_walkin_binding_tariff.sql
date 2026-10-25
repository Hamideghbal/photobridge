-- Preserve existing customer prices; binding remains unset until explicitly saved.
ALTER TABLE walkin_prices ADD COLUMN IF NOT EXISTS album_binding_price bigint;
