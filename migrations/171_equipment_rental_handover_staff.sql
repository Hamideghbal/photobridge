-- PhotoBridge R100F9 — restricted equipment handover staff role
ALTER TABLE equipment_rental_shop_memberships DROP CONSTRAINT IF EXISTS equipment_rental_shop_memberships_role_check;
ALTER TABLE equipment_rental_shop_memberships ADD CONSTRAINT equipment_rental_shop_memberships_role_check CHECK (role IN ('shop_admin','photographer','handover_staff'));
CREATE INDEX IF NOT EXISTS equipment_rental_handover_staff_idx ON equipment_rental_shop_memberships(shop_id,active,created_at DESC) WHERE role='handover_staff';
