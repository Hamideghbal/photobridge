-- Customer appointments are separate from completed services and invoices.
CREATE TABLE IF NOT EXISTS pb_crm.appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_kind text NOT NULL CHECK(owner_kind IN ('lab','photographer')),
 owner_id text NOT NULL,
 customer_id uuid NOT NULL,
 service_name text NOT NULL CHECK(length(btrim(service_name)) BETWEEN 1 AND 200),
 starts_at timestamptz NOT NULL,
 duration_minutes integer NOT NULL DEFAULT 60 CHECK(duration_minutes BETWEEN 5 AND 720),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')),
 sms_enabled boolean NOT NULL DEFAULT false,
 revision integer NOT NULL DEFAULT 1,
 reminder_revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,owner_kind,owner_id),
 FOREIGN KEY(customer_id,owner_kind,owner_id) REFERENCES pb_crm.customers(id,owner_kind,owner_id)
);
CREATE INDEX IF NOT EXISTS pb_crm_appointments_calendar ON pb_crm.appointments(owner_kind,owner_id,starts_at);
ALTER TABLE pb_crm.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_crm.appointments FORCE ROW LEVEL SECURITY;
CREATE POLICY pb_crm_appointments_scope ON pb_crm.appointments FOR ALL
 USING(owner_kind=nullif(current_setting('pb_crm.owner_kind',true),'') AND owner_id=nullif(current_setting('pb_crm.owner_id',true),''))
 WITH CHECK(owner_kind=nullif(current_setting('pb_crm.owner_kind',true),'') AND owner_id=nullif(current_setting('pb_crm.owner_id',true),''));
-- Server-only delivery outbox: no API reads/writes this table without explicit owner scope.
-- Claim is durable before contacting an external provider. Ambiguous deliveries are never auto-retried.
CREATE TABLE IF NOT EXISTS crm_appointment_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 appointment_id uuid NOT NULL,
 owner_kind text NOT NULL,
 owner_id text NOT NULL,
 revision integer NOT NULL,
 channel text NOT NULL CHECK(channel IN ('internal','sms')),
 due_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','processing','sent','failed','cancelled')),
 error_code text,
 processed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(appointment_id,revision,channel),
 FOREIGN KEY(appointment_id,owner_kind,owner_id) REFERENCES pb_crm.appointments(id,owner_kind,owner_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS crm_appointment_reminders_due ON crm_appointment_reminders(due_at) WHERE state='pending';
