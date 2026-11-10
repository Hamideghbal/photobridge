-- Independent CRM service invoice schema. Does not modify legacy finance tables.
-- Apply only AFTER pb_crm schema has been installed and reviewed.
CREATE TABLE IF NOT EXISTS pb_crm.service_invoices (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab','photographer')),
 owner_id TEXT NOT NULL CHECK (length(btrim(owner_id))>0),
 customer_id UUID NOT NULL,
 invoice_number BIGINT NOT NULL CHECK (invoice_number>0),
 status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','void')),
 customer_name TEXT NOT NULL CHECK (length(btrim(customer_name))>0),
 customer_mobile TEXT NOT NULL,
 business_name TEXT NOT NULL CHECK (length(btrim(business_name))>0),
 business_phone TEXT NOT NULL DEFAULT '',
 business_address TEXT NOT NULL DEFAULT '',
 items JSONB NOT NULL CHECK (jsonb_typeof(items)='array' AND jsonb_array_length(items) BETWEEN 1 AND 50),
 subtotal_toman BIGINT NOT NULL CHECK (subtotal_toman>=0),
 discount_toman BIGINT NOT NULL CHECK (discount_toman>=0),
 total_toman BIGINT NOT NULL CHECK (total_toman>=0),
 paid_toman BIGINT NOT NULL CHECK (paid_toman>=0),
 due_toman BIGINT NOT NULL CHECK (due_toman>=0),
 notes TEXT NOT NULL DEFAULT '',
 created_by UUID NOT NULL,
 issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 voided_at TIMESTAMPTZ,
 voided_by UUID,
 void_reason TEXT,
 CONSTRAINT pb_crm_service_invoice_customer_scope_fk FOREIGN KEY (customer_id,owner_kind,owner_id) REFERENCES pb_crm.customers(id,owner_kind,owner_id) ON DELETE RESTRICT,
 CONSTRAINT pb_crm_service_invoice_totals CHECK(subtotal_toman-discount_toman=total_toman AND total_toman-paid_toman=due_toman),
 CONSTRAINT pb_crm_service_invoice_owner_number UNIQUE(owner_kind,owner_id,invoice_number)
);
CREATE INDEX IF NOT EXISTS pb_crm_service_invoices_lookup ON pb_crm.service_invoices(owner_kind,owner_id,customer_id,issued_at DESC);
ALTER TABLE pb_crm.service_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.service_invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_service_invoice_scope ON pb_crm.service_invoices FOR ALL
 USING(owner_kind=nullif(current_setting('pb_crm.owner_kind',true),'') AND owner_id=nullif(current_setting('pb_crm.owner_id',true),''))
 WITH CHECK(owner_kind=nullif(current_setting('pb_crm.owner_kind',true),'') AND owner_id=nullif(current_setting('pb_crm.owner_id',true),''));
