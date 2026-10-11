-- R1132: a single uploaded photograph can request several physical prints.
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_copies integer NOT NULL DEFAULT 1;
UPDATE order_files SET print_copies=1 WHERE print_copies IS NULL OR print_copies<1;
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_files_print_copies_range') THEN
  ALTER TABLE order_files ADD CONSTRAINT order_files_print_copies_range CHECK (print_copies BETWEEN 1 AND 99);
 END IF;
END $$;
