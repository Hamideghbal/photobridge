BEGIN;

ALTER TABLE photographer_gallery_order_items
  ADD COLUMN IF NOT EXISTS customer_note text;

UPDATE photographer_gallery_order_items
SET customer_note=NULL
WHERE customer_note IS NOT NULL AND btrim(customer_note)='';

COMMIT;
