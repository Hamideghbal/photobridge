-- One hostname belongs to exactly one institution, preserving existing shop domains.
ALTER TABLE equipment_store_domains ALTER COLUMN shop_id DROP NOT NULL;
ALTER TABLE equipment_store_domains ADD COLUMN IF NOT EXISTS lab_id uuid REFERENCES labs(id);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='equipment_store_domain_single_owner') THEN
 ALTER TABLE equipment_store_domains ADD CONSTRAINT equipment_store_domain_single_owner CHECK ((shop_id IS NOT NULL)::int + (lab_id IS NOT NULL)::int = 1);
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS lab_custom_domains_lab_idx ON equipment_store_domains(lab_id) WHERE lab_id IS NOT NULL;
