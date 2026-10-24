

CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  mobile text,
  password_hash text NOT NULL,
  platform_role text NOT NULL DEFAULT 'user' CHECK (platform_role IN ('platform_admin','user')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_until timestamptz,
  timezone text NOT NULL DEFAULT 'Asia/Tehran',
  resolution_min integer NOT NULL DEFAULT 240,
  resolution_max integer NOT NULL DEFAULT 360,
  resolution_target integer NOT NULL DEFAULT 300,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('lab_admin','customer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id),
  expires_at timestamptz,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitations_lab_idx ON invitations(lab_id);

CREATE TABLE IF NOT EXISTS print_sizes (
  id text PRIMARY KEY,
  label text NOT NULL,
  width_cm numeric(8,2) NOT NULL,
  height_cm numeric(8,2) NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS lab_prices (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  size_id text NOT NULL REFERENCES print_sizes(id),
  luster bigint,
  silk bigint,
  metallic bigint,
  chassis bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lab_id, size_id)
);

CREATE TABLE IF NOT EXISTS working_hours (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  enabled boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  PRIMARY KEY (lab_id, weekday)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigserial UNIQUE,
  lab_id uuid NOT NULL REFERENCES labs(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  mode text NOT NULL DEFAULT 'print' CHECK (mode IN ('print','album')),
  status text NOT NULL DEFAULT 'uploading',
  delivery text NOT NULL DEFAULT 'pickup' CHECK (delivery IN ('pickup','courier')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','urgent','very_urgent')),
  album_data jsonb,
  total bigint NOT NULL DEFAULT 0,
  printed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_lab_idx ON orders(lab_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  original_name text NOT NULL,
  object_key text NOT NULL UNIQUE,
  preview_key text,
  thumbnail_key text,
  content_type text,
  bytes bigint,
  width integer,
  height integer,
  dpi numeric(10,2),
  print_size_id text REFERENCES print_sizes(id),
  print_type text,
  chassis boolean NOT NULL DEFAULT false,
  crop_data jsonb,
  original_state text NOT NULL DEFAULT 'pending' CHECK (original_state IN ('pending','active','ready_for_deletion','deleted')),
  original_delete_after timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_files_cleanup_idx ON order_files(original_state, original_delete_after);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  message text NOT NULL,
  attachment_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_lab_customer_idx ON chat_messages(lab_id, customer_id, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  lab_id uuid REFERENCES labs(id),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO print_sizes(id,label,width_cm,height_cm) VALUES
('10x15','۱۰×۱۵',10,15),('13x18','۱۳×۱۸',13,18),('13x26','۱۳×۲۶',13,26),
('16x21','۱۶×۲۱',16,21),('20x30','۲۰×۳۰',20,30),('30x30','۳۰×۳۰',30,30),
('30x40','۳۰×۴۰',30,40),('30x45','۳۰×۴۵',30,45),('30x60','۳۰×۶۰',30,60),
('30x80','۳۰×۸۰',30,80),('40x60','۴۰×۶۰',40,60),('40x80','۴۰×۸۰',40,80),
('50x70','۵۰×۷۰',50,70),('50x80','۵۰×۸۰',50,80),('60x90','۶۰×۹۰',60,90),
('70x100','۷۰×۱۰۰',70,100),('75x120','۷۵×۱۲۰',75,120),('75x200','۷۵×۲۰۰',75,200)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS downloaded_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS correction_note text;

CREATE TABLE IF NOT EXISTS order_status_events (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  actor_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_status_events_order_idx ON order_status_events(order_id, created_at);

INSERT INTO order_status_events(order_id,lab_id,customer_id,status,created_at)
SELECT o.id,o.lab_id,o.customer_id,o.status,o.updated_at
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_events e WHERE e.order_id=o.id);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigserial UNIQUE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal bigint NOT NULL DEFAULT 0,
  discount bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  pdf_object_key text,
  pdf_ready boolean NOT NULL DEFAULT false,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_lab_idx ON invoices(lab_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON invoices(customer_id, issued_at DESC);

-- PhotoBridge v0.12.0 — core accounting ledger, payments and expenses

CREATE TABLE IF NOT EXISTS finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('asset','liability','equity','income','expense')),
  system_key text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id, code),
  UNIQUE(lab_id, system_key)
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  txn_date timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  reference_type text,
  reference_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_transactions_reference_uidx
  ON finance_transactions(lab_id, reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS finance_transactions_lab_date_idx
  ON finance_transactions(lab_id, txn_date DESC);

CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  debit bigint NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit bigint NOT NULL DEFAULT 0 CHECK (credit >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);
CREATE INDEX IF NOT EXISTS finance_entries_tx_idx ON finance_entries(transaction_id);
CREATE INDEX IF NOT EXISTS finance_entries_customer_idx ON finance_entries(customer_id);
CREATE INDEX IF NOT EXISTS finance_entries_invoice_idx ON finance_entries(invoice_id);

CREATE TABLE IF NOT EXISTS finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','transfer','cheque','other')),
  note text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_payments_lab_date_idx ON finance_payments(lab_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS finance_payments_invoice_idx ON finance_payments(invoice_id);

CREATE TABLE IF NOT EXISTS finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  category text NOT NULL,
  payee text,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','transfer','cheque','other')),
  note text,
  spent_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_expenses_lab_date_idx ON finance_expenses(lab_id, spent_at DESC);

-- Standard chart of accounts for every lab
INSERT INTO finance_accounts(lab_id,code,name,kind,system_key)
SELECT l.id,v.code,v.name,v.kind,v.system_key
FROM labs l
CROSS JOIN (VALUES
  ('1101','صندوق','asset','cash'),
  ('1102','بانک / کارتخوان','asset','bank'),
  ('1201','حساب‌های دریافتنی','asset','receivable'),
  ('4101','درآمد فروش و خدمات چاپ','income','sales'),
  ('5101','هزینه‌های عملیاتی','expense','operating_expense')
) AS v(code,name,kind,system_key)
ON CONFLICT (lab_id, system_key) DO NOTHING;

-- Backfill invoice accounting documents for invoices issued before this migration
INSERT INTO finance_transactions(lab_id,txn_date,description,reference_type,reference_id,created_at)
SELECT i.lab_id,i.issued_at,'صدور فاکتور #'||i.number,'invoice',i.id,i.issued_at
FROM invoices i
WHERE i.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM finance_transactions t
    WHERE t.lab_id=i.lab_id AND t.reference_type='invoice' AND t.reference_id=i.id
  );

INSERT INTO finance_entries(transaction_id,account_id,customer_id,invoice_id,debit,credit,note)
SELECT t.id,a.id,i.customer_id,i.id,i.total,0,'بدهکار شدن مشتری'
FROM finance_transactions t
JOIN invoices i ON i.id=t.reference_id AND t.reference_type='invoice'
JOIN finance_accounts a ON a.lab_id=t.lab_id AND a.system_key='receivable'
WHERE i.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM finance_entries e WHERE e.transaction_id=t.id AND e.account_id=a.id
  );

INSERT INTO finance_entries(transaction_id,account_id,customer_id,invoice_id,debit,credit,note)
SELECT t.id,a.id,i.customer_id,i.id,0,i.total,'درآمد فاکتور'
FROM finance_transactions t
JOIN invoices i ON i.id=t.reference_id AND t.reference_type='invoice'
JOIN finance_accounts a ON a.lab_id=t.lab_id AND a.system_key='sales'
WHERE i.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM finance_entries e WHERE e.transaction_id=t.id AND e.account_id=a.id
  );

-- PhotoBridge v0.16.5 — customer sub-ledger, account-level payments and periodic discounts

ALTER TABLE finance_payments ALTER COLUMN invoice_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS lab_customer_finance_settings (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_enabled boolean NOT NULL DEFAULT false,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_every_invoices integer NOT NULL DEFAULT 10 CHECK (discount_every_invoices BETWEEN 1 AND 1000),
  last_discount_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lab_id, customer_id)
);

CREATE TABLE IF NOT EXISTS finance_customer_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind text NOT NULL DEFAULT 'discount' CHECK (kind IN ('discount','credit','correction')),
  amount bigint NOT NULL CHECK (amount > 0),
  percent numeric(5,2),
  base_amount bigint,
  invoice_count integer,
  period_from timestamptz,
  period_to timestamptz,
  note text,
  adjusted_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_customer_adjustments_customer_idx
  ON finance_customer_adjustments(lab_id, customer_id, adjusted_at DESC);

INSERT INTO finance_accounts(lab_id,code,name,kind,system_key)
SELECT l.id,'5201','تخفیفات و تعدیلات فروش','expense','sales_discount'
FROM labs l
ON CONFLICT (lab_id, system_key) DO NOTHING;

-- PhotoBridge v0.17.0 — discount activation boundary + chronological sub-ledger placement

ALTER TABLE lab_customer_finance_settings
  ADD COLUMN IF NOT EXISTS discount_started_at timestamptz;

-- Preserve the beginning of already-existing automatic discount cycles when possible.
-- If a setting was enabled but had never produced an automatic discount, start it from
-- the time the setting itself was last saved so older invoices are not retroactively discounted.
UPDATE lab_customer_finance_settings s
SET discount_started_at = COALESCE(
  (
    SELECT min(x.period_from)
    FROM finance_customer_adjustments x
    WHERE x.lab_id=s.lab_id
      AND x.customer_id=s.customer_id
      AND x.kind='discount'
      AND x.percent IS NOT NULL
      AND x.invoice_count IS NOT NULL
      AND x.invoice_count>0
      AND x.period_from IS NOT NULL
  ),
  s.updated_at,
  now()
)
WHERE s.discount_enabled=true
  AND s.discount_started_at IS NULL;

UPDATE lab_customer_finance_settings
SET discount_started_at=NULL
WHERE discount_enabled=false;

-- Automatic discount documents belong immediately after the last invoice in their batch.
-- Older versions recorded them at the time the reconciliation job happened, which pushed
-- them to the end of the customer's statement.
UPDATE finance_transactions t
SET txn_date=x.period_to
FROM finance_customer_adjustments x
WHERE t.reference_type='customer_adjustment'
  AND t.reference_id=x.id
  AND x.kind='discount'
  AND x.percent IS NOT NULL
  AND x.invoice_count IS NOT NULL
  AND x.invoice_count>0
  AND x.period_to IS NOT NULL
  AND t.txn_date IS DISTINCT FROM x.period_to;

UPDATE finance_customer_adjustments
SET adjusted_at=period_to
WHERE kind='discount'
  AND percent IS NOT NULL
  AND invoice_count IS NOT NULL
  AND invoice_count>0
  AND period_to IS NOT NULL
  AND adjusted_at IS DISTINCT FROM period_to;

CREATE INDEX IF NOT EXISTS lab_customer_finance_settings_discount_started_idx
  ON lab_customer_finance_settings(lab_id,customer_id,discount_started_at)
  WHERE discount_enabled=true;

ALTER TABLE labs ADD COLUMN IF NOT EXISTS service_only boolean NOT NULL DEFAULT false;

INSERT INTO labs(name,slug,active,active_from,active_until,timezone,resolution_min,resolution_max,resolution_target,service_only)
SELECT 'PhotoBridge · عکاسان مستقل','photobridge-standalone-photographers',true,now(),NULL,'Asia/Tehran',240,360,300,true
WHERE NOT EXISTS (SELECT 1 FROM labs WHERE service_only=true OR slug='photobridge-standalone-photographers');

UPDATE labs SET service_only=true WHERE slug='photobridge-standalone-photographers';
CREATE INDEX IF NOT EXISTS labs_service_only_idx ON labs(service_only);

-- PhotoBridge v0.17.36 — Latin-only storage paths + photographer settlement workflow

ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS payment_card_number text,
  ADD COLUMN IF NOT EXISTS payment_iban text,
  ADD COLUMN IF NOT EXISTS payment_account_holder text;

ALTER TABLE lab_memberships
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'ledger';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lab_memberships_settlement_mode_chk') THEN
    ALTER TABLE lab_memberships ADD CONSTRAINT lab_memberships_settlement_mode_chk
      CHECK (settlement_mode IN ('ledger','prepaid'));
  END IF;
END $$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'ledger',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_settlement_mode_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_settlement_mode_chk
      CHECK (settlement_mode IN ('ledger','prepaid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_payment_status_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_chk
      CHECK (payment_status IN ('not_required','awaiting_receipt','receipt_pending','paid','receipt_rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS order_payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  object_key text NOT NULL,
  original_name text NOT NULL,
  content_type text,
  bytes bigint,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','pending','approved','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_payment_receipts_lab_status_idx ON order_payment_receipts(lab_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS order_payment_receipts_customer_idx ON order_payment_receipts(customer_id,created_at DESC);

-- PhotoBridge v0.17.62 — laboratory discovery, collaboration requests and active-lab selection

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photographer_active_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL;

ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS photographer_discovery_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS photographer_join_discount_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (photographer_join_discount_percent >= 0 AND photographer_join_discount_percent <= 100);

CREATE TABLE IF NOT EXISTS lab_collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  offer_discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (offer_discount_percent >= 0 AND offer_discount_percent <= 100),
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, photographer_id)
);
CREATE INDEX IF NOT EXISTS lab_collaboration_requests_lab_status_idx
  ON lab_collaboration_requests(lab_id,status,requested_at DESC);
CREATE INDEX IF NOT EXISTS lab_collaboration_requests_photographer_idx
  ON lab_collaboration_requests(photographer_id,status,requested_at DESC);

-- Preserve current behavior while preferring a real laboratory over the internal
-- service-only account whenever the photographer already belongs to one.
UPDATE users u
SET photographer_active_lab_id = COALESCE(
  (
    SELECT m.lab_id
    FROM lab_memberships m
    JOIN labs l ON l.id=m.lab_id
    WHERE m.user_id=u.id AND m.role='customer' AND m.active=true AND l.service_only=false
    ORDER BY m.created_at
    LIMIT 1
  ),
  (
    SELECT m.lab_id
    FROM lab_memberships m
    WHERE m.user_id=u.id AND m.role='customer' AND m.active=true
    ORDER BY m.created_at
    LIMIT 1
  )
)
WHERE u.photographer_active_lab_id IS NULL
  AND EXISTS (SELECT 1 FROM lab_memberships m WHERE m.user_id=u.id AND m.role='customer' AND m.active=true);

CREATE TABLE IF NOT EXISTS accounting_export_runs (
  id uuid PRIMARY KEY,
  owner_type text NOT NULL CHECK (owner_type IN ('lab','customer')),
  owner_id uuid NOT NULL,
  lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  from_date date,
  to_date date,
  only_new boolean NOT NULL DEFAULT false,
  document_count integer NOT NULL DEFAULT 0,
  invoice_count integer NOT NULL DEFAULT 0,
  total_amount bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_export_runs_owner_idx
  ON accounting_export_runs(owner_type, owner_id, software, created_at DESC);

CREATE TABLE IF NOT EXISTS accounting_export_documents (
  owner_type text NOT NULL CHECK (owner_type IN ('lab','customer')),
  owner_id uuid NOT NULL,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  run_id uuid NOT NULL REFERENCES accounting_export_runs(id) ON DELETE CASCADE,
  exported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_type, owner_id, software, document_type, document_id)
);

CREATE INDEX IF NOT EXISTS accounting_export_documents_run_idx
  ON accounting_export_documents(run_id);

CREATE TABLE IF NOT EXISTS accounting_external_parties (
  id uuid PRIMARY KEY,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  external_code text,
  name text NOT NULL,
  mobile text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_external_parties_lab_software_idx
  ON accounting_external_parties(lab_id, software, name);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_external_parties_code_unique_idx
  ON accounting_external_parties(lab_id, software, external_code)
  WHERE external_code IS NOT NULL AND btrim(external_code) <> '';

CREATE TABLE IF NOT EXISTS accounting_party_mappings (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_party_id uuid REFERENCES accounting_external_parties(id) ON DELETE SET NULL,
  external_code text,
  external_name text NOT NULL,
  external_mobile text,
  mapping_source text NOT NULL DEFAULT 'manual' CHECK (mapping_source IN ('manual','auto_mobile','auto_name')),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lab_id, software, customer_id)
);

CREATE INDEX IF NOT EXISTS accounting_party_mappings_external_idx
  ON accounting_party_mappings(lab_id, software, external_code);

ALTER TABLE accounting_export_runs
  ADD COLUMN IF NOT EXISTS unmapped_mode text NOT NULL DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='accounting_export_runs_unmapped_mode_check'
  ) THEN
    ALTER TABLE accounting_export_runs
      ADD CONSTRAINT accounting_export_runs_unmapped_mode_check
      CHECK (unmapped_mode IN ('new','skip'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS lab_accounting_settings (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL DEFAULT 'holo' CHECK (software IN ('generic','holo','sepidar','mahak')),
  setup_completed boolean NOT NULL DEFAULT false,
  new_customer_policy text NOT NULL DEFAULT 'approval' CHECK (new_customer_policy IN ('auto_new','approval','skip')),
  invite_requires_setup boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS target_mobile text,
  ADD COLUMN IF NOT EXISTS target_name text,
  ADD COLUMN IF NOT EXISTS accounting_software text,
  ADD COLUMN IF NOT EXISTS accounting_external_party_id uuid REFERENCES accounting_external_parties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accounting_external_code text,
  ADD COLUMN IF NOT EXISTS accounting_external_name text,
  ADD COLUMN IF NOT EXISTS accounting_external_mobile text,
  ADD COLUMN IF NOT EXISTS sms_status text,
  ADD COLUMN IF NOT EXISTS sms_reference text,
  ADD COLUMN IF NOT EXISTS sms_sent_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='invitations_accounting_software_check'
  ) THEN
    ALTER TABLE invitations
      ADD CONSTRAINT invitations_accounting_software_check
      CHECK (accounting_software IS NULL OR accounting_software IN ('generic','holo','sepidar','mahak'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='invitations_sms_status_check'
  ) THEN
    ALTER TABLE invitations
      ADD CONSTRAINT invitations_sms_status_check
      CHECK (sms_status IS NULL OR sms_status IN ('sent','failed','not_sent'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS invitations_lab_target_mobile_idx
  ON invitations(lab_id, target_mobile, created_at DESC);
CREATE INDEX IF NOT EXISTS invitations_accounting_party_idx
  ON invitations(accounting_external_party_id);

-- PhotoBridge v0.17.83 — import legacy customer balances as auditable opening balances

ALTER TABLE accounting_external_parties
  ADD COLUMN IF NOT EXISTS opening_balance bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_balance_provided boolean NOT NULL DEFAULT false;

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS accounting_opening_balance bigint;

CREATE TABLE IF NOT EXISTS accounting_opening_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL CHECK (software IN ('generic','holo','sepidar','mahak')),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_party_id uuid REFERENCES accounting_external_parties(id) ON DELETE SET NULL,
  source_external_code text,
  source_external_name text,
  source_external_mobile text,
  amount bigint NOT NULL DEFAULT 0,
  initialized_by uuid REFERENCES users(id) ON DELETE SET NULL,
  initialized_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lab_id, software, customer_id)
);

CREATE INDEX IF NOT EXISTS accounting_opening_balances_lab_software_idx
  ON accounting_opening_balances(lab_id, software, customer_id);

CREATE TABLE IF NOT EXISTS accounting_opening_balance_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_balance_id uuid NOT NULL REFERENCES accounting_opening_balances(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_amount bigint NOT NULL DEFAULT 0,
  new_amount bigint NOT NULL DEFAULT 0,
  delta bigint NOT NULL DEFAULT 0,
  transaction_id uuid UNIQUE REFERENCES finance_transactions(id) ON DELETE SET NULL,
  note text,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_opening_balance_changes_customer_idx
  ON accounting_opening_balance_changes(lab_id, customer_id, changed_at DESC);

INSERT INTO finance_accounts(lab_id,code,name,kind,system_key)
SELECT l.id,'3101','مانده افتتاحیه انتقالی','equity','opening_balance_equity'
FROM labs l
ON CONFLICT (lab_id, system_key) DO NOTHING;

-- PhotoBridge v0.17.89 — safe accounting mapping disconnect + audit history

ALTER TABLE accounting_party_mappings
  ADD COLUMN IF NOT EXISTS connected_at timestamptz;

UPDATE accounting_party_mappings
SET connected_at = COALESCE(connected_at, updated_at, now())
WHERE connected_at IS NULL;

ALTER TABLE accounting_party_mappings
  ALTER COLUMN connected_at SET DEFAULT now();

CREATE TABLE IF NOT EXISTS accounting_party_mapping_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  software text NOT NULL,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('connect','change','disconnect','auto_connect','auto_refresh')),
  external_party_id uuid,
  external_code text,
  external_name text,
  external_mobile text,
  mapping_source text,
  opening_balance bigint,
  note text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_party_mapping_history_lookup_idx
  ON accounting_party_mapping_history(lab_id, software, customer_id, created_at DESC);

ALTER TABLE lab_accounting_settings
  ALTER COLUMN invite_requires_setup SET DEFAULT false;

UPDATE lab_accounting_settings
SET invite_requires_setup=false
WHERE invite_requires_setup=true;

ALTER TABLE accounting_party_mappings
  DROP CONSTRAINT IF EXISTS accounting_party_mappings_mapping_source_check;
ALTER TABLE accounting_party_mappings
  ADD CONSTRAINT accounting_party_mappings_mapping_source_check
  CHECK (mapping_source IN ('manual','auto_mobile','auto_name','invitation'));

