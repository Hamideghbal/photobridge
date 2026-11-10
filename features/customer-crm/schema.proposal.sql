-- PhotoBridge customer CRM: ISOLATED SCHEMA PROPOSAL ONLY.
-- This file is intentionally NOT in migrations/ and is NOT executed by the live build.
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

-- Each customer can have several photography sessions or categories.
CREATE TABLE IF NOT EXISTS pb_crm.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('lab', 'photographer')),
  owner_id TEXT NOT NULL CHECK (length(btrim(owner_id)) > 0),
  shoot_type TEXT NOT NULL
    CHECK (shoot_type IN ('child', 'birthday', 'engagement', 'wedding',
                         'family', 'portrait', 'other')),
  shoot_type_other TEXT,
  shoot_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pb_crm_sessions_customer_owner_fk
    FOREIGN KEY (customer_id, owner_kind, owner_id)
    REFERENCES pb_crm.customers(id, owner_kind, owner_id)
    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS pb_crm_sessions_by_owner
  ON pb_crm.sessions (owner_kind, owner_id, shoot_type, shoot_date DESC);

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
