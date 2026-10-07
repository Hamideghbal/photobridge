-- PhotoBridge v0.17.295 — blank default lab tariffs + print-ready JPEG derivatives

ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_object_key text;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_name text;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_content_type text;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_bytes bigint;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_conversion_status text NOT NULL DEFAULT 'not_needed';
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS print_conversion_error text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='order_files'::regclass AND conname='order_files_print_conversion_status_check'
  ) THEN
    ALTER TABLE order_files ADD CONSTRAINT order_files_print_conversion_status_check
      CHECK (print_conversion_status IN ('not_needed','pending','processing','ready','failed'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS order_files_print_conversion_idx ON order_files(print_conversion_status,created_at);

-- Only clear the exact historical product defaults. Any price the lab has already changed
-- remains untouched. Sizes remain available; the lab supplies its own tariffs.
UPDATE lab_prices SET luster=NULL,silk=NULL,metallic=NULL,chassis=NULL,updated_at=now()
WHERE (size_id='10x15' AND luster=30 AND silk=45 AND metallic IS NULL AND chassis=45)
   OR (size_id='13x18' AND luster=45 AND silk=75 AND metallic IS NULL AND chassis=80)
   OR (size_id='13x26' AND luster=55 AND silk=85 AND metallic IS NULL AND chassis IS NULL)
   OR (size_id='16x21' AND luster=60 AND silk=90 AND metallic=130 AND chassis=90)
   OR (size_id='20x30' AND luster=130 AND silk=170 AND metallic=220 AND chassis=130)
   OR (size_id='30x30' AND luster=195 AND silk=255 AND metallic IS NULL AND chassis=270)
   OR (size_id='30x40' AND luster=260 AND silk=340 AND metallic=500 AND chassis=260)
   OR (size_id='30x45' AND luster=290 AND silk=390 AND metallic=500 AND chassis=315)
   OR (size_id='30x60' AND luster=390 AND silk=500 AND metallic=660 AND chassis=420)
   OR (size_id='30x80' AND luster=520 AND silk=680 AND metallic=880 AND chassis=520)
   OR (size_id='40x60' AND luster=520 AND silk=650 AND metallic=1100 AND chassis=600)
   OR (size_id='40x80' AND luster=670 AND silk=840 AND metallic=1480 AND chassis=650)
   OR (size_id='50x70' AND luster=600 AND silk=840 AND metallic=1300 AND chassis=650)
   OR (size_id='50x80' AND luster=700 AND silk=920 AND metallic=1500 AND chassis=760)
   OR (size_id='60x90' AND luster=1200 AND silk=1600 AND metallic=2400 AND chassis=1200)
   OR (size_id='70x100' AND luster=1400 AND silk=1900 AND metallic=2700 AND chassis=1400)
   OR (size_id='75x120' AND luster=1700 AND silk=2300 AND metallic=3200 AND chassis=2300)
   OR (size_id='75x200' AND luster=2800 AND silk=3600 AND metallic IS NULL AND chassis IS NULL);
