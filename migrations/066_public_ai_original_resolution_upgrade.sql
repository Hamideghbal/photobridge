-- Public economic retouch keeps the full-resolution AI result internally and
-- can unlock that exact original-size output later by charging only the price difference.
CREATE TABLE IF NOT EXISTS public_ai_order_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public_ai_orders(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'original_resolution' CHECK (kind IN ('original_resolution')),
  target_plan_id text REFERENCES public_ai_plans(id),
  amount bigint NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TOMAN',
  status text NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','payment_pending','paid','failed','cancelled')),
  payment_provider text,
  payment_track_id text,
  payment_ref_number text,
  payment_gateway_amount bigint,
  payment_result integer,
  payment_message text,
  payment_requested_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id,kind)
);
CREATE INDEX IF NOT EXISTS public_ai_order_upgrades_track_idx ON public_ai_order_upgrades(payment_provider,payment_track_id) WHERE payment_track_id IS NOT NULL;
