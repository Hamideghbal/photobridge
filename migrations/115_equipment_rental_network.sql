-- PhotoBridge v0.17.617 — public equipment-rental network, shop accounts and 30-day trial

ALTER TABLE equipment_rental_shops
  ADD COLUMN IF NOT EXISTS active_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS active_until timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subscription_discount_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_note text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='equipment_rental_shops_subscription_discount_amount_chk') THEN
    ALTER TABLE equipment_rental_shops ADD CONSTRAINT equipment_rental_shops_subscription_discount_amount_chk CHECK (subscription_discount_amount >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS equipment_rental_shops_subscription_idx
  ON equipment_rental_shops(active,active_until,created_at DESC);

CREATE TABLE IF NOT EXISTS equipment_rental_shop_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('shop_admin','photographer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id,user_id,role)
);
CREATE INDEX IF NOT EXISTS equipment_rental_shop_memberships_shop_idx ON equipment_rental_shop_memberships(shop_id,role,active,created_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_shop_memberships_user_idx ON equipment_rental_shop_memberships(user_id,role,active,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_rental_one_shop_admin_per_user_uidx ON equipment_rental_shop_memberships(user_id) WHERE role='shop_admin' AND active=true;

CREATE TABLE IF NOT EXISTS equipment_rental_subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  months integer NOT NULL CHECK (months > 0 AND months <= 36),
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(months)
);
INSERT INTO equipment_rental_subscription_plans(name,months,price,active,sort_order) VALUES
('اشتراک یک‌ماهه فروشگاه تجهیزات',1,0,true,10),
('اشتراک سه‌ماهه فروشگاه تجهیزات',3,0,true,20),
('اشتراک شش‌ماهه فروشگاه تجهیزات',6,0,true,30)
ON CONFLICT(months) DO NOTHING;

CREATE TABLE IF NOT EXISTS equipment_rental_subscription_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES equipment_rental_subscription_plans(id) ON DELETE SET NULL,
  months integer NOT NULL CHECK (months > 0 AND months <= 36),
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  review_note text,
  previous_active_until timestamptz,
  new_active_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_rental_subscription_renewals_shop_idx ON equipment_rental_subscription_renewals(shop_id,created_at DESC);
CREATE INDEX IF NOT EXISTS equipment_rental_subscription_renewals_status_idx ON equipment_rental_subscription_renewals(status,created_at DESC);

-- Equipment shops use the same verified-mobile signup infrastructure as labs.
ALTER TABLE signup_mobile_verifications DROP CONSTRAINT IF EXISTS signup_mobile_verifications_kind_check;
ALTER TABLE signup_mobile_verifications ADD CONSTRAINT signup_mobile_verifications_kind_check
  CHECK (kind IN ('lab_trial','photographer','invite','public_retouch','equipment_rental_trial'));

-- Keep existing pilot shops usable after this migration. Admin-created pilot rows had no subscription window.
UPDATE equipment_rental_shops
SET active_from=COALESCE(active_from,created_at,now()), active_until=COALESCE(active_until,now()+interval '30 days')
WHERE active_until IS NULL;
