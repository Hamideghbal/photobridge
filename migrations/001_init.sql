CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
