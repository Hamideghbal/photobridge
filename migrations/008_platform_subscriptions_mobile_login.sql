CREATE INDEX IF NOT EXISTS users_mobile_idx ON users(mobile) WHERE mobile IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  months integer NOT NULL CHECK (months > 0 AND months <= 36),
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (months)
);

INSERT INTO subscription_plans(name,months,price,active,sort_order) VALUES
('اشتراک یک‌ماهه',1,0,true,10),
('اشتراک سه‌ماهه',3,0,true,20),
('اشتراک شش‌ماهه',6,0,true,30)
ON CONFLICT (months) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscription_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  months integer NOT NULL CHECK (months > 0 AND months <= 36),
  amount bigint NOT NULL CHECK (amount >= 0),
  receipt_object_key text,
  receipt_name text,
  receipt_content_type text,
  receipt_bytes bigint,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','pending','approved','rejected')),
  submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  review_note text,
  previous_active_until timestamptz,
  new_active_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscription_renewals_lab_idx ON subscription_renewals(lab_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_renewals_status_idx ON subscription_renewals(status, created_at DESC);
