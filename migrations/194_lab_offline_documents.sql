-- Independent desktop documents are imported once; published snapshots never change.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS offline_reference text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offline_reference text;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS offline_metadata jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_offline_reference_idx ON invoices(lab_id,offline_reference) WHERE offline_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_offline_reference_idx ON orders(lab_id,offline_reference) WHERE offline_reference IS NOT NULL;
CREATE TABLE IF NOT EXISTS lab_offline_imports (
 lab_id uuid NOT NULL REFERENCES labs(id),
 document_id uuid NOT NULL,
 device_id uuid NOT NULL,
 offline_reference text NOT NULL,
 payload_hash text NOT NULL,
 snapshot jsonb NOT NULL,
 result jsonb NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(lab_id,document_id),
 UNIQUE(lab_id,offline_reference)
);
CREATE TABLE IF NOT EXISTS lab_offline_customers (
 lab_id uuid NOT NULL REFERENCES labs(id),device_id uuid NOT NULL,local_customer_id uuid NOT NULL,
 customer_id uuid NOT NULL REFERENCES users(id),PRIMARY KEY(lab_id,device_id,local_customer_id)
);
-- A monotonic row revision avoids sub-millisecond timestamp races across clients.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS document_revision bigint NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION lab_bump_order_document_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.document_revision := OLD.document_revision + 1; RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS lab_order_document_revision ON orders;
CREATE TRIGGER lab_order_document_revision BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION lab_bump_order_document_revision();
