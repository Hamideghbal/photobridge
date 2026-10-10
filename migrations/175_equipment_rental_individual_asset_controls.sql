-- Keep returned-unit history intact when a physical unit is retired.
ALTER TABLE equipment_rental_assets ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
-- A group can have zero bookable units after its last unit is disabled/retired.
ALTER TABLE equipment_rental_items DROP CONSTRAINT IF EXISTS equipment_rental_items_stock_total_check;
ALTER TABLE equipment_rental_items ADD CONSTRAINT equipment_rental_items_stock_total_check CHECK (stock_total >= 0);
-- Translate previous group-level deactivation to the same physical units.
UPDATE equipment_rental_assets a SET active=false
FROM equipment_rental_items i WHERE i.id=a.item_id AND i.active=false AND a.active=true;
UPDATE equipment_rental_items i SET stock_total=(SELECT count(*)::int FROM equipment_rental_assets a WHERE a.item_id=i.id AND a.active=true AND a.deleted_at IS NULL)
WHERE EXISTS(SELECT 1 FROM equipment_rental_assets a WHERE a.item_id=i.id);
