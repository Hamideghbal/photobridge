ALTER TABLE order_files ADD COLUMN IF NOT EXISTS relative_path text;
UPDATE order_files SET relative_path = original_name WHERE relative_path IS NULL;
