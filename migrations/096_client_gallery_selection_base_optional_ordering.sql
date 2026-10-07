BEGIN;

ALTER TABLE photographer_client_galleries
  ADD COLUMN IF NOT EXISTS ordering_enabled boolean NOT NULL DEFAULT false;

-- Selection + per-photo notes are now the permanent base gallery workflow.
UPDATE photographer_client_galleries
SET selection_enabled=true
WHERE selection_enabled IS DISTINCT FROM true;

-- Preserve previously priced galleries as ordering-enabled.
UPDATE photographer_client_galleries g
SET ordering_enabled=true
WHERE COALESCE(g.digital_price,0)>0
   OR EXISTS (
     SELECT 1
     FROM photographer_gallery_print_tariff_states gs
     JOIN photographer_gallery_print_tariffs t
       ON t.owner_id=g.owner_id
      AND t.size_id=gs.size_id
      AND t.active=true
     WHERE gs.gallery_id=g.id
       AND gs.active=true
       AND (t.luster_enabled OR t.silk_enabled OR t.metallic_enabled)
   );

ALTER TABLE photographer_gallery_order_items
  DROP CONSTRAINT IF EXISTS photographer_gallery_order_items_item_type_check;

ALTER TABLE photographer_gallery_order_items
  ADD CONSTRAINT photographer_gallery_order_items_item_type_check
  CHECK (item_type IN ('selection','digital','print'));

COMMIT;
