-- PhotoBridge v0.17.278 — public prepaid AI + photographer invite-only upgrade architecture

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photographer_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photographer_joined_at timestamptz;

UPDATE users u
SET photographer_enabled=true,
    photographer_joined_at=COALESCE(photographer_joined_at,(
      SELECT min(m.created_at) FROM lab_memberships m WHERE m.user_id=u.id AND m.role='customer'
    ),u.created_at)
WHERE EXISTS (SELECT 1 FROM lab_memberships m WHERE m.user_id=u.id AND m.role='customer');

ALTER TABLE ai_image_jobs DROP CONSTRAINT IF EXISTS ai_image_jobs_owner_type_check;
ALTER TABLE ai_image_jobs ADD CONSTRAINT ai_image_jobs_owner_type_check CHECK (owner_type IN ('lab','customer','admin','public'));

CREATE TABLE IF NOT EXISTS photographer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  issuer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer_type text NOT NULL CHECK (issuer_type IN ('admin','lab','photographer')),
  issuer_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  campaign text,
  channel text,
  target_mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_invites_issuer_idx ON photographer_invites(issuer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS photographer_invites_active_idx ON photographer_invites(active,expires_at) WHERE active=true;

CREATE TABLE IF NOT EXISTS photographer_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES photographer_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invite_id,user_id)
);
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_user_idx ON photographer_invite_redemptions(user_id,redeemed_at DESC);

CREATE TABLE IF NOT EXISTS public_ai_plans (
  id text PRIMARY KEY,
  service_key text NOT NULL REFERENCES platform_services(service_key) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  variant text NOT NULL,
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public_ai_plans(id,service_key,title,description,variant,unit_price,active,sort_order,metadata) VALUES
('skin-light','ai_skin_retouch','روتوش Light','پاک‌سازی طبیعی و ملایم پوست','light',79000,true,10,'{"retouchLevel":"gentle","retouchResolutionPreset":"default","quality":"low"}'::jsonb),
('skin-strong','ai_skin_retouch','روتوش Strong','روتوش محسوس‌تر با حفظ کامل هویت','strong',119000,true,20,'{"retouchLevel":"standard","retouchResolutionPreset":"default","quality":"low"}'::jsonb),
('skin-2k','ai_skin_retouch','روتوش 2K','روتوش Light با خروجی پردازش 2K','2k',159000,true,30,'{"retouchLevel":"gentle","retouchResolutionPreset":"low_2k","quality":"medium"}'::jsonb)
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public_ai_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL UNIQUE,
  access_expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
  plan_id text NOT NULL REFERENCES public_ai_plans(id),
  ai_job_id uuid UNIQUE REFERENCES ai_image_jobs(id) ON DELETE SET NULL,
  contact_mobile text NOT NULL,
  contact_email text NOT NULL,
  amount bigint NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TOMAN',
  status text NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','payment_pending','paid','processing','completed','failed','cancelled')),
  payment_provider text,
  payment_track_id text,
  payment_ref_number text,
  payment_gateway_amount bigint,
  payment_result integer,
  payment_message text,
  payment_requested_at timestamptz,
  paid_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  downloaded_at timestamptz,
  ready_sms_status text,
  ready_sms_sent_at timestamptz,
  ready_email_status text,
  ready_email_sent_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_ai_orders_status_idx ON public_ai_orders(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS public_ai_orders_delivery_idx ON public_ai_orders(completed_at,downloaded_at,ready_sms_sent_at) WHERE status='completed';
