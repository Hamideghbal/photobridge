-- PhotoBridge v0.14.9 — walk-in crop handoff metadata
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS crop_handling text NOT NULL DEFAULT 'none';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_files_crop_handling_check') THEN
    ALTER TABLE order_files ADD CONSTRAINT order_files_crop_handling_check CHECK (crop_handling IN ('none','customer','lab'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS order_files_crop_handling_idx ON order_files(order_id,crop_handling);
