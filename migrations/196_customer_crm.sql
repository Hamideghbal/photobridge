-- PhotoBridge customer CRM: versioned migration, execute only on approved deploy.
-- Separate CRM tables only. Keep existing orders, finance, members and invitations unchanged.
-- Review existing authentication/tenant identifiers before wiring API or promoting it.
-- Date components preserve the calendar chosen by the user, including Jalali anniversaries.

CREATE SCHEMA IF NOT EXISTS pb_crm;

CREATE TABLE IF NOT EXISTS pb_crm.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab', 'photographer')),
  owner_id TEXT NOT NULL CHECK (length(btrim(owner_id)) > 0),
  full_name TEXT NOT NULL CHECK (length(btrim(full_name)) > 0),
  mobile TEXT NOT NULL CHECK (char_length(mobile) BETWEEN 10 AND 20),
  notes TEXT,
  marketing_permission TEXT NOT NULL DEFAULT 'unknown'
    CHECK (marketing_permission IN ('unknown', 'opted_in', 'opted_out')),
  permission_source TEXT,
  permission_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (id, owner_kind, owner_id)
);

CREATE INDEX IF NOT EXISTS pb_crm_customers_by_owner
  ON pb_crm.customers (owner_kind, owner_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS pb_crm_customers_by_mobile
  ON pb_crm.customers (owner_kind, owner_id, mobile)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS pb_crm_customers_by_permission
  ON pb_crm.customers (owner_kind, owner_id, marketing_permission)
  WHERE deleted_at IS NULL;

-- Each lab/photographer owns an editable, independent photography type menu.
-- Only CRM operators manage this table; the customers themselves have NO login.
CREATE TABLE IF NOT EXISTS pb_crm.shoot_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab', 'photographer')),
  owner_id TEXT NOT NULL CHECK (length(btrim(owner_id)) > 0),
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  is_preset BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_kind, owner_id)
);
-- Prevent active duplicates per owner; allow re-adding a name after archiving.
CREATE UNIQUE INDEX IF NOT EXISTS pb_crm_shoot_types_active_name
  ON pb_crm.shoot_types (owner_kind, owner_id, lower(btrim(name)))
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS pb_crm_shoot_types_menu
  ON pb_crm.shoot_types (owner_kind, owner_id, sort_order, created_at)
  WHERE archived_at IS NULL;

-- Each customer may have several sessions, including custom categories.
CREATE TABLE IF NOT EXISTS pb_crm.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab', 'photographer')),
  owner_id TEXT NOT NULL CHECK (length(btrim(owner_id)) > 0),
  shoot_type_id UUID NOT NULL,
  shoot_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pb_crm_sessions_customer_owner_fk
    FOREIGN KEY (customer_id, owner_kind, owner_id)
    REFERENCES pb_crm.customers(id, owner_kind, owner_id)
    ON DELETE CASCADE,
  -- Cross-tenant category IDs cannot be applied to this customer's session.
  CONSTRAINT pb_crm_sessions_shoot_type_owner_fk
    FOREIGN KEY (shoot_type_id, owner_kind, owner_id)
    REFERENCES pb_crm.shoot_types(id, owner_kind, owner_id)
    ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS pb_crm_sessions_by_owner
  ON pb_crm.sessions (owner_kind, owner_id, shoot_type_id, shoot_date DESC);

-- Optional SMS draft for EACH owner's photography category.
-- A category can exist without a template. Templates are editable by the owner.
-- No automatic delivery, scheduling, SMS provider, or billing is implemented.
CREATE TABLE IF NOT EXISTS pb_crm.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab', 'photographer')),
  owner_id TEXT NOT NULL CHECK (length(btrim(owner_id)) > 0),
  shoot_type_id UUID NOT NULL,
  message_text TEXT NOT NULL CHECK (char_length(btrim(message_text)) BETWEEN 1 AND 1000),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pb_crm_sms_templates_shoot_type_owner_fk
    FOREIGN KEY (shoot_type_id, owner_kind, owner_id)
    REFERENCES pb_crm.shoot_types(id, owner_kind, owner_id)
    ON DELETE RESTRICT,
  CONSTRAINT pb_crm_sms_templates_one_per_type UNIQUE
    (owner_kind, owner_id, shoot_type_id)
);
CREATE INDEX IF NOT EXISTS pb_crm_sms_templates_menu
  ON pb_crm.sms_templates (owner_kind, owner_id, enabled);

-- An occasion's year may be unknown. Month/day are kept in the ORIGINAL
-- calendar. Never treat a Jalali month/day as a Gregorian month/day.
CREATE TABLE IF NOT EXISTS pb_crm.occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab', 'photographer')),
  owner_id TEXT NOT NULL CHECK (length(btrim(owner_id)) > 0),
  occasion_type TEXT NOT NULL
    CHECK (occasion_type IN ('birthday', 'engagement_anniversary',
                            'wedding_anniversary', 'shoot_anniversary', 'other')),
  title TEXT,
  calendar_kind TEXT NOT NULL DEFAULT 'jalali'
    CHECK (calendar_kind IN ('jalali', 'gregorian')),
  event_year SMALLINT CHECK (event_year BETWEEN 1 AND 9999),
  event_month SMALLINT NOT NULL CHECK (event_month BETWEEN 1 AND 12),
  event_day SMALLINT NOT NULL CHECK (event_day BETWEEN 1 AND 31),
  repeats_yearly BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Leap-day validity (29 Feb / 30 Esfand) is validated for the
  -- specific year in the service. Yearless recurring dates may use it.
  CONSTRAINT pb_crm_occasions_valid_month_day CHECK (
    (calendar_kind = 'jalali' AND (
      (event_month BETWEEN 1 AND 6 AND event_day BETWEEN 1 AND 31) OR
      (event_month BETWEEN 7 AND 12 AND event_day BETWEEN 1 AND 30)
    )) OR
    (calendar_kind = 'gregorian' AND (
      (event_month IN (1,3,5,7,8,10,12) AND event_day BETWEEN 1 AND 31) OR
      (event_month IN (4,6,9,11) AND event_day BETWEEN 1 AND 30) OR
      (event_month = 2 AND event_day BETWEEN 1 AND 29)
    ))
  ),
  CONSTRAINT pb_crm_occasions_customer_owner_fk
    FOREIGN KEY (customer_id, owner_kind, owner_id)
    REFERENCES pb_crm.customers(id, owner_kind, owner_id)
    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS pb_crm_occasions_by_owner_date
  ON pb_crm.occasions
  (owner_kind, owner_id, calendar_kind, event_month, event_day);

-- Defense in depth. API must set both values from authenticated identity
-- using SET LOCAL within the SAME transaction as each CRM query.
-- Never accept owner_kind / owner_id from browser request bodies.
ALTER TABLE pb_crm.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.customers FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_customers_scope ON pb_crm.customers
  FOR ALL
  USING (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  )
  WITH CHECK (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  );

ALTER TABLE pb_crm.shoot_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.shoot_types FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_shoot_types_scope ON pb_crm.shoot_types
  FOR ALL
  USING (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  )
  WITH CHECK (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  );

ALTER TABLE pb_crm.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.sms_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_sms_templates_scope ON pb_crm.sms_templates
  FOR ALL
  USING (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  )
  WITH CHECK (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  );

ALTER TABLE pb_crm.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_sessions_scope ON pb_crm.sessions
  FOR ALL
  USING (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  )
  WITH CHECK (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  );

ALTER TABLE pb_crm.occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.occasions FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_occasions_scope ON pb_crm.occasions
  FOR ALL
  USING (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  )
  WITH CHECK (
    owner_kind = nullif(current_setting('pb_crm.owner_kind', true), '')
    AND owner_id = nullif(current_setting('pb_crm.owner_id', true), '')
  );


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
