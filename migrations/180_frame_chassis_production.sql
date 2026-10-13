-- Frame/chassis production orders reuse sales and the existing customer ledger.
ALTER TABLE equipment_sale_orders ADD COLUMN IF NOT EXISTS production_stage text,
 ADD COLUMN IF NOT EXISTS expected_ready_date date,
 ADD COLUMN IF NOT EXISTS expected_delivery_date date,
 ADD COLUMN IF NOT EXISTS delivery_method text,
 ADD COLUMN IF NOT EXISTS delivery_address text,
 ADD COLUMN IF NOT EXISTS production_specs jsonb,
 ADD COLUMN IF NOT EXISTS production_confirmed_at timestamptz;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='equipment_sale_production_stage_chk') THEN
 ALTER TABLE equipment_sale_orders ADD CONSTRAINT equipment_sale_production_stage_chk CHECK(production_stage IS NULL OR production_stage IN ('awaiting_approval','in_production','ready','delivered','cancelled'));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='equipment_sale_delivery_method_chk') THEN
 ALTER TABLE equipment_sale_orders ADD CONSTRAINT equipment_sale_delivery_method_chk CHECK(delivery_method IS NULL OR delivery_method IN ('pickup','courier'));
 END IF;
END $$;
ALTER TABLE equipment_rental_accounting_entries ADD COLUMN IF NOT EXISTS sale_order_id uuid REFERENCES equipment_sale_orders(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS equipment_frame_ledger_once ON equipment_rental_accounting_entries(sale_order_id,entry_type,direction) WHERE sale_order_id IS NOT NULL;

ALTER TABLE equipment_rental_accounting_entries DROP CONSTRAINT IF EXISTS equipment_rental_accounting_entries_entry_type_check;
ALTER TABLE equipment_rental_accounting_entries ADD CONSTRAINT equipment_rental_accounting_entries_entry_type_check CHECK(entry_type IN ('opening_debt','booking_charge','booking_reversal','payment','adjustment_debit','adjustment_credit','sale_charge','sale_reversal','sale_refund'));
