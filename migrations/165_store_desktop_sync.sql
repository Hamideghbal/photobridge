CREATE TABLE IF NOT EXISTS equipment_store_desktop_operations (
 shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id), operation_id uuid NOT NULL,
 device_id uuid NOT NULL, payload_hash text NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(shop_id,operation_id)
);
CREATE TABLE IF NOT EXISTS equipment_store_desktop_ids (
 shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id), local_id uuid NOT NULL,
 server_id uuid NOT NULL, entity text NOT NULL, PRIMARY KEY(shop_id,local_id)
);
CREATE OR REPLACE FUNCTION equipment_store_increment_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.desktop_revision := OLD.desktop_revision + 1; RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['equipment_rental_items','equipment_sale_items','equipment_rental_bookings','equipment_rental_invoices','equipment_rental_accounting_entries','equipment_rental_booking_shortages','equipment_sale_orders'] LOOP
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS desktop_revision bigint NOT NULL DEFAULT 0',t);
  EXECUTE format('DROP TRIGGER IF EXISTS store_desktop_revision ON %I',t);
  EXECUTE format('CREATE TRIGGER store_desktop_revision BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION equipment_store_increment_revision()',t);
 END LOOP;
END $$;
